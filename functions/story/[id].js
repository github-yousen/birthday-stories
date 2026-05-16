// 故事详情页 /story/[id]
import { pickLang, t, ensureUid, escapeHtml, nl2br, pad2, formatTime, calcHotScore } from '../_shared.js';
import { renderHead, renderHeader, renderFooter } from '../_template.js';
import { trackVisit, getSiteStats } from '../_stats.js';

export async function onRequest({ request, env, params }) {
  const lang = pickLang(request);
  const { uid, isNew } = await ensureUid(request);
  const url = new URL(request.url);
  const id = parseInt(params.id);

  if (!id || isNaN(id)) {
    return new Response('Not Found', { status: 404 });
  }

  await trackVisit(env, request, uid);

  // 拉故事
  const story = await env.DB.prepare(
    `SELECT * FROM stories WHERE id=?`
  ).bind(id).first();

  if (!story) {
    return new Response('Story Not Found', { status: 404 });
  }

  // 浏览量 +1（异步，不阻塞）
  const newViews = story.view_count + 1;
  const newHot = calcHotScore(story.like_count, story.comment_count, newViews, story.created_at);
  await env.DB.prepare(
    'UPDATE stories SET view_count=?, hot_score=? WHERE id=?'
  ).bind(newViews, newHot, id).run();

  // 当前用户是否已点赞
  const liked = await env.DB.prepare(
    'SELECT id FROM likes WHERE story_id=? AND user_uid=?'
  ).bind(id, uid).first();

  // 评论
  const comments = await env.DB.prepare(
    'SELECT id,nickname,content,created_at FROM comments WHERE story_id=? ORDER BY created_at DESC LIMIT 100'
  ).bind(id).all();

  const stats = await getSiteStats(env);

  const dateStr = `${story.birth_year}-${pad2(story.birth_month)}-${pad2(story.birth_day)}`;
  const title = `${story.nickname} · ${dateStr} ${t(lang, 'detail_title')}`;
  const desc = (story.excerpt || story.story).slice(0, 160);

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description: desc,
    datePublished: new Date(story.created_at).toISOString(),
    dateModified: new Date(story.updated_at).toISOString(),
    author: { '@type': 'Person', name: story.nickname },
    publisher: { '@type': 'Organization', name: 'Birthday Stories' },
    mainEntityOfPage: url.toString(),
    interactionStatistic: [
      { '@type': 'InteractionCounter', interactionType: { '@type': 'LikeAction' }, userInteractionCount: story.like_count },
      { '@type': 'InteractionCounter', interactionType: { '@type': 'CommentAction' }, userInteractionCount: story.comment_count },
      { '@type': 'InteractionCounter', interactionType: { '@type': 'ViewAction' }, userInteractionCount: newViews },
    ],
  };

  const head = renderHead({ title, desc, lang, url: url.toString(), schema });

  const initial = story.nickname.charAt(0).toUpperCase();
  const commentsHtml = (comments.results || []).map(c => `
<div class="comment">
  <div class="comment-head">
    <span class="comment-nick">${escapeHtml(c.nickname)}</span>
    <span class="comment-time">${formatTime(c.created_at, lang)}</span>
  </div>
  <div class="comment-body">${nl2br(c.content)}</div>
</div>
`).join('') || `<div style="color:var(--fg-muted);font-size:14px;">${lang === 'zh' ? '暂无评论' : 'No comments yet'}</div>`;

  const browseUrl = `/browse?y=${story.birth_year}&m=${story.birth_month}&d=${story.birth_day}`;

  const html = head + renderHeader(lang, '/story') + `
<div class="container">
  <section style="padding:24px 0;">
    <a href="${browseUrl}" style="color:var(--fg-muted);font-size:13px;">← ${t(lang, 'back')}</a>
  </section>

  <article class="story-detail">
    <h1>${escapeHtml(story.nickname)}${lang === 'zh' ? ' 的故事' : "'s Story"}</h1>
    <div class="meta-bar">
      <span class="story-nick">
        <span class="avatar">${escapeHtml(initial)}</span>
        ${escapeHtml(story.nickname)}
      </span>
      <span>·</span>
      <span>🎂 ${dateStr}</span>
      <span>·</span>
      <span>${t(lang, 'submitted_at')} ${formatTime(story.created_at, lang)}</span>
      <span>·</span>
      <span>👁 ${newViews}</span>
    </div>
    <div class="body">${nl2br(story.story)}</div>

    <div class="actions-bar">
      <button class="like-btn ${liked ? 'liked' : ''}" id="likeBtn" data-id="${id}" data-liked="${liked ? '1' : '0'}">
        ${liked ? '♥' : '♡'} <span id="likeCount">${story.like_count}</span> ${t(lang, liked ? 'unlike_btn' : 'like_btn')}
      </button>
      <a href="${browseUrl}" class="like-btn">↪ ${lang === 'zh' ? '更多同生日故事' : 'More same-day stories'}</a>
    </div>
  </article>

  <section class="comments-section">
    <h3>💬 ${t(lang, 'comments')} (${story.comment_count})</h3>
    <form class="comment-form" id="commentForm">
      <textarea name="content" placeholder="${t(lang, 'write_comment')}" required maxlength="1000"></textarea>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;">
        <input name="nickname" type="text" placeholder="${t(lang, 'label_nickname')}" maxlength="40"
               style="flex:1;max-width:240px;padding:8px 10px;border:1px solid var(--border);border-radius:8px;background:var(--bg);color:var(--fg);">
        <button type="submit" class="btn">${t(lang, 'submit_comment')}</button>
      </div>
    </form>
    <div class="comment-list" id="commentList">${commentsHtml}</div>
  </section>
</div>
<script>
const STORY_ID = ${id};
const LANG = ${JSON.stringify(lang)};
document.getElementById('likeBtn').addEventListener('click', async (e) => {
  const btn = e.currentTarget;
  const liked = btn.dataset.liked === '1';
  btn.disabled = true;
  try {
    const r = await fetch('/api/likes', {
      method: liked ? 'DELETE' : 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ story_id: STORY_ID })
    });
    const j = await r.json();
    if (j.ok) {
      btn.dataset.liked = liked ? '0' : '1';
      btn.classList.toggle('liked');
      document.getElementById('likeCount').textContent = j.like_count;
      btn.innerHTML = (liked ? '♡' : '♥') + ' <span id="likeCount">' + j.like_count + '</span> ' +
        (LANG === 'zh' ? (liked ? '点赞' : '已赞') : (liked ? 'Like' : 'Liked'));
      showToast(LANG === 'zh' ? (liked ? '已取消' : '点赞成功') : (liked ? 'Removed' : 'Liked'));
    } else {
      showToast(j.error || 'Error');
    }
  } catch (err) { showToast('Network error'); }
  finally { btn.disabled = false; }
});

document.getElementById('commentForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const content = (fd.get('content') || '').trim();
  const nickname = (fd.get('nickname') || '').trim();
  if (!content) return;
  const btn = e.target.querySelector('button');
  btn.disabled = true;
  try {
    const r = await fetch('/api/comments', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ story_id: STORY_ID, content, nickname })
    });
    const j = await r.json();
    if (j.ok) {
      showToast(LANG === 'zh' ? '评论成功' : 'Posted!');
      e.target.reset();
      // 插入新评论
      const list = document.getElementById('commentList');
      const html = '<div class="comment"><div class="comment-head"><span class="comment-nick">' +
        j.comment.nickname.replace(/[<>&]/g, c=>({'<':'&lt;','>':'&gt;','&':'&amp;'}[c])) +
        '</span><span class="comment-time">' + (LANG==='zh'?'刚刚':'just now') +
        '</span></div><div class="comment-body">' +
        j.comment.content.replace(/[<>&]/g, c=>({'<':'&lt;','>':'&gt;','&':'&amp;'}[c])).replace(/\\n/g,'<br>') +
        '</div></div>';
      if (list.querySelector('.comment')) list.insertAdjacentHTML('afterbegin', html);
      else list.innerHTML = html;
    } else {
      showToast(j.error || 'Error');
    }
  } catch(err){ showToast('Network error'); }
  finally { btn.disabled = false; }
});
</script>
` + renderFooter(lang, stats);

  const headers = { 'Content-Type': 'text/html; charset=UTF-8', 'Cache-Control': 'public, max-age=10' };
  if (isNew) headers['Set-Cookie'] = `bs_uid=${uid}; Path=/; Max-Age=31536000; SameSite=Lax`;
  return new Response(html, { headers });
}
