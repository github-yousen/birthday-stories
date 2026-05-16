// /write 写故事页
import { pickLang, t, ensureUid, escapeHtml, pad2 } from './_shared.js';
import { renderHead, renderHeader, renderFooter } from './_template.js';
import { trackVisit, getSiteStats } from './_stats.js';

export async function onRequest({ request, env }) {
  const lang = pickLang(request);
  const { uid, isNew } = await ensureUid(request);
  const url = new URL(request.url);

  await trackVisit(env, request, uid);
  const stats = await getSiteStats(env);

  // 预填充生日（从 URL）
  const presetY = parseInt(url.searchParams.get('y') || '0');
  const presetM = parseInt(url.searchParams.get('m') || '0');
  const presetD = parseInt(url.searchParams.get('d') || '0');

  const today = new Date();
  const currentYear = today.getFullYear();
  const yearOptions = [];
  for (let y = currentYear; y >= 1900; y--) yearOptions.push(y);

  const title = t(lang, 'write_title') + ' · ' + t(lang, 'site_title');
  const desc = t(lang, 'write_title');

  const head = renderHead({ title, desc, lang, url: url.toString() });

  const html = head + renderHeader(lang, '/write') + `
<div class="container">
  <section style="padding:48px 0 0;">
    <a href="/" style="color:var(--fg-muted);font-size:13px;">← ${t(lang, 'back')}</a>
  </section>

  <form class="write-form" id="writeForm">
    <h2>${t(lang, 'write_title')}</h2>

    <div class="field">
      <label>${t(lang, 'label_birthday')}</label>
      <div class="field-row">
        <select name="year" required>
          ${yearOptions.map(y => `<option value="${y}" ${y === presetY ? 'selected' : ''}>${y}</option>`).join('')}
        </select>
        <select name="month" required>
          ${Array.from({length: 12}, (_, i) => `<option value="${i+1}" ${(i+1) === presetM ? 'selected' : ''}>${pad2(i+1)}</option>`).join('')}
        </select>
        <select name="day" required>
          ${Array.from({length: 31}, (_, i) => `<option value="${i+1}" ${(i+1) === presetD ? 'selected' : ''}>${pad2(i+1)}</option>`).join('')}
        </select>
      </div>
    </div>

    <div class="field">
      <label>${t(lang, 'label_nickname')}</label>
      <input type="text" name="nickname" maxlength="40" placeholder="${t(lang, 'placeholder_nickname')}">
      <div class="checkbox-row" style="margin-top:8px;">
        <input type="checkbox" id="show_nick" name="display_nickname" value="1" checked>
        <label for="show_nick" style="margin:0;text-transform:none;letter-spacing:0;">${t(lang, 'label_show_nickname')}</label>
      </div>
    </div>

    <div class="field">
      <label>${t(lang, 'label_story')}</label>
      <textarea name="story" required maxlength="10000" placeholder="${t(lang, 'placeholder_story')}"></textarea>
      <div class="char-count"><span id="charCount">0</span> / 10000</div>
    </div>

    <button type="submit" class="btn" style="width:100%;padding:14px;">${t(lang, 'submit_btn')} →</button>
  </form>
</div>
<script>
const LANG = ${JSON.stringify(lang)};
const ta = document.querySelector('textarea[name="story"]');
const cc = document.getElementById('charCount');
ta.addEventListener('input', () => { cc.textContent = ta.value.length; });

document.getElementById('writeForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const data = {
    year: parseInt(fd.get('year')),
    month: parseInt(fd.get('month')),
    day: parseInt(fd.get('day')),
    nickname: (fd.get('nickname') || '').trim(),
    display_nickname: fd.get('display_nickname') === '1',
    story: (fd.get('story') || '').trim(),
    lang: LANG,
  };
  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = '...';
  try {
    const r = await fetch('/api/stories', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(data)
    });
    const j = await r.json();
    if (j.ok) {
      showToast(LANG === 'zh' ? '故事已发布！' : 'Published!');
      setTimeout(() => location.href = '/story/' + j.story.id, 800);
    } else {
      showToast(j.error || 'Error');
      btn.disabled = false;
      btn.textContent = LANG === 'zh' ? '发布故事 →' : 'Publish →';
    }
  } catch (err) {
    showToast('Network error');
    btn.disabled = false;
    btn.textContent = LANG === 'zh' ? '发布故事 →' : 'Publish →';
  }
});
</script>
` + renderFooter(lang, stats);

  const headers = { 'Content-Type': 'text/html; charset=UTF-8' };
  if (isNew) headers['Set-Cookie'] = `bs_uid=${uid}; Path=/; Max-Age=31536000; SameSite=Lax`;
  return new Response(html, { headers });
}
