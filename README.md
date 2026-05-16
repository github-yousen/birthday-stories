# 同生日故事 · Birthday Stories

> 一个全栈生日故事社区，让有相同生日的人相遇。

🌐 **Live**: https://birthday-stories.pages.dev

## ✨ 功能

- 📅 输入生日（年月日）+ 写下你的故事（≤10000 字）
- 🔓 **解锁机制**：未写故事的访客只能查看热度前 10；写过故事后解锁全部分页
- 🔥 **热度排序**：Reddit 风格热度算法（点赞×3 + 评论×5 + 浏览×0.1 + 时间衰减）
- 💬 **点赞 + 评论**：每个故事可点赞、评论
- 🌍 **中英双语**：自动检测 `Accept-Language` + 手动切换
- 📊 **完整统计**：今日/昨日 UV/PV、累计故事数、累计用户数
- 🚀 **SEO 完美**：每页 SSR 直出 HTML；Article/CollectionPage Schema.org；动态 sitemap.xml；OG/Twitter Card
- 🎨 **极简美学**：Fraunces 衬线 + Inter 无衬线 + 深色/亮色主题切换

## 🏗 架构

| 层 | 技术 |
|---|---|
| 渲染 | **Cloudflare Pages Functions**（每个路由 SSR 直出 HTML） |
| 数据 | **Cloudflare D1**（SQLite-on-edge）|
| 部署 | Cloudflare Pages，全球 CDN |
| 前端 | 原生 HTML + CSS + 少量 JS（点赞/评论交互），无构建 |

## 📁 项目结构

```
birthday-stories/
├── functions/
│   ├── _shared.js            # 共享：i18n 词典、UID/IP/sha256/热度算法
│   ├── _template.js          # SSR 模板：head/header/footer + CSS
│   ├── _stats.js             # UV/PV 统计逻辑
│   ├── index.js              # GET / 首页
│   ├── browse.js             # GET /browse 同生日列表
│   ├── write.js              # GET /write 写故事页
│   ├── sitemap.xml.js        # GET /sitemap.xml
│   ├── story/[id].js         # GET /story/:id 详情页
│   └── api/
│       ├── stories.js        # POST /api/stories 发布故事
│       ├── likes.js          # POST/DELETE /api/likes 点赞/取消
│       └── comments.js       # POST /api/comments 发评论
├── public/
│   ├── _placeholder.html     # CF Pages 静态占位
│   └── robots.txt
├── schema/init.sql           # D1 数据库初始化
├── wrangler.toml             # CF Pages + D1 绑定
└── deploy.sh                 # 一键部署脚本
```

## 🚀 部署

### 一键部署
```bash
./deploy.sh
```

> **前置要求**：CF API Token 必须包含以下权限：
> - Account · **D1** · Edit
> - Account · **Cloudflare Pages** · Edit
> - Account · Account Settings · Read
>
> 编辑 Token: https://dash.cloudflare.com/profile/api-tokens

### 手动步骤
```bash
# 1. 创建 D1
wrangler d1 create birthday-stories-db
# 把返回的 database_id 写入 wrangler.toml

# 2. 应用 schema
wrangler d1 execute birthday-stories-db --remote --file=schema/init.sql

# 3. 创建 Pages 项目
wrangler pages project create birthday-stories --production-branch=main

# 4. 部署
wrangler pages deploy public --project-name=birthday-stories
```

## 🧪 本地开发

```bash
# 1. 应用 schema 到本地 D1
wrangler d1 execute birthday-stories-db --local --file=schema/init.sql

# 2. 启动开发服务器
wrangler pages dev --port 8788 --d1 DB=birthday-stories-db --local public

# 访问 http://localhost:8788
```

## 🔍 SEO 说明

- **每页都是 SSR**：HTML 由 Functions 直出，搜索引擎可完整抓取
- **canonical + hreflang**：每页带规范 URL 和 zh/en 语言版本互链
- **Schema.org**：
  - 首页：`WebSite` + `SearchAction`
  - 浏览页：`CollectionPage` + `ItemList`
  - 详情页：`Article` + `InteractionCounter`（点赞/评论/浏览）
- **sitemap.xml**：动态包含首页、写页、366 天浏览页、所有故事详情页

## 📜 数据模型

| 表 | 用途 |
|---|---|
| `stories` | 故事正文（含生日 m-d 索引、热度分、计数） |
| `comments` | 评论 |
| `likes` | 点赞（防重复） |
| `daily_stats` | 每日 UV/PV |
| `visitors` | 当日访客指纹（去重 UV）|

## 🔒 反 spam

- 同 UID 同生日只能发 1 条故事（重复 = 更新）
- 同 IP 24h 内最多发 5 条故事
- 同 IP 1h 内最多发 20 条评论
- IP 哈希存储，不存原始 IP

## 📧 联系

- Email: yzc-cn@qq.com
- 由 [Yousen](https://github.com/github-yousen) 用心打造
