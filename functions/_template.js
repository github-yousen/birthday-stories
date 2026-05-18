// SSR HTML 模板生成器
import { t, escapeHtml, nl2br, formatTime, pad2 } from './_shared.js';

const STYLES = `
<style>
:root {
  --bg: #faf9f6;
  --bg-card: #ffffff;
  --fg: #1a1a1a;
  --fg-soft: #5c5c5c;
  --fg-muted: #999;
  --accent: #ff6b6b;
  --accent-soft: #fff0f0;
  --border: #e8e6e0;
  --shadow: 0 1px 3px rgba(0,0,0,.04);
  --shadow-hover: 0 4px 16px rgba(255,107,107,.15);
  --radius: 12px;
  --maxw: 880px;
  --serif: 'Fraunces', 'Noto Serif SC', Georgia, serif;
  --sans: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif;
}
[data-theme="dark"] {
  --bg: #0e0e10;
  --bg-card: #18181b;
  --fg: #f0ede4;
  --fg-soft: #b0aca0;
  --fg-muted: #6b6860;
  --accent: #ff8e8e;
  --accent-soft: #2a1818;
  --border: #2a2a2e;
  --shadow: 0 1px 3px rgba(0,0,0,.3);
}
* { box-sizing: border-box; }
body {
  margin: 0; padding: 0;
  font-family: var(--sans);
  background: var(--bg);
  color: var(--fg);
  line-height: 1.7;
  -webkit-font-smoothing: antialiased;
}
a { color: var(--accent); text-decoration: none; }
a:hover { text-decoration: underline; }
.container { max-width: var(--maxw); margin: 0 auto; padding: 0 20px; }
header.site-header {
  position: sticky; top: 0; z-index: 50;
  background: rgba(250, 249, 246, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border);
}
[data-theme="dark"] header.site-header { background: rgba(14,14,16,0.85); }
.nav {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 0;
}
.logo {
  font-family: var(--serif); font-size: 20px; font-weight: 600;
  color: var(--fg); letter-spacing: -0.01em;
}
.logo b { color: var(--accent); }
.nav-actions { display: flex; gap: 16px; align-items: center; }
.nav-actions a { color: var(--fg-soft); font-size: 14px; }
.nav-actions a.active { color: var(--fg); font-weight: 600; }
.lang-toggle, .theme-toggle {
  background: transparent; border: 1px solid var(--border); border-radius: 999px;
  padding: 4px 12px; font-size: 13px; cursor: pointer;
  color: var(--fg-soft); transition: all .2s;
}
.lang-toggle:hover, .theme-toggle:hover { color: var(--fg); border-color: var(--accent); }
.theme-toggle { padding: 4px 10px; font-size: 14px; }

/* Hero */
.hero {
  padding: 80px 0 60px;
  text-align: center;
}
.hero h1 {
  font-family: var(--serif); font-weight: 600;
  font-size: clamp(32px, 5vw, 52px);
  line-height: 1.15; margin: 0 0 18px;
  letter-spacing: -0.02em;
}
.hero h1 em {
  font-style: italic; color: var(--accent); font-weight: 500;
}
.hero p {
  color: var(--fg-soft); font-size: 17px; max-width: 600px;
  margin: 0 auto 32px;
}

/* Birthday picker form */
.bday-form {
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: var(--radius); padding: 24px;
  box-shadow: var(--shadow);
  display: flex; flex-wrap: wrap; gap: 12px; align-items: center;
  justify-content: center;
  max-width: 640px; margin: 0 auto;
}
.bday-form select, .bday-form input {
  font-size: 15px; padding: 10px 14px; border-radius: 8px;
  border: 1px solid var(--border); background: var(--bg);
  color: var(--fg); font-family: inherit;
  transition: border-color .15s;
}
.bday-form select:focus, .bday-form input:focus {
  outline: none; border-color: var(--accent);
}
.btn {
  display: inline-block;
  font-family: var(--sans); font-size: 15px; font-weight: 600;
  padding: 10px 24px; border-radius: 8px;
  background: var(--accent); color: #fff; border: none; cursor: pointer;
  transition: transform .15s, box-shadow .15s;
}
.btn:hover { transform: translateY(-1px); box-shadow: var(--shadow-hover); }
.btn-ghost {
  background: transparent; color: var(--fg);
  border: 1px solid var(--border);
}
.btn-ghost:hover { border-color: var(--accent); color: var(--accent); }

/* Stories list */
.section-head {
  display: flex; justify-content: space-between; align-items: baseline;
  padding: 60px 0 20px; gap: 12px; flex-wrap: wrap;
}
.section-head h2 {
  font-family: var(--serif); font-weight: 600; font-size: 28px;
  margin: 0; letter-spacing: -0.01em;
}
.section-head .meta {
  color: var(--fg-muted); font-size: 14px;
}
.sort-tabs {
  display: inline-flex; gap: 4px; background: var(--bg-card);
  border: 1px solid var(--border); border-radius: 999px; padding: 4px;
}
.sort-tabs a {
  font-size: 13px; padding: 4px 14px; border-radius: 999px;
  color: var(--fg-soft); transition: all .15s;
}
.sort-tabs a.active {
  background: var(--accent); color: #fff; font-weight: 600;
}
.sort-tabs a:hover { text-decoration: none; }

.lock-banner {
  background: var(--accent-soft); border: 1px solid var(--accent);
  border-radius: var(--radius); padding: 14px 18px; margin: 16px 0;
  font-size: 14px; color: var(--accent);
}

.story-card {
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: var(--radius); padding: 24px;
  margin-bottom: 16px; transition: all .2s;
}
.story-card:hover {
  border-color: var(--accent);
  box-shadow: var(--shadow-hover);
  transform: translateY(-1px);
}
.story-head {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 10px; gap: 12px; flex-wrap: wrap;
}
.story-nick {
  font-weight: 600; font-size: 14px; color: var(--fg);
  display: flex; align-items: center; gap: 8px;
}
.avatar {
  width: 28px; height: 28px; border-radius: 50%;
  background: linear-gradient(135deg, var(--accent), #ff9a8b);
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 12px; font-weight: 700;
}
.story-time { color: var(--fg-muted); font-size: 13px; }
.story-excerpt {
  color: var(--fg-soft); font-size: 15px; line-height: 1.7;
  margin: 8px 0 14px;
}
.story-foot {
  display: flex; gap: 16px; align-items: center;
  font-size: 13px; color: var(--fg-muted);
}
.story-foot a { color: var(--fg-muted); }
.story-foot a:hover { color: var(--accent); text-decoration: none; }
.read-more {
  color: var(--accent); font-weight: 500;
}

/* Pagination */
.pager {
  display: flex; justify-content: center; gap: 8px; margin: 32px 0;
}
.pager a, .pager span {
  padding: 8px 14px; border-radius: 8px;
  border: 1px solid var(--border); color: var(--fg-soft);
  font-size: 14px; min-width: 40px; text-align: center;
}
.pager a:hover { border-color: var(--accent); color: var(--accent); text-decoration: none; }
.pager .current { background: var(--accent); color: #fff; border-color: var(--accent); }
.pager .disabled { opacity: 0.4; pointer-events: none; }

/* Detail page */
.story-detail {
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: var(--radius); padding: 40px;
  margin: 32px 0;
}
.story-detail h1 {
  font-family: var(--serif); font-size: 32px; font-weight: 600;
  margin: 0 0 16px; line-height: 1.2; letter-spacing: -0.01em;
}
.story-detail .meta-bar {
  display: flex; gap: 16px; align-items: center;
  color: var(--fg-muted); font-size: 14px; margin-bottom: 28px;
  padding-bottom: 20px; border-bottom: 1px solid var(--border);
}
.story-detail .body {
  font-size: 17px; line-height: 1.85; color: var(--fg);
}

.actions-bar {
  display: flex; gap: 12px; margin: 32px 0;
}
.like-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 10px 20px; border-radius: 999px;
  border: 1px solid var(--border); background: var(--bg-card);
  color: var(--fg); font-size: 14px; font-weight: 500;
  cursor: pointer; transition: all .15s;
}
.like-btn:hover { border-color: var(--accent); color: var(--accent); }
.like-btn.liked { background: var(--accent); color: #fff; border-color: var(--accent); }

.comments-section {
  margin-top: 48px;
}
.comments-section h3 {
  font-family: var(--serif); font-size: 22px; font-weight: 600;
  margin: 0 0 20px;
}
.comment-form { margin-bottom: 24px; }
.comment-form textarea {
  width: 100%; min-height: 80px; resize: vertical;
  padding: 12px; border-radius: 8px;
  border: 1px solid var(--border); background: var(--bg);
  color: var(--fg); font-family: inherit; font-size: 15px;
}
.comment-form textarea:focus { outline: none; border-color: var(--accent); }
.comment-list { display: flex; flex-direction: column; gap: 14px; }
.comment {
  padding: 14px 18px; background: var(--bg);
  border-radius: 8px; border: 1px solid var(--border);
}
.comment-head {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 6px; font-size: 13px;
}
.comment-nick { font-weight: 600; color: var(--fg); }
.comment-time { color: var(--fg-muted); }
.comment-body { color: var(--fg-soft); font-size: 14px; line-height: 1.6; }

/* Write story form */
.write-form {
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: var(--radius); padding: 32px;
  margin: 32px 0;
}
.write-form h2 {
  font-family: var(--serif); font-size: 26px; font-weight: 600;
  margin: 0 0 24px; letter-spacing: -0.01em;
}
.field { margin-bottom: 20px; }
.field label {
  display: block; font-size: 13px; font-weight: 600;
  margin-bottom: 8px; color: var(--fg-soft);
  text-transform: uppercase; letter-spacing: 0.05em;
}
.field-row { display: flex; gap: 8px; }
.field-row select, .field-row input { flex: 1; }
.field input, .field select, .field textarea {
  width: 100%; padding: 12px; border-radius: 8px;
  border: 1px solid var(--border); background: var(--bg);
  color: var(--fg); font-family: inherit; font-size: 15px;
}
.field textarea { min-height: 200px; resize: vertical; line-height: 1.7; }
.field input:focus, .field select:focus, .field textarea:focus {
  outline: none; border-color: var(--accent);
}
.checkbox-row {
  display: flex; gap: 8px; align-items: center;
  font-size: 14px; color: var(--fg-soft);
}
.char-count { font-size: 12px; color: var(--fg-muted); text-align: right; margin-top: 4px; }

/* Stats footer */
.stats-bar {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 16px;
  margin: 60px 0 40px;
}
.stat-card {
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: var(--radius); padding: 20px;
  text-align: center;
}
.stat-num {
  font-family: 'JetBrains Mono', monospace;
  font-size: 28px; font-weight: 700; color: var(--accent);
  line-height: 1;
}
.stat-label {
  font-size: 12px; color: var(--fg-muted);
  margin-top: 6px; text-transform: uppercase; letter-spacing: 0.06em;
}

/* Footer */
footer.site-footer {
  border-top: 1px solid var(--border);
  padding: 40px 0 60px;
  margin-top: 80px;
  text-align: center; color: var(--fg-muted);
  font-size: 13px;
}
footer.site-footer a { color: var(--fg-soft); }
.signature {
  font-family: var(--serif); font-style: italic; font-size: 16px;
  color: var(--fg); margin-bottom: 8px;
}

/* Toast */
.toast {
  position: fixed; bottom: 32px; left: 50%; transform: translateX(-50%);
  background: var(--fg); color: var(--bg);
  padding: 12px 24px; border-radius: 999px;
  font-size: 14px; z-index: 100;
  opacity: 0; pointer-events: none; transition: opacity .2s;
}
.toast.show { opacity: 1; }

@media (max-width: 600px) {
  .hero { padding: 50px 0 40px; }
  .story-detail { padding: 24px; }
  .write-form { padding: 24px; }
}
</style>
`;

