import time
from playwright.sync_api import sync_playwright

def test():
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="msedge", headless=True)
        ctx = browser.new_context(viewport={"width": 1440, "height": 900})
        page = ctx.new_page()

        # Test My Learning
        print("Visiting /my-learning...")
        page.goto("http://127.0.0.1:5173/my-learning", wait_until="networkidle")
        time.sleep(1)
        page.screenshot(path="screenshot_mylearning_fixed.png", full_page=False)

        # Test Profile (Google Learner)
        print("Visiting /profile...")
        page.goto("http://127.0.0.1:5173/profile", wait_until="networkidle")
        time.sleep(1)
        page.screenshot(path="screenshot_profile_google_learner.png", full_page=False)

        # Check content on My Learning
        content = page.content()
        print("Page title:", page.title())

        browser.close()
        print("Done!")

if __name__ == "__main__":
    test()
