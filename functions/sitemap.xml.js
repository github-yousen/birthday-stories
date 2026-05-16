// /sitemap.xml - 自动包含所有故事详情页
export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  const origin = url.origin;

  const stories = await env.DB.prepare(
    'SELECT id, updated_at FROM stories ORDER BY updated_at DESC LIMIT 5000'
  ).all();

  const now = new Date().toISOString();

  const urls = [
    `<url><loc>${origin}/</loc><changefreq>daily</changefreq><priority>1.0</priority><lastmod>${now}</lastmod></url>`,
    `<url><loc>${origin}/?lang=en</loc><changefreq>daily</changefreq><priority>0.9</priority><lastmod>${now}</lastmod></url>`,
    `<url><loc>${origin}/write</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>`,
  ];

  // 365 天的浏览页都列上（搜索引擎友好）
  for (let m = 1; m <= 12; m++) {
    const days = new Date(2024, m, 0).getDate();
    for (let d = 1; d <= days; d++) {
      urls.push(`<url><loc>${origin}/browse?y=2000&amp;m=${m}&amp;d=${d}</loc><changefreq>weekly</changefreq><priority>0.6</priority></url>`);
    }
  }

  // 所有故事详情页
  for (const s of (stories.results || [])) {
    const lastmod = new Date(s.updated_at).toISOString();
    urls.push(`<url><loc>${origin}/story/${s.id}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=UTF-8',
      'Cache-Control': 'public, max-age=3600',
    }
  });
}
