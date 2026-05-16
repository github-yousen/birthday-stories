// 共享工具：i18n、SSR 渲染、HTML 转义、IP 哈希等
export const I18N = {
  zh: {
    site_title: '同生日故事 · 寻找与你同一天生日的人',
    site_desc: '输入你的生日，看看那些和你同一天来到这世界的人，他们正在写怎样的故事。',
    nav_home: '首页',
    nav_browse: '浏览',
    nav_about: '关于',
    write_btn: '写下我的故事',
    write_title: '写下属于你的生日故事',
    label_birthday: '我的生日',
    label_year: '年',
    label_month: '月',
    label_day: '日',
    label_nickname: '昵称（可选）',
    placeholder_nickname: '留空将匿名显示（IP后缀+随机ID）',
    label_show_nickname: '公开昵称',
    label_story: '我的故事',
    placeholder_story: '写下你和这一天的故事...（最多 10000 字）',
    submit_btn: '发布故事',
    same_day: '同一天生日',
    stories_count: '条故事',
    no_stories: '还没有人写过这一天的故事，成为第一个吧！',
    locked_tip: '🔒 写完你自己的故事后即可查看全部 · 当前仅展示热度前 10',
    sort_hot: '热度',
    sort_time: '最新',
    likes: '赞',
    views: '浏览',
    comments: '评论',
    today_uv: '今日访客',
    today_pv: '今日浏览',
    yesterday_uv: '昨日访客',
    yesterday_pv: '昨日浏览',
    total_stories: '总故事',
    total_users: '总用户',
    err_required: '请填写生日和故事内容',
    err_too_long: '故事内容超过 10000 字',
    err_invalid_date: '日期无效',
    success: '故事已发布！',
    contact: '联系',
    powered_by: '由 Yousen 用心打造',
    read_more: '阅读全文',
    write_comment: '写下你的评论...',
    submit_comment: '发布评论',
    like_btn: '点赞',
    unlike_btn: '已赞',
    page: '第',
    of: '/',
    pages: '页',
    prev: '上一页',
    next: '下一页',
    detail_title: '的生日故事',
    back: '返回',
    hero_title: '寻找与你同一天来到世界的人',
    hero_sub: '生日是一个特别的坐标。也许你不是孤独的——总有人和你共享这一天，正在过着不同的人生。',
    cta_search: '查看同生日的故事',
    label_search_birthday: '我的生日是',
    show_more: '展开',
    show_less: '收起',
    submitted_at: '发布于',
    you_unlocked: '✓ 你已解锁全部故事',
    locked_full_list: '写下你自己的故事，解锁全部 {n} 条',
  },
  en: {
    site_title: 'Birthday Stories · Find People Born on Your Day',
    site_desc: 'Enter your birthday and discover the stories of people who share the same day.',
    nav_home: 'Home',
    nav_browse: 'Browse',
    nav_about: 'About',
    write_btn: 'Write My Story',
    write_title: 'Write Your Birthday Story',
    label_birthday: 'My Birthday',
    label_year: 'Year',
    label_month: 'Month',
    label_day: 'Day',
    label_nickname: 'Nickname (optional)',
    placeholder_nickname: 'Leave blank to show anonymously',
    label_show_nickname: 'Show nickname',
    label_story: 'My Story',
    placeholder_story: 'Write your story about this day... (max 10000 chars)',
    submit_btn: 'Publish',
    same_day: 'Same-day Birthday',
    stories_count: 'stories',
    no_stories: 'No stories yet on this day. Be the first!',
    locked_tip: '🔒 Write your own story to unlock the full list · showing top 10 by heat',
    sort_hot: 'Hot',
    sort_time: 'Latest',
    likes: 'likes',
    views: 'views',
    comments: 'comments',
    today_uv: 'Today UV',
    today_pv: 'Today PV',
    yesterday_uv: 'Yesterday UV',
    yesterday_pv: 'Yesterday PV',
    total_stories: 'Stories',
    total_users: 'Users',
    err_required: 'Please fill in birthday and story',
    err_too_long: 'Story exceeds 10000 chars',
    err_invalid_date: 'Invalid date',
    success: 'Story published!',
    contact: 'Contact',
    powered_by: 'Crafted by Yousen',
    read_more: 'Read more',
    write_comment: 'Write a comment...',
    submit_comment: 'Submit',
    like_btn: 'Like',
    unlike_btn: 'Liked',
    page: 'Page',
    of: '/',
    pages: '',
    prev: 'Prev',
    next: 'Next',
    detail_title: "'s Birthday Story",
    back: 'Back',
    hero_title: 'Find People Born on Your Day',
    hero_sub: 'A birthday is a special coordinate. You are not alone — others share this day with you, living different lives.',
    cta_search: 'See Same-day Stories',
    label_search_birthday: 'My birthday is',
    show_more: 'Show more',
    show_less: 'Show less',
    submitted_at: 'Posted',
    you_unlocked: '✓ You have unlocked all stories',
    locked_full_list: 'Write your own story to unlock all {n}',
  },
};

