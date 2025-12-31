# ギフト診断アプリ & WordPress自動化ツール

プレゼント選びをサポートする診断アプリと、WordPress記事自動化ツールのモノレポ。

---

## 🚀 Claude Code 再開用プロンプト（妻用）

次回、この作業を再開する時は、Claude Codeに以下をコピー&ペーストしてください:

```
このリポジトリは夫と共同運営しているギフト診断アプリです。

## 概要
- 診断アプリ: https://gift-diagnosis.vercel.app
- WordPress: https://lifestyle-select.com

## 今日やること
（以下から選んでコピー）

### WordPress記事を書く場合:
「WordPress記事を書きたいです。テーマは【ここにテーマを記入】」
例: 「WordPress記事を書きたいです。テーマは母の日ギフト 予算別おすすめ」

### 商品データを追加・編集する場合:
「products.jsonに商品を追加したいです」
「スプレッドシートで商品を管理したいです」
「商品URLから自動で情報を入力したいです（AI判定機能）」

### 現在の状態を確認する場合:
「現在の商品一覧を教えて」
「下書き記事の一覧を見せて」

## 注意
- 作業前に必ず `git pull origin main` で最新を取得してください
- WordPress記事は必ず体験・エピソードを確認してから作成してください
```

---

## プロジェクト構成

```
present_blog/
├── diagnosis-app/     # Next.js診断アプリ（Vercelにデプロイ済み）
├── wp-automation/     # WordPress自動化ツール（Python）
└── README.md          # このファイル
```

## 本番環境

| サービス | URL |
|---------|-----|
| 診断アプリ | https://gift-diagnosis.vercel.app |
| WordPress | https://lifestyle-select.com |
| GitHub | https://github.com/akira0907/gift-diagnosis |
| Vercel | https://vercel.com/akira0907s-projects/gift-diagnosis |

---

## diagnosis-app（診断アプリ）

### 概要
3ステップで最適なギフトを診断するWebアプリ。

1. **誰に贈る？** - 彼氏/彼女/夫/妻/父/母/友人など
2. **どんなシーン？** - 誕生日/クリスマス/記念日/出産祝いなど
3. **予算は？** - 〜3,000円 / 3,000〜5,000円 / ... / 30,000円〜

### 技術スタック
- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- Vercel（自動デプロイ）

### ディレクトリ構成
```
diagnosis-app/
├── src/
│   ├── app/                    # ページ
│   │   ├── page.tsx           # トップページ
│   │   └── diagnose/          # 診断フロー
│   │       ├── page.tsx       # 質問ページ
│   │       └── result/        # 結果ページ
│   ├── components/            # UIコンポーネント
│   ├── data/
│   │   ├── products.json      # 商品データ ★編集対象
│   │   └── questions.ts       # 質問データ
│   ├── lib/
│   │   └── diagnose/
│   │       └── engine.ts      # マッチングエンジン
│   └── types/                 # TypeScript型定義
└── package.json
```

### 商品データの編集

#### 方法1: Googleスプレッドシートで管理（推奨）

商品データはGoogleスプレッドシートで管理できます。詳しくは[商品データのスプレッドシート管理](docs/SPREADSHEET_MANAGEMENT.md)を参照してください。

**🎯 AI判定機能付き自動入力（最新・推奨）:**
- 商品URLを入力するだけで、カテゴリ・贈る相手・シーンなどすべて自動入力
- GitHub Tokenは安全に管理（次回以降も自動で引き継がれる）
- セットアップガイド: [docs/AUTO_FILL_AI_SETUP.md](docs/AUTO_FILL_AI_SETUP.md)

**クイックガイド:**
1. `data/products.csv` をGoogleスプレッドシートにインポート
2. Apps Scriptに `scripts/auto-fill-ai.js` を設定
3. 商品URLを入力して「自動入力（AI判定）」をクリック
4. 「GitHubにプッシュ」でGitHubに保存
5. ローカルで `python3 scripts/csv_to_json.py` を実行してアプリに反映

#### 方法2: JSONファイルを直接編集

`src/data/products.json` を直接編集して商品を追加・更新することもできます。

