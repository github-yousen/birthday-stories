// POST /api/stories - 发布故事
import { ensureUid, getClientIp, sha256, calcExcerpt, makeAnonNickname, calcHotScore, pad2 } from '../_shared.js';

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const { year, month, day, nickname, display_nickname, story, lang } = body;

    // 校验
    if (!year || !month || !day || !story) {
      return jsonErr('Missing required fields');
    }
    if (story.length > 10000) {
      return jsonErr('Story too long (max 10000)');
    }
    if (story.length < 1) {
      return jsonErr('Story is empty');
    }
    if (year < 1900 || year > new Date().getFullYear()) {
      return jsonErr('Invalid year');
    }
    if (month < 1 || month > 12 || day < 1 || day > 31) {
      return jsonErr('Invalid date');
    }
    // 闰年/月日校验
    const dayCheck = new Date(year, month - 1, day);
    if (dayCheck.getMonth() !== month - 1 || dayCheck.getDate() !== day) {
      return jsonErr('Invalid date combination');
    }

    const { uid } = await ensureUid(request);
    const ip = getClientIp(request);
    const ipHash = await sha256(ip);

    // 反垃圾：同 uid 同生日只能发一条（覆盖）
    const existing = await env.DB.prepare(
      'SELECT id FROM stories WHERE user_uid=? AND birth_year=? AND birth_month=? AND birth_day=?'
    ).bind(uid, year, month, day).first();

    // 反 spam：同一 IP 24h 内最多 5 条
    const recentCount = await env.DB.prepare(
      'SELECT COUNT(*) as c FROM stories WHERE ip_hash=? AND created_at > ?'
    ).bind(ipHash, Date.now() - 86400000).first();
    if (recentCount && recentCount.c >= 5) {
      return jsonErr('Too many submissions from your IP today');
    }

    const finalNickname = (display_nickname && nickname && nickname.trim())
      ? nickname.trim().slice(0, 40)
      : makeAnonNickname(ip, uid);
    const isCustom = display_nickname && nickname && nickname.trim() ? 1 : 0;
    const excerpt = calcExcerpt(story, 120);
    const now = Date.now();
    const initHot = calcHotScore(0, 0, 0, now);

    let storyId;
    if (existing) {
      // 更新
      await env.DB.prepare(`
        UPDATE stories SET nickname=?, display_nickname=?, story=?, excerpt=?, lang=?, hot_score=?, updated_at=?
        WHERE id=?
      `).bind(finalNickname, isCustom, story, excerpt, lang || 'zh', initHot, now, existing.id).run();
      storyId = existing.id;
    } else {
      const result = await env.DB.prepare(`
        INSERT INTO stories (birth_year, birth_month, birth_day, nickname, display_nickname, story, excerpt, ip_hash, user_uid, lang, hot_score, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(year, month, day, finalNickname, isCustom, story, excerpt, ipHash, uid, lang || 'zh', initHot, now, now).run();
      storyId = result.meta?.last_row_id;
    }

    return new Response(JSON.stringify({
      ok: true,
      story: { id: storyId, nickname: finalNickname }
    }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return jsonErr('Server error: ' + e.message);
  }
}

function jsonErr(msg, status = 400) {
  return new Response(JSON.stringify({ ok: false, error: msg }), {
    status, headers: { 'Content-Type': 'application/json' }
  });
}