export function pickLang(request) {
  const url = new URL(request.url);
  // 优先级：URL ?lang= > Cookie > Accept-Language
  const q = url.searchParams.get('lang');
  if (q === 'zh' || q === 'en') return q;
  const cookie = request.headers.get('Cookie') || '';
  const m = cookie.match(/lang=(zh|en)/);
  if (m) return m[1];
  const al = (request.headers.get('Accept-Language') || '').toLowerCase();
  if (al.startsWith('zh') || al.includes('zh-')) return 'zh';
  return 'en';
}

export function t(lang, key, vars = {}) {
  const dict = I18N[lang] || I18N.zh;
  let s = dict[key] || I18N.zh[key] || key;
  for (const k of Object.keys(vars)) s = s.replace('{' + k + '}', vars[k]);
  return s;
}

export function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function nl2br(s) {
  return escapeHtml(s).replace(/\n/g, '<br>');
}

export async function sha256(str) {
  const buf = new TextEncoder().encode(str);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, '0')).join('');
}

export function getClientIp(request) {
  return request.headers.get('CF-Connecting-IP') ||
         request.headers.get('X-Forwarded-For') ||
         '0.0.0.0';
}

export async function ensureUid(request) {
  // 从 cookie 中读 uid，否则生成新的
  const cookie = request.headers.get('Cookie') || '';
  const m = cookie.match(/bs_uid=([a-f0-9]{16})/);
  if (m) return { uid: m[1], isNew: false };
  // 新用户
  const rand = crypto.getRandomValues(new Uint8Array(8));
  const uid = [...rand].map(b => b.toString(16).padStart(2, '0')).join('');
  return { uid, isNew: true };
}

export function getDate(ts = Date.now()) {
  const d = new Date(ts);
  // UTC+8
  const cn = new Date(d.getTime() + 8 * 3600 * 1000);
  return cn.toISOString().slice(0, 10);
}

export function formatTime(ts, lang) {
  const d = new Date(ts);
  const now = Date.now();
  const diff = (now - ts) / 1000;
  if (diff < 60) return lang === 'zh' ? '刚刚' : 'just now';
  if (diff < 3600) return lang === 'zh' ? `${Math.floor(diff/60)} 分钟前` : `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return lang === 'zh' ? `${Math.floor(diff/3600)} 小时前` : `${Math.floor(diff/3600)}h ago`;
  if (diff < 86400*7) return lang === 'zh' ? `${Math.floor(diff/86400)} 天前` : `${Math.floor(diff/86400)}d ago`;
  return d.toISOString().slice(0, 10);
}

export function makeAnonNickname(ip, uid) {
  // 默认昵称：ip 末段 + uid 前 4 位
  const ipTail = (ip.split('.').pop() || '0');
  return `Visitor_${ipTail}_${uid.slice(0, 4)}`;
}

export function pad2(n) { return String(n).padStart(2, '0'); }

export function calcExcerpt(text, len = 120) {
  const trimmed = text.replace(/\s+/g, ' ').trim();
  if (trimmed.length <= len) return trimmed;
  return trimmed.slice(0, len) + '…';
}

export function calcHotScore(likes, comments, views, createdAt) {
  // Reddit-style hot score: 加分项 + 时间衰减（小时为单位，半衰期约 24h）
  const score = likes * 3 + comments * 5 + views * 0.1;
  const ageHours = (Date.now() - createdAt) / 3600000;
  // 时间衰减：(score) / (ageHours + 2)^1.2
  return score / Math.pow(ageHours + 2, 1.2) + score * 0.1; // 加 score*0.1 让历史好故事不至于完全沉底
}

// 检查用户在指定生日下是否已发故事（解锁完整列表权限）
export async function hasUserUnlocked(env, uid, birthMd) {
  if (!uid) return false;
  const r = await env.DB.prepare(
    'SELECT COUNT(*) as c FROM stories WHERE user_uid=? AND birth_md=?'
  ).bind(uid, birthMd).first();
  return r && r.c > 0;
}
