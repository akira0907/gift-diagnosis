"""
AI記事生成モジュール

重要な設計思想:
- AIが勝手に記事を書くのではなく、対話を通じて実体験・熱量を引き出す
- ユーザーの体験談をベースに、SEOを意識した構成に整える
"""

from dataclasses import dataclass
from typing import Optional
from rich.console import Console
from rich.prompt import Prompt, Confirm
from rich.panel import Panel
from rich.markdown import Markdown

console = Console()


@dataclass
class ArticleOutline:
    """記事の構成"""
    title: str
    description: str  # meta description
    sections: list[dict]  # [{"heading": "...", "content": "..."}]
    personal_experience: str  # ユーザーの体験談
    recommendation_reason: str  # おすすめする理由


@dataclass
class GeneratedArticle:
    """生成された記事"""
    title: str
    content: str  # HTML形式
    excerpt: str  # 抜粋
    seo_description: str


class InteractiveArticleGenerator:
    """
    対話型記事生成器

    AIに丸投げするのではなく、ユーザーとの対話を通じて
    実体験に基づいた熱量のある記事を作成します。
    """

    def __init__(self, diagnosis_app_url: str):
        self.diagnosis_app_url = diagnosis_app_url
        self.cta_html = self._create_cta_html()

    def _create_cta_html(self) -> str:
        """診断アプリへのCTA HTMLを生成"""
        return f'''
<!-- ギフト診断CTA -->
<div style="background: linear-gradient(135deg, #fdf4f3 0%, #fce8e6 100%); border-radius: 12px; padding: 24px; margin: 32px 0; text-align: center; border: 1px solid #f4b4ae;">
  <p style="font-size: 18px; font-weight: bold; color: #aa372d; margin-bottom: 12px;">
    🎁 プレゼント選びに迷ったら...
  </p>
  <p style="color: #536076; margin-bottom: 16px;">
    3つの質問に答えるだけで、最適なギフトが見つかります
  </p>
  <a href="{self.diagnosis_app_url}" target="_blank" rel="noopener" style="display: inline-block; background-color: #cb4539; color: white; padding: 12px 32px; border-radius: 9999px; text-decoration: none; font-weight: bold;">
    無料でギフト診断をする →
  </a>
</div>
'''

    def start_interview(self) -> Optional[ArticleOutline]:
        """
        記事作成のためのインタビューを開始

        Returns:
            ArticleOutline または None（キャンセル時）
        """
        console.print(Panel(
            "[bold]📝 記事作成インタビュー[/bold]\n\n"
            "これから、あなたの体験をもとに記事を作成します。\n"
            "AIが勝手に書くのではなく、あなたの[bold]実体験[/bold]と[bold]熱量[/bold]を\n"
            "引き出すための質問をいくつかさせてください。",
            title="Welcome",
            border_style="blue",
        ))

        # 1. 何について書くか
        console.print("\n[bold cyan]【質問1】何についての記事を書きますか？[/bold cyan]")
        console.print("例: 「母の日に贈ったハンドクリームが喜ばれた話」")
        console.print("例: 「彼女の誕生日プレゼント選びで失敗した経験」")
        topic = Prompt.ask("\n[bold]トピック[/bold]")

        if not topic:
            console.print("[yellow]キャンセルしました[/yellow]")
            return None

        # 2. 実際の体験を聞く
        console.print("\n[bold cyan]【質問2】そのプレゼントにまつわる実体験を教えてください[/bold cyan]")
        console.print("・いつ、誰に贈りましたか？")
        console.print("・なぜそれを選びましたか？")
        console.print("・相手の反応はどうでしたか？")
        console.print("・他に検討した選択肢はありましたか？")
        console.print("\n[dim]（できるだけ具体的に。エピソードがあると読者に刺さります）[/dim]")
        experience = Prompt.ask("\n[bold]あなたの体験[/bold]")

        if not experience:
            console.print("[yellow]キャンセルしました[/yellow]")
            return None

        # 3. おすすめポイント
        console.print("\n[bold cyan]【質問3】このプレゼントの良かった点を3つ教えてください[/bold cyan]")
        console.print("例: 「パッケージが可愛い」「香りが上品」「値段が手頃」")
        good_points = Prompt.ask("\n[bold]良かった点（カンマ区切り）[/bold]")

        # 4. 注意点・デメリット
        console.print("\n[bold cyan]【質問4】注意点やデメリットはありますか？[/bold cyan]")
        console.print("正直に書くと信頼性が上がります")
        cautions = Prompt.ask("\n[bold]注意点[/bold]", default="特になし")

        # 5. タイトル案
        console.print("\n[bold cyan]【質問5】記事のタイトル案を教えてください[/bold cyan]")
        console.print("SEOを意識して、検索されそうなキーワードを含めてください")
        console.print("例: 「【母の日】50代の母が本当に喜んだプレゼント5選｜実体験レビュー」")
        title = Prompt.ask("\n[bold]タイトル[/bold]")

        # 6. 確認
        console.print("\n" + "=" * 50)
        console.print("[bold]入力内容の確認[/bold]")
        console.print(f"タイトル: {title}")
        console.print(f"トピック: {topic}")
        console.print(f"体験談: {experience[:100]}...")
        console.print(f"良い点: {good_points}")
        console.print(f"注意点: {cautions}")
        console.print("=" * 50)

        if not Confirm.ask("\nこの内容で記事を作成しますか？"):
            console.print("[yellow]キャンセルしました[/yellow]")
            return None

        return ArticleOutline(
            title=title,
            description=f"{topic}について、実際に贈った体験をもとにレビューします。",
            sections=[
                {"heading": "はじめに", "content": topic},
                {"heading": "良かった点", "content": good_points},
                {"heading": "注意点", "content": cautions},
            ],
            personal_experience=experience,
            recommendation_reason=good_points,
        )

    def generate_article(self, outline: ArticleOutline) -> GeneratedArticle:
        """
        アウトラインから記事HTMLを生成

        注意: この段階ではAIは使わず、テンプレートベースで構成します。
        AIによる文章のリライトは別途オプションで提供可能。
        """
        # HTML記事を構築
        html_parts = []

        # 導入文
        html_parts.append(f'''
<p>この記事では、<strong>{outline.title}</strong>について、実際に贈った体験をもとにご紹介します。</p>

<p>「本当に喜んでもらえるプレゼントを選びたい」そんなあなたの参考になれば嬉しいです。</p>
''')

        # 最初のCTA挿入
        html_parts.append(self.cta_html)

        # 体験談セクション
        html_parts.append(f'''
<h2>実際に贈ってみた体験談</h2>

<p>{outline.personal_experience}</p>
''')

        # 良かった点
        points = [p.strip() for p in outline.recommendation_reason.split(",")]
        points_html = "\n".join([f"<li>{p}</li>" for p in points if p])

        html_parts.append(f'''
<h2>おすすめポイント</h2>

<ul>
{points_html}
</ul>
''')

        # 注意点
        if outline.sections[2]["content"] != "特になし":
            html_parts.append(f'''
<h2>購入前に知っておきたい注意点</h2>

<p>{outline.sections[2]["content"]}</p>
''')

        # まとめ + CTA
        html_parts.append(f'''
<h2>まとめ</h2>

<p>今回は{outline.title}についてご紹介しました。</p>

<p>プレゼント選びは本当に悩みますよね。でも、相手のことを想って選んだプレゼントは、きっと喜んでもらえるはずです。</p>

<p>この記事が、あなたのプレゼント選びの参考になれば幸いです。</p>
''')

        # 最後のCTA
        html_parts.append(self.cta_html)

        full_content = "\n".join(html_parts)

        return GeneratedArticle(
            title=outline.title,
            content=full_content,
            excerpt=outline.description,
            seo_description=outline.description,
        )

    def preview_article(self, article: GeneratedArticle):
        """記事のプレビューを表示"""
        console.print("\n" + "=" * 60)
        console.print(Panel(
            f"[bold]{article.title}[/bold]",
            title="記事プレビュー",
            border_style="green",
        ))

        # HTMLをそのまま表示（Markdownとして表示）
        # 実際のHTMLプレビューは別途ブラウザで確認
        console.print("\n[dim]（HTML形式で生成されています。WordPress投稿後にプレビューで確認してください）[/dim]")
        console.print(f"\n抜粋: {article.excerpt}")
        console.print("=" * 60)
