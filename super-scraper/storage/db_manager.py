import sqlite3
import os
import json
import uuid
from datetime import datetime

class DBManager:
    def __init__(self, db_path=None):
        if db_path is None:
            self.db_path = os.path.join(os.path.dirname(__file__), 'vault.db')
        else:
            self.db_path = db_path
        self._init_db()

    def _init_db(self):
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Documents table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS documents (
            id TEXT PRIMARY KEY,
            source_url TEXT,
            topic_tags TEXT,
            json_path TEXT,
            confidence REAL,
            created_at TEXT
        )
        ''')
        
        # Images table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS images (
            id TEXT PRIMARY KEY,
            hash TEXT UNIQUE,
            file_path TEXT,
            source_url TEXT,
            created_at TEXT
        )
        ''')
        
        # Junction table for multimodal mapping
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS document_images (
            document_id TEXT,
            image_id TEXT,
            FOREIGN KEY(document_id) REFERENCES documents(id) ON DELETE CASCADE,
            FOREIGN KEY(image_id) REFERENCES images(id) ON DELETE CASCADE,
            PRIMARY KEY (document_id, image_id)
        )
        ''')
        
        conn.commit()
        conn.close()

    def add_document(self, doc_id: str, source_url: str, topic_tags: list, json_path: str, confidence: float):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('''
        INSERT OR REPLACE INTO documents (id, source_url, topic_tags, json_path, confidence, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ''', (doc_id, source_url, json.dumps(topic_tags, ensure_ascii=False), json_path, confidence, datetime.now().isoformat()))
        conn.commit()
        conn.close()

    def add_image(self, hash_val: str, file_path: str, source_url: str) -> str:
        """Returns the ID of the image (new or existing)."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('SELECT id FROM images WHERE hash = ?', (hash_val,))
        row = cursor.fetchone()
        
        if row:
            img_id = row[0]
        else:
            img_id = str(uuid.uuid4())
            cursor.execute('''
            INSERT INTO images (id, hash, file_path, source_url, created_at)
            VALUES (?, ?, ?, ?, ?)
            ''', (img_id, hash_val, file_path, source_url, datetime.now().isoformat()))
            conn.commit()
            
        conn.close()
        return img_id

    def link_image_to_document(self, doc_id: str, image_id: str):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('''
        INSERT OR IGNORE INTO document_images (document_id, image_id)
        VALUES (?, ?)
        ''', (doc_id, image_id))
        conn.commit()
        conn.close()

    def get_images_for_topic(self, topic: str):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        # Find documents that have this topic tag
        cursor.execute('''
        SELECT d.id, d.topic_tags, i.file_path, i.source_url
        FROM documents d
        JOIN document_images di ON d.id = di.document_id
        JOIN images i ON di.image_id = i.id
        WHERE d.topic_tags LIKE ?
        ''', (f'%{topic}%',))
        
        results = cursor.fetchall()
        conn.close()
        return results

    def purge_data(self):
        """Purge all data from DB and return list of file paths to delete"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('SELECT file_path FROM images')
        images = [row[0] for row in cursor.fetchall()]
        
        cursor.execute('SELECT json_path FROM documents')
        docs = [row[0] for row in cursor.fetchall()]
        
        cursor.execute('DELETE FROM document_images')
        cursor.execute('DELETE FROM images')
        cursor.execute('DELETE FROM documents')
        
        conn.commit()
        conn.close()
        
        return {"images": images, "docs": docs}