const FONTS = `<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,500;0,600;1,400;1,500&family=JetBrains+Mono:wght@500;700&family=Noto+Serif+SC:wght@500;600&display=swap" rel="stylesheet">`;

export function renderHead({ title, desc, lang, url, schema }) {
  const ogImage = `${new URL(url).origin}/og.png`;
  const altLang = lang === 'zh' ? 'en' : 'zh';
  const altUrl = new URL(url);
  altUrl.searchParams.set('lang', altLang);
  return `<!DOCTYPE html>
<html lang="${lang === 'zh' ? 'zh-CN' : 'en'}" data-theme="light">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(desc)}">
<meta name="keywords" content="生日故事,同生日,birthday stories,birthday twins,share birthday,生日分享">
<meta name="robots" content="index,follow">
<meta name="google-site-verification" content="oaKEc7HeCzTgUxnhrbm9FBMurc2e2FnWpKTMLfidn8Y">
<link rel="canonical" href="${escapeHtml(url)}">
<link rel="alternate" hreflang="${lang}" href="${escapeHtml(url)}">
<link rel="alternate" hreflang="${altLang}" href="${escapeHtml(altUrl.toString())}">
<link rel="alternate" hreflang="x-default" href="${escapeHtml(altUrl.toString())}">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(desc)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${escapeHtml(url)}">
<meta property="og:image" content="${escapeHtml(ogImage)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(desc)}">
${schema ? `<script type="application/ld+json">${JSON.stringify(schema)}</script>` : ''}
${FONTS}
${STYLES}
</head>
<body>`;
}

