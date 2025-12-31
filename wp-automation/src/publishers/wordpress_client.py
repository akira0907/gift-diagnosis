"""
WordPress REST API クライアント

重要: 既存の記事は一切変更しない。新規投稿（下書き）のみ行う。
"""

import base64
from dataclasses import dataclass
from typing import Optional
import requests
from rich.console import Console

from ..utils.config import WordPressConfig

console = Console()


@dataclass
class PostData:
    """投稿データ"""
    title: str
    content: str
    excerpt: str = ""
    status: str = "draft"  # 常にdraftで投稿
    categories: list[int] = None
    tags: list[int] = None
    featured_media: int = 0

    def __post_init__(self):
        if self.categories is None:
            self.categories = []
        if self.tags is None:
            self.tags = []


@dataclass
class PostResult:
    """投稿結果"""
    success: bool
    post_id: Optional[int] = None
    post_url: Optional[str] = None
    edit_url: Optional[str] = None
    error: Optional[str] = None


class WordPressClient:
    """
    WordPress REST API クライアント

    注意: このクライアントは新規投稿（下書き）のみを行います。
    既存の記事の更新・削除機能は意図的に実装していません。
    """

    def __init__(self, config: WordPressConfig):
        self.config = config
        self.session = requests.Session()
        self._setup_auth()

    def _setup_auth(self):
        """Basic認証のセットアップ"""
        credentials = f"{self.config.username}:{self.config.app_password}"
        encoded = base64.b64encode(credentials.encode()).decode()
        self.session.headers.update({
            "Authorization": f"Basic {encoded}",
            "Content-Type": "application/json",
        })

    def test_connection(self) -> bool:
        """
        WordPress接続テスト
        """
        try:
            response = self.session.get(
                f"{self.config.api_base}/users/me",
                timeout=10,
            )
            if response.status_code == 200:
                user = response.json()
                console.print(f"[green]✓ WordPress接続成功: {user.get('name', 'Unknown')}[/green]")
                return True
            else:
                console.print(f"[red]✗ WordPress接続失敗: {response.status_code}[/red]")
                return False
        except requests.RequestException as e:
            console.print(f"[red]✗ 接続エラー: {e}[/red]")
            return False

    def create_draft(self, post: PostData) -> PostResult:
        """
        新規記事を下書きとして投稿

        重要: この関数は常に下書き（draft）として投稿します。
        公開はWordPress管理画面から手動で行ってください。
        """
        # 安全のため、常にdraftを強制
        post.status = "draft"

        payload = {
            "title": post.title,
            "content": post.content,
            "excerpt": post.excerpt,
            "status": "draft",
        }

        if post.categories:
            payload["categories"] = post.categories
        if post.tags:
            payload["tags"] = post.tags
        if post.featured_media:
            payload["featured_media"] = post.featured_media

        try:
            response = self.session.post(
                f"{self.config.api_base}/posts",
                json=payload,
                timeout=30,
            )

            if response.status_code == 201:
                data = response.json()
                post_id = data.get("id")

                return PostResult(
                    success=True,
                    post_id=post_id,
                    post_url=data.get("link"),
                    edit_url=f"{self.config.url}/wp-admin/post.php?post={post_id}&action=edit",
                )
            else:
                return PostResult(
                    success=False,
                    error=f"投稿失敗: {response.status_code} - {response.text}",
                )

        except requests.RequestException as e:
            return PostResult(
                success=False,
                error=f"リクエストエラー: {e}",
            )

    def get_categories(self) -> list[dict]:
        """カテゴリ一覧を取得"""
        try:
            response = self.session.get(
                f"{self.config.api_base}/categories",
                params={"per_page": 100},
                timeout=10,
            )
            if response.status_code == 200:
                return response.json()
            return []
        except requests.RequestException:
            return []

    def get_tags(self) -> list[dict]:
        """タグ一覧を取得"""
        try:
            response = self.session.get(
                f"{self.config.api_base}/tags",
                params={"per_page": 100},
                timeout=10,
            )
            if response.status_code == 200:
                return response.json()
            return []
        except requests.RequestException:
            return []
