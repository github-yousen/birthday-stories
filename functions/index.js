// 首页：Hero + 最新故事 + 全网热门
import { pickLang, t, ensureUid, escapeHtml, pad2 } from './_shared.js';
import { renderHead, renderHeader, renderFooter, renderStoryCard } from './_template.js';
import { trackVisit, getSiteStats } from './_stats.js';

export async function onRequest({ request, env }) {
  const lang = pickLang(request);
  const { uid, isNew } = await ensureUid(request);
  const url = new URL(request.url);

  // 异步统计（不阻塞）
  await trackVisit(env, request, uid);

  // 拉数据
  const [latest, hot, stats] = await Promise.all([
    env.DB.prepare(
      'SELECT id,birth_year,birth_month,birth_day,nickname,excerpt,story,created_at,like_count,view_count,comment_count FROM stories ORDER BY created_at DESC LIMIT 6'
    ).all(),
    env.DB.prepare(
      'SELECT id,birth_year,birth_month,birth_day,nickname,excerpt,story,created_at,like_count,view_count,comment_count FROM stories ORDER BY hot_score DESC LIMIT 6'
    ).all(),
    getSiteStats(env),
  ]);

  const today = new Date();
  const currentYear = today.getFullYear();
  const yearOptions = [];
  for (let y = currentYear; y >= 1900; y--) yearOptions.push(y);

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: t(lang, 'site_title'),
    url: url.origin,
    description: t(lang, 'site_desc'),
    potentialAction: {
      '@type': 'SearchAction',
      target: `${url.origin}/browse?m={month}&d={day}`,
      'query-input': 'required name=month required name=day',
    },
  };

  const head = renderHead({
    title: t(lang, 'site_title'),
    desc: t(lang, 'site_desc'),
    lang, url: url.toString(), schema,
  });

  const heroForm = `
<form class="bday-form" method="GET" action="/browse">
  <span style="font-weight:600;color:var(--fg-soft);">${t(lang, 'label_search_birthday')}</span>
  <select name="y" required>
    ${yearOptions.map(y => `<option value="${y}">${y}</option>`).join('')}
  </select>
  <span>${t(lang, 'label_year')}</span>
  <select name="m" required>
    ${Array.from({length: 12}, (_, i) => `<option value="${i+1}">${pad2(i+1)}</option>`).join('')}
  </select>
  <span>${t(lang, 'label_month')}</span>
  <select name="d" required>
    ${Array.from({length: 31}, (_, i) => `<option value="${i+1}">${pad2(i+1)}</option>`).join('')}
  </select>
  <span>${t(lang, 'label_day')}</span>
  <button type="submit" class="btn">${t(lang, 'cta_search')} →</button>
</form>`;

  const hot10 = (hot.results || []).map(s => renderStoryCard(s, lang)).join('');
  const latest6 = (latest.results || []).map(s => renderStoryCard(s, lang)).join('');

  const html = head + renderHeader(lang, '/') + `
<div class="container">
  <section class="hero">
    <h1>${t(lang, 'hero_title')}</h1>
    <p>${t(lang, 'hero_sub')}</p>
    ${heroForm}
    <div style="margin-top:24px;">
      <a href="/write" class="btn btn-ghost">${t(lang, 'write_btn')} →</a>
    </div>
  </section>

  <div class="section-head">
    <h2>${lang === 'zh' ? '🔥 全网热门故事' : '🔥 Hot Stories'}</h2>
    <span class="meta">${(hot.results || []).length} ${t(lang, 'stories_count')}</span>
  </div>
  ${hot10 || `<div class="story-card" style="text-align:center;color:var(--fg-muted);">${t(lang, 'no_stories')}</div>`}

  <div class="section-head">
    <h2>${lang === 'zh' ? '✨ 最新发布' : '✨ Latest'}</h2>
  </div>
  ${latest6 || `<div class="story-card" style="text-align:center;color:var(--fg-muted);">${t(lang, 'no_stories')}</div>`}
</div>
` + renderFooter(lang, stats);

  const headers = {
    'Content-Type': 'text/html; charset=UTF-8',
    'Cache-Control': 'public, max-age=60',
  };
  if (isNew) {
    headers['Set-Cookie'] = `bs_uid=${uid}; Path=/; Max-Age=31536000; SameSite=Lax`;
  }
  // 带 ?lang 参数时记忆到 cookie
  if (url.searchParams.get('lang')) {
    const existing = headers['Set-Cookie'] || '';
    const langCookie = `lang=${lang}; Path=/; Max-Age=31536000; SameSite=Lax`;
    headers['Set-Cookie'] = existing ? [existing, langCookie] : langCookie;
  }
  return new Response(html, { headers });
}
