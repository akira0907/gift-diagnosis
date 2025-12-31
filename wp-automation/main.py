#!/usr/bin/env python3
"""
WordPress記事自動化ツール

使い方:
    python main.py              # 対話モードで記事作成
    python main.py --test       # WordPress接続テスト
    python main.py --help       # ヘルプ表示

重要な設計思想:
- 既存のWordPress記事は一切変更しない（新規記事の下書き投稿のみ）
- AIが勝手に書くのではなく、対話を通じて実体験・熱量を引き出す
"""

import argparse
import sys
from rich.console import Console
from rich.panel import Panel
from rich.prompt import Confirm

from src.utils import load_config
from src.publishers import WordPressClient, PostData
from src.generators import InteractiveArticleGenerator

console = Console()


def test_connection():
    """WordPress接続テスト"""
    console.print("\n[bold]WordPress接続テスト[/bold]\n")

    config = load_config()

    if not config.wordpress.url:
        console.print("[red]エラー: WP_URL が設定されていません[/red]")
        console.print("config/.env ファイルを作成し、WordPress の情報を設定してください")
        console.print("\n設定例:")
        console.print("  WP_URL=https://your-wordpress-site.com")
        console.print("  WP_USERNAME=your-username")
        console.print("  WP_APP_PASSWORD=xxxx xxxx xxxx xxxx")
        return False

    client = WordPressClient(config.wordpress)
    return client.test_connection()


def create_article():
    """対話形式で記事を作成"""
    console.print(Panel(
        "[bold]🎁 ギフト記事作成ツール[/bold]\n\n"
        "このツールは、あなたの実体験をもとにブログ記事を作成します。\n"
        "AIに丸投げではなく、対話を通じて熱量のある記事を目指します。\n\n"
        "[dim]※ 記事は必ず「下書き」として保存されます[/dim]",
        border_style="blue",
    ))

    # 設定読み込み
    config = load_config()

    # 診断アプリURLの確認
    console.print(f"\n[dim]診断アプリURL: {config.diagnosis_app_url}[/dim]")

    # 記事生成器を初期化
    generator = InteractiveArticleGenerator(config.diagnosis_app_url)

    # インタビュー開始
    outline = generator.start_interview()
    if outline is None:
        return

    # 記事生成
    console.print("\n[bold]記事を生成しています...[/bold]")
    article = generator.generate_article(outline)

    # プレビュー
    generator.preview_article(article)

    # WordPress投稿の確認
    if config.wordpress.url:
        if Confirm.ask("\n[bold]WordPressに下書きとして投稿しますか？[/bold]"):
            client = WordPressClient(config.wordpress)

            # 接続テスト
            if not client.test_connection():
                console.print("[red]WordPress接続に失敗しました[/red]")
                return

            # 投稿
            post = PostData(
                title=article.title,
                content=article.content,
                excerpt=article.excerpt,
                status="draft",
            )

            result = client.create_draft(post)

            if result.success:
                console.print(Panel(
                    f"[green]✓ 下書き投稿が完了しました！[/green]\n\n"
                    f"投稿ID: {result.post_id}\n"
                    f"編集URL: {result.edit_url}",
                    title="投稿成功",
                    border_style="green",
                ))
            else:
                console.print(f"[red]投稿失敗: {result.error}[/red]")
    else:
        console.print("\n[yellow]WordPress設定がないため、投稿はスキップしました[/yellow]")
        console.print("生成された記事のHTMLは上記の通りです。手動でコピーして使用できます。")


def main():
    parser = argparse.ArgumentParser(
        description="WordPress記事自動化ツール",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
例:
    python main.py          # 対話モードで記事作成
    python main.py --test   # WordPress接続テスト

設定:
    config/.env ファイルに以下を設定してください:
    - WP_URL: WordPressサイトのURL
    - WP_USERNAME: ユーザー名
    - WP_APP_PASSWORD: アプリケーションパスワード
    - DIAGNOSIS_APP_URL: 診断アプリのURL
        """
    )

    parser.add_argument(
        "--test",
        action="store_true",
        help="WordPress接続テストを実行",
    )

    args = parser.parse_args()

    if args.test:
        success = test_connection()
        sys.exit(0 if success else 1)
    else:
        create_article()


if __name__ == "__main__":
    main()
