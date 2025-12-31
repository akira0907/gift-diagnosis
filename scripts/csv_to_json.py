#!/usr/bin/env python3
import json
import csv
import os
from datetime import datetime

# CSVファイルを読み込み
script_dir = os.path.dirname(os.path.abspath(__file__))
csv_path = os.path.join(script_dir, '../data/products.csv')

products = []

with open(csv_path, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)

    for row in reader:
        # 配列データをパース
        recipients = [r.strip() for r in row['recipients'].split(',') if r.strip()]
        occasions = [o.strip() for o in row['occasions'].split(',') if o.strip()]
        tags = [t.strip() for t in row['tags'].split(',') if t.strip()]

        # アフィリエイトリンクを構築
        affiliate_links = []
        if row['amazonUrl'].strip():
            affiliate_links.append({
                'provider': 'amazon',
                'url': row['amazonUrl'].strip()
            })
        if row['rakutenUrl'].strip():
            affiliate_links.append({
                'provider': 'rakuten',
                'url': row['rakutenUrl'].strip()
            })

        # 商品データを構築
        product = {
            'id': row['id'].strip(),
            'name': row['name'].strip(),
            'description': row['description'].strip(),
            'price': int(row['price']) if row['price'].strip() else 0,
            'imageUrl': row['imageUrl'].strip(),
            'category': row['category'].strip(),
            'recipients': recipients,
            'occasions': occasions,
            'budgetRange': row['budgetRange'].strip(),
            'affiliateLinks': affiliate_links,
            'tags': tags,
            'priority': int(row['priority']) if row['priority'].strip() else 0,
            'isPublished': row['isPublished'].strip().upper() == 'TRUE',
            'createdAt': datetime.now().isoformat() + 'Z',
            'updatedAt': datetime.now().isoformat() + 'Z'
        }

        products.append(product)

# products.jsonのフォーマットで出力
output = {
    'version': '1.0.0',
    'lastUpdated': datetime.now().isoformat() + 'Z',
    'products': products
}

output_path = os.path.join(script_dir, '../src/data/products.json')
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print(f'✅ products.jsonを更新しました: {output_path}')
print(f'📊 商品数: {len(products)}件')
