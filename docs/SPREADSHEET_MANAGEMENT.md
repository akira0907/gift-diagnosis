# 商品データのスプレッドシート管理

このドキュメントでは、Googleスプレッドシートを使って商品データを管理する方法を説明します。

## 📋 概要

商品データは以下の2つの形式で管理されています:
- **CSV形式** (`data/products.csv`) - Googleスプレッドシートで編集
- **JSON形式** (`src/data/products.json`) - アプリケーションで使用

スプレッドシートで編集した内容は、スクリプトを実行することでアプリに反映されます。

## 🔄 ワークフロー

### 1. スプレッドシートで商品を編集する

1. `data/products.csv` をGoogleスプレッドシートにインポート
2. スプレッドシート上で商品情報を編集
3. 編集が完了したらCSV形式でエクスポート
4. エクスポートしたファイルを `data/products.csv` に上書き保存

### 2. 変更をアプリに反映する

```bash
cd /Users/yasuko/Documents/local/gift-diagnosis
python3 scripts/csv_to_json.py
```

このコマンドで、CSVの内容が `src/data/products.json` に変換されます。

### 3. 変更をコミット・プッシュする

```bash
git add data/products.csv src/data/products.json
git commit -m "商品データを更新"
git push origin main
```

## 📊 CSVファイルの列構成

| 列名 | 説明 | 例 |
|------|------|------|
| `id` | 商品ID (一意) | `prod_001` |
| `name` | 商品名 | `ロクシタン ハンドクリーム` |
| `description` | 商品説明 | `ミニサイズのハンドクリーム4本セット...` |
| `price` | 価格（数値） | `2970` |
| `imageUrl` | 画像のパス | `/images/products/handcream.jpg` |
| `category` | カテゴリ | `コスメ` |
| `recipients` | 贈る相手（カンマ区切り） | `彼女,妻,母,友人女性` |
| `occasions` | シーン（カンマ区切り） | `誕生日,クリスマス,母の日` |
| `budgetRange` | 予算帯 | `〜3,000円` |
| `amazonUrl` | AmazonのURL | `https://www.amazon.co.jp/...` |
| `rakutenUrl` | 楽天のURL | `https://search.rakuten.co.jp/...` |
| `tags` | タグ（カンマ区切り） | `コスメ,ハンドクリーム,女性向け` |
| `priority` | 優先度（数値, 1-100） | `90` |
| `isPublished` | 公開/非公開 | `TRUE` または `FALSE` |

## ⚠️ 注意事項

### 配列データの入力方法

`recipients`, `occasions`, `tags` などの配列データは、**カンマ区切り**で入力してください。

✅ **正しい例:**
```
彼女,妻,母,友人女性
```

❌ **間違った例:**
```
彼女
妻
母
友人女性
```

### 商品IDについて

- 新しい商品を追加する場合は、既存のIDと重複しない一意のIDを設定してください
- 推奨形式: `prod_XXX` (XXXは3桁の数字)
- 例: `prod_101`, `prod_102`

### 価格とpriorityは数値

- カンマや円記号は**含めないでください**
- ✅ 正しい: `2970`
- ❌ 間違い: `2,970円`

### 公開/非公開

- 公開する商品: `TRUE`
- 非公開にする商品: `FALSE`
- 大文字・小文字は問いません（`true`, `True`, `TRUE` すべてOK）

## 🛠 スクリプト一覧

### `scripts/json_to_csv.py`

**用途:** 現在のJSON形式の商品データをCSVに変換

```bash
python3 scripts/json_to_csv.py
```

このスクリプトは、`src/data/products.json` を読み込んで `data/products.csv` を生成します。
主にスプレッドシート編集を開始する前や、JSONから最新のCSVを作成したい時に使用します。

### `scripts/csv_to_json.py`

**用途:** CSV形式の商品データをJSON形式に変換してアプリに反映

```bash
python3 scripts/csv_to_json.py
```

このスクリプトは、`data/products.csv` を読み込んで `src/data/products.json` を更新します。
スプレッドシートで編集した内容をアプリに反映する際に使用します。

## 📝 よくある質問

### Q. スプレッドシートでセル内改行を使いたい

A. 説明文（`description`）などで改行を含めたい場合、セル内で改行しても問題ありません。CSV出力時に自動的にダブルクォートで囲まれ、適切にエスケープされます。

### Q. カンマを含む文字列を入力したい

A. 通常通り入力してください。Googleスプレッドシートが自動的にダブルクォートでエスケープします。

例: `「親戚、友人、同僚へのギフトに最適」` → そのまま入力してOK

### Q. 商品の順番を変えたい

A. CSVファイル上の行の順番がそのままアプリに反映されます。スプレッドシートで行を並び替えてからエクスポートしてください。

### Q. 商品を削除したい

A. スプレッドシート上で該当する行を削除してください。または、`isPublished` を `FALSE` にすることで非公開にできます。

## 🎯 Googleスプレッドシート連携の自動化（今後の拡張）

将来的には、Google Apps Script（GAS）を使って以下のような自動化が可能です:

1. スプレッドシート編集時に自動でGitHubにプッシュ
2. GitHub Actionsで自動的にCSV→JSON変換
3. Vercelで自動デプロイ

必要に応じて実装を検討してください。
