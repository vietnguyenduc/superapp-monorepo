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

def run_visual_audit(urls: list = None, url: str = None, delay: int = 2000, auth_click_selector: str = None, **kwargs) -> str:
    # Support both 'url' and 'urls' for backward compatibility
    target_urls = urls if urls else ([url] if url else [])
    if not target_urls:
        return "Error: You must provide 'url' or 'urls' parameter (e.g., urls=['http://localhost:5175/'])."
        
    try:
        from core.provider_registry import get_registry
        from google.genai import types
        registry = get_registry()
        client = registry.gemini._get_client()
        if not client:
            return "Error: Gemini client not available for visual audit."
    except Exception as e:
        return f"Error initializing Gemini: {e}"

    images_parts = []
    console_msgs = []
    
    viewports = [
        {"name": "Mobile", "width": 375, "height": 812},
        {"name": "iPad", "width": 768, "height": 1024},
        {"name": "Desktop", "width": 1440, "height": 900}
    ]
    
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True, args=['--no-sandbox', '--disable-setuid-sandbox'])
            
            for vp in viewports:
                # Create ONE context per viewport to preserve LocalStorage/Auth across URLs
                context = browser.new_context(viewport={"width": vp["width"], "height": vp["height"]})
                page = context.new_page()
                page.on("console", lambda msg: console_msgs.append(f"[{vp['name']}][{msg.type}] {msg.text}"))
                page.on("pageerror", lambda err: console_msgs.append(f"[{vp['name']}][error] {err}"))
                
                for i, current_url in enumerate(target_urls):
                    try:
                        page.goto(current_url, wait_until="networkidle", timeout=15000)
                    except Exception as e:
                        logger.warning(f"Timeout on {vp['name']} for {current_url}: {e}")
                    
                    page.wait_for_timeout(delay)
                    
                    # If this is the first URL and we need to bypass login
                    if i == 0 and auth_click_selector:
                        try:
                            page.click(auth_click_selector, timeout=5000)
                            # Apps often take several seconds to fetch auth context and redirect
                            try:
                                page.wait_for_load_state("networkidle", timeout=15000)
                            except Exception:
                                pass # Network idle might timeout if there's polling, just continue
                            page.wait_for_timeout(5000) # Generous 5-second extra wait for React to mount Dashboard
                        except Exception as e:
                            logger.warning(f"Failed to click auth selector '{auth_click_selector}' on {vp['name']}: {e}")
                    img_viewport = page.screenshot(full_page=False)
                    images_parts.append(types.Part.from_bytes(data=img_viewport, mime_type="image/png"))
                    
                    # Capture Full Page (to see overall layout, gaps, footer)
                    try:
                        img_full = page.screenshot(full_page=True)
                        images_parts.append(types.Part.from_bytes(data=img_full, mime_type="image/png"))
                    except Exception as e:
                        logger.warning(f"Failed full_page screenshot on {vp['name']} for {current_url}: {e}")
                
                context.close()
            browser.close()
            
    except Exception as e:
        return f"Browser Automation Error: {e}"
        
    # Send to Gemini
    system_instruction = (
        "You are an elite QA Engineer and Senior UI/UX Designer. "
        "You are given pairs of screenshots (Viewport-only + Full-page) taken at 3 viewports (Mobile 375px, iPad 768px, Desktop 1440px) "
        "across one or multiple URLs. "
        "Your task is to conduct a rigorous visual audit with a strong focus on OVERALL LAYOUT and JOURNEY. "
        "1. Check the ENTIRE layout (gaps, empty spaces, footer positioning, content stretching). "
        "2. Check for functional overlaps (sticky elements, FABs, bottom tab bars overlapping main content or each other). "
        "3. Identify design blocks that look broken or squished on smaller viewports. "
        "4. Be very specific about line numbers or component names if you can infer them. "
        "Output a highly structured Markdown report. Do NOT hold back on criticism."
    )
    
    prompt = f"Please perform a complete Visual Audit for the following URLs:\n" + "\n".join(target_urls)
    
    config = types.GenerateContentConfig(
        system_instruction=system_instruction,
        temperature=0.1,
    )
    
    try:
        response = client.models.generate_content(
            model=registry.gemini.model,
            contents=[prompt] + images_parts,
            config=config
        )
        report = response.text
    except Exception as e:
        return f"Gemini Vision Error: {e}"
        
    out = f"--- Visual Audit Report ---\n{report}\n"
    if console_msgs:
        out += f"\n--- Console Logs ---\n" + "\n".join(console_msgs[:20]) # Limit console logs

        
    return out
