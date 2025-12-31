/**
 * Google Apps Script: 商品管理システム（完全版）
 *
 * 機能:
 * 1. 商品URLからの簡易自動入力（API Key不要）
 * 2. スプレッドシートからGitHubへのプッシュ
 */

// ===== 設定項目 =====
const CONFIG = {
  PRODUCT_URL_COLUMN: 15, // O列
  GITHUB_TOKEN: 'YOUR_GITHUB_PERSONAL_ACCESS_TOKEN', // Apps Scriptエディタで設定してください
  GITHUB_OWNER: 'akira0907',
  GITHUB_REPO: 'gift-diagnosis',
  GITHUB_BRANCH: 'main',
  FILE_PATH: 'data/products.csv',
};

// ===== カスタムメニュー =====

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('商品管理')
    .addItem('選択行の商品情報を補助入力', 'autoFillSelectedRow')
    .addItem('空欄の商品情報を一括補助入力', 'autoFillAllEmptyRows')
    .addSeparator()
    .addItem('GitHubにプッシュ', 'pushToGitHub')
    .addItem('設定を確認', 'showConfig')
    .addToUi();
}

// ===== 商品情報自動入力機能 =====

function autoFillSelectedRow() {
  const ui = SpreadsheetApp.getUi();

  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const row = sheet.getActiveRange().getRow();

    if (row === 1) {
      ui.alert('エラー', 'ヘッダー行は編集できません。', ui.ButtonSet.OK);
      return;
    }

    const result = fillProductInfo(sheet, row);

    if (result.success) {
      ui.alert('成功',
        row + '行目に基本情報を入力しました！\n\n' +
        '商品名: ' + result.name + '\n' +
        '価格: ' + result.price + '\n\n' +
        '※ カテゴリ、贈る相手、シーンなどは手動で入力してください。',
        ui.ButtonSet.OK
      );
    } else {
      ui.alert('エラー', result.error || '商品情報の取得に失敗しました。', ui.ButtonSet.OK);
    }
  } catch (error) {
    ui.alert('エラー', 'エラーが発生しました: ' + error.message, ui.ButtonSet.OK);
    Logger.log(error);
  }
}

function autoFillAllEmptyRows() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert(
    '確認',
    '商品URLが入力されているが、商品名が空欄の行をすべて補助入力します。よろしいですか？',
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) return;

  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const lastRow = sheet.getLastRow();
    let count = 0;
    const results = [];

    for (let row = 2; row <= lastRow; row++) {
      const productUrl = sheet.getRange(row, CONFIG.PRODUCT_URL_COLUMN).getValue();
      const productName = sheet.getRange(row, 2).getValue();

      if (productUrl && !productName) {
        const result = fillProductInfo(sheet, row);
        if (result.success) {
          count++;
          results.push(row + '行目: ' + result.name);
        }
        SpreadsheetApp.flush();
        Utilities.sleep(1000);
      }
    }

    ui.alert('完了',
      count + '件の商品情報を補助入力しました！\n\n' +
      results.join('\n') + '\n\n' +
      '※ カテゴリ、贈る相手、シーンなどは手動で入力してください。',
      ui.ButtonSet.OK
    );
  } catch (error) {
    ui.alert('エラー', 'エラーが発生しました: ' + error.message, ui.ButtonSet.OK);
    Logger.log(error);
  }
}

function fillProductInfo(sheet, row) {
  try {
    // sheetの存在確認
    if (!sheet) {
      return { success: false, error: 'シートオブジェクトが無効です' };
    }

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
    sheet.getRange(row, 2).setValue(productInfo.name);
    sheet.getRange(row, 3).setValue(productInfo.description);
    sheet.getRange(row, 4).setValue(productInfo.price || '');
    sheet.getRange(row, 5).setValue(productInfo.imageUrl);

    // URLを適切な列に設定
    if (productUrl.indexOf('amazon') !== -1) {
      sheet.getRange(row, 10).setValue(productUrl);
    } else if (productUrl.indexOf('rakuten') !== -1 || productUrl.indexOf('room.rakuten') !== -1) {
      sheet.getRange(row, 11).setValue(productUrl);
    }

    // デフォルト値を設定
    sheet.getRange(row, 13).setValue(80);
    sheet.getRange(row, 14).setValue('TRUE');

    return {
      success: true,
      name: productInfo.name,
      price: productInfo.price || '（価格不明）'
    };
  } catch (error) {
    Logger.log('fillProductInfo error: ' + error.message);
    return { success: false, error: error.message };
  }
}

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
        .replace(/\s*\|\s*.+$/, '')
        .replace(/\s*-\s*.+$/, '')
        .replace(/【.*?】/g, '')
        .trim();

      if (title.length > 50) {
        title = title.substring(0, 50);
      }
    }

    // 価格を抽出
    let price = null;
    const pricePatterns = [
      /[¥￥]\s*([0-9,]+)/,
      /価格[：:]\s*([0-9,]+)円/,
      /"price"[^0-9]*([0-9,]+)/
    ];

    for (let i = 0; i < pricePatterns.length; i++) {
      const match = html.match(pricePatterns[i]);
      if (match) {
        price = parseInt(match[1].replace(/,/g, ''));
        break;
      }
    }

    const productName = title || 'タイトル取得失敗';
    const imageUrl = '/images/products/product.jpg';

    return {
      success: true,
      name: productName,
      description: productName.substring(0, 100),
      price: price,
      imageUrl: imageUrl
    };

  } catch (error) {
    Logger.log('URL取得エラー: ' + error.message);
    return { success: false, error: 'ページの取得に失敗しました: ' + error.message };
  }
}

