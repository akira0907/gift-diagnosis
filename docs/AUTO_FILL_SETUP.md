# 商品情報自動入力機能 セットアップガイド

このガイドでは、商品URLを入力するだけで商品情報を自動取得してスプレッドシートを埋める機能のセットアップ方法を説明します。

## 📋 概要

この機能を使うと：
1. **商品URLを入力** (例: https://www.ayura.co.jp/products/item/73009/)
2. **メニューから「選択行の商品情報を自動入力」をクリック**
3. **商品名、説明、価格、カテゴリなどが自動で入力される**

Claude AIが商品ページを解析して、適切な情報を抽出します。

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
   - `scripts/auto-fill-product-info.js` の内容をコピー
   - Apps Scriptエディタに貼り付け（既存のコードを上書き）

3. **プロジェクト名を設定**
   - 「無題のプロジェクト」→「Gift Diagnosis Auto Fill」など

### ステップ3: Claude API Keyを取得

1. **Anthropic Consoleにアクセス**
   - https://console.anthropic.com/

2. **APIキーを作成**
   - 「API Keys」→「Create Key」
   - 名前を設定（例: gift-diagnosis-autofill）
   - キーをコピー（`sk-ant-...` で始まる文字列）

3. **料金について**
   - Claude APIは従量課金制です
   - Sonnet 3.5を使用: 1商品あたり約0.5〜1円
   - 初回は$5の無料クレジットがあります

### ステップ4: API Keyをスクリプトに設定

1. **Apps Scriptエディタに戻る**

2. **API Keyを貼り付け**
   ```javascript
   const AUTO_FILL_CONFIG = {
     PRODUCT_URL_COLUMN: 15, // O列
     CLAUDE_API_KEY: 'sk-ant-xxxxxxxxxxxxxxxx', // ← ここに貼り付け
     CLAUDE_MODEL: 'claude-3-5-sonnet-20241022',
     CLAUDE_API_URL: 'https://api.anthropic.com/v1/messages'
   };
   ```

3. **保存**
   - Cmd+S（Mac）または Ctrl+S（Windows）

### ステップ5: 権限を承認

1. **スプレッドシートに戻る**
   - ページをリロード（Cmd+R または F5）

2. **メニューを確認**
   - 「商品管理」メニューが追加されているはず

3. **初回実行**
   - 「商品管理」→「選択行の商品情報を自動入力」
   - 権限承認画面が表示されたら承認

---

## 📝 使い方

### 方法1: 1行ずつ自動入力

1. **O列に商品URLを入力**
   ```
   例: https://www.ayura.co.jp/products/item/73009/
   ```

2. **その行を選択**
   - 行番号をクリック

3. **メニューから自動入力**
   - 「商品管理」→「選択行の商品情報を自動入力」

4. **数秒待つ**
   - AIが商品情報を取得して自動入力します

### 方法2: 一括自動入力

1. **複数の商品URLを入力**
   - O列に複数の商品URLを貼り付け

2. **一括実行**
   - 「商品管理」→「空欄の商品情報を一括自動入力」

3. **待機**
   - 1件ずつ処理されます（API制限対策で2秒間隔）

---

## ✅ 自動入力される情報

| 列 | 内容 | 例 |
|---|------|-----|
| **id** | 自動採番 | `prod_016` |
| **name** | 商品名 | `アユーラ ナイトリートバス` |
| **description** | 商品説明（ギフト向け） | `心地よい香りでリラックス。疲れた日のご褒美に最適な入浴剤。` |
| **price** | 価格（数値のみ） | `2200` |
| **imageUrl** | 画像パス | `/images/products/ayura-bath.jpg` |
| **category** | カテゴリ | `コスメ` |
| **recipients** | 贈る相手 | `彼女,妻,母,友人女性` |
| **occasions** | シーン | `誕生日,母の日,お礼` |
| **budgetRange** | 予算帯 | `〜3,000円` |
| **amazonUrl** | Amazon URL | （該当する場合） |
| **rakutenUrl** | 楽天 URL | （該当する場合） |
| **tags** | タグ | `コスメ,入浴剤,リラックス,女性向け,アユーラ` |
| **priority** | 優先度 | `85` |
| **isPublished** | 公開状態 | `TRUE` |

---

## 🔧 カスタマイズ

### 商品URL列を変更したい場合

`AUTO_FILL_CONFIG.PRODUCT_URL_COLUMN` の値を変更してください。

```javascript
PRODUCT_URL_COLUMN: 15,  // O列 → 別の列に変更する場合は数字を変更
```

### AIモデルを変更したい場合

コスト削減のために軽量モデルを使用できます。

```javascript
CLAUDE_MODEL: 'claude-3-haiku-20240307',  // より安価なモデル
```

---

## ⚠️ 注意事項

### API使用料金

- **Sonnet 3.5**: 1商品あたり約0.5〜1円
- **Haiku**: 1商品あたり約0.1〜0.2円
- 月に100商品追加しても約100円程度です

### 情報の正確性

- AIが自動抽出するため、**必ず内容を確認してください**
- 特に以下の項目は確認推奨:
  - 価格が正しいか
  - カテゴリが適切か
  - 贈る相手・シーンが妥当か

### 対応サイト

- Amazon、楽天、公式サイトなど、ほとんどの商品ページに対応
- ページによっては情報取得できない場合があります

---

## 🛠 トラブルシューティング

### 「Claude API Keyが設定されていません」エラー

**原因**: API Keyが正しく設定されていない

**解決策**:
1. Apps Scriptエディタを開く
2. `CLAUDE_API_KEY` に正しいキーが設定されているか確認
3. キーの前後にスペースや改行がないか確認

### 商品情報が取得できない

**原因1**: URLが間違っている
- URLをコピペミスしていないか確認

**原因2**: サイトがアクセスを制限している
- 一部のサイトはbot判定でブロックする場合があります

**原因3**: API制限
- 短時間に大量リクエストすると制限される場合があります
- 一括処理は2秒間隔で実行されます

### 「このアプリは確認されていません」警告

**解決策**:
1. 「詳細」をクリック
2. 「Gift Diagnosis Auto Fill（安全ではないページ）に移動」をクリック
3. 「許可」をクリック

---

## 📚 参考リンク

- [Claude API Documentation](https://docs.anthropic.com/)
- [Anthropic Console](https://console.anthropic.com/)
- [Google Apps Script Guide](https://developers.google.com/apps-script)

---

## 💡 ワークフロー例

### 新しい商品を20件追加する場合

1. **スプレッドシートを開く**
2. **O列に20個の商品URLを貼り付け**
   ```
   https://www.ayura.co.jp/products/item/73009/
   https://www.amazon.co.jp/dp/B0DJMMJSPZ
   https://rakuten.co.jp/...
   ...
   ```
3. **「空欄の商品情報を一括自動入力」をクリック**
4. **40秒ほど待つ**（2秒×20件）
5. **内容を確認・微調整**
6. **「GitHubにプッシュ」をクリック**
7. **ローカルで反映**
   ```bash
   cd /Users/yasuko/Documents/local/gift-diagnosis
   git pull origin main
   python3 scripts/csv_to_json.py
   git add src/data/products.json
   git commit -m "商品を20件追加"
   git push origin main
   ```

これで完了です！