```json
{
  "id": "prod_XXX",
  "name": "商品名",
  "description": "商品説明",
  "price": 5000,
  "imageUrl": "/images/products/xxx.jpg",
  "category": "コスメ",
  "recipients": ["彼女", "妻", "母"],
  "occasions": ["誕生日", "クリスマス"],
  "budgetRange": "5,000〜10,000円",
  "affiliateLinks": [
    {
      "provider": "amazon",
      "url": "https://www.amazon.co.jp/dp/XXXXXXXX"
    }
  ],
  "tags": ["コスメ", "ギフト"],
  "priority": 80,
  "isPublished": true,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

### 予算帯の定義
| budgetRange | 価格範囲 |
|-------------|----------|
| 〜3,000円 | 0円〜2,999円 |
| 3,000〜5,000円 | 3,000円〜4,999円 |
| 5,000〜10,000円 | 5,000円〜9,999円 |
| 10,000〜20,000円 | 10,000円〜19,999円 |
| 20,000〜30,000円 | 20,000円〜29,999円 |
| 30,000円〜 | 30,000円以上 |

### ローカル開発
```bash
cd diagnosis-app
npm install
npm run dev
# http://localhost:3000 で確認
```

### デプロイ
```bash
git add .
git commit -m "変更内容"
git push origin main
# → Vercelで自動デプロイ
```

---

## wp-automation（WordPress投稿ツール）

### 概要
Claude Codeと連携してWordPress記事を投稿・更新するツール。
API Keyは不要で、Claude Codeとの対話で記事を作成し、そのまま投稿できます。

### 機能
- WordPress記事の新規投稿（下書き/公開）
- 既存記事の更新
- 下書き一覧の取得

### セットアップ
```bash
cd wp-automation
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 設定ファイル
`config/.env` にWordPress認証情報を設定：
```
WP_URL=https://lifestyle-select.com
WP_USERNAME=xxxxx
WP_APP_PASSWORD=xxxxx xxxxx xxxxx xxxxx xxxxx xxxxx
DIAGNOSIS_APP_URL=https://gift-diagnosis.vercel.app/diagnose
```

**注意**: `.env` ファイルはGitHubには含まれません。別途共有が必要です。

### 使い方（Claude Codeと組み合わせ）

#### 1. 接続テスト
```bash
python post_article.py --test
```

#### 2. 記事を投稿（Claude Codeで記事を書いてもらい、投稿）
```bash
# 下書きとして投稿
python post_article.py --title "彼氏への誕生日プレゼント10選" --content "<h2>はじめに</h2><p>本文...</p>"

# 公開として投稿
python post_article.py --title "タイトル" --content "<p>本文</p>" --status publish
```

#### 3. 記事を更新
```bash
# タイトルを更新
python post_article.py --update 123 --title "新しいタイトル"

# 本文を更新
python post_article.py --update 123 --content "<p>新しい本文</p>"

# 下書きを公開
python post_article.py --update 123 --status publish
```

#### 4. 下書き一覧を確認
```bash
python post_article.py --list
```

### Claude Codeでの記事作成フロー

**重要**: 記事には個人の体験・熱量を反映させることが大切です。Claude Codeは必ず以下の質問をしてから記事を作成します。

#### 記事作成前の質問（必須）

1. **実際の体験**
   - 成功したギフト選びのエピソード
   - 失敗したエピソード
   - 相手の反応や感想

2. **個人的な思い・こだわり**
   - なぜそのギフトを選んだのか
   - 予算についての考え方
   - ギフト選びで大切にしていること

3. **読者に伝えたいメッセージ**
   - 一番伝えたいこと
   - 自分の経験から学んだこと

#### 実際のフロー

1. 記事テーマをリクエスト：
   ```
   「母の日ギフト 予算別おすすめ」という記事を書いて
   ```

2. Claude Codeが体験・思いを確認する質問を投げかける

3. あなたが体験やエピソードを共有

4. Claude Codeが個人の体験を反映した記事HTMLを生成

5. 投稿コマンド：
   ```
   「この記事をWordPressに下書きで投稿して」
   ```

6. Claude Codeが `post_article.py` を実行して投稿

7. WordPress管理画面で確認後、公開

---

## 共同編集の手順

### 初回セットアップ（妻側）

1. GitHubアカウントを作成（未作成の場合）
2. リポジトリへの招待を受諾
3. ローカルにクローン：
   ```bash
   git clone https://github.com/akira0907/gift-diagnosis.git
   cd gift-diagnosis
   ```
4. 依存関係インストール：
   ```bash
   cd diagnosis-app
   npm install
   ```

### 編集フロー

1. 最新を取得：
   ```bash
   git pull origin main
   ```

2. 編集作業（Claude Codeで）：
   ```bash
   claude
   ```
   例：「products.jsonに新しい商品を追加して」

3. 変更をプッシュ：
   ```bash
   git add .
   git commit -m "商品を追加"
   git push origin main
   ```

4. Vercelで自動デプロイ（数分で反映）

### 注意事項
- 編集前に必ず `git pull` で最新を取得
- 同時編集はコンフリクトの原因になるので避ける
- WordPressの既存記事は変更しない

---

## よく使うClaude Codeコマンド例

### 商品追加
```
「楽天ROOMのこの商品を追加して：[URL]」
「〜3,000円の女性向けコスメを追加して」
```

### 商品編集
```
「prod_001の価格を3500円に変更して」
「ロクシタンの商品を非公開にして」
```

### 確認
```
「現在の商品一覧を見せて」
「5,000〜10,000円の商品を教えて」
```

### デプロイ
```
「変更をGitHubにプッシュして」
```

---

## トラブルシューティング

### ビルドエラー
```bash
cd diagnosis-app
npm run build
```
エラーが出たらClaude Codeに相談。

### デプロイが反映されない
1. GitHubにプッシュされているか確認
2. Vercelダッシュボードでデプロイ状況を確認
3. 数分待ってからブラウザをリロード

### 商品が表示されない
- `isPublished: true` になっているか確認
- `recipients` と `occasions` が正しく設定されているか確認
- 価格と `budgetRange` が一致しているか確認
