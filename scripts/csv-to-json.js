const fs = require('fs');
const path = require('path');

// CSVファイルを読み込み
const csvPath = path.join(__dirname, '../data/products.csv');
const csvContent = fs.readFileSync(csvPath, 'utf8');

// CSVをパース
const lines = csvContent.split('\n').filter(line => line.trim());
const headers = lines[0].split(',').map(h => h.trim());

// CSVの値をパースする関数（ダブルクォートのエスケープに対応）
function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // エスケープされたダブルクォート
        current += '"';
        i++; // 次の文字をスキップ
      } else {
        // クォートの開始/終了
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // フィールドの区切り
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  // 最後のフィールドを追加
  result.push(current);

  return result.map(field => field.trim());
}

// 文字列を配列に変換
function stringToArray(str) {
  if (!str || str.trim() === '') return [];
  return str.split(',').map(item => item.trim()).filter(item => item);
}

// 商品データを構築
const products = [];

for (let i = 1; i < lines.length; i++) {
  const values = parseCsvLine(lines[i]);

  if (values.length < headers.length) continue; // 不完全な行はスキップ

  const product = {};

  headers.forEach((header, index) => {
    const value = values[index] || '';

    switch (header) {
      case 'id':
      case 'name':
      case 'description':
      case 'imageUrl':
      case 'category':
      case 'budgetRange':
        product[header] = value;
        break;

      case 'price':
      case 'priority':
        product[header] = parseInt(value, 10) || 0;
        break;

      case 'recipients':
      case 'occasions':
      case 'tags':
        product[header] = stringToArray(value);
        break;

      case 'amazonUrl':
      case 'rakutenUrl':
        // affiliateLinksとして格納
        if (!product.affiliateLinks) {
          product.affiliateLinks = [];
        }
        if (value) {
          const provider = header === 'amazonUrl' ? 'amazon' : 'rakuten';
          product.affiliateLinks.push({
            provider: provider,
            url: value
          });
        }
        break;

      case 'isPublished':
        product[header] = value.toUpperCase() === 'TRUE';
        break;
    }
  });

  // createdAtとupdatedAtを追加（既存データから取得または現在時刻）
  const now = new Date().toISOString();
  product.createdAt = product.createdAt || now;
  product.updatedAt = now;

  products.push(product);
}

// products.jsonのフォーマットで出力
const output = {
  version: "1.0.0",
  lastUpdated: new Date().toISOString(),
  products: products
};

const outputPath = path.join(__dirname, '../src/data/products.json');
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf8');

console.log(`✅ products.jsonを更新しました: ${outputPath}`);
console.log(`📊 商品数: ${products.length}件`);
