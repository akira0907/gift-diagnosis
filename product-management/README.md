# ローカル商品管理ツール

Googleスプレッドシートを使わずに、ローカル環境で商品データを管理するツールです。

## 🎯 特徴

- ✅ **CSVファイルで管理** - Excel、Numbers、Google Sheetsなど好きなアプリで編集可能
- ✅ **URLから自動入力** - 商品URLを指定するだけで情報を自動取得
- ✅ **AI判定** - カテゴリ、贈る相手、シーンを自動判定
- ✅ **自動GitHubプッシュ** - JSON変換からデプロイまで自動化
- ✅ **GAS不要** - すべてローカルで完結

## 📦 セットアップ

### 必要なもの

- Python 3（既にインストール済み）
- Git（既にインストール済み）

### 初回セットアップ

```bash
cd /Users/yasuko/Documents/local/gift-diagnosis
```

これだけです！追加のインストールは不要です。

## 🚀 使い方

### 1. 商品URLから自動追加

```bash
python3 product-management/manage_products.py add-url "https://www.amazon.co.jp/dp/B0DJMMJSPZ"
```

**実行結果**:
```
🔍 商品情報を取得中: https://www.amazon.co.jp/dp/B0DJMMJSPZ
✅ 商品名: ロクシタン ハンドクリーム GIFT FOR YOU ギフトセット
✅ 価格: ¥2,970
🤖 カテゴリ: コスメ
🤖 予算帯: 〜3,000円
✅ 商品を追加しました: prod_016

💡 次のステップ:
   1. python3 manage_products.py open  # CSVを開いて内容を確認・編集
   2. python3 manage_products.py push  # GitHubにプッシュ
```

### 2. CSVファイルを開いて編集

```bash
python3 product-management/manage_products.py open
```

- macOSのデフォルトアプリ（Numbers、Excelなど）でCSVが開きます
- 商品名、説明、カテゴリなどを自由に編集できます
- 編集後は保存して閉じてください

### 3. 商品一覧を表示

```bash
python3 product-management/manage_products.py list
```

**実行結果**:
```
📦 商品一覧 (15件)

prod_001: ロクシタン ハンドクリーム GIFT FOR YOU ギフトセット - ¥2970 (コスメ)
prod_002: パーカー ジョッター ボールペン ブラックCT - ¥2750 (雑貨)
...
```

### 4. GitHubにプッシュ

```bash
python3 product-management/manage_products.py push
```

**実行結果**:
```
🔄 JSONファイルを生成中...
✅ JSONファイルを生成しました: src/data/products.json

📤 GitHubにプッシュ中...
✅ GitHubへのプッシュが完了しました!
🚀 Vercelで自動デプロイされます
🔗 https://gift-diagnosis.vercel.app
```

## 📝 ワークフロー例

### 新しい商品を追加する場合

```bash
# 1. URLから商品を追加
python3 product-management/manage_products.py add-url "https://www.amazon.co.jp/dp/XXXXXXX"

# 2. CSVを開いて内容を確認・編集（必要に応じて）
python3 product-management/manage_products.py open

# 3. GitHubにプッシュ
python3 product-management/manage_products.py push
```

### 複数の商品を一度に追加する場合

```bash
# 1. 複数のURLから追加
python3 product-management/manage_products.py add-url "https://www.amazon.co.jp/dp/XXXXXXX1"
python3 product-management/manage_products.py add-url "https://www.amazon.co.jp/dp/XXXXXXX2"
python3 product-management/manage_products.py add-url "https://www.rakuten.co.jp/..."

# 2. CSVを開いて一括編集
python3 product-management/manage_products.py open

# 3. 編集が終わったらプッシュ
python3 product-management/manage_products.py push
```

### 既存の商品を編集する場合

```bash
# 1. CSVを開く
python3 product-management/manage_products.py open

# 2. Numbers/Excelで編集して保存

# 3. プッシュ
python3 product-management/manage_products.py push
```

## 📊 CSVファイルの構造

CSVファイル（`data/products.csv`）は以下の列で構成されています：

