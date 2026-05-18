// IndexNow 主动推送工具：故事发布/更新时通知 Bing/Yandex 立刻收录
// 文档：https://www.indexnow.org/documentation
// Key 文件须挂在 https://birthday-stories.pages.dev/<key>.txt 内容为 key 自身

const INDEXNOW_KEY = '4508f7851b4014ca1f73d1faa2426692';
const HOST = 'birthday-stories.pages.dev';
const KEY_LOCATION = `https://${HOST}/${INDEXNOW_KEY}.txt`;

/**
 * 主动推送一组 URL 给 IndexNow（会同时分发到 Bing / Yandex / Seznam 等）
 * 失败不抛错（避免影响主流程）
 */
export async function pingIndexNow(urls) {
  if (!urls || urls.length === 0) return;
  const list = Array.isArray(urls) ? urls : [urls];
  try {
    const res = await fetch('https://api.indexnow.org/IndexNow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: HOST,
        key: INDEXNOW_KEY,
        keyLocation: KEY_LOCATION,
        urlList: list,
      }),
    });
    // 200/202 都算成功，202 表示已接受待处理
    return { ok: res.status < 300, status: res.status };
  } catch (e) {
    // 静默失败：搜索引擎收录不应阻塞用户体验
    return { ok: false, error: String(e) };
  }
}

/**
 * 故事发布后自动调用（首页+浏览页+故事详情都要通知）
 */
export async function notifyStoryUpdate(env, storyId, year, month, day) {
  const md = String(month).padStart(2, '0') + '-' + String(day).padStart(2, '0');
  const urls = [
    `https://${HOST}/`,
    `https://${HOST}/browse?y=${year}&m=${month}&d=${day}`,
    `https://${HOST}/story/${storyId}`,
  ];
  return pingIndexNow(urls);
}
