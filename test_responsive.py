import time
from playwright.sync_api import sync_playwright

VIEWPORTS = [
    {"name": "large_desktop", "width": 1920, "height": 1080},
    {"name": "desktop", "width": 1440, "height": 900},
    {"name": "laptop", "width": 1280, "height": 800},
    {"name": "tablet_landscape", "width": 1024, "height": 768},
    {"name": "tablet_portrait", "width": 768, "height": 1024},
    {"name": "mobile", "width": 390, "height": 844},
    {"name": "small_mobile", "width": 360, "height": 800},
]

PAGES = [
    {"path": "/", "name": "home"},
    {"path": "/create", "name": "create"},
    {"path": "/notes", "name": "notes"},
    {"path": "/tutor", "name": "tutor"},
    {"path": "/workspace", "name": "workspace"},
    {"path": "/my-learning", "name": "my_learning"},
]

def run_tests():
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="msedge", headless=True)
        results = []

        for vp in VIEWPORTS:
            context = browser.new_context(viewport={"width": vp["width"], "height": vp["height"]})
            page = context.new_page()

            for pg in PAGES:
                url = f"http://127.0.0.1:5173{pg['path']}"
                try:
                    page.goto(url, wait_until="networkidle")
                    time.sleep(0.5)

                    # Check for horizontal overflow
                    has_h_scroll = page.evaluate("""() => {
                        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
                    }""")

                    # Check for visible content
                    title = page.title()

                    results.append({
                        "viewport": vp["name"],
                        "size": f"{vp['width']}x{vp['height']}",
                        "page": pg["name"],
                        "has_horizontal_overflow": has_h_scroll,
                        "status": "PASS" if not has_h_scroll else "FAIL_OVERFLOW"
                    })
                except Exception as e:
                    results.append({
                        "viewport": vp["name"],
                        "size": f"{vp['width']}x{vp['height']}",
                        "page": pg["name"],
                        "status": f"ERROR: {str(e)}"
                    })
            context.close()
        browser.close()

        # Print summary table
        print(f"{'VIEWPORT':<18} | {'SIZE':<11} | {'PAGE':<14} | {'OVERFLOW?':<10} | {'RESULT'}")
        print("-" * 65)
        all_passed = True
        for r in results:
            overflow_str = str(r.get("has_horizontal_overflow", False))
            res = r.get("status")
            if res != "PASS":
                all_passed = False
            print(f"{r['viewport']:<18} | {r['size']:<11} | {r['page']:<14} | {overflow_str:<10} | {res}")

        if all_passed:
            print("\n>>> ALL VIEWPORT AND RESPONSIVENESS TESTS PASSED! ZERO OVERFLOW! <<<")
        else:
            print("\n>>> SOME TESTS DETECTED ISSUES TO RESOLVE <<<")

if __name__ == "__main__":
    run_tests()
