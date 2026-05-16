// /api/comments - 发布评论
import { ensureUid, getClientIp, sha256, makeAnonNickname, calcHotScore } from '../_shared.js';

export async function onRequestPost({ request, env }) {
  try {
    const { story_id, content, nickname } = await request.json();
    if (!story_id || !content) return jsonErr('Missing required');
    if (content.length > 1000) return jsonErr('Comment too long (max 1000)');

    const { uid } = await ensureUid(request);
    const ip = getClientIp(request);
    const ipHash = await sha256(ip);

    const story = await env.DB.prepare('SELECT id FROM stories WHERE id=?').bind(story_id).first();
    if (!story) return jsonErr('Story not found', 404);

    // 反 spam：同 IP 1 小时最多 20 条
    const recent = await env.DB.prepare(
      'SELECT COUNT(*) as c FROM comments WHERE ip_hash=? AND created_at > ?'
    ).bind(ipHash, Date.now() - 3600000).first();
    if (recent && recent.c >= 20) return jsonErr('Too many comments');

    const finalNick = (nickname && nickname.trim())
      ? nickname.trim().slice(0, 40)
      : makeAnonNickname(ip, uid);
    const now = Date.now();

    const result = await env.DB.prepare(
      'INSERT INTO comments (story_id, nickname, content, user_uid, ip_hash, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(story_id, finalNick, content, uid, ipHash, now).run();

    // 评论数 +1，重算热度
    await env.DB.prepare(
      'UPDATE stories SET comment_count = comment_count + 1 WHERE id=?'
    ).bind(story_id).run();
    const fresh = await env.DB.prepare(
      'SELECT like_count, comment_count, view_count, created_at FROM stories WHERE id=?'
    ).bind(story_id).first();
    const newHot = calcHotScore(fresh.like_count, fresh.comment_count, fresh.view_count, fresh.created_at);
    await env.DB.prepare('UPDATE stories SET hot_score=? WHERE id=?').bind(newHot, story_id).run();

    return new Response(JSON.stringify({
      ok: true,
      comment: { id: result.meta?.last_row_id, nickname: finalNick, content, created_at: now }
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