function generateNextProductId(sheet) {
  try {
    // sheetの存在確認
    if (!sheet) {
      Logger.log('generateNextProductId: sheet is null or undefined');
      return 'prod_016';
    }

    const lastRow = sheet.getLastRow();

    // データがない場合
    if (lastRow < 2) {
      return 'prod_016';
    }

    const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    let maxNum = 15;

    for (let i = 0; i < ids.length; i++) {
      const id = ids[i][0];
      if (id && id.toString().indexOf('prod_') === 0) {
        const num = parseInt(id.toString().replace('prod_', ''));
        if (!isNaN(num) && num > 0 && num < 1000 && num > maxNum) {
          maxNum = num;
        }
      }
    }

    const nextNum = maxNum + 1;
    const paddedNum = ('000' + nextNum).slice(-3);
    return 'prod_' + paddedNum;

  } catch (error) {
    Logger.log('generateNextProductId error: ' + error.message);
    return 'prod_016';
  }
}

// ===== GitHub連携機能 =====

function pushToGitHub() {
  const ui = SpreadsheetApp.getUi();

  if (CONFIG.GITHUB_TOKEN === 'YOUR_GITHUB_PERSONAL_ACCESS_TOKEN') {
    ui.alert('エラー', 'GitHub Personal Access Tokenが設定されていません。', ui.ButtonSet.OK);
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
    Logger.log(error);
  }
}

function convertSheetToCSV(sheet) {
  const data = sheet.getDataRange().getValues();
  const csv = [];

  for (let i = 0; i < data.length; i++) {
    const row = [];
    for (let j = 0; j < data[i].length; j++) {
      const str = data[i][j].toString();
      if (str.indexOf(',') !== -1 || str.indexOf('"') !== -1 || str.indexOf('\n') !== -1) {
        row.push('"' + str.replace(/"/g, '""') + '"');
      } else {
        row.push(str);
      }
    }
    csv.push(row.join(','));
  }

  return csv.join('\n');
}

function uploadToGitHub(content) {
  try {
    const getUrl = 'https://api.github.com/repos/' + CONFIG.GITHUB_OWNER + '/' +
                   CONFIG.GITHUB_REPO + '/contents/' + CONFIG.FILE_PATH +
                   '?ref=' + CONFIG.GITHUB_BRANCH;

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
      Logger.log('ファイルが存在しないため、新規作成します');
    }

    const now = new Date();
    const timestamp = Utilities.formatDate(now, 'Asia/Tokyo', 'yyyy-MM-dd HH:mm:ss');
    const commitMessage = '商品データを更新 (' + timestamp + ')\n\nGoogleスプレッドシートから自動更新';

    const putUrl = 'https://api.github.com/repos/' + CONFIG.GITHUB_OWNER + '/' +
                   CONFIG.GITHUB_REPO + '/contents/' + CONFIG.FILE_PATH;

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
        error: 'HTTPエラー ' + responseCode + ': ' + (responseBody.message || 'Unknown error')
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// ===== 設定表示 =====

function showConfig() {
  const ui = SpreadsheetApp.getUi();
  const tokenStatus = CONFIG.GITHUB_TOKEN === 'YOUR_GITHUB_PERSONAL_ACCESS_TOKEN' ? '未設定 ❌' : '設定済み ✅';

  const message = '現在の設定:\n\n' +
    '商品URL列: ' + CONFIG.PRODUCT_URL_COLUMN + '列目（O列）\n' +
    'GitHub Owner: ' + CONFIG.GITHUB_OWNER + '\n' +
    'リポジトリ: ' + CONFIG.GITHUB_REPO + '\n' +
    'ブランチ: ' + CONFIG.GITHUB_BRANCH + '\n' +
    'ファイルパス: ' + CONFIG.FILE_PATH + '\n' +
    'GitHub Token: ' + tokenStatus + '\n\n' +
    '【重要】\n' +
    'この機能は簡易版です。以下の情報は自動入力されません：\n' +
    '- カテゴリ\n' +
    '- 贈る相手\n' +
    '- シーン\n' +
    '- 予算帯\n' +
    '- タグ\n\n' +
    'これらは手動で入力してください。\n\n' +
    '設定を変更する場合は、「拡張機能」→「Apps Script」からスクリプトを編集してください。';

  ui.alert('商品管理の設定', message, ui.ButtonSet.OK);
}
