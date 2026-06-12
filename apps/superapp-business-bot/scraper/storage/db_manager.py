import sqlite3
import os
from datetime import datetime

class DBManager:
    def __init__(self):
        self.db_path = os.path.join(os.path.dirname(__file__), 'hashes.db')
        self._init_db()

    def _init_db(self):
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS image_hashes (
                hash_value TEXT PRIMARY KEY,
                file_path TEXT NOT NULL,
                timestamp TEXT NOT NULL
            )
        ''')
        conn.commit()
        conn.close()

    def hash_exists(self, hash_value: str) -> bool:
        """Kiểm tra xem mã băm này đã tồn tại trong DB hay chưa"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('SELECT 1 FROM image_hashes WHERE hash_value = ?', (hash_value,))
        exists = cursor.fetchone() is not None
        conn.close()
        return exists

    def save_hash(self, hash_value: str, file_path: str):
        """Lưu mã băm và đường dẫn file vào CSDL"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        now = datetime.now().isoformat()
        try:
            cursor.execute('''
                INSERT INTO image_hashes (hash_value, file_path, timestamp)
                VALUES (?, ?, ?)
            ''', (hash_value, file_path, now))
            conn.commit()
        except sqlite3.IntegrityError:
            pass # Đã tồn tại
        finally:
            conn.close()

    def count_hashes(self):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('SELECT COUNT(*) FROM image_hashes')
        count = cursor.fetchone()[0]
        conn.close()
        return count
