"""Unit tests for ui_server.py endpoints."""
import sys
import os
import json
import pytest
from unittest.mock import patch, MagicMock

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


@pytest.fixture
def app():
    """Create Flask test client."""
    from ui_server import app as flask_app
    flask_app.config['TESTING'] = True
    with flask_app.test_client() as client:
        yield client


class TestAPIEndpoints:
    """Test suite for API endpoints."""

    def test_index_returns_html(self, app):
        """GET / should return HTML."""
        resp = app.get('/')
        assert resp.status_code == 200
        assert resp.content_type.startswith('text/html')

    def test_preview_missing_url(self, app):
        """POST /api/preview without URL should return 400."""
        resp = app.post('/api/preview', json={})
        assert resp.status_code == 400
        data = json.loads(resp.data)
        assert 'error' in data

    def test_preview_empty_url(self, app):
        """POST /api/preview with empty URL should return 400."""
        resp = app.post('/api/preview', json={'url': ''})
        assert resp.status_code == 400
        data = json.loads(resp.data)
        assert 'error' in data

    @patch('ecosystem_bridge.fetch_proposed_schema')
    def test_preview_valid_url(self, mock_fetch, app, sample_preview_result):
        """POST /api/preview with valid URL should return preview data."""
        mock_fetch.return_value = sample_preview_result
        resp = app.post('/api/preview', json={'url': 'https://example.com'})
        assert resp.status_code == 200
        data = json.loads(resp.data)
        assert data['title'] == 'Example Domain'
        assert 'links_count' in data
        assert 'headlines' in data

    @patch('ecosystem_bridge.fetch_proposed_schema')
    def test_preview_handles_exception(self, mock_fetch, app):
        """POST /api/preview should handle exceptions gracefully."""
        mock_fetch.side_effect = Exception("Connection failed")
        resp = app.post('/api/preview', json={'url': 'https://example.com'})
        assert resp.status_code == 500
        data = json.loads(resp.data)
        assert 'error' in data

    def test_crawl_missing_url(self, app):
        """POST /crawl without URL should return 400."""
        resp = app.post('/crawl', json={})
        assert resp.status_code == 400
        data = json.loads(resp.data)
        assert 'error' in data

    def test_crawl_empty_url(self, app):
        """POST /crawl with empty URL should return 400."""
        resp = app.post('/crawl', json={'url': ''})
        assert resp.status_code == 400
        data = json.loads(resp.data)
        assert 'error' in data

    def test_crawl_valid_request(self, app):
        """POST /crawl with valid URL should return task_id."""
        resp = app.post('/crawl', json={'url': 'https://example.com'})
        assert resp.status_code == 200
        data = json.loads(resp.data)
        assert 'id' in data
        assert 'task_id' in data
        assert data['status'] == 'started'

    def test_crawl_supports_form_data(self, app):
        """POST /crawl should support form-data as well as JSON."""
        resp = app.post('/crawl', data={'url': 'https://example.com'})
        assert resp.status_code == 200
        data = json.loads(resp.data)
        assert 'task_id' in data

    def test_crawl_with_intent(self, app):
        """POST /crawl with user intent should work."""
        resp = app.post('/crawl', json={
            'url': 'https://example.com',
            'intent': 'Get product prices'
        })
        assert resp.status_code == 200
        data = json.loads(resp.data)
        assert 'task_id' in data

    def test_crawl_status_not_found(self, app):
        """GET /crawl/status/<id> for non-existent task should return done with error."""
        resp = app.get('/crawl/status/nonexistent')
        assert resp.status_code == 200
        data = json.loads(resp.data)
        assert data['done'] is True
        assert 'error' in data

    def test_crawl_status_valid(self, app, sample_task_id, mock_crawl_task):
        """GET /crawl/status/<id> for existing task should return status."""
        # Inject a mock task
        import ui_server
        ui_server._crawl_tasks[sample_task_id] = mock_crawl_task
        
        resp = app.get(f'/crawl/status/{sample_task_id}')
        assert resp.status_code == 200
        data = json.loads(resp.data)
        assert data['status'] == 'running'
        assert data['progress'] == 0

    def test_crawl_stream_returns_sse(self, app, sample_task_id, mock_crawl_task):
        """GET /crawl/stream/<id> should return SSE events."""
        import ui_server
        mock_task = dict(mock_crawl_task)
        mock_task['done'] = True  # Make it complete immediately
        ui_server._crawl_tasks[sample_task_id] = mock_task
        
        resp = app.get(f'/crawl/stream/{sample_task_id}')
        assert resp.status_code == 200
        assert resp.content_type.startswith('text/event-stream')
        data = resp.data.decode('utf-8')
        assert 'data:' in data

    def test_stats_endpoint(self, app):
        """GET /api/stats should return storage statistics."""
        resp = app.get('/api/stats')
        assert resp.status_code == 200
        data = json.loads(resp.data)
        assert 'total_items' in data
        assert 'categories' in data

    def test_purge_endpoint(self, app):
        """POST /purge should return success."""
        resp = app.post('/purge')
        assert resp.status_code == 200
        data = json.loads(resp.data)
        assert data['status'] == 'success'

    def test_ask_missing_question(self, app):
        """POST /ask without question should return 400."""
        resp = app.post('/ask', data={})
        assert resp.status_code == 400
        data = json.loads(resp.data)
        assert 'error' in data

    def test_scavenger_trigger_missing_topic(self, app):
        """POST /scavenger_trigger without topic should return 400."""
        resp = app.post('/scavenger_trigger', json={})
        assert resp.status_code == 400
        data = json.loads(resp.data)
        assert 'error' in data

    def test_scavenger_trigger_valid(self, app):
        """POST /scavenger_trigger with topic should return task_id."""
        resp = app.post('/scavenger_trigger', json={'topic': 'AI news'})
        assert resp.status_code == 200
        data = json.loads(resp.data)
        assert 'task_id' in data

    def test_delete_item_missing_path(self, app):
        """POST /api/item/delete without path should return 400."""
        resp = app.post('/api/item/delete', json={})
        assert resp.status_code == 400
        data = json.loads(resp.data)
        assert 'error' in data

    def test_delete_items_missing_body(self, app):
        """POST /api/items/delete without body should return 400."""
        resp = app.post('/api/items/delete', json={})
        assert resp.status_code == 400
        data = json.loads(resp.data)
        assert 'error' in data

    def test_delete_all_items(self, app):
        """POST /api/items/delete with all=true should work."""
        resp = app.post('/api/items/delete', json={'all': True})
        assert resp.status_code == 200
        data = json.loads(resp.data)
        assert data['status'] == 'success'

    def test_normalize_path(self):
        """Test normalize_path helper function."""
        from ui_server import normalize_path
        
        # Test None
        assert normalize_path(None) is None
        
        # Test empty string
        assert normalize_path('') is None
        
        # Test basic path
        result = normalize_path('/tmp/test')
        assert result is not None
        assert 'test' in result

    def test_deduplicate_index(self):
        """Test deduplicate_index helper function."""
        from ui_server import deduplicate_index, save_index, load_index
        
        # Test with empty index
        result = deduplicate_index({})
        assert result == {}

    def test_flatten_feed(self):
        """Test flatten_feed helper function."""
        from ui_server import flatten_feed
        
        data = {
            'News': [
                {'title': 'Article 1', 'date': '2024-01-02'},
                {'title': 'Article 2', 'date': '2024-01-01'}
            ],
            'Blog': [
                {'title': 'Blog Post', 'date': '2024-01-03'}
            ]
        }
        
        result = flatten_feed(data)
        assert len(result) == 3
        # Should be sorted by date descending
        assert result[0]['title'] == 'Blog Post'
        assert result[1]['title'] == 'Article 1'
        # Each item should have category
        assert result[0]['category'] == 'Blog'
        assert result[1]['category'] == 'News'
