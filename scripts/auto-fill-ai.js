/**
 * Google Apps Script: 商品管理システム（AI判定機能付き）
 *
 * 機能:
 * 1. 商品URLから全情報を自動入力（AI判定でカテゴリ・相手・シーンも自動）
 * 2. スプレッドシートからGitHubへのプッシュ
 * 3. スクリプトプロパティでトークン管理（セキュア）
 *
 * セットアップ:
 * 1. スクリプトエディタで「プロジェクトの設定」→「スクリプトプロパティ」
 * 2. 「GITHUB_TOKEN」プロパティを追加してトークンを設定
 */

// ===== 設定項目 =====
const CONFIG = {
  SHEET_NAME: 'products', // 商品データが入っているシート名
  PRODUCT_URL_COLUMN: 15, // O列

  // GitHub連携設定（GitHubにプッシュしない）
  GITHUB_OWNER: 'akira0907',
  GITHUB_REPO: 'gift-diagnosis',
  GITHUB_BRANCH: 'main',
  FILE_PATH: 'data/products.csv',
};

/**
 * GitHub Tokenをスクリプトプロパティから取得
 */
function getGitHubToken() {
  const scriptProperties = PropertiesService.getScriptProperties();
  const token = scriptProperties.getProperty('GITHUB_TOKEN');

  if (!token || token === 'YOUR_GITHUB_PERSONAL_ACCESS_TOKEN') {
    return null;
  }

  return token;
}

/**
 * GitHub Tokenを設定
 */
function setGitHubToken(token) {
  const scriptProperties = PropertiesService.getScriptProperties();
  scriptProperties.setProperty('GITHUB_TOKEN', token);
}

// ===== カスタムメニュー =====

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('商品管理')
    .addItem('選択行の商品情報を自動入力（AI判定）', 'autoFillSelectedRowWithAI')
    .addItem('空欄の商品情報を一括自動入力（AI判定）', 'autoFillAllEmptyRowsWithAI')
    .addSeparator()
    .addItem('GitHubにプッシュ', 'pushToGitHub')
    .addSeparator()
    .addItem('GitHub Tokenを設定', 'setupGitHubToken')
    .addItem('設定を確認', 'showConfig')
    .addToUi();
}

/**
 * GitHub Tokenのセットアップ
 */
function setupGitHubToken() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt(
    'GitHub Token設定',
    'GitHub Personal Access Tokenを入力してください:\n' +
    '(https://github.com/settings/tokens から取得)',
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() === ui.Button.OK) {
    const token = response.getResponseText().trim();
    if (token) {
      setGitHubToken(token);
      ui.alert('成功', 'GitHub Tokenを設定しました。', ui.ButtonSet.OK);
    } else {
      ui.alert('エラー', 'トークンが入力されませんでした。', ui.ButtonSet.OK);
    }
  }
}

// ===== 商品情報自動入力機能（AI判定付き） =====

