-- 同生日故事网站 D1 Schema
-- 设计原则：所有表均带索引，便于按生日聚合 + 时间倒序

-- 故事表
CREATE TABLE IF NOT EXISTS stories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  birth_year INTEGER NOT NULL,
  birth_month INTEGER NOT NULL CHECK(birth_month BETWEEN 1 AND 12),
  birth_day INTEGER NOT NULL CHECK(birth_day BETWEEN 1 AND 31),
  -- 月日组合，用于"同一天生日"查询的核心索引列
  birth_md TEXT GENERATED ALWAYS AS (printf('%02d-%02d', birth_month, birth_day)) STORED,
  nickname TEXT NOT NULL,        -- 用户昵称（默认 ip+uid，公开时显示真实名）
  display_nickname INTEGER NOT NULL DEFAULT 0, -- 0=默认匿名标识 1=自定义昵称公开
  story TEXT NOT NULL,
  excerpt TEXT,                  -- 摘要（前 120 字）
  ip_hash TEXT,                  -- ip 哈希，去重 + 反垃圾
  user_uid TEXT NOT NULL,        -- 浏览器指纹/cookie 标识
  lang TEXT DEFAULT 'zh',
  like_count INTEGER NOT NULL DEFAULT 0,
  view_count INTEGER NOT NULL DEFAULT 0,
  comment_count INTEGER NOT NULL DEFAULT 0,
  hot_score REAL NOT NULL DEFAULT 0,  -- 热度分（点赞×3 + 评论×5 + 浏览×0.1 + 时间衰减）
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_stories_md ON stories(birth_md, hot_score DESC);
CREATE INDEX IF NOT EXISTS idx_stories_md_time ON stories(birth_md, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stories_hot ON stories(hot_score DESC);
CREATE INDEX IF NOT EXISTS idx_stories_uid ON stories(user_uid);
CREATE INDEX IF NOT EXISTS idx_stories_created ON stories(created_at DESC);

-- 评论表
CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  story_id INTEGER NOT NULL,
  nickname TEXT NOT NULL,
  content TEXT NOT NULL CHECK(length(content) <= 1000),
  user_uid TEXT NOT NULL,
  ip_hash TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_comments_story ON comments(story_id, created_at DESC);

-- 点赞表（防重复点赞）
CREATE TABLE IF NOT EXISTS likes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  story_id INTEGER NOT NULL,
  user_uid TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  UNIQUE(story_id, user_uid),
  FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE
);

-- 站点统计表（按天聚合）
CREATE TABLE IF NOT EXISTS daily_stats (
  date TEXT PRIMARY KEY,         -- YYYY-MM-DD
  pv INTEGER NOT NULL DEFAULT 0,
  uv INTEGER NOT NULL DEFAULT 0
);

-- 当日访客指纹（用于 UV 去重，每天清理）
CREATE TABLE IF NOT EXISTS visitors (
  date TEXT NOT NULL,
  visitor_uid TEXT NOT NULL,
  last_seen INTEGER NOT NULL,
  PRIMARY KEY (date, visitor_uid)
);
CREATE INDEX IF NOT EXISTS idx_visitors_date ON visitors(date);
