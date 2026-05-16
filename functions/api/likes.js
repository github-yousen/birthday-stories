// /api/likes - 点赞 / 取消点赞
import { ensureUid, calcHotScore } from '../_shared.js';

export async function onRequestPost({ request, env }) {
  return handle(request, env, true);
}
export async function onRequestDelete({ request, env }) {
  return handle(request, env, false);
}

async function handle(request, env, isLike) {
  try {
    const { story_id } = await request.json();
    if (!story_id) return jsonErr('Missing story_id');
    const { uid } = await ensureUid(request);

    const story = await env.DB.prepare('SELECT * FROM stories WHERE id=?').bind(story_id).first();
    if (!story) return jsonErr('Story not found', 404);

    if (isLike) {
      // 已存在则什么都不做
      const exist = await env.DB.prepare(
        'SELECT id FROM likes WHERE story_id=? AND user_uid=?'
      ).bind(story_id, uid).first();
      if (!exist) {
        await env.DB.prepare(
          'INSERT INTO likes (story_id, user_uid, created_at) VALUES (?, ?, ?)'
        ).bind(story_id, uid, Date.now()).run();
        await env.DB.prepare(
          'UPDATE stories SET like_count = like_count + 1 WHERE id=?'
        ).bind(story_id).run();
      }
    } else {
      const exist = await env.DB.prepare(
        'SELECT id FROM likes WHERE story_id=? AND user_uid=?'
      ).bind(story_id, uid).first();
      if (exist) {
        await env.DB.prepare('DELETE FROM likes WHERE id=?').bind(exist.id).run();
        await env.DB.prepare(
          'UPDATE stories SET like_count = MAX(0, like_count - 1) WHERE id=?'
        ).bind(story_id).run();
      }
    }

    // 重新拉最新 like_count，重算 hot_score
    const fresh = await env.DB.prepare(
      'SELECT like_count, comment_count, view_count, created_at FROM stories WHERE id=?'
    ).bind(story_id).first();
    const newHot = calcHotScore(fresh.like_count, fresh.comment_count, fresh.view_count, fresh.created_at);
    await env.DB.prepare('UPDATE stories SET hot_score=? WHERE id=?').bind(newHot, story_id).run();

    return new Response(JSON.stringify({
      ok: true, like_count: fresh.like_count
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
