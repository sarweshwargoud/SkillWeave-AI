import time
from playwright.sync_api import sync_playwright

def take_screenshots():
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="msedge", headless=True)
        
        # Test 1: Desktop 1920x1080
        ctx_desktop = browser.new_context(viewport={"width": 1920, "height": 1080})
        page = ctx_desktop.new_page()
        page.goto("http://127.0.0.1:5173/", wait_until="networkidle")
        time.sleep(1.5)
        page.screenshot(path="screenshot_desktop_home.png", full_page=False)
        ctx_desktop.close()

        # Test 2: Mobile 390x844
        ctx_mobile = browser.new_context(viewport={"width": 390, "height": 844}, is_mobile=True)
        page = ctx_mobile.new_page()
        page.goto("http://127.0.0.1:5173/", wait_until="networkidle")
        time.sleep(1.5)
        page.screenshot(path="screenshot_mobile_home.png", full_page=False)
        
        # Test mobile drawer menu click
        page.click(".mobile-hamburger-btn")
        time.sleep(0.5)
        page.screenshot(path="screenshot_mobile_menu.png", full_page=False)
        ctx_mobile.close()

        browser.close()
        print("Screenshots captured successfully!")

if __name__ == "__main__":
    take_screenshots()
