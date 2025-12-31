const fs = require('fs');
const path = require('path');

// products.jsonを読み込み
const productsPath = path.join(__dirname, '../src/data/products.json');
const productsData = JSON.parse(fs.readFileSync(productsPath, 'utf8'));

// CSVヘッダー
const headers = [
  'id',
  'name',
  'description',
  'price',
  'imageUrl',
  'category',
  'recipients',
  'occasions',
  'budgetRange',
  'amazonUrl',
  'rakutenUrl',
  'tags',
  'priority',
  'isPublished'
];

// CSVの値をエスケープする関数
function escapeCsv(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  // カンマ、改行、ダブルクォートが含まれる場合はダブルクォートで囲む
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// 配列をカンマ区切り文字列に変換
function arrayToString(arr) {
  if (!Array.isArray(arr)) return '';
  return arr.join(',');
}

// アフィリエイトリンクからURLを取得
function getAffiliateUrl(links, provider) {
  if (!Array.isArray(links)) return '';
  const link = links.find(l => l.provider === provider);
  return link ? link.url : '';
}

// CSVデータを生成
const csvRows = [headers.join(',')];

productsData.products.forEach(product => {
  const row = [
    escapeCsv(product.id),
    escapeCsv(product.name),
    escapeCsv(product.description),
    escapeCsv(product.price),
    escapeCsv(product.imageUrl),
    escapeCsv(product.category),
    escapeCsv(arrayToString(product.recipients)),
    escapeCsv(arrayToString(product.occasions)),
    escapeCsv(product.budgetRange),
    escapeCsv(getAffiliateUrl(product.affiliateLinks, 'amazon')),
    escapeCsv(getAffiliateUrl(product.affiliateLinks, 'rakuten')),
    escapeCsv(arrayToString(product.tags)),
    escapeCsv(product.priority),
    escapeCsv(product.isPublished ? 'TRUE' : 'FALSE')
  ];
  csvRows.push(row.join(','));
});

// CSVファイルを出力
const csvContent = csvRows.join('\n');
const outputPath = path.join(__dirname, '../data/products.csv');

// dataディレクトリがなければ作成
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

fs.writeFileSync(outputPath, csvContent, 'utf8');
console.log(`✅ CSVファイルを生成しました: ${outputPath}`);
console.log(`📊 商品数: ${productsData.products.length}件`);
