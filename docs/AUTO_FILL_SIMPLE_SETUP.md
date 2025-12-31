# 商品情報簡易自動入力機能 セットアップガイド

このガイドでは、**API Key不要**で商品URLから基本情報を自動取得する機能のセットアップ方法を説明します。

## 📋 概要

この機能を使うと：
1. **商品URLを入力** (例: https://www.ayura.co.jp/products/item/73009/)
2. **メニューから「選択行の商品情報を補助入力」をクリック**
3. **商品名と価格が自動で入力される**

### ✅ メリット
- **API Key不要** - Claude APIやその他の外部APIは必要ありません
- **無料** - 追加のコストは一切かかりません
- **シンプル** - 設定が簡単で、すぐに使い始められます

### ⚠️ 制限事項
以下の情報は**自動入力されません**（手動で入力する必要があります）：
- カテゴリ
- 贈る相手
- シーン
- 予算帯
- タグ

商品名と価格のみを自動取得し、詳細情報は手動で調整するスタイルです。

---

## 🚀 セットアップ手順

### ステップ1: スプレッドシートに列を追加

1. **Googleスプレッドシートを開く**
   - https://docs.google.com/spreadsheets/d/1ObAaJrRmAtzKM-v81OiS9XpOIxHJVj4B5wvFWkCRyOE/edit

2. **O列に「productUrl」列を追加**
   - N列（isPublished）の右に新しい列を挿入
   - O1セルに `productUrl` と入力

3. **列の構成を確認**
   ```
   A: id
   B: name
   C: description
   D: price
   E: imageUrl
   F: category
   G: recipients
   H: occasions
   I: budgetRange
   J: amazonUrl
   K: rakutenUrl
   L: tags
   M: priority
   N: isPublished
   O: productUrl ← 新しく追加
   ```

### ステップ2: Apps Scriptを設定

1. **Apps Scriptエディタを開く**
   - スプレッドシートのメニューから「拡張機能」→「Apps Script」

2. **既存のコードを置き換え**
   - `scripts/auto-fill-simple.js` の内容をコピー
   - Apps Scriptエディタに貼り付け（既存のコードを上書き）

3. **プロジェクト名を設定**
   - 「無題のプロジェクト」→「Gift Diagnosis Simple Auto Fill」など

4. **保存**
   - Cmd+S（Mac）または Ctrl+S（Windows）

### ステップ3: GitHub連携設定（オプション）

「GitHubにプッシュ」機能を使う場合のみ設定してください。

1. **GitHub Personal Access Tokenを取得**
   - [GOOGLE_APPS_SCRIPT_SETUP.md](./GOOGLE_APPS_SCRIPT_SETUP.md) の「ステップ3」を参照

2. **Apps Scriptにトークンを設定**
   ```javascript
   const CONFIG = {
     PRODUCT_URL_COLUMN: 15, // O列
     GITHUB_TOKEN: 'ghp_xxxxxxxxxxxxxxxxxxxx', // ← ここに貼り付け
     GITHUB_OWNER: 'akira0907',
     GITHUB_REPO: 'gift-diagnosis',
     GITHUB_BRANCH: 'main',
     FILE_PATH: 'data/products.csv',
   };
   ```

### ステップ4: 権限を承認

1. **スプレッドシートに戻る**
   - ページをリロード（Cmd+R または F5）

2. **メニューを確認**
   - 「商品管理」メニューが追加されているはず

3. **初回実行**
   - 「商品管理」→「選択行の商品情報を補助入力」
   - 権限承認画面が表示されたら承認

---

## 📝 使い方

### 方法1: 1行ずつ補助入力

1. **O列に商品URLを入力**
   ```
   例: https://www.ayura.co.jp/products/item/73009/
   例: https://www.amazon.co.jp/dp/B0DJMMJSPZ
   ```

2. **その行を選択**
   - 行番号をクリック

3. **メニューから補助入力**
   - 「商品管理」→「選択行の商品情報を補助入力」

4. **結果を確認**
   - 商品名と価格が自動入力されます
   - カテゴリ、贈る相手、シーンなどは**手動で入力**してください

### 方法2: 一括補助入力

1. **複数の商品URLを入力**
   - O列に複数の商品URLを貼り付け

2. **一括実行**
   - 「商品管理」→「空欄の商品情報を一括補助入力」

3. **待機**
   - 1件ずつ処理されます（サイトへの負荷軽減のため1秒間隔）

---

## ✅ 自動入力される情報

| 列 | 内容 | 自動入力 |
|---|------|---------|
| **id** | 商品ID | ✅ 自動採番（prod_016, prod_017...） |
| **name** | 商品名 | ✅ ページタイトルから抽出 |
| **description** | 商品説明 | ✅ 商品名をそのまま使用 |
| **price** | 価格 | ✅ ページから抽出（できない場合は空欄） |
| **imageUrl** | 画像URL | ✅ 仮の値を設定 `/images/products/product.jpg` |
| **category** | カテゴリ | ❌ **手動で入力** |
| **recipients** | 贈る相手 | ❌ **手動で入力** |
| **occasions** | シーン | ❌ **手動で入力** |
| **budgetRange** | 予算帯 | ❌ **手動で入力** |
| **amazonUrl** | Amazon URL | ✅ URLがAmazonの場合のみ |
| **rakutenUrl** | 楽天 URL | ✅ URLが楽天の場合のみ |
| **tags** | タグ | ❌ **手動で入力** |
| **priority** | 優先度 | ✅ デフォルト値 `80` |
| **isPublished** | 公開状態 | ✅ デフォルト値 `TRUE` |

---

## 💡 ワークフロー例

### 新しい商品を5件追加する場合

1. **スプレッドシートを開く**

2. **O列に5個の商品URLを貼り付け**
   ```
   https://www.ayura.co.jp/products/item/73009/
   https://www.amazon.co.jp/dp/B0DJMMJSPZ
   https://rakuten.co.jp/...
   ...
   ```

3. **「空欄の商品情報を一括補助入力」をクリック**

4. **5秒ほど待つ**（1秒×5件）

5. **自動入力された内容を確認**
   - 商品名と価格が正しいか確認

6. **手動で詳細情報を入力**
   - F列（category）: コスメ、グルメ、雑貨など
   - G列（recipients）: 彼女,妻,母 など
   - H列（occasions）: 誕生日,母の日 など
   - I列（budgetRange）: 〜3,000円、3,000〜5,000円 など
   - L列（tags）: コスメ,入浴剤,リラックス など

7. **「GitHubにプッシュ」をクリック**（設定済みの場合）

8. **ローカルで反映**
   ```bash
   cd /Users/yasuko/Documents/local/gift-diagnosis
   git pull origin main
   python3 scripts/csv_to_json.py
   git add src/data/products.json
   git commit -m "商品を5件追加"
   git push origin main
   ```

---

## 🔧 カスタマイズ

### 商品URL列を変更したい場合

`CONFIG.PRODUCT_URL_COLUMN` の値を変更してください。

```javascript
PRODUCT_URL_COLUMN: 15,  // O列 → 別の列に変更する場合は数字を変更
```

---

## ⚠️ 注意事項

### 情報の正確性

- **価格が取得できない場合があります**
  - サイトによってHTML構造が異なるため、価格抽出に失敗することがあります
  - その場合は手動で入力してください

- **商品名が長すぎる場合**
  - 50文字以内に自動カットされます
  - 必要に応じて手動で調整してください

### 対応サイト

- Amazon、楽天、公式サイトなど、ほとんどの商品ページに対応
- ページによっては情報取得できない場合があります
- JavaScript動的レンダリングのページは非対応

### サイトへの負荷

- 一括処理は1秒間隔で実行されます
- 同じサイトに短時間で大量アクセスしないようにしてください

---

## 🛠 トラブルシューティング

### 商品名が「タイトル取得失敗」になる

**原因**: ページのHTMLから`<title>`タグを抽出できなかった

**解決策**:
- URLが正しいか確認
- 手動で商品名を入力

### 価格が空欄になる

**原因**: ページから価格を抽出できなかった

**解決策**:
- 手動で価格を入力
- サイトによって価格の表示形式が異なるため、抽出できない場合があります

### 「商品URLが入力されていません」エラー

**原因**: O列（productUrl列）にURLが入力されていない

**解決策**:
- O列に商品URLを入力してから実行

---

## 📚 参考リンク

- [スプレッドシート管理ガイド](./SPREADSHEET_MANAGEMENT.md)
- [Google Apps Script セットアップ](./GOOGLE_APPS_SCRIPT_SETUP.md)
- [Google Apps Script 公式ドキュメント](https://developers.google.com/apps-script)

---

## 🎯 Claude API版との比較

より高度な自動入力が必要な場合は、Claude API版もあります。

| 項目 | 簡易版（このガイド） | Claude API版 |
|------|---------------------|--------------|
| **API Key** | 不要 | 必要 |
| **コスト** | 無料 | 1商品あたり約0.5〜1円 |
| **自動入力** | 商品名・価格のみ | カテゴリ・贈る相手・シーンなども推測 |
| **精度** | 低〜中 | 高 |
| **設定** | 簡単 | やや複雑 |

簡易版で試してみて、物足りない場合はClaude API版を検討してください。

詳細は [AUTO_FILL_SETUP.md](./AUTO_FILL_SETUP.md) を参照してください。
