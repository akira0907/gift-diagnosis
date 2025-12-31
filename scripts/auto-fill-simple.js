/**
 * Google Apps Script: 商品URL簡易自動入力機能（API Key不要）
 *
 * 商品URLからページタイトルと価格を抽出して基本情報を埋めます。
 * 詳細情報は手動で調整する必要がありますが、API Keyは不要です。
 *
 * セットアップ方法は docs/AUTO_FILL_SIMPLE_SETUP.md を参照してください。
 */

// ===== 設定項目 =====
const CONFIG = {
  // 商品URLの列番号（A列=1, B列=2, ...）
  PRODUCT_URL_COLUMN: 15, // O列

  // GitHub連携設定（既存のgoogle-apps-script.jsから移植）
  GITHUB_TOKEN: 'YOUR_GITHUB_PERSONAL_ACCESS_TOKEN',
  GITHUB_OWNER: 'akira0907',
  GITHUB_REPO: 'gift-diagnosis',
  GITHUB_BRANCH: 'main',
  FILE_PATH: 'data/products.csv',
};

// ===== カスタムメニュー =====

/**
 * スプレッドシート起動時にメニューを追加
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('商品管理')
    .addItem('選択行の商品情報を補助入力', 'autoFillSelectedRow')
    .addItem('空欄の商品情報を一括補助入力', 'autoFillAllEmptyRows')
    .addSeparator()
    .addItem('GitHubにプッシュ', 'pushToGitHub')
    .addItem('設定を確認', 'showConfig')
    .addToUi();
}

// ===== メイン処理 =====

/**
 * 選択中の行の商品情報を自動入力
 */
function autoFillSelectedRow() {
  const ui = SpreadsheetApp.getUi();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const activeRange = sheet.getActiveRange();
  const row = activeRange.getRow();

  // ヘッダー行はスキップ
  if (row === 1) {
    ui.alert('エラー', 'ヘッダー行は編集できません。', ui.ButtonSet.OK);
    return;
  }

  try {
    const result = fillProductInfo(sheet, row);

    if (result.success) {
      ui.alert('成功',
        `${row}行目に基本情報を入力しました！\n\n` +
        `商品名: ${result.name}\n` +
        `価格: ${result.price}\n\n` +
        `※ カテゴリ、贈る相手、シーンなどは手動で入力してください。`,
        ui.ButtonSet.OK
      );
    } else {
      ui.alert('エラー', result.error || '商品情報の取得に失敗しました。', ui.ButtonSet.OK);
    }
  } catch (error) {
    ui.alert('エラー', 'エラーが発生しました: ' + error.message, ui.ButtonSet.OK);
    console.error(error);
  }
}

/**
 * 空欄の商品情報を一括自動入力
 */
function autoFillAllEmptyRows() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert(
    '確認',
    '商品URLが入力されているが、商品名が空欄の行をすべて補助入力します。よろしいですか？',
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) {
    return;
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const lastRow = sheet.getLastRow();
  let count = 0;
  const results = [];

  try {
    for (let row = 2; row <= lastRow; row++) {
      const productUrl = sheet.getRange(row, CONFIG.PRODUCT_URL_COLUMN).getValue();
      const productName = sheet.getRange(row, 2).getValue();

      if (productUrl && !productName) {
        const result = fillProductInfo(sheet, row);
        if (result.success) {
          count++;
          results.push(`${row}行目: ${result.name}`);
        }
        SpreadsheetApp.flush();
        Utilities.sleep(1000); // サイトへの負荷軽減のため1秒待機
      }
    }

    ui.alert('完了',
      `${count}件の商品情報を補助入力しました！\n\n` +
      results.join('\n') + '\n\n' +
      '※ カテゴリ、贈る相手、シーンなどは手動で入力してください。',
      ui.ButtonSet.OK
    );
  } catch (error) {
    ui.alert('エラー', `${count}件処理後にエラーが発生しました: ${error.message}`, ui.ButtonSet.OK);
    console.error(error);
  }
}

/**
 * 指定行の商品情報を自動入力
 */
function fillProductInfo(sheet, row) {
  const productUrl = sheet.getRange(row, CONFIG.PRODUCT_URL_COLUMN).getValue();

  if (!productUrl) {
    return { success: false, error: '商品URLが入力されていません。' };
  }

  // URLから商品情報を取得
  const productInfo = extractProductInfoFromUrl(productUrl);

  if (!productInfo.success) {
    return productInfo;
  }

  // IDを自動採番（既存のIDがない場合のみ）
  const existingId = sheet.getRange(row, 1).getValue();
  if (!existingId) {
    const newId = generateNextProductId(sheet);
    sheet.getRange(row, 1).setValue(newId);
  }

  // 基本情報を入力
  sheet.getRange(row, 2).setValue(productInfo.name);           // 商品名
  sheet.getRange(row, 3).setValue(productInfo.description);    // 商品説明（URLから抽出したタイトル）
  sheet.getRange(row, 4).setValue(productInfo.price || '');    // 価格
  sheet.getRange(row, 5).setValue(productInfo.imageUrl);       // 画像URL（仮）

  // Amazonまたは楽天URLを適切な列に設定
  if (productUrl.includes('amazon')) {
    sheet.getRange(row, 10).setValue(productUrl);  // AmazonURL
  } else if (productUrl.includes('rakuten') || productUrl.includes('room.rakuten')) {
    sheet.getRange(row, 11).setValue(productUrl);  // 楽天URL
  }

  // デフォルト値を設定
  sheet.getRange(row, 13).setValue(80);    // 優先度
  sheet.getRange(row, 14).setValue('TRUE'); // 公開状態

  return {
    success: true,
    name: productInfo.name,
    price: productInfo.price || '（価格不明）'
  };
}

