"""Pytest configuration and fixtures for Super Scraper tests."""
import sys
import os
import json
import pytest

# Add parent directory to path so we can import app modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


@pytest.fixture
def sample_url():
    """A sample URL for testing."""
    return "https://example.com"


@pytest.fixture
def sample_task_id():
    """A sample task ID for testing."""
    return "test-task-001"


@pytest.fixture
def mock_crawl_task():
    """A mock crawl task state."""
    return {
        'done': False,
        'error': None,
        'progress': 0,
        'step': 'connect',
        'status': 'active',
        'message': 'Starting...',
        'result': None,
        'analysis': None,
        'next_searches': [],
        'next_images': [],
        'preview': None
    }


@pytest.fixture
def sample_preview_result():
    """A sample preview result."""
    return {
        'title': 'Example Domain',
        'links_count': 1,
        'images_count': 0,
        'headlines': ['Example Domain'],
        'proposed_schema': {
            'title': 'string',
            'description': 'text'
        }
    }


@pytest.fixture
def sample_crawl_result():
    """A sample crawl result."""
    return {
        'title': 'Example Article',
        'description': 'This is a sample article description.',
        'inferred_categories': ['Technology'],
        'confidence_score': 0.85,
        'original_source_url': 'https://example.com/article'
    }
