"""Shared fixtures for ui_server tests."""
import sys
import os
import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


@pytest.fixture
def sample_preview_result():
    """Sample preview result from fetch_proposed_schema."""
    return {
        'title': 'Example Domain',
        'links_count': 42,
        'images_count': 5,
        'headlines': ['Example Domain Headline'],
        'potential_rows': 10,
        'proposed_schema': {
            'type': 'object',
            'properties': {
                'title': {'type': 'string'},
                'url': {'type': 'string'}
            }
        },
        'base_schema': {
            'type': 'object',
            'properties': {}
        }
    }


@pytest.fixture
def sample_task_id():
    """Sample task ID for crawl tests."""
    return 'test-task-001'


@pytest.fixture
def mock_crawl_task():
    """Mock crawl task dictionary."""
    return {
        'id': 'test-task-001',
        'url': 'https://example.com',
        'status': 'running',
        'progress': 0,
        'done': False,
        'error': None,
        'result': None,
        'steps': [
            {'key': 'connect', 'label': 'Connecting', 'status': 'pending'},
            {'key': 'fetch', 'label': 'Fetching', 'status': 'pending'},
            {'key': 'parse', 'label': 'Parsing', 'status': 'pending'},
            {'key': 'ai', 'label': 'AI Analysis', 'status': 'pending'},
            {'key': 'save', 'label': 'Saving', 'status': 'pending'},
        ]
    }