/**
 * URLから商品情報を抽出（シンプル版）
 */
function extractProductInfoFromUrl(url) {
  try {
    const response = UrlFetchApp.fetch(url, {
      muteHttpExceptions: true,
      followRedirects: true,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (response.getResponseCode() !== 200) {
      return { success: false, error: 'ページの取得に失敗しました。' };
    }

    const html = response.getContentText();

    // タイトルを抽出
    let title = '';
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      title = titleMatch[1]
        .replace(/\s*\|\s*.+$/, '')  // "商品名 | サイト名" → "商品名"
        .replace(/\s*-\s*.+$/, '')   // "商品名 - サイト名" → "商品名"
        .replace(/【.*?】/g, '')      // 【キャッチコピー】を削除
        .trim();

      // 文字数制限（50文字以内）
      if (title.length > 50) {
        title = title.substring(0, 50);
      }
    }

    // 価格を抽出（簡易版）
    let price = null;
    const pricePatterns = [
      /[¥￥]\s*([0-9,]+)/,           // ¥1,234
      /価格[：:]\s*([0-9,]+)円/,     // 価格：1234円
      /"price"[^0-9]*([0-9,]+)/,     // JSON-LDなど
    ];

    for (const pattern of pricePatterns) {
      const match = html.match(pattern);
      if (match) {
        price = parseInt(match[1].replace(/,/g, ''));
        break;
      }
    }

    // 商品名の生成
    let productName = title || 'タイトル取得失敗';

    // 画像URLの仮設定
    const imageUrl = '/images/products/product.jpg';

    return {
      success: true,
      name: productName,
      description: productName.substring(0, 100), // 商品名をそのまま説明に使用
      price: price,
      imageUrl: imageUrl
    };

  } catch (error) {
    console.error('URL取得エラー:', error);
    return { success: false, error: 'ページの取得に失敗しました: ' + error.message };
  }
}

/**
 * 次の商品IDを生成
 */
function generateNextProductId(sheet) {
  const lastRow = sheet.getLastRow();
  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();

  let maxNum = 15; // 既存の最大はprod_015

  ids.forEach(row => {
    const id = row[0];
    if (id && id.toString().startsWith('prod_')) {
      const num = parseInt(id.toString().replace('prod_', ''));
      if (num > 0 && num < 100 && num > maxNum) {
        maxNum = num;
      }
    }
  });

  return `prod_${String(maxNum + 1).padStart(3, '0')}`;
}

/**
 * 設定内容を表示
 */
function showConfig() {
  const ui = SpreadsheetApp.getUi();
  const message = `現在の設定:

商品URL列: ${CONFIG.PRODUCT_URL_COLUMN}列目（O列）
GitHub Token: ${CONFIG.GITHUB_TOKEN === 'YOUR_GITHUB_PERSONAL_ACCESS_TOKEN' ? '未設定 ❌' : '設定済み ✅'}

【重要】
この機能は簡易版です。以下の情報は自動入力されません：
- カテゴリ
- 贈る相手
- シーン
- 予算帯
- タグ

これらは手動で入力してください。

設定を変更する場合は、「拡張機能」→「Apps Script」からスクリプトを編集してください。`;

  ui.alert('商品管理の設定', message, ui.ButtonSet.OK);
}

// ===== GitHub連携機能 =====

/**
 * スプレッドシートの内容をGitHubにプッシュ
 */
function pushToGitHub() {
  const ui = SpreadsheetApp.getUi();

  if (CONFIG.GITHUB_TOKEN === 'YOUR_GITHUB_PERSONAL_ACCESS_TOKEN') {
    ui.alert('エラー', 'GitHub Personal Access Tokenが設定されていません。\nスクリプトエディタで設定してください。', ui.ButtonSet.OK);
    return;
  }

  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const csvContent = convertSheetToCSV(sheet);
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

function convertSheetToCSV(sheet) {
  const data = sheet.getDataRange().getValues();
  return data.map(row => {
    return row.map(cell => {
      const str = cell.toString();
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return '"' + str.replace(/"/g, '""') + '"';
      }
      return str;
    }).join(',');
  }).join('\n');
}

function uploadToGitHub(content) {
  try {
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
        sha = JSON.parse(getResponse.getContentText()).sha;
      }
    } catch (e) {
      console.log('ファイルが存在しないため、新規作成します');
    }

    const now = new Date();
    const timestamp = Utilities.formatDate(now, 'Asia/Tokyo', 'yyyy-MM-dd HH:mm:ss');
    const commitMessage = `商品データを更新 (${timestamp})\n\nGoogleスプレッドシートから自動更新`;

    const putUrl = `https://api.github.com/repos/${CONFIG.GITHUB_OWNER}/${CONFIG.GITHUB_REPO}/contents/${CONFIG.FILE_PATH}`;
    const payload = {
      message: commitMessage,
      content: Utilities.base64Encode(content),
      branch: CONFIG.GITHUB_BRANCH
    };

    if (sha) {
      payload.sha = sha;
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