| 列名 | 説明 | 例 |
|------|------|-----|
| `id` | 商品ID | prod_001 |
| `name` | 商品名 | ロクシタン ハンドクリーム |
| `description` | 商品説明 | ミニサイズのハンドクリーム... |
| `price` | 価格（税込） | 2970 |
| `imageUrl` | 画像URL | /images/products/handcream.jpg |
| `category` | カテゴリ | コスメ |
| `recipients` | 贈る相手（カンマ区切り） | 彼女,妻,母,友人女性 |
| `occasions` | シーン（カンマ区切り） | 誕生日,クリスマス,母の日 |
| `budgetRange` | 予算帯 | 〜3,000円 |
| `amazonUrl` | Amazon URL | https://... |
| `rakutenUrl` | 楽天 URL | https://... |
| `tags` | タグ（カンマ区切り） | コスメ,プチギフト,女性向け |
| `priority` | 優先度（数値） | 85 |
| `isPublished` | 公開状態 | TRUE / FALSE |
| `productUrl` | 元のURL | https://... |

## 🤖 AI判定のロジック

### カテゴリ判定

商品名から以下のキーワードで自動判定：

- **コスメ**: 化粧、コスメ、クリーム、香水、アロマ、入浴
- **グルメ**: チョコ、スイーツ、お菓子、酒、ワイン
- **ガジェット**: 時計、イヤホン、スマート、ガジェット
- **花・植物**: 花、フラワー、植物
- **ファッション**: 財布、ネクタイ、バッグ
- **インテリア**: インテリア、家具
- **体験**: ディナー、体験
- **雑貨**: その他

### 贈る相手の判定

カテゴリから自動判定：

- **コスメ・花**: 彼女、妻、母、友人女性
- **ガジェット・ファッション**: 彼氏、夫、父、上司、友人男性
- **その他**: 幅広く設定

### シーン判定

価格とカテゴリから自動判定：

- **5,000円以上**: 誕生日、クリスマス、記念日
- **5,000円未満**: 誕生日、お礼
- **コスメ**: +母の日、ホワイトデー
- **グルメ**: +お中元、お歳暮

### 予算帯

価格から自動計算：

- 〜3,000円
- 3,000〜5,000円
- 5,000〜10,000円
- 10,000〜20,000円
- 20,000〜30,000円
- 30,000円〜

## 🔧 トラブルシューティング

### 商品情報が取得できない

URLによっては商品情報を自動取得できない場合があります。その場合：

1. `python3 manage_products.py open` でCSVを開く
2. 手動で商品名と価格を入力
3. 保存して `python3 manage_products.py push`

### CSVが開かない

デフォルトアプリが設定されていない場合は、以下のいずれかで開いてください：

- Numbers（macOS標準）
- Microsoft Excel
- Google Sheets（ファイルをアップロード）
- VS Codeなどのテキストエディタ

### GitHubプッシュに失敗する

```bash
# まず最新の状態に更新
cd /Users/yasuko/Documents/local/gift-diagnosis
git pull origin main

# 再度プッシュ
python3 product-management/manage_products.py push
```

## 💡 ヒント

### エイリアスを設定すると便利

`~/.zshrc` に追加：

```bash
alias products='python3 /Users/yasuko/Documents/local/gift-diagnosis/product-management/manage_products.py'
```

その後：

```bash
source ~/.zshrc

# 短いコマンドで実行可能
products add-url "https://..."
products open
products push
```

### CSVを直接編集する

```bash
# VS Codeで開く
code /Users/yasuko/Documents/local/gift-diagnosis/data/products.csv

# Numbersで開く
open -a Numbers /Users/yasuko/Documents/local/gift-diagnosis/data/products.csv
```

## 📚 関連ドキュメント

- [data/products.csv](../data/products.csv) - 商品データCSV
- [src/data/products.json](../src/data/products.json) - 診断アプリ用JSON（自動生成）
- [診断アプリ](https://gift-diagnosis.vercel.app) - デプロイされたアプリ

## ✅ まとめ

このツールで、GAS不要でローカルで完結する商品管理が可能になりました：

1. **商品追加**: `add-url` コマンドで一発追加
2. **編集**: 好きなアプリでCSVを編集
3. **デプロイ**: `push` コマンドで自動的にGitHub→Vercel

シンプルで強力なワークフローをお楽しみください！🎉
