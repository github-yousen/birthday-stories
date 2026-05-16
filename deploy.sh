#!/bin/bash
# 一键创建 D1 数据库并部署到 Cloudflare Pages
# 前置要求：CF API Token 必须包含 D1:Edit 权限
#
# 使用方式：
#   bash deploy.sh
#
# 如果你的 Token 没有 D1 权限，去 https://dash.cloudflare.com/profile/api-tokens
# 编辑 Token，添加权限：
#   - Account · D1 · Edit
#   - Account · Cloudflare Pages · Edit
#   - Account · Account Settings · Read
#   - User · User Details · Read

set -e

# ====== 凭据（必须通过环境变量传入）======
if [ -z "$CLOUDFLARE_API_TOKEN" ] || [ -z "$CLOUDFLARE_ACCOUNT_ID" ]; then
  echo "❌ 必须先设置环境变量："
  echo "   export CLOUDFLARE_API_TOKEN=your_token"
  echo "   export CLOUDFLARE_ACCOUNT_ID=your_account_id"
  exit 1
fi
CF_TOKEN="$CLOUDFLARE_API_TOKEN"
CF_ACCOUNT="$CLOUDFLARE_ACCOUNT_ID"
PROJECT_NAME="birthday-stories"
DB_NAME="birthday-stories-db"

cd "$(dirname "$0")"

echo "========== Step 1: 创建 D1 数据库 =========="
DB_INFO=$(curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/$CF_ACCOUNT/d1/database" \
  -H "Authorization: Bearer $CF_TOKEN" \
  -H "Content-Type: application/json" \
  --data "{\"name\":\"$DB_NAME\"}")

if echo "$DB_INFO" | grep -q '"success":true'; then
  DB_ID=$(echo "$DB_INFO" | python3 -c "import json,sys;print(json.load(sys.stdin)['result']['uuid'])")
  echo "✓ D1 数据库已创建: $DB_ID"
elif echo "$DB_INFO" | grep -q '"name already in use"\|already exists'; then
  echo "数据库已存在，查询 ID..."
  DB_LIST=$(curl -s "https://api.cloudflare.com/client/v4/accounts/$CF_ACCOUNT/d1/database" \
    -H "Authorization: Bearer $CF_TOKEN")
  DB_ID=$(echo "$DB_LIST" | python3 -c "
import json,sys
d=json.load(sys.stdin)
for x in d.get('result',[]):
  if x['name']=='$DB_NAME':
    print(x['uuid'])
    break
")
  echo "✓ 复用已有数据库: $DB_ID"
else
  echo "❌ 创建数据库失败:"
  echo "$DB_INFO" | python3 -m json.tool
  echo
  echo "提示：请先去 https://dash.cloudflare.com/profile/api-tokens"
  echo "为 Token 添加 'Account · D1 · Edit' 权限。"
  exit 1
fi

echo
echo "========== Step 2: 写入 D1 ID 到 wrangler.toml =========="
sed -i "s|database_id = \".*\"|database_id = \"$DB_ID\"|" wrangler.toml
grep database_id wrangler.toml

echo
echo "========== Step 3: 应用 Schema =========="
wrangler d1 execute "$DB_NAME" --remote --file=schema/init.sql 2>&1 | tail -5

echo
echo "========== Step 4: 创建 Pages 项目（若已存在则跳过）=========="
curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/$CF_ACCOUNT/pages/projects" \
  -H "Authorization: Bearer $CF_TOKEN" \
  -H "Content-Type: application/json" \
  --data "{\"name\":\"$PROJECT_NAME\",\"production_branch\":\"main\"}" > /dev/null

echo
echo "========== Step 5: 部署 Pages =========="
wrangler pages deploy public --project-name="$PROJECT_NAME" --commit-dirty=true 2>&1 | tail -15

echo
echo "========== ✅ 部署完成 =========="
echo "访问: https://$PROJECT_NAME.pages.dev"