function autoFillSelectedRowWithAI() {
  const ui = SpreadsheetApp.getUi();

  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME);

    if (!sheet) {
      ui.alert('エラー',
        'シート「' + CONFIG.SHEET_NAME + '」が見つかりません。\n\n' +
        'CONFIGのSHEET_NAMEを正しいシート名に設定してください。',
        ui.ButtonSet.OK);
      return;
    }
    const row = sheet.getActiveRange().getRow();

    if (row === 1) {
      ui.alert('エラー', 'ヘッダー行は編集できません。', ui.ButtonSet.OK);
      return;
    }

    const result = fillProductInfoWithAI(sheet, row);

    if (result.success) {
      ui.alert('成功',
        row + '行目に商品情報を入力しました！\n\n' +
        '商品名: ' + result.name + '\n' +
        '価格: ' + result.price + '\n' +
        'カテゴリ: ' + result.category + '\n' +
        '贈る相手: ' + result.recipients + '\n\n' +
        '※ 内容を確認して、必要に応じて修正してください。',
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

function autoFillAllEmptyRowsWithAI() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert(
    '確認',
    '商品URLが入力されているが、商品名が空欄の行をすべて自動入力します。\n' +
    'AI判定でカテゴリ・贈る相手・シーンも自動設定されます。\n\n' +
    'よろしいですか？',
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) return;

  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME);

    if (!sheet) {
      ui.alert('エラー',
        'シート「' + CONFIG.SHEET_NAME + '」が見つかりません。\n\n' +
        'CONFIGのSHEET_NAMEを正しいシート名に設定してください。',
        ui.ButtonSet.OK);
      return;
    }
    const lastRow = sheet.getLastRow();
    let count = 0;
    const results = [];

    for (let row = 2; row <= lastRow; row++) {
      const productUrl = sheet.getRange(row, CONFIG.PRODUCT_URL_COLUMN).getValue();
      const productName = sheet.getRange(row, 2).getValue();

      if (productUrl && !productName) {
        const result = fillProductInfoWithAI(sheet, row);
        if (result.success) {
          count++;
          results.push(row + '行目: ' + result.name);
        }
        SpreadsheetApp.flush();
        Utilities.sleep(2000); // AI判定のため2秒待機
      }
    }

    ui.alert('完了',
      count + '件の商品情報を自動入力しました！\n\n' +
      results.join('\n') + '\n\n' +
      '※ 内容を確認して、必要に応じて修正してください。',
      ui.ButtonSet.OK
    );
  } catch (error) {
    ui.alert('エラー', 'エラーが発生しました: ' + error.message, ui.ButtonSet.OK);
    Logger.log(error);
  }
}

function fillProductInfoWithAI(sheet, row) {
  try {
    if (!sheet) {
      return { success: false, error: 'シートオブジェクトが無効です' };
    }

    const productUrl = sheet.getRange(row, CONFIG.PRODUCT_URL_COLUMN).getValue();

    if (!productUrl) {
      return { success: false, error: '商品URLが入力されていません。' };
    }

    // URLから商品情報を取得（AI判定付き）
    const productInfo = extractProductInfoWithAI(productUrl);

    if (!productInfo.success) {
      return productInfo;
    }

    // IDを自動採番（既存のIDがない場合のみ）
    const existingId = sheet.getRange(row, 1).getValue();
    if (!existingId) {
      const newId = generateNextProductId(sheet);
      sheet.getRange(row, 1).setValue(newId);
    }

    // 全情報を入力
    sheet.getRange(row, 2).setValue(productInfo.name);           // 商品名
    sheet.getRange(row, 3).setValue(productInfo.description);    // 商品説明
    sheet.getRange(row, 4).setValue(productInfo.price || '');    // 価格
    sheet.getRange(row, 5).setValue(productInfo.imageUrl);       // 画像URL
    sheet.getRange(row, 6).setValue(productInfo.category);       // カテゴリ
    sheet.getRange(row, 7).setValue(productInfo.recipients);     // 贈る相手
    sheet.getRange(row, 8).setValue(productInfo.occasions);      // シーン
    sheet.getRange(row, 9).setValue(productInfo.budgetRange);    // 予算帯

    // URLを適切な列に設定
    if (productUrl.indexOf('amazon') !== -1) {
      sheet.getRange(row, 10).setValue(productUrl);
    } else if (productUrl.indexOf('rakuten') !== -1 || productUrl.indexOf('room.rakuten') !== -1) {
      sheet.getRange(row, 11).setValue(productUrl);
    }

    sheet.getRange(row, 12).setValue(productInfo.tags);          // タグ
    sheet.getRange(row, 13).setValue(productInfo.priority || 80); // 優先度
    sheet.getRange(row, 14).setValue('TRUE');                     // 公開状態

    return {
      success: true,
      name: productInfo.name,
      price: productInfo.price || '（価格不明）',
      category: productInfo.category,
      recipients: productInfo.recipients
    };
  } catch (error) {
    Logger.log('fillProductInfoWithAI error: ' + error.message);
    return { success: false, error: error.message };
  }
}

/**
 * URLから商品情報を抽出（AI判定付き）
 */
