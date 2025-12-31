/**
 * Google Apps Script: 商品URL自動入力機能
 *
 * 商品URLを入力すると、そのページから商品情報を自動取得して
 * スプレッドシートの各列を埋めます。
 *
 * セットアップ方法は docs/AUTO_FILL_SETUP.md を参照してください。
 */

// ===== 設定項目 =====
const AUTO_FILL_CONFIG = {
  // 商品URLの列番号（A列=1, B列=2, ...）
  PRODUCT_URL_COLUMN: 15, // O列 (amazonUrl/rakutenUrlの後に追加)

  // Claude API設定
  CLAUDE_API_KEY: 'YOUR_CLAUDE_API_KEY', // https://console.anthropic.com/ から取得
  CLAUDE_MODEL: 'claude-3-5-sonnet-20241022',
  CLAUDE_API_URL: 'https://api.anthropic.com/v1/messages'
};

// ===== カスタムメニュー =====

/**
 * スプレッドシート起動時にメニューを追加
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('商品管理')
    .addItem('選択行の商品情報を自動入力', 'autoFillSelectedRow')
    .addItem('空欄の商品情報を一括自動入力', 'autoFillAllEmptyRows')
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
    const success = fillProductInfo(sheet, row);
    if (success) {
      ui.alert('成功', `${row}行目の商品情報を自動入力しました！`, ui.ButtonSet.OK);
    } else {
      ui.alert('エラー', '商品URLが入力されていないか、情報取得に失敗しました。', ui.ButtonSet.OK);
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
    '商品URLが入力されているが、商品名が空欄の行をすべて自動入力します。よろしいですか？',
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) {
    return;
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const lastRow = sheet.getLastRow();
  let count = 0;

  try {
    for (let row = 2; row <= lastRow; row++) {
      const productUrl = sheet.getRange(row, AUTO_FILL_CONFIG.PRODUCT_URL_COLUMN).getValue();
      const productName = sheet.getRange(row, 2).getValue(); // B列=商品名

      // 商品URLがあり、商品名が空の場合のみ処理
      if (productUrl && !productName) {
        const success = fillProductInfo(sheet, row);
        if (success) {
          count++;
          SpreadsheetApp.flush(); // 更新を反映
          Utilities.sleep(2000); // API制限対策で2秒待機
        }
      }
    }

    ui.alert('完了', `${count}件の商品情報を自動入力しました！`, ui.ButtonSet.OK);
  } catch (error) {
    ui.alert('エラー', `${count}件処理後にエラーが発生しました: ${error.message}`, ui.ButtonSet.OK);
    console.error(error);
  }
}

/**
 * 指定行の商品情報を自動入力
 */
