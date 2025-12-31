# ギフト診断アプリ & WordPress自動化ツール

プレゼント選びをサポートする診断アプリと、WordPress記事自動化ツールのモノレポ。

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

`src/data/products.json` を編集して商品を追加・更新できます。

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

## wp-automation（WordPress自動化ツール）

### 概要
WordPress記事の作成を支援するPythonツール。対話式で記事を生成し、CTAを自動挿入。

### 機能
- 対話式記事生成（個人の体験を反映）
- 診断アプリへのCTA自動挿入
- 下書き投稿（公開は手動で確認後）

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

### 使い方
```bash
python main.py
```

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
