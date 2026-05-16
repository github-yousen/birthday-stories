// 站点统计：UV/PV 记录
import { getDate, getClientIp, sha256 } from './_shared.js';

export async function trackVisit(env, request, uid) {
  try {
    const today = getDate();
    const ip = getClientIp(request);
    // 用 cookie uid + ip 哈希组合做指纹（cookie 清掉但 IP 不变也算同一人）
    const fingerprint = await sha256(uid + '|' + ip);

    // PV +1
    await env.DB.prepare(
      `INSERT INTO daily_stats (date, pv, uv) VALUES (?, 1, 0)
       ON CONFLICT(date) DO UPDATE SET pv = pv + 1`
    ).bind(today).run();

    // UV 去重：今天该指纹是否已计数
    const exists = await env.DB.prepare(
      'SELECT visitor_uid FROM visitors WHERE date=? AND visitor_uid=?'
    ).bind(today, fingerprint).first();

    if (!exists) {
      await env.DB.prepare(
        'INSERT INTO visitors (date, visitor_uid, last_seen) VALUES (?, ?, ?)'
      ).bind(today, fingerprint, Date.now()).run();
      await env.DB.prepare(
        'UPDATE daily_stats SET uv = uv + 1 WHERE date=?'
      ).bind(today).run();
    }

    // 顺手清理 7 天前的 visitor 记录
    const oldDate = getDate(Date.now() - 7 * 86400000);
    await env.DB.prepare('DELETE FROM visitors WHERE date < ?').bind(oldDate).run();
  } catch (e) {
    // 统计失败不影响主流程
    console.error('trackVisit failed', e);
  }
}

export async function getSiteStats(env) {
  const today = getDate();
  const yesterday = getDate(Date.now() - 86400000);

  const [todayRow, ydayRow, totalStories, totalUsers] = await Promise.all([
    env.DB.prepare('SELECT pv, uv FROM daily_stats WHERE date=?').bind(today).first(),
    env.DB.prepare('SELECT pv, uv FROM daily_stats WHERE date=?').bind(yesterday).first(),
    env.DB.prepare('SELECT COUNT(*) as c FROM stories').first(),
    env.DB.prepare('SELECT COUNT(DISTINCT user_uid) as c FROM stories').first(),
  ]);

  return {
    today_pv: todayRow?.pv || 0,
    today_uv: todayRow?.uv || 0,
    yesterday_pv: ydayRow?.pv || 0,
    yesterday_uv: ydayRow?.uv || 0,
    total_stories: totalStories?.c || 0,
    total_users: totalUsers?.c || 0,
  };
}
