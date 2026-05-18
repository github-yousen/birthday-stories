#!/usr/bin/env python3
"""
IndexNow 全站主动推送脚本
用途：把 sitemap.xml 里的所有 URL 一次性推送给 Bing / Yandex / IndexNow 联盟
触发：手动跑 / cron 定期跑 / 部署后跑
"""
import urllib.request
import json
import re
import sys

HOST = "birthday-stories.pages.dev"
KEY = "4508f7851b4014ca1f73d1faa2426692"
KEY_LOCATION = f"https://{HOST}/{KEY}.txt"
UA = {"User-Agent": "Mozilla/5.0 (compatible; IndexNowSubmitter/1.0)"}


def fetch_sitemap_urls():
    req = urllib.request.Request(f"https://{HOST}/sitemap.xml", headers=UA)
    body = urllib.request.urlopen(req, timeout=30).read().decode()
    return re.findall(r"<loc>([^<]+)</loc>", body)


def push(name, endpoint, urls):
    payload = {
        "host": HOST,
        "key": KEY,
        "keyLocation": KEY_LOCATION,
        "urlList": urls,
    }
    req = urllib.request.Request(
        endpoint,
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json; charset=utf-8", **UA},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return f"✅ {name:14s} HTTP {resp.status}"
    except urllib.error.HTTPError as e:
        body = e.read().decode()[:200]
        return f"⚠️  {name:14s} HTTP {e.code} {body}"
    except Exception as e:
        return f"❌ {name:14s} {e}"


def main():
    urls = fetch_sitemap_urls()
    print(f"📋 Sitemap 含 {len(urls)} 条 URL")
    if not urls:
        sys.exit(1)

    endpoints = [
        ("IndexNow.org", "https://api.indexnow.org/IndexNow"),
        ("Bing", "https://www.bing.com/IndexNow"),
        ("Yandex", "https://yandex.com/indexnow"),
    ]
    for name, url in endpoints:
        print(push(name, url, urls))


if __name__ == "__main__":
    main()
