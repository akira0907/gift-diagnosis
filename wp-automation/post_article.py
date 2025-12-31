#!/usr/bin/env python3
"""
WordPress記事投稿ツール（Claude Code対話形式用）

使い方:
    python post_article.py --test                    # 接続テスト
    python post_article.py --title "タイトル" --content "本文HTML"  # 記事投稿
    python post_article.py --update 123 --title "新タイトル"        # 記事更新
    python post_article.py --list                    # 下書き一覧

Claude Codeでの使用例:
    1. Claude Codeに記事を書いてもらう
    2. このスクリプトで投稿/更新
"""

import argparse
import base64
import os
import sys
from pathlib import Path

import requests
from dotenv import load_dotenv


def load_wp_config():
    """WordPress設定を読み込む"""
    env_path = Path(__file__).parent / "config" / ".env"
    if env_path.exists():
        load_dotenv(env_path)

    url = os.getenv("WP_URL", "")
    username = os.getenv("WP_USERNAME", "")
    app_password = os.getenv("WP_APP_PASSWORD", "")

    if not all([url, username, app_password]):
        print("エラー: WordPress設定が不完全です")
        print("config/.env に以下を設定してください:")
        print("  WP_URL=https://your-site.com")
        print("  WP_USERNAME=your-username")
        print("  WP_APP_PASSWORD=xxxx xxxx xxxx xxxx")
        sys.exit(1)

    return url, username, app_password


def get_session(username: str, app_password: str) -> requests.Session:
    """認証済みセッションを取得"""
    session = requests.Session()
    credentials = f"{username}:{app_password}"
    encoded = base64.b64encode(credentials.encode()).decode()
    session.headers.update({
        "Authorization": f"Basic {encoded}",
        "Content-Type": "application/json",
    })
    return session


def test_connection():
    """WordPress接続テスト"""
    url, username, app_password = load_wp_config()
    session = get_session(username, app_password)

    try:
        response = session.get(f"{url}/wp-json/wp/v2/users/me", timeout=10)
        if response.status_code == 200:
            user = response.json()
            print(f"✓ 接続成功: {user.get('name', 'Unknown')} ({url})")
            return True
        else:
            print(f"✗ 接続失敗: {response.status_code}")
            return False
    except requests.RequestException as e:
        print(f"✗ エラー: {e}")
        return False


def create_post(title: str, content: str, excerpt: str = "", status: str = "draft"):
    """新規記事を投稿"""
    url, username, app_password = load_wp_config()
    session = get_session(username, app_password)

    payload = {
        "title": title,
        "content": content,
        "excerpt": excerpt,
        "status": status,
    }

    try:
        response = session.post(
            f"{url}/wp-json/wp/v2/posts",
            json=payload,
            timeout=30,
        )

        if response.status_code == 201:
            data = response.json()
            post_id = data.get("id")
            print(f"✓ 投稿成功!")
            print(f"  投稿ID: {post_id}")
            print(f"  ステータス: {status}")
            print(f"  編集URL: {url}/wp-admin/post.php?post={post_id}&action=edit")
            return post_id
        else:
            print(f"✗ 投稿失敗: {response.status_code}")
            print(response.text)
            return None
    except requests.RequestException as e:
        print(f"✗ エラー: {e}")
        return None


def update_post(post_id: int, title: str = None, content: str = None, excerpt: str = None, status: str = None):
    """既存記事を更新"""
    url, username, app_password = load_wp_config()
    session = get_session(username, app_password)

    payload = {}
    if title is not None:
        payload["title"] = title
    if content is not None:
        payload["content"] = content
    if excerpt is not None:
        payload["excerpt"] = excerpt
    if status is not None:
        payload["status"] = status

    if not payload:
        print("エラー: 更新する項目がありません")
        return False

    try:
        response = session.post(
            f"{url}/wp-json/wp/v2/posts/{post_id}",
            json=payload,
            timeout=30,
        )

        if response.status_code == 200:
            data = response.json()
            print(f"✓ 更新成功!")
            print(f"  投稿ID: {post_id}")
            print(f"  編集URL: {url}/wp-admin/post.php?post={post_id}&action=edit")
            return True
        else:
            print(f"✗ 更新失敗: {response.status_code}")
            print(response.text)
            return False
    except requests.RequestException as e:
        print(f"✗ エラー: {e}")
        return False


def list_drafts():
    """下書き一覧を取得"""
    url, username, app_password = load_wp_config()
    session = get_session(username, app_password)

    try:
        response = session.get(
            f"{url}/wp-json/wp/v2/posts",
            params={"status": "draft", "per_page": 20},
            timeout=10,
        )

        if response.status_code == 200:
            posts = response.json()
            if not posts:
                print("下書きはありません")
                return

            print(f"下書き一覧 ({len(posts)}件):\n")
            for post in posts:
                print(f"  ID: {post['id']}")
                print(f"  タイトル: {post['title']['rendered']}")
                print(f"  編集URL: {url}/wp-admin/post.php?post={post['id']}&action=edit")
                print()
        else:
            print(f"✗ 取得失敗: {response.status_code}")
    except requests.RequestException as e:
        print(f"✗ エラー: {e}")


def main():
    parser = argparse.ArgumentParser(
        description="WordPress記事投稿ツール（Claude Code用）",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
使用例:
    # 接続テスト
    python post_article.py --test

    # 新規投稿（下書き）
    python post_article.py --title "彼氏への誕生日プレゼント" --content "<p>本文</p>"

    # 公開投稿
    python post_article.py --title "タイトル" --content "<p>本文</p>" --status publish

    # 記事更新
    python post_article.py --update 123 --title "新しいタイトル"
    python post_article.py --update 123 --content "<p>新しい本文</p>"
    python post_article.py --update 123 --status publish

    # 下書き一覧
    python post_article.py --list
        """
    )

    parser.add_argument("--test", action="store_true", help="接続テスト")
    parser.add_argument("--list", action="store_true", help="下書き一覧を表示")
    parser.add_argument("--title", type=str, help="記事タイトル")
    parser.add_argument("--content", type=str, help="記事本文（HTML）")
    parser.add_argument("--excerpt", type=str, default="", help="抜粋")
    parser.add_argument("--status", type=str, default="draft",
                        choices=["draft", "publish", "private"],
                        help="投稿ステータス (default: draft)")
    parser.add_argument("--update", type=int, metavar="POST_ID", help="更新する記事ID")

    args = parser.parse_args()

    if args.test:
        success = test_connection()
        sys.exit(0 if success else 1)

    if args.list:
        list_drafts()
        return

    if args.update:
        # 記事更新
        success = update_post(
            args.update,
            title=args.title,
            content=args.content,
            excerpt=args.excerpt if args.excerpt else None,
            status=args.status if args.status != "draft" else None,
        )
        sys.exit(0 if success else 1)

    if args.title and args.content:
        # 新規投稿
        post_id = create_post(args.title, args.content, args.excerpt, args.status)
        sys.exit(0 if post_id else 1)

    # 引数なしの場合はヘルプ表示
    parser.print_help()


if __name__ == "__main__":
    main()
