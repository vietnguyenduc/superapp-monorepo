import sys
import traceback

sys.path.append('c:\\Vibecoding\\superapp-monorepo\\super-scraper')
from agent.rag_engine import RAGEngine

try:
    engine = RAGEngine()
    res = engine.ask("test")
    print(res)
except Exception as e:
    traceback.print_exc()
