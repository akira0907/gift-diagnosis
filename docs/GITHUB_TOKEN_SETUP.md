# GitHub Token 設定ガイド

このガイドでは、GitHub Personal Access Tokenの設定方法を説明します。

## 📋 概要

GitHub Tokenは以下の目的で使用されます：
- GoogleスプレッドシートからGitHubにデータをプッシュ
- ローカル環境から自動化スクリプトを実行

**重要**: Token設定は一度だけ行えば、次回以降は自動で引き継がれます。

---

## 🔐 セキュリティについて

### 3つの管理方法

1. **Apps Script スクリプトプロパティ**（推奨）
   - ✅ セキュア: Tokenがコードに含まれない
   - ✅ 自動引き継ぎ: 一度設定すれば次回以降も有効
   - ✅ GitHubに公開されない
   - 用途: Googleスプレッドシートからの自動プッシュ

2. **ローカル .envファイル**
   - ✅ セキュア: `.gitignore`で除外
   - ✅ 簡単: ファイルに保存するだけ
   - ❌ ローカルのみ: 他のマシンでは再設定が必要
   - 用途: ローカルでの自動化スクリプト

3. **コードに直接記述**（非推奨）
   - ❌ 危険: GitHubに公開される
   - ❌ 手動管理: 毎回削除・追加が必要
   - 用途: テスト時のみ

---

## 🚀 セットアップ手順

### ステップ1: GitHub Personal Access Tokenを取得

1. **GitHubにアクセス**
   - https://github.com/settings/tokens にアクセス

2. **新しいトークンを作成**
   - 「Generate new token」→「Generate new token (classic)」をクリック

3. **トークンを設定**
   - **Note**: `gift-diagnosis-automation`（分かりやすい名前）
   - **Expiration**: `No expiration`（期限なし）または任意の期限
   - **Select scopes**: `repo` にチェック（リポジトリへのアクセス権限）

4. **トークンを生成**
   - 「Generate token」をクリック
   - 生成されたトークン（`ghp_...` で始まる文字列）をコピー
   - ⚠️ **重要**: このトークンは一度しか表示されません！

### ステップ2: Apps Scriptに設定（Googleスプレッドシート用）

#### 方法A: メニューから設定（最も簡単）

1. **Googleスプレッドシートを開く**
   - https://docs.google.com/spreadsheets/d/1ObAaJrRmAtzKM-v81OiS9XpOIxHJVj4B5wvFWkCRyOE/edit

2. **Apps Scriptを設定**
   - `scripts/auto-fill-ai.js` をApps Scriptエディタに貼り付け
   - スプレッドシートをリロード

3. **メニューから設定**
   - 「商品管理」→「GitHub Tokenを設定」
   - ダイアログにトークンを貼り付け
   - 「OK」をクリック

✅ **完了！次回以降は自動で引き継がれます。**

#### 方法B: スクリプトプロパティから設定

1. **Apps Scriptエディタを開く**
   - スプレッドシートで「拡張機能」→「Apps Script」

2. **プロジェクト設定を開く**
   - 左側メニューから「プロジェクトの設定」（⚙アイコン）

3. **スクリプトプロパティを追加**
   - 下にスクロールして「スクリプトプロパティ」セクション
   - 「スクリプトプロパティを追加」をクリック

4. **プロパティを入力**
   - プロパティ: `GITHUB_TOKEN`
   - 値: （コピーしたトークンを貼り付け）
   - 「スクリプトプロパティを保存」をクリック

✅ **完了！次回以降は自動で引き継がれます。**

### ステップ3: ローカル環境に設定（オプション）

ローカルで自動化スクリプトを実行する場合のみ必要です。

1. **`.env`ファイルを作成**
   ```bash
   cd /Users/yasuko/Documents/local/gift-diagnosis
   cp .env.example .env
   ```

2. **`.env`ファイルを編集**
   ```bash
   # .env
   GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
   ```

3. **保存**
   - これで`.env`ファイルにTokenが保存されます
   - `.gitignore`で除外されているので、GitHubにプッシュされません

✅ **完了！次回以降はこのファイルが使用されます。**

---

## 🔍 設定の確認方法

### Apps Scriptの設定を確認

1. **Googleスプレッドシートで確認**
   - 「商品管理」→「設定を確認」
   - GitHub Token: **設定済み ✅** と表示されればOK

2. **Apps Scriptエディタで確認**
   - 「プロジェクトの設定」→「スクリプトプロパティ」
   - `GITHUB_TOKEN`プロパティが表示されればOK

### ローカル環境の設定を確認

```bash
cat .env
```

`GITHUB_TOKEN=ghp_...`と表示されればOK。

---

## 🔄 Tokenを更新・変更する場合

### Apps Scriptの場合

1. **メニューから変更**
   - 「商品管理」→「GitHub Tokenを設定」
   - 新しいトークンを入力

2. **または、スクリプトプロパティから変更**
   - 「プロジェクトの設定」→「スクリプトプロパティ」
   - `GITHUB_TOKEN`の値を編集

### ローカル環境の場合

`.env`ファイルを編集：
```bash
# .env
GITHUB_TOKEN=新しいトークン
```

---

## ⚠️ トラブルシューティング

### 「GitHub Tokenが設定されていません」エラー

**原因**: Tokenが正しく設定されていない

**解決策**:
1. 「商品管理」→「設定を確認」でステータスを確認
2. 未設定の場合は、上記の手順で再設定

### 「GitHubへのプッシュに失敗しました」エラー

**原因1**: Tokenが間違っている
- Tokenをコピーミスしていないか確認
- `ghp_`で始まる文字列か確認

**原因2**: Tokenの権限が不足
- Tokenに`repo`スコープが付与されているか確認
- https://github.com/settings/tokens で確認

**原因3**: Tokenの期限切れ
- Tokenに有効期限が設定されている場合、期限切れの可能性
- 新しいTokenを作成して再設定

---

## 📚 関連ドキュメント

- [AI判定機能付き自動入力](./AUTO_FILL_AI_SETUP.md)
- [スプレッドシート管理](./SPREADSHEET_MANAGEMENT.md)
- [Google Apps Script セットアップ](./GOOGLE_APPS_SCRIPT_SETUP.md)

---

## 💡 ベストプラクティス

### DO ✅

- Apps Scriptスクリプトプロパティでtokenを管理
- ローカルでは`.env`ファイルを使用
- Tokenには必要最小限の権限のみ付与
- 定期的にTokenをローテーション

### DON'T ❌

- Tokenをコードに直接書かない
- Tokenをメールやチャットで共有しない
- Tokenを公開リポジトリにプッシュしない
- 不要になったTokenは削除する

---

## 🔐 セキュリティチェックリスト

- [ ] GitHub TokenをApps Scriptスクリプトプロパティに設定
- [ ] ローカルの`.env`ファイルに設定（オプション）
- [ ] `.env`が`.gitignore`に含まれていることを確認
- [ ] コード内にTokenが含まれていないことを確認
- [ ] Tokenに`repo`スコープのみ付与されていることを確認
- [ ] 「商品管理」→「設定を確認」で設定済みと表示されることを確認

すべてチェックできたら、設定完了です！🎉
