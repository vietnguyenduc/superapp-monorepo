import os
import json
from flask import Flask, render_template

app = Flask(__name__)

INDEX_FILE = os.path.join(os.path.dirname(__file__), 'storage', 'summary_index.json')

@app.route('/')
def index():
    data = {}
    if os.path.exists(INDEX_FILE):
        with open(INDEX_FILE, 'r', encoding='utf-8') as f:
            try:
                data = json.load(f)
            except:
                pass
                
    # Flatten data for simple display
    feed = []
    for category, items in data.items():
        for item in items:
            item['category'] = category
            feed.append(item)
            
    # Sắp xếp mới nhất lên đầu
    feed.sort(key=lambda x: x.get('date', ''), reverse=True)
            
    return render_template('index.html', feed=feed)

if __name__ == '__main__':
    # Chạy trên port 5000, có thể public qua ngrok: ngrok http 5000
    app.run(host='0.0.0.0', port=5000, debug=True)