function extractProductInfoWithAI(url) {
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

    // AI判定でカテゴリ・相手・シーンを決定
    const aiJudgment = judgeProductCategory(productName, html, price);

    return {
      success: true,
      name: productName,
      description: productName.substring(0, 100),
      price: price,
      imageUrl: '/images/products/product.jpg',
      category: aiJudgment.category,
      recipients: aiJudgment.recipients,
      occasions: aiJudgment.occasions,
      budgetRange: aiJudgment.budgetRange,
      tags: aiJudgment.tags,
      priority: aiJudgment.priority
    };

  } catch (error) {
    Logger.log('URL取得エラー: ' + error.message);
    return { success: false, error: 'ページの取得に失敗しました: ' + error.message };
  }
}

/**
 * AI判定：商品のカテゴリ・贈る相手・シーンを自動判定
 */
function judgeProductCategory(productName, htmlContent, price) {
  const nameLower = productName.toLowerCase();

  // カテゴリ判定
  let category = '雑貨'; // デフォルト
  if (nameLower.indexOf('化粧') !== -1 || nameLower.indexOf('コスメ') !== -1 ||
      nameLower.indexOf('クリーム') !== -1 || nameLower.indexOf('香水') !== -1 ||
      nameLower.indexOf('アロマ') !== -1 || nameLower.indexOf('入浴') !== -1) {
    category = 'コスメ';
  } else if (nameLower.indexOf('チョコ') !== -1 || nameLower.indexOf('スイーツ') !== -1 ||
             nameLower.indexOf('お菓子') !== -1 || nameLower.indexOf('酒') !== -1 ||
             nameLower.indexOf('ワイン') !== -1 || nameLower.indexOf('日本酒') !== -1) {
    category = 'グルメ';
  } else if (nameLower.indexOf('時計') !== -1 || nameLower.indexOf('イヤホン') !== -1 ||
             nameLower.indexOf('スマート') !== -1 || nameLower.indexOf('ガジェット') !== -1) {
    category = 'ガジェット';
  } else if (nameLower.indexOf('花') !== -1 || nameLower.indexOf('フラワー') !== -1 ||
             nameLower.indexOf('植物') !== -1) {
    category = '花・植物';
  } else if (nameLower.indexOf('財布') !== -1 || nameLower.indexOf('ネクタイ') !== -1 ||
             nameLower.indexOf('バッグ') !== -1) {
    category = 'ファッション';
  } else if (nameLower.indexOf('インテリア') !== -1 || nameLower.indexOf('家具') !== -1) {
    category = 'インテリア';
  } else if (nameLower.indexOf('ディナー') !== -1 || nameLower.indexOf('体験') !== -1) {
    category = '体験';
  }

  // 予算帯判定
  let budgetRange = '5,000~10,000円';
  if (price) {
    if (price < 3000) {
      budgetRange = '~3,000円';
    } else if (price < 5000) {
      budgetRange = '3,000~5,000円';
    } else if (price < 10000) {
      budgetRange = '5,000~10,000円';
    } else if (price < 20000) {
      budgetRange = '10,000~20,000円';
    } else if (price < 30000) {
      budgetRange = '20,000~30,000円';
    } else {
      budgetRange = '30,000円~';
    }
  }

  // 贈る相手の判定
  let recipients = [];

  // 女性向け
  if (category === 'コスメ' || nameLower.indexOf('花') !== -1) {
    recipients.push('彼女', '妻', '母', '友人女性');
  }
  // 男性向け
  else if (category === 'ガジェット' || nameLower.indexOf('財布') !== -1 ||
           nameLower.indexOf('ネクタイ') !== -1) {
    recipients.push('彼氏', '夫', '父', '上司', '友人男性');
  }
  // 両方
  else {
    recipients.push('彼女', '彼氏', '夫', '妻', '友人女性', '友人男性');
  }

  // シーン判定
  let occasions = [];
  if (price && price >= 5000) {
    occasions.push('誕生日', 'クリスマス', '記念日');
  } else {
    occasions.push('誕生日', 'お礼');
  }

  // カテゴリ別のシーン追加
  if (category === 'コスメ' || category === '花・植物') {
    occasions.push('母の日', 'ホワイトデー');
  } else if (category === 'グルメ') {
    occasions.push('お中元', 'お歳暮');
  }

  // タグ生成
  let tags = [category];
  if (price < 5000) tags.push('プチギフト');
  if (price >= 10000) tags.push('高級');

  // 商品名からキーワード抽出
  const keywords = productName.split(/[\s　、,]+/).slice(0, 3);
  tags = tags.concat(keywords);

  // 優先度判定
  let priority = 80;
  if (price && price >= 10000) priority = 85;
  if (category === 'コスメ' || category === 'ガジェット') priority += 5;

  return {
    category: category,
    recipients: recipients.join(','),
    occasions: occasions.join(','),
    budgetRange: budgetRange,
    tags: tags.slice(0, 5).join(','),
    priority: priority
  };
}

