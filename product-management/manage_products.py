#!/usr/bin/env python3
"""
商品管理CLI - ローカルでCSVベースの商品管理を行うツール

使い方:
  python3 manage_products.py add-url <URL>        # URLから商品を追加
  python3 manage_products.py list                 # 商品一覧を表示
  python3 manage_products.py push                 # GitHubにプッシュ
  python3 manage_products.py open                 # CSVをデフォルトアプリで開く
"""

import csv
import json
import subprocess
import sys
import os
import re
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any
import urllib.request
from html.parser import HTMLParser

# パス設定
BASE_DIR = Path(__file__).parent.parent
CSV_PATH = BASE_DIR / "data" / "products.csv"
JSON_PATH = BASE_DIR / "src" / "data" / "products.json"


class ProductHTMLParser(HTMLParser):
    """商品ページのHTMLから情報を抽出"""

    def __init__(self):
        super().__init__()
        self.title = None
        self.price = None
        self.in_title = False

    def handle_starttag(self, tag, attrs):
        if tag == 'title':
            self.in_title = True
        # 価格情報の抽出（一般的なパターン）
        for attr, value in attrs:
            if attr == 'class' and 'price' in value.lower():
                self.in_title = True

    def handle_data(self, data):
        if self.in_title and self.title is None:
            self.title = data.strip()
        # 価格パターンを検索
        if not self.price:
            price_match = re.search(r'[¥￥]?\s*([0-9,]+)\s*円', data)
            if price_match:
                self.price = int(price_match.group(1).replace(',', ''))

    def handle_endtag(self, tag):
        if tag == 'title':
            self.in_title = False


def fetch_product_info(url: str) -> Dict[str, Any]:
    """URLから商品情報を取得"""
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as response:
            html = response.read().decode('utf-8', errors='ignore')

        parser = ProductHTMLParser()
        parser.feed(html)

        # タイトルをクリーンアップ
        title = parser.title or "商品名不明"
        title = re.sub(r'\s*[-|]\s*.*$', '', title)  # サイト名を削除
        title = title.strip()[:100]  # 100文字に制限

        return {
            'name': title,
            'price': parser.price or 0,
            'url': url
        }
    except Exception as e:
        print(f"⚠️  商品情報の取得に失敗: {e}")
        return {'name': '', 'price': 0, 'url': url}


def judge_category(name: str, price: int) -> Dict[str, Any]:
    """商品名と価格からカテゴリなどをAI判定"""
    name_lower = name.lower()

    # カテゴリ判定
    if any(kw in name_lower for kw in ['化粧', 'コスメ', 'クリーム', '香水', 'アロマ', '入浴']):
        category = 'コスメ'
    elif any(kw in name_lower for kw in ['チョコ', 'スイーツ', 'お菓子', '酒', 'ワイン']):
        category = 'グルメ'
    elif any(kw in name_lower for kw in ['時計', 'イヤホン', 'スマート', 'ガジェット']):
        category = 'ガジェット'
    elif any(kw in name_lower for kw in ['花', 'フラワー', '植物']):
        category = '花・植物'
    elif any(kw in name_lower for kw in ['財布', 'ネクタイ', 'バッグ']):
        category = 'ファッション'
    elif any(kw in name_lower for kw in ['インテリア', '家具']):
        category = 'インテリア'
    elif any(kw in name_lower for kw in ['ディナー', '体験']):
        category = '体験'
    else:
        category = '雑貨'

    # 予算帯
    if price < 3000:
        budget = '〜3,000円'
    elif price < 5000:
        budget = '3,000〜5,000円'
    elif price < 10000:
        budget = '5,000〜10,000円'
    elif price < 20000:
        budget = '10,000〜20,000円'
    elif price < 30000:
        budget = '20,000〜30,000円'
    else:
        budget = '30,000円〜'

    # 贈る相手
    if category in ['コスメ', '花・植物']:
        recipients = '彼女,妻,母,友人女性'
    elif category in ['ガジェット', 'ファッション']:
        recipients = '彼氏,夫,父,上司,友人男性'
    else:
        recipients = '彼女,彼氏,夫,妻,友人女性,友人男性'

    # シーン
    if price >= 5000:
        occasions = '誕生日,クリスマス,記念日'
    else:
        occasions = '誕生日,お礼'

    if category == 'コスメ':
        occasions += ',母の日,ホワイトデー'
    elif category == 'グルメ':
        occasions += ',お中元,お歳暮'

    # タグ
    tags = [category]
    if price < 5000:
        tags.append('プチギフト')
    if price >= 10000:
        tags.append('高級')

    # 優先度
    priority = 80
    if price >= 10000:
        priority += 5
    if category in ['コスメ', 'ガジェット']:
        priority += 5

    return {
        'category': category,
        'recipients': recipients,
        'occasions': occasions,
        'budgetRange': budget,
        'tags': ','.join(tags),
        'priority': priority
    }


