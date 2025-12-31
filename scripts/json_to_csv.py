#!/usr/bin/env python3
import json
import csv
import os

# products.jsonを読み込み
script_dir = os.path.dirname(os.path.abspath(__file__))
products_path = os.path.join(script_dir, '../src/data/products.json')

with open(products_path, 'r', encoding='utf-8') as f:
    products_data = json.load(f)

# CSVヘッダー
headers = [
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
]

# アフィリエイトリンクからURLを取得
def get_affiliate_url(links, provider):
    if not isinstance(links, list):
        return ''
    for link in links:
        if link.get('provider') == provider:
            return link.get('url', '')
    return ''

# 配列をカンマ区切り文字列に変換
def array_to_string(arr):
    if not isinstance(arr, list):
        return ''
    return ','.join(arr)

# CSVファイルを作成
output_path = os.path.join(script_dir, '../data/products.csv')
os.makedirs(os.path.dirname(output_path), exist_ok=True)

with open(output_path, 'w', encoding='utf-8', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(headers)

    for product in products_data['products']:
        row = [
            product.get('id', ''),
            product.get('name', ''),
            product.get('description', ''),
            product.get('price', ''),
            product.get('imageUrl', ''),
            product.get('category', ''),
            array_to_string(product.get('recipients', [])),
            array_to_string(product.get('occasions', [])),
            product.get('budgetRange', ''),
            get_affiliate_url(product.get('affiliateLinks', []), 'amazon'),
            get_affiliate_url(product.get('affiliateLinks', []), 'rakuten'),
            array_to_string(product.get('tags', [])),
            product.get('priority', ''),
            'TRUE' if product.get('isPublished') else 'FALSE'
        ]
        writer.writerow(row)

print(f'✅ CSVファイルを生成しました: {output_path}')
print(f'📊 商品数: {len(products_data["products"])}件')