function generateNextProductId(sheet) {
  try {
    if (!sheet) {
      Logger.log('generateNextProductId: sheet is null or undefined');
      return 'prod_016';
    }

    const lastRow = sheet.getLastRow();

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
  const token = getGitHubToken();

  if (!token) {
    ui.alert('エラー',
      'GitHub Personal Access Tokenが設定されていません。\n\n' +
      '「商品管理」→「GitHub Tokenを設定」から設定してください。',
      ui.ButtonSet.OK);
    return;
  }

  try {
    Logger.log('pushToGitHub: 開始');
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    Logger.log('pushToGitHub: spreadsheet取得成功');

    const sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME);
    Logger.log('pushToGitHub: sheet = ' + sheet);
    Logger.log('pushToGitHub: CONFIG.SHEET_NAME = ' + CONFIG.SHEET_NAME);

    if (!sheet) {
      ui.alert('エラー',
        'シート「' + CONFIG.SHEET_NAME + '」が見つかりません。\n\n' +
        'CONFIGのSHEET_NAMEを正しいシート名に設定してください。',
        ui.ButtonSet.OK);
      return;
    }

    Logger.log('pushToGitHub: sheetチェック完了、convertSheetToCSV呼び出し前');
    // 1. CSVとして保存
    const csvContent = convertSheetToCSV(sheet);
    Logger.log('pushToGitHub: CSV変換完了');
    const csvResult = uploadToGitHub(csvContent, token, CONFIG.FILE_PATH);

    if (!csvResult.success) {
      ui.alert('エラー', 'CSVのプッシュに失敗しました。\n\n' + csvResult.error, ui.ButtonSet.OK);
      return;
    }

    // 2. JSONに変換して保存
    const jsonContent = convertSheetToJSON(sheet);
    const jsonResult = uploadToGitHub(jsonContent, token, 'src/data/products.json');

    if (!jsonResult.success) {
      ui.alert('エラー', 'JSONのプッシュに失敗しました。\n\n' + jsonResult.error, ui.ButtonSet.OK);
      return;
    }

    ui.alert('成功',
      'GitHubへのプッシュが完了しました！\n\n' +
      'CSV: ' + csvResult.commitUrl + '\n\n' +
      'JSON: ' + jsonResult.commitUrl + '\n\n' +
      '数分後にVercelで自動デプロイされ、診断アプリに反映されます。',
      ui.ButtonSet.OK);

  } catch (error) {
    ui.alert('エラー', 'エラーが発生しました: ' + error.message, ui.ButtonSet.OK);
    Logger.log(error);
  }
}