def get_next_product_id() -> str:
    """次の商品IDを生成"""
    if not CSV_PATH.exists():
        return 'prod_001'

    with open(CSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        ids = [row['id'] for row in reader if row['id'].startswith('prod_')]

    if not ids:
        return 'prod_001'

    max_num = max([int(id.replace('prod_', '')) for id in ids if id.replace('prod_', '').isdigit()])
    return f'prod_{max_num + 1:03d}'


def add_product_from_url(url: str):
    """URLから商品を追加"""
    print(f"🔍 商品情報を取得中: {url}")

    # 商品情報を取得
    info = fetch_product_info(url)
    if not info['name']:
        print("❌ 商品情報を取得できませんでした")
        return

    print(f"✅ 商品名: {info['name']}")
    print(f"✅ 価格: ¥{info['price']:,}")

    # AI判定
    judgment = judge_category(info['name'], info['price'])
    print(f"🤖 カテゴリ: {judgment['category']}")
    print(f"🤖 予算帯: {judgment['budgetRange']}")

    # 新しい商品データ
    product_id = get_next_product_id()
    timestamp = datetime.now().isoformat()

    # Amazon/楽天URLの判定
    amazon_url = url if 'amazon.co.jp' in url else ''
    rakuten_url = url if 'rakuten.co.jp' in url else ''

    new_product = {
        'id': product_id,
        'name': info['name'],
        'description': info['name'],  # 簡易版
        'price': info['price'],
        'imageUrl': '/images/products/default.jpg',
        'category': judgment['category'],
        'recipients': judgment['recipients'],
        'occasions': judgment['occasions'],
        'budgetRange': judgment['budgetRange'],
        'amazonUrl': amazon_url,
        'rakutenUrl': rakuten_url,
        'tags': judgment['tags'],
        'priority': judgment['priority'],
        'isPublished': 'TRUE',
        'productUrl': url
    }

    # CSVに追加
    fieldnames = list(new_product.keys())
    file_exists = CSV_PATH.exists()

    with open(CSV_PATH, 'a', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        if not file_exists:
            writer.writeheader()
        writer.writerow(new_product)

    print(f"✅ 商品を追加しました: {product_id}")
    print(f"\n💡 次のステップ:")
    print(f"   1. python3 manage_products.py open  # CSVを開いて内容を確認・編集")
    print(f"   2. python3 manage_products.py push  # GitHubにプッシュ")


def list_products():
    """商品一覧を表示"""
    if not CSV_PATH.exists():
        print("商品データがありません")
        return

    with open(CSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        products = list(reader)

    print(f"\n📦 商品一覧 ({len(products)}件)\n")
    for p in products:
        print(f"{p['id']}: {p['name'][:50]} - ¥{p['price']} ({p['category']})")


def csv_to_json():
    """CSVをJSON形式に変換"""
    if not CSV_PATH.exists():
        print("❌ CSVファイルが見つかりません")
        return False

    with open(CSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        products = []

        for row in reader:
            # データ型変換
            product = {
                'id': row['id'],
                'name': row['name'],
                'description': row['description'],
                'price': int(row['price']) if row['price'] else 0,
                'imageUrl': row['imageUrl'],
                'category': row['category'],
                'recipients': [r.strip() for r in row['recipients'].split(',') if r.strip()],
                'occasions': [o.strip() for o in row['occasions'].split(',') if o.strip()],
                'budgetRange': row['budgetRange'],
                'affiliateLinks': [],
                'tags': [t.strip() for t in row['tags'].split(',') if t.strip()],
                'priority': int(row['priority']) if row['priority'] else 80,
                'isPublished': row['isPublished'] == 'TRUE',
                'createdAt': datetime.now().isoformat(),
                'updatedAt': datetime.now().isoformat()
            }

            # affiliateLinks配列を生成
            if row.get('amazonUrl'):
                product['affiliateLinks'].append({
                    'provider': 'amazon',
                    'url': row['amazonUrl']
                })
            if row.get('rakutenUrl'):
                product['affiliateLinks'].append({
                    'provider': 'rakuten',
                    'url': row['rakutenUrl']
                })

            products.append(product)

    # ProductsData形式でラップ
    products_data = {
        'version': '1.0.0',
        'lastUpdated': datetime.now().strftime('%Y-%m-%d'),
        'products': products
    }

    # JSONファイルに書き込み
    with open(JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(products_data, f, ensure_ascii=False, indent=2)

    print(f"✅ JSONファイルを生成しました: {JSON_PATH}")
    return True


def push_to_github():
    """GitHubにプッシュ"""
    print("🔄 JSONファイルを生成中...")
    if not csv_to_json():
        return

    print("\n📤 GitHubにプッシュ中...")

    os.chdir(BASE_DIR)

    # Git操作
    subprocess.run(['git', 'add', 'data/products.csv', 'src/data/products.json'])

    commit_msg = f"商品データを更新 - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\nローカル商品管理ツールから自動更新"
    subprocess.run(['git', 'commit', '-m', commit_msg])
    subprocess.run(['git', 'push', 'origin', 'main'])

    print("\n✅ GitHubへのプッシュが完了しました!")
    print("🚀 Vercelで自動デプロイされます")
    print("🔗 https://gift-diagnosis.vercel.app")


def open_csv():
    """CSVファイルをデフォルトアプリで開く"""
    if not CSV_PATH.exists():
        print("❌ CSVファイルが見つかりません")
        return

    if sys.platform == 'darwin':  # macOS
        subprocess.run(['open', str(CSV_PATH)])
    elif sys.platform == 'win32':  # Windows
        subprocess.run(['start', str(CSV_PATH)], shell=True)
    else:  # Linux
        subprocess.run(['xdg-open', str(CSV_PATH)])

    print(f"📝 CSVファイルを開きました: {CSV_PATH}")
    print("\n💡 編集後は以下を実行してください:")
    print("   python3 manage_products.py push")


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return

    command = sys.argv[1]

    if command == 'add-url':
        if len(sys.argv) < 3:
            print("使い方: python3 manage_products.py add-url <URL>")
            return
        add_product_from_url(sys.argv[2])

    elif command == 'list':
        list_products()

    elif command == 'push':
        push_to_github()

    elif command == 'open':
        open_csv()

    else:
        print(f"❌ 不明なコマンド: {command}")
        print(__doc__)


if __name__ == '__main__':
    main()