export function renderHeader(lang, currentPath = '/') {
  const otherLang = lang === 'zh' ? 'en' : 'zh';
  return `
<header class="site-header">
  <div class="container nav">
    <a href="/" class="logo"><b>♥</b> ${lang === 'zh' ? '同生日故事' : 'Birthday Stories'}</a>
    <div class="nav-actions">
      <a href="/" ${currentPath === '/' ? 'class="active"' : ''}>${t(lang, 'nav_home')}</a>
      <a href="/browse" ${currentPath.startsWith('/browse') ? 'class="active"' : ''}>${t(lang, 'nav_browse')}</a>
      <a href="/write" ${currentPath === '/write' ? 'class="active"' : ''}>${t(lang, 'write_btn')}</a>
      <button class="theme-toggle" onclick="toggleTheme()" title="theme">☾</button>
      <a href="?lang=${otherLang}" class="lang-toggle">${otherLang === 'zh' ? '中' : 'EN'}</a>
    </div>
  </div>
</header>`;
}

export function renderFooter(lang, stats = {}) {
  return `
<div class="container">
  <div class="stats-bar">
    <div class="stat-card"><div class="stat-num">${stats.today_uv || 0}</div><div class="stat-label">${t(lang, 'today_uv')}</div></div>
    <div class="stat-card"><div class="stat-num">${stats.today_pv || 0}</div><div class="stat-label">${t(lang, 'today_pv')}</div></div>
    <div class="stat-card"><div class="stat-num">${stats.yesterday_uv || 0}</div><div class="stat-label">${t(lang, 'yesterday_uv')}</div></div>
    <div class="stat-card"><div class="stat-num">${stats.yesterday_pv || 0}</div><div class="stat-label">${t(lang, 'yesterday_pv')}</div></div>
    <div class="stat-card"><div class="stat-num">${stats.total_stories || 0}</div><div class="stat-label">${t(lang, 'total_stories')}</div></div>
    <div class="stat-card"><div class="stat-num">${stats.total_users || 0}</div><div class="stat-label">${t(lang, 'total_users')}</div></div>
  </div>
</div>
<footer class="site-footer">
  <div class="container">
    <div class="signature">${t(lang, 'powered_by')}</div>
    <div>📧 <a href="mailto:yzc-cn@qq.com">yzc-cn@qq.com</a> · ${t(lang, 'contact')}</div>
    <div style="margin-top:12px;">© ${new Date().getFullYear()} Birthday Stories · <a href="/sitemap.xml">sitemap</a></div>
  </div>
</footer>
<div id="toast" class="toast"></div>
<script>
function toggleTheme() {
  const cur = document.documentElement.getAttribute('data-theme') || 'light';
  const next = cur === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  document.querySelector('.theme-toggle').textContent = next === 'dark' ? '☀' : '☾';
}
(function(){
  const t = localStorage.getItem('theme') ||
           (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', t);
  const btn = document.querySelector('.theme-toggle');
  if (btn) btn.textContent = t === 'dark' ? '☀' : '☾';
})();
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg; el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2400);
}
</script>
</body></html>`;
}

export function renderStoryCard(s, lang) {
  const initial = (s.nickname || '?').charAt(0).toUpperCase();
  return `
<article class="story-card">
  <div class="story-head">
    <div class="story-nick">
      <span class="avatar">${escapeHtml(initial)}</span>
      <span>${escapeHtml(s.nickname)}</span>
      <span style="color:var(--fg-muted);font-weight:400;font-size:12px;">· ${s.birth_year}-${pad2(s.birth_month)}-${pad2(s.birth_day)}</span>
    </div>
    <div class="story-time">${formatTime(s.created_at, lang)}</div>
  </div>
  <div class="story-excerpt">${escapeHtml(s.excerpt || s.story.slice(0, 120))}</div>
  <div class="story-foot">
    <span>♥ ${s.like_count} ${t(lang, 'likes')}</span>
    <span>💬 ${s.comment_count} ${t(lang, 'comments')}</span>
    <span>👁 ${s.view_count} ${t(lang, 'views')}</span>
    <a href="/story/${s.id}" class="read-more">${t(lang, 'read_more')} →</a>
  </div>
</article>`;
}