function fillProductInfo(sheet, row) {
  // 商品URLを取得
  const productUrl = sheet.getRange(row, AUTO_FILL_CONFIG.PRODUCT_URL_COLUMN).getValue();

  if (!productUrl) {
    return false;
  }

  // Claude APIで商品情報を取得
  const productInfo = extractProductInfo(productUrl);

  if (!productInfo) {
    return false;
  }

  // 各列に情報を入力
  // IDは自動採番（既存のIDがない場合のみ）
  const existingId = sheet.getRange(row, 1).getValue();
  if (!existingId) {
    const newId = generateNextProductId(sheet);
    sheet.getRange(row, 1).setValue(newId);
  }

  // B列〜N列に情報を入力
  sheet.getRange(row, 2).setValue(productInfo.name || '');           // 商品名
  sheet.getRange(row, 3).setValue(productInfo.description || '');    // 商品説明
  sheet.getRange(row, 4).setValue(productInfo.price || '');          // 価格
  sheet.getRange(row, 5).setValue(productInfo.imageUrl || '');       // 画像URL
  sheet.getRange(row, 6).setValue(productInfo.category || '');       // カテゴリ
  sheet.getRange(row, 7).setValue(productInfo.recipients || '');     // 贈る相手
  sheet.getRange(row, 8).setValue(productInfo.occasions || '');      // シーン
  sheet.getRange(row, 9).setValue(productInfo.budgetRange || '');    // 予算帯
  sheet.getRange(row, 10).setValue(productInfo.amazonUrl || '');     // AmazonURL
  sheet.getRange(row, 11).setValue(productInfo.rakutenUrl || '');    // 楽天URL
  sheet.getRange(row, 12).setValue(productInfo.tags || '');          // タグ
  sheet.getRange(row, 13).setValue(productInfo.priority || 80);      // 優先度
  sheet.getRange(row, 14).setValue('TRUE');                          // 公開状態

  return true;
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
 * Claude APIを使って商品情報を抽出
 */
function extractProductInfo(url) {
  // API Key確認
  if (AUTO_FILL_CONFIG.CLAUDE_API_KEY === 'YOUR_CLAUDE_API_KEY') {
    throw new Error('Claude API Keyが設定されていません。スクリプトエディタで設定してください。');
  }

  // URLから商品ページを取得
  let htmlContent;
  try {
    const response = UrlFetchApp.fetch(url, {
      muteHttpExceptions: true,
      followRedirects: true
    });
    htmlContent = response.getContentText();
  } catch (error) {
    console.error('URL取得エラー:', error);
    return null;
  }

  // HTMLが長すぎる場合は最初の50000文字のみ使用
  if (htmlContent.length > 50000) {
    htmlContent = htmlContent.substring(0, 50000);
  }

  // Claude APIに問い合わせ
  const prompt = `以下の商品ページのHTMLから、ギフト診断アプリ用の商品情報を抽出してください。

【HTMLコンテンツ】
${htmlContent}

【抽出する情報】
以下のJSON形式で返してください。判断できない項目は推測で構いません。

{
  "name": "商品名（50文字以内）",
  "description": "商品説明（100文字以内、ギフトとしての魅力を簡潔に）",
  "price": 価格（数値のみ、カンマなし）,
  "imageUrl": "/images/products/商品名.jpg",
  "category": "カテゴリ（コスメ/グルメ/雑貨/インテリア/ガジェット/ファッション/花・植物/体験から選択）",
  "recipients": "贈る相手（カンマ区切り: 彼氏,彼女,夫,妻,父,母,上司,同僚,友人男性,友人女性,子供から選択）",
  "occasions": "シーン（カンマ区切り: 誕生日,クリスマス,ホワイトデー,バレンタイン,母の日,父の日,記念日,お礼,結婚祝い,出産祝い,引っ越し祝い,就職祝い,退職祝いから選択）",
  "budgetRange": "予算帯（〜3,000円/3,000〜5,000円/5,000〜10,000円/10,000〜20,000円/20,000〜30,000円/30,000円〜から選択）",
  "amazonUrl": "Amazon商品URL（AmazonURLの場合はそのまま、楽天の場合は空文字）",
  "rakutenUrl": "楽天商品URL（楽天URLの場合はそのまま、Amazonの場合は空文字）",
  "tags": "タグ（カンマ区切り、5個程度）",
  "priority": 優先度（70〜95の数値、人気商品は高め）
}

【注意事項】
- descriptionはギフトとして贈る際の魅力を簡潔に書いてください
- imageUrlは実際の画像URLではなく、「/images/products/商品名.jpg」の形式で返してください
- recipientsとoccasionsは、この商品がどんな人にどんなシーンで贈られるか考えて選択してください
- budgetRangeは価格に基づいて適切なものを選んでください
- tagsは商品の特徴を表すキーワードを5個程度選んでください

JSONのみを返してください。説明文は不要です。`;

  try {
    const apiResponse = UrlFetchApp.fetch(AUTO_FILL_CONFIG.CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': AUTO_FILL_CONFIG.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      payload: JSON.stringify({
        model: AUTO_FILL_CONFIG.CLAUDE_MODEL,
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      }),
      muteHttpExceptions: true
    });

    const result = JSON.parse(apiResponse.getContentText());

    if (result.content && result.content[0] && result.content[0].text) {
      const jsonText = result.content[0].text.trim();
      // JSONブロックから抽出（```json ... ```の形式の場合）
      const jsonMatch = jsonText.match(/```json\s*([\s\S]*?)\s*```/) || jsonText.match(/```\s*([\s\S]*?)\s*```/);
      const cleanJson = jsonMatch ? jsonMatch[1] : jsonText;

      const productInfo = JSON.parse(cleanJson);
      return productInfo;
    }

    return null;
  } catch (error) {
    console.error('Claude API エラー:', error);
    return null;
  }
}

/**
 * 設定内容を表示
 */
function showConfig() {
  const ui = SpreadsheetApp.getUi();
  const message = `現在の設定:

商品URL列: ${AUTO_FILL_CONFIG.PRODUCT_URL_COLUMN}列目
Claude API Key: ${AUTO_FILL_CONFIG.CLAUDE_API_KEY === 'YOUR_CLAUDE_API_KEY' ? '未設定 ❌' : '設定済み ✅'}

設定を変更する場合は、「拡張機能」→「Apps Script」からスクリプトを編集してください。`;

  ui.alert('自動入力の設定', message, ui.ButtonSet.OK);
}

// ===== GitHub連携機能 =====
// (既存のgoogle-apps-script.jsの内容をここにも含める)

function pushToGitHub() {
  // 既存のpushToGitHub関数をコピー
  SpreadsheetApp.getUi().alert('GitHub連携機能は別途実装してください');
}
