# Google Apps Script セットアップガイド

このガイドでは、Googleスプレッドシートから直接GitHubに商品データをプッシュする方法を説明します。

## 📋 概要

Google Apps Script（GAS）を使うと、スプレッドシートに**「GitHubにプッシュ」ボタン**が追加され、編集した内容をワンクリックでGitHubに反映できます。

## 🚀 セットアップ手順

### ステップ1: Googleスプレッドシートを作成

1. **新しいスプレッドシートを作成**
   - https://sheets.new を開く
   - 名前を「ギフト診断 商品データ」などに変更

2. **CSVデータをインポート**
   - `data/products.csv` の内容をコピー
   - A1セルに貼り付け（自動で列に分割されます）

### ステップ2: Google Apps Scriptを設定

1. **Apps Scriptエディタを開く**
   - スプレッドシートのメニューから「拡張機能」→「Apps Script」をクリック

2. **スクリプトをコピー**
   - デフォルトの `function myFunction() {}` を削除
   - `scripts/google-apps-script.js` の内容をすべてコピーして貼り付け

3. **プロジェクト名を変更**
   - 左上の「無題のプロジェクト」をクリック
   - 「Gift Diagnosis GitHub Integration」などに変更

### ステップ3: GitHub Personal Access Tokenを取得

1. **GitHubにアクセス**
   - https://github.com/settings/tokens にアクセス
   - 「Generate new token」→「Generate new token (classic)」をクリック

2. **トークンを設定**
   - **Note**: `gift-diagnosis-spreadsheet` など分かりやすい名前
   - **Expiration**: `No expiration`（期限なし）または任意の期限
   - **Select scopes**: `repo` にチェック（リポジトリへのアクセス権限）
   - 「Generate token」をクリック

3. **トークンをコピー**
   - 生成されたトークン（`ghp_...` で始まる文字列）をコピー
   - ⚠️ このトークンは一度しか表示されないので、必ずコピーしてください

### ステップ4: Apps Scriptにトークンを設定

1. **Apps Scriptエディタに戻る**
   - スクリプトの上部にある `CONFIG` セクションを探す

2. **トークンを貼り付け**
   ```javascript
   const CONFIG = {
     GITHUB_TOKEN: 'ghp_xxxxxxxxxxxxxxxxxxxx', // ← ここに貼り付け
     GITHUB_OWNER: 'akira0907',
     GITHUB_REPO: 'gift-diagnosis',
     GITHUB_BRANCH: 'main',
     FILE_PATH: 'data/products.csv',
   };
   ```

3. **保存**
   - Cmd+S（Mac）または Ctrl+S（Windows）で保存
   - 💾 アイコンをクリックでも保存できます

### ステップ5: 初回実行と権限の承認

1. **スプレッドシートに戻る**
   - スプレッドシートのタブに戻る
   - ページをリロード（Cmd+R または F5）

2. **カスタムメニューを確認**
   - メニューバーに「GitHub連携」という項目が追加されているはずです
   - もし表示されない場合は、もう一度リロードしてください

3. **初回実行**
   - 「GitHub連携」→「GitHubにプッシュ」をクリック
   - 権限の承認画面が表示されます

4. **権限を承認**
   - 「権限を確認」をクリック
   - Googleアカウントを選択
   - 「このアプリは確認されていません」と表示されたら、「詳細」→「Gift Diagnosis GitHub Integration（安全ではないページ）に移動」をクリック
   - 「許可」をクリック

### ステップ6: テスト実行

1. **GitHubにプッシュ**
   - 「GitHub連携」→「GitHubにプッシュ」をクリック
   - 成功すると「GitHubへのプッシュが完了しました！」というメッセージが表示されます

2. **GitHubで確認**
   - https://github.com/akira0907/gift-diagnosis/blob/main/data/products.csv
   - 最新のコミットが反映されているか確認

---

## 📝 使い方

### 商品データを編集してGitHubに反映

1. **スプレッドシートで編集**
   - 商品情報を追加・編集・削除

2. **GitHubにプッシュ**
   - 「GitHub連携」→「GitHubにプッシュ」をクリック

3. **ローカルで反映**
   - ローカル環境で以下を実行:
   ```bash
   cd /Users/yasuko/Documents/local/gift-diagnosis
   git pull origin main
   python3 scripts/csv_to_json.py
   git add src/data/products.json
   git commit -m "商品データを更新"
   git push origin main
   ```

---

## 🔄 ワークフロー全体像

### パターン1: スプレッドシートから編集（推奨）

```
1. Googleスプレッドシートで編集
   ↓
2. 「GitHubにプッシュ」ボタンをクリック
   ↓
3. data/products.csv がGitHubに保存される
   ↓
4. ローカルで git pull
   ↓
5. python3 scripts/csv_to_json.py を実行
   ↓
6. src/data/products.json が更新される
   ↓
7. git commit & push
   ↓
8. Vercelで自動デプロイ
```

### パターン2: ローカルから編集

```
1. src/data/products.json を直接編集
   ↓
2. git commit & push
   ↓
3. python3 scripts/json_to_csv.py を実行
   ↓
4. data/products.csv を手動でスプレッドシートに反映
```

---

## ⚠️ 注意事項

### セキュリティ

- **GitHub Tokenは秘密情報です**
  - 他人に見せない、共有しない
  - スクリプトはスプレッドシートのオーナーのみ閲覧可能にする

### データの同期

- **スプレッドシートとローカルの両方で編集しない**
  - どちらか一方をマスターデータとして運用
  - 推奨: スプレッドシートをマスターにする

### コンフリクト回避

- **編集前に最新を確認**
  - 編集前にGitHubの最新状態を確認
  - 夫婦で同時編集しないように注意

---

## 🛠 トラブルシューティング

### メニューが表示されない

**解決策:**
- スプレッドシートをリロード（Cmd+R または F5）
- Apps Scriptで保存されているか確認
- `onOpen` 関数が正しく記述されているか確認

### 「GitHubにプッシュ」が失敗する

**原因1: トークンが間違っている**
- GitHub Personal Access Tokenを再確認
- `ghp_` で始まる文字列が正しく設定されているか確認

**原因2: トークンの権限が不足**
- トークンに `repo` スコープが付与されているか確認
- 必要に応じて新しいトークンを作成

**原因3: ファイルパスが間違っている**
- `CONFIG.FILE_PATH` が `data/products.csv` になっているか確認

### 権限エラーが出る

**解決策:**
- Apps Scriptの権限を再度承認
- 「拡張機能」→「Apps Script」→「実行」→「onOpen」を手動実行

---

## 📚 参考リンク

- [GitHub Personal Access Tokens](https://github.com/settings/tokens)
- [Google Apps Script公式ドキュメント](https://developers.google.com/apps-script)
- [GitHub REST API](https://docs.github.com/ja/rest)

---

## 🎯 今後の改善案

将来的に以下のような自動化も可能です：

1. **スプレッドシート編集時に自動プッシュ**
   - `onEdit()` トリガーを使用

2. **GitHub Actionsで自動変換**
   - CSV更新時に自動的に `csv_to_json.py` を実行
   - products.jsonも自動コミット

3. **双方向同期**
   - ローカルで編集 → スプレッドシートに自動反映
   - スプレッドシートで編集 → ローカルに自動反映

必要に応じて実装を検討してください。
