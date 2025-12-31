/**
 * Google Apps Script for Spreadsheet to GitHub Integration
 *
 * このスクリプトをGoogleスプレッドシートに設定すると、
 * スプレッドシートの内容を自動的にGitHubのCSVファイルとして保存できます。
 *
 * セットアップ方法は docs/GOOGLE_APPS_SCRIPT_SETUP.md を参照してください。
 */

// ===== 設定項目 =====
// これらの値をあなたのリポジトリ情報に置き換えてください
const CONFIG = {
  GITHUB_TOKEN: 'YOUR_GITHUB_PERSONAL_ACCESS_TOKEN', // GitHubのPersonal Access Token
  GITHUB_OWNER: 'akira0907',                         // GitHubユーザー名
  GITHUB_REPO: 'gift-diagnosis',                     // リポジトリ名
  GITHUB_BRANCH: 'main',                             // ブランチ名
  FILE_PATH: 'data/products.csv',                    // 保存先ファイルパス
};

// ===== メイン処理 =====

/**
 * カスタムメニューをスプレッドシートに追加
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('GitHub連携')
    .addItem('GitHubにプッシュ', 'pushToGitHub')
    .addItem('設定を確認', 'showConfig')
    .addToUi();
}

/**
 * スプレッドシートの内容をGitHubにプッシュ
 */
function pushToGitHub() {
  const ui = SpreadsheetApp.getUi();

  // 設定チェック
  if (CONFIG.GITHUB_TOKEN === 'YOUR_GITHUB_PERSONAL_ACCESS_TOKEN') {
    ui.alert('エラー', 'GitHub Personal Access Tokenが設定されていません。\nスクリプトエディタで設定してください。', ui.ButtonSet.OK);
    return;
  }

  try {
    // スプレッドシートの内容を取得
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const csvContent = convertSheetToCSV(sheet);

    // GitHubにプッシュ
    const result = uploadToGitHub(csvContent);

    if (result.success) {
      ui.alert('成功', 'GitHubへのプッシュが完了しました！\n\nコミットURL:\n' + result.commitUrl, ui.ButtonSet.OK);
    } else {
      ui.alert('エラー', 'GitHubへのプッシュに失敗しました。\n\n' + result.error, ui.ButtonSet.OK);
    }
  } catch (error) {
    ui.alert('エラー', 'エラーが発生しました: ' + error.message, ui.ButtonSet.OK);
    console.error(error);
  }
}

/**
 * 設定内容を表示
 */
function showConfig() {
  const ui = SpreadsheetApp.getUi();
  const message = `現在の設定:

GitHub Owner: ${CONFIG.GITHUB_OWNER}
リポジトリ: ${CONFIG.GITHUB_REPO}
ブランチ: ${CONFIG.GITHUB_BRANCH}
ファイルパス: ${CONFIG.FILE_PATH}
トークン設定: ${CONFIG.GITHUB_TOKEN === 'YOUR_GITHUB_PERSONAL_ACCESS_TOKEN' ? '未設定 ❌' : '設定済み ✅'}

設定を変更する場合は、「拡張機能」→「Apps Script」からスクリプトを編集してください。`;

  ui.alert('GitHub連携の設定', message, ui.ButtonSet.OK);
}

// ===== ヘルパー関数 =====

/**
 * スプレッドシートの内容をCSV形式に変換
 */
function convertSheetToCSV(sheet) {
  const data = sheet.getDataRange().getValues();
  const csv = data.map(row => {
    return row.map(cell => {
      // セルの値をCSV形式にエスケープ
      const str = cell.toString();
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return '"' + str.replace(/"/g, '""') + '"';
      }
      return str;
    }).join(',');
  }).join('\n');

  return csv;
}

/**
 * GitHubにファイルをアップロード
 */
function uploadToGitHub(content) {
  try {
    // 既存のファイル情報を取得（SHAが必要）
    const getUrl = `https://api.github.com/repos/${CONFIG.GITHUB_OWNER}/${CONFIG.GITHUB_REPO}/contents/${CONFIG.FILE_PATH}?ref=${CONFIG.GITHUB_BRANCH}`;

    let sha = null;
    try {
      const getResponse = UrlFetchApp.fetch(getUrl, {
        method: 'GET',
        headers: {
          'Authorization': 'token ' + CONFIG.GITHUB_TOKEN,
          'Accept': 'application/vnd.github.v3+json'
        },
        muteHttpExceptions: true
      });

      if (getResponse.getResponseCode() === 200) {
        const fileInfo = JSON.parse(getResponse.getContentText());
        sha = fileInfo.sha;
      }
    } catch (e) {
      console.log('ファイルが存在しないため、新規作成します');
    }

    // コミットメッセージ
    const now = new Date();
    const timestamp = Utilities.formatDate(now, 'Asia/Tokyo', 'yyyy-MM-dd HH:mm:ss');
    const commitMessage = `商品データを更新 (${timestamp})

Googleスプレッドシートから自動更新`;

    // GitHubにプッシュ
    const putUrl = `https://api.github.com/repos/${CONFIG.GITHUB_OWNER}/${CONFIG.GITHUB_REPO}/contents/${CONFIG.FILE_PATH}`;

    const payload = {
      message: commitMessage,
      content: Utilities.base64Encode(content),
      branch: CONFIG.GITHUB_BRANCH
    };

    if (sha) {
      payload.sha = sha; // 既存ファイルの更新
    }

    const response = UrlFetchApp.fetch(putUrl, {
      method: 'PUT',
      headers: {
        'Authorization': 'token ' + CONFIG.GITHUB_TOKEN,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });

    const responseCode = response.getResponseCode();
    const responseBody = JSON.parse(response.getContentText());

    if (responseCode === 200 || responseCode === 201) {
      return {
        success: true,
        commitUrl: responseBody.commit.html_url
      };
    } else {
      return {
        success: false,
        error: `HTTPエラー ${responseCode}: ${responseBody.message || 'Unknown error'}`
      };
    }

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * テスト用: 現在のスプレッドシートをCSVに変換して表示
 */
function testCSVConversion() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const csv = convertSheetToCSV(sheet);
  console.log(csv);
  return csv;
}