function convertSheetToCSV(sheet) {
  Logger.log('convertSheetToCSV: 呼び出し開始');
  Logger.log('convertSheetToCSV: sheet = ' + sheet);
  Logger.log('convertSheetToCSV: typeof sheet = ' + typeof sheet);

  if (!sheet) {
    Logger.log('convertSheetToCSV: sheet is null or undefined');
    throw new Error('シートオブジェクトが無効です');
  }

  Logger.log('convertSheetToCSV: getDataRange()呼び出し前');
  const data = sheet.getDataRange().getValues();
  Logger.log('convertSheetToCSV: getDataRange()呼び出し成功');
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

/**
 * スプレッドシートをJSON形式に変換（診断アプリ用）
 */
function convertSheetToJSON(sheet) {
  if (!sheet) {
    Logger.log('convertSheetToJSON: sheet is null or undefined');
    throw new Error('シートオブジェクトが無効です');
  }

  const data = sheet.getDataRange().getValues();

  // ヘッダー行を取得
  const headers = data[0];

  // データ行を処理
  const products = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];

    // 空行はスキップ
    if (!row[0]) continue;

    const product = {};

    for (let j = 0; j < headers.length; j++) {
      const header = headers[j].toString().trim();
      let value = row[j];

      // 空の値はスキップ（productUrlは除く）
      if (!value && header !== 'productUrl') {
        if (header === 'amazonUrl' || header === 'rakutenUrl' || header === 'tags') {
          value = '';
        } else {
          continue;
        }
      }

      // データ型に応じて変換
      if (header === 'price' || header === 'priority') {
        // 数値型
        product[header] = value ? parseInt(value) : 0;
      } else if (header === 'isPublished') {
        // 真偽値型
        product[header] = value === 'TRUE' || value === true;
      } else if (header === 'recipients' || header === 'occasions' || header === 'tags') {
        // 配列型（カンマ区切り文字列を配列に変換）
        if (value) {
          const strValue = value.toString().trim();
          product[header] = strValue ? strValue.split(',').map(function(item) {
            return item.trim();
          }).filter(function(item) {
            return item;
          }) : [];
        } else {
          product[header] = [];
        }
      } else if (header === 'productUrl') {
        // productUrlはJSONに含めない
        continue;
      } else {
        // 文字列型
        product[header] = value ? value.toString().trim() : '';
      }
    }

    products.push(product);
  }

  return JSON.stringify(products, null, 2);
}

function uploadToGitHub(content, token, filePath) {
  try {
    const getUrl = 'https://api.github.com/repos/' + CONFIG.GITHUB_OWNER + '/' +
                   CONFIG.GITHUB_REPO + '/contents/' + filePath +
                   '?ref=' + CONFIG.GITHUB_BRANCH;

    let sha = null;
    try {
      const getResponse = UrlFetchApp.fetch(getUrl, {
        method: 'GET',
        headers: {
          'Authorization': 'token ' + token,
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
    const fileType = filePath.indexOf('.json') !== -1 ? 'JSON' : 'CSV';
    const commitMessage = '商品データを更新 (' + fileType + ') - ' + timestamp + '\n\nGoogleスプレッドシートから自動更新';

    const putUrl = 'https://api.github.com/repos/' + CONFIG.GITHUB_OWNER + '/' +
                   CONFIG.GITHUB_REPO + '/contents/' + filePath;

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
        'Authorization': 'token ' + token,
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
  const token = getGitHubToken();
  const tokenStatus = token ? '設定済み ✅' : '未設定 ❌';

  const message = '現在の設定:\n\n' +
    '商品URL列: ' + CONFIG.PRODUCT_URL_COLUMN + '列目（O列）\n' +
    'GitHub Owner: ' + CONFIG.GITHUB_OWNER + '\n' +
    'リポジトリ: ' + CONFIG.GITHUB_REPO + '\n' +
    'ブランチ: ' + CONFIG.GITHUB_BRANCH + '\n' +
    'ファイルパス: ' + CONFIG.FILE_PATH + '\n' +
    'GitHub Token: ' + tokenStatus + '\n\n' +
    '【AI判定機能】\n' +
    '以下の情報はAIが自動で判定します：\n' +
    '✓ カテゴリ\n' +
    '✓ 贈る相手\n' +
    '✓ シーン\n' +
    '✓ 予算帯\n' +
    '✓ タグ\n' +
    '✓ 優先度\n\n' +
    '※ 判定結果は必ず確認して、必要に応じて修正してください。';

  ui.alert('商品管理の設定', message, ui.ButtonSet.OK);
}
