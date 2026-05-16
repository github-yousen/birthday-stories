// /browse?y=&m=&d=&page=&sort=
import { pickLang, t, ensureUid, escapeHtml, pad2, hasUserUnlocked } from './_shared.js';
import { renderHead, renderHeader, renderFooter, renderStoryCard } from './_template.js';
import { trackVisit, getSiteStats } from './_stats.js';

export async function onRequest({ request, env }) {
  const lang = pickLang(request);
  const { uid, isNew } = await ensureUid(request);
  const url = new URL(request.url);

  await trackVisit(env, request, uid);

  const m = parseInt(url.searchParams.get('m') || '0');
  const d = parseInt(url.searchParams.get('d') || '0');
  const y = parseInt(url.searchParams.get('y') || '0');
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
  const sort = url.searchParams.get('sort') === 'time' ? 'time' : 'hot';
  const pageSize = 20;

  // 没指定月日 → 引导回首页
  if (!m || !d || m < 1 || m > 12 || d < 1 || d > 31) {
    return Response.redirect(url.origin + '/', 302);
  }

  const birthMd = `${pad2(m)}-${pad2(d)}`;

  // 用户是否已解锁此生日（写过故事）
  const unlocked = await hasUserUnlocked(env, uid, birthMd);

  // 总数
  const totalRow = await env.DB.prepare(
    'SELECT COUNT(*) as c FROM stories WHERE birth_md=?'
  ).bind(birthMd).first();
  const total = totalRow?.c || 0;

  let stories = { results: [] };
  let totalPages = 1;
  let isLocked = false;

  if (unlocked) {
    // 解锁：完整分页列表
    totalPages = Math.max(1, Math.ceil(total / pageSize));
    const offset = (page - 1) * pageSize;
    const orderBy = sort === 'time' ? 'created_at DESC' : 'hot_score DESC, created_at DESC';
    stories = await env.DB.prepare(
      `SELECT id,birth_year,birth_month,birth_day,nickname,excerpt,story,created_at,like_count,view_count,comment_count
       FROM stories WHERE birth_md=? ORDER BY ${orderBy} LIMIT ? OFFSET ?`
    ).bind(birthMd, pageSize, offset).all();
  } else {
    // 未解锁：只能看热度前 10
    isLocked = true;
    stories = await env.DB.prepare(
      `SELECT id,birth_year,birth_month,birth_day,nickname,excerpt,story,created_at,like_count,view_count,comment_count
       FROM stories WHERE birth_md=? ORDER BY hot_score DESC, created_at DESC LIMIT 10`
    ).bind(birthMd).all();
  }

  const stats = await getSiteStats(env);

  // SEO
  const dateStr = `${pad2(m)}-${pad2(d)}`;
  const title = lang === 'zh'
    ? `${m}月${d}日生日的人 · 同生日故事`
    : `People Born on ${pad2(m)}-${pad2(d)} · Birthday Stories`;
  const desc = lang === 'zh'
    ? `${m}月${d}日生日，共 ${total} 个人在这里分享了他们的故事。看看有谁与你同一天来到这世界。`
    : `${pad2(m)}-${pad2(d)} birthday: ${total} people have shared their stories. Find others born on the same day.`;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: title,
    description: desc,
    url: url.toString(),
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: stories.results?.length || 0,
      itemListElement: (stories.results || []).slice(0, 10).map((s, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${url.origin}/story/${s.id}`,
        name: s.nickname,
      })),
    },
  };

  const head = renderHead({ title, desc, lang, url: url.toString(), schema });

  const sortBase = `/browse?y=${y}&m=${m}&d=${d}&page=${page}`;
  const sortTabs = unlocked ? `
<div class="sort-tabs">
  <a href="${sortBase}&sort=hot" ${sort === 'hot' ? 'class="active"' : ''}>${t(lang, 'sort_hot')}</a>
  <a href="${sortBase}&sort=time" ${sort === 'time' ? 'class="active"' : ''}>${t(lang, 'sort_time')}</a>
</div>` : '';

  const lockBanner = isLocked ? `
<div class="lock-banner">
  ${t(lang, 'locked_full_list', { n: total })}
  <br><a href="/write?y=${y}&m=${m}&d=${d}" style="font-weight:600;">→ ${t(lang, 'write_btn')}</a>
</div>` : (total > 0 ? `<div style="color:var(--fg-muted);font-size:13px;margin:8px 0;">${t(lang, 'you_unlocked')}</div>` : '');

  const cards = (stories.results || []).map(s => renderStoryCard(s, lang)).join('') ||
                `<div class="story-card" style="text-align:center;color:var(--fg-muted);">${t(lang, 'no_stories')}</div>`;

  // 分页器
  let pager = '';
  if (unlocked && totalPages > 1) {
    const items = [];
    items.push(page > 1
      ? `<a href="${sortBase.replace('page='+page, 'page='+(page-1))}&sort=${sort}">${t(lang, 'prev')}</a>`
      : `<span class="disabled">${t(lang, 'prev')}</span>`);
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, page + 2);
    for (let p = start; p <= end; p++) {
      items.push(p === page
        ? `<span class="current">${p}</span>`
        : `<a href="/browse?y=${y}&m=${m}&d=${d}&page=${p}&sort=${sort}">${p}</a>`);
    }
    items.push(page < totalPages
      ? `<a href="${sortBase.replace('page='+page, 'page='+(page+1))}&sort=${sort}">${t(lang, 'next')}</a>`
      : `<span class="disabled">${t(lang, 'next')}</span>`);
    pager = `<div class="pager">${items.join('')}</div>`;
  }

  const html = head + renderHeader(lang, '/browse') + `
<div class="container">
  <section style="padding:40px 0 20px;">
    <a href="/" style="color:var(--fg-muted);font-size:13px;">← ${t(lang, 'back')}</a>
    <h1 style="font-family:var(--serif);font-size:36px;font-weight:600;margin:8px 0 8px;letter-spacing:-0.02em;">
      ${lang === 'zh' ? `${m} 月 ${d} 日 生日` : `Born on ${pad2(m)}-${pad2(d)}`}
    </h1>
    <p style="color:var(--fg-soft);font-size:16px;margin:0;">
      ${lang === 'zh' ? `共 ${total} 个人在这里分享了故事` : `${total} people shared stories on this day`}
    </p>
  </section>

  <div class="section-head">
    <h2>${t(lang, 'same_day')}</h2>
    ${sortTabs}
  </div>

  ${lockBanner}
  ${cards}
  ${pager}
</div>
` + renderFooter(lang, stats);

  const headers = { 'Content-Type': 'text/html; charset=UTF-8', 'Cache-Control': 'public, max-age=30' };
  if (isNew) headers['Set-Cookie'] = `bs_uid=${uid}; Path=/; Max-Age=31536000; SameSite=Lax`;
  return new Response(html, { headers });
}
