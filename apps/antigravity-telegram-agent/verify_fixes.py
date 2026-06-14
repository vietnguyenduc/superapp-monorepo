import sys
import os
from pathlib import Path
import json
import unittest
from unittest.mock import MagicMock, patch

# Force UTF-8 and load .env
if sys.platform.startswith('win'):
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

os.chdir(Path(__file__).parent)
from dotenv import load_dotenv
load_dotenv('.env')

class TestAntigravityFixes(unittest.TestCase):
    def test_get_user_by_email(self):
        from core.db import get_user_by_email, SUPABASE_URL, SUPABASE_KEY
        if not SUPABASE_URL or not SUPABASE_KEY:
            print("Supabase credentials not set, using Mock")
        
        with patch('requests.get') as mock_get:
            # Mock success response
            mock_res = MagicMock()
            mock_res.status_code = 200
            mock_res.json.return_value = [{"email": "test@example.com", "role": "admin"}]
            mock_get.return_value = mock_res
            
            user = get_user_by_email("test@example.com")
            self.assertIsNotNone(user)
            self.assertEqual(user["email"], "test@example.com")
            
            # Mock empty response
            mock_res.json.return_value = []
            user = get_user_by_email("notfound@example.com")
            self.assertIsNone(user)

    def test_scheduler_time_validation(self):
        from scheduler import setup_scheduler
        
        # Mock bot
        mock_bot = MagicMock()
        mock_callback = MagicMock()
        
        # Test invalid report_time_str fallback
        with patch('scheduler.BackgroundScheduler') as mock_sched_cls:
            mock_sched = MagicMock()
            mock_sched_cls.return_value = mock_sched
            
            # Should fall back to 18:00
            setup_scheduler(mock_bot, "12345", report_time_str="99:99", kaizen_time_str="25:00", kaizen_callback=mock_callback)
            
            # Inspect the hour/minute arguments in add_job
            # First job added: report time job
            # Second job added: kaizen time job
            calls = mock_sched.add_job.call_args_list
            report_job_kwargs = calls[0][1]
            kaizen_job_kwargs = calls[1][1]
            
            self.assertEqual(report_job_kwargs['hour'], 18)
            self.assertEqual(report_job_kwargs['minute'], 0)
            self.assertEqual(kaizen_job_kwargs['hour'], 2)
            self.assertEqual(kaizen_job_kwargs['minute'], 0)

    def test_ai_router_dynamic_fallback(self):
        from core.ai_router import _get_ordered_providers
        
        mock_registry = MagicMock()
        mock_registry.get_provider_by_name = lambda name: name
        
        with patch('core.settings.load_settings') as mock_load:
            mock_load.return_value = {"fallback_order": ["claude", "nvidia", "gemini"]}
            ordered = _get_ordered_providers(mock_registry, "medium")
            self.assertEqual(ordered, ["claude", "nvidia", "gemini"])

    def test_settings_sanitization(self):
        from main import process_settings_input
        
        mock_bot = MagicMock()
        mock_message = MagicMock()
        mock_message.text = "  /schedule 10 test_command  "
        
        with patch('main.bot', mock_bot), patch('core.settings.save_settings') as mock_save:
            process_settings_input(mock_message, "settings_edit_budget")
            
            # Should have replied with error/cancellation
            mock_bot.reply_to.assert_called_once()
            self.assertIn("hủy", mock_bot.reply_to.call_args[0][1].lower())
            # Should not have saved settings
            mock_save.assert_not_called()

if __name__ == "__main__":
    unittest.main()
