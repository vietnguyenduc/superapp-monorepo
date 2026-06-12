from playwright.sync_api import sync_playwright
import time
import logging

logger = logging.getLogger("ATA.browser")

def _run_browser_action(url: str, action_func, headless=True):
    """Helper to run a browser action."""
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=headless, args=['--no-sandbox', '--disable-setuid-sandbox'])
            context = browser.new_context()
            page = context.new_page()
            
            # Collect console messages
            console_msgs = []
            page.on("console", lambda msg: console_msgs.append(f"[{msg.type}] {msg.text}"))
            page.on("pageerror", lambda err: console_msgs.append(f"[error] {err}"))
            
            try:
                page.goto(url, wait_until="networkidle", timeout=15000)
            except Exception as e:
                logger.warning(f"Timeout or error navigating to {url}: {e}")
                
            result = action_func(page)
            browser.close()
            
            return {
                "result": result,
                "console": console_msgs
            }
    except Exception as e:
        return f"Browser Error: {e}"

def read_browser_page(args: dict) -> str:
    url = args.get("url")
    delay = args.get("delay", 1000)
    
    if not url:
        return "Error: 'url' is required."
        
    def action(page):
        page.wait_for_timeout(delay)
        return page.evaluate("() => document.body.innerText")
        
    res = _run_browser_action(url, action)
    if isinstance(res, str):
        return res
        
    text = res["result"]
    console = "\n".join(res["console"])
    out = f"--- Content of {url} ---\n{text[:5000]}"
    if console:
        out += f"\n\n--- Console Logs ---\n{console}"
    return out

def click_element(args: dict) -> str:
    url = args.get("url")
    selector = args.get("selector")
    delay = args.get("delay", 1000)
    
    if not url or not selector:
        return "Error: 'url' and 'selector' are required."
        
    def action(page):
        page.wait_for_timeout(delay)
        page.click(selector)
        page.wait_for_timeout(delay) # Wait for UI to update
        return page.evaluate("() => document.body.innerText")
        
    res = _run_browser_action(url, action)
    if isinstance(res, str):
        return res
        
    text = res["result"]
    console = "\n".join(res["console"])
    out = f"--- Content after clicking '{selector}' ---\n{text[:5000]}"
    if console:
        out += f"\n\n--- Console Logs ---\n{console}"
    return out

def take_screenshot(args: dict) -> str:
    url = args.get("url")
    save_path = args.get("save_path", "screenshot.png")
    delay = args.get("delay", 1000)
    
    if not url:
        return "Error: 'url' is required."
        
    def action(page):
        page.wait_for_timeout(delay)
        page.screenshot(path=save_path)
        return f"Screenshot saved to {save_path}"
        
    res = _run_browser_action(url, action)
    if isinstance(res, str):
        return res
        
    return res["result"]
