"""
設定管理モジュール
"""

import os
from dataclasses import dataclass
from pathlib import Path
from dotenv import load_dotenv


@dataclass
class WordPressConfig:
    """WordPress接続設定"""
    url: str
    username: str
    app_password: str

    @property
    def api_base(self) -> str:
        """REST API のベースURL"""
        return f"{self.url.rstrip('/')}/wp-json/wp/v2"


@dataclass
class AIConfig:
    """AI API設定"""
    provider: str  # "openai" or "anthropic"
    api_key: str
    model: str


@dataclass
class AppConfig:
    """アプリケーション設定"""
    wordpress: WordPressConfig
    ai: AIConfig
    diagnosis_app_url: str


def load_config() -> AppConfig:
    """
    環境変数から設定を読み込む
    """
    # .env ファイルを読み込み
    env_path = Path(__file__).parent.parent.parent / "config" / ".env"
    if env_path.exists():
        load_dotenv(env_path)
    else:
        # フォールバック: プロジェクトルートの .env
        load_dotenv()

    # WordPress設定
    wp_config = WordPressConfig(
        url=os.getenv("WP_URL", ""),
        username=os.getenv("WP_USERNAME", ""),
        app_password=os.getenv("WP_APP_PASSWORD", ""),
    )

    # AI設定（Anthropic優先）
    anthropic_key = os.getenv("ANTHROPIC_API_KEY", "")
    openai_key = os.getenv("OPENAI_API_KEY", "")

    if anthropic_key:
        ai_config = AIConfig(
            provider="anthropic",
            api_key=anthropic_key,
            model="claude-sonnet-4-20250514",
        )
    elif openai_key:
        ai_config = AIConfig(
            provider="openai",
            api_key=openai_key,
            model="gpt-4o",
        )
    else:
        ai_config = AIConfig(
            provider="none",
            api_key="",
            model="",
        )

    return AppConfig(
        wordpress=wp_config,
        ai=ai_config,
        diagnosis_app_url=os.getenv("DIAGNOSIS_APP_URL", "https://example.com/diagnose"),
    )
