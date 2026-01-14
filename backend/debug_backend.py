from services.course_generator import build_course
import os

print("--- DEBUGGING BACKEND ---")
print(f"YOUTUBE_API_KEY present: {bool(os.getenv('YOUTUBE_API_KEY'))}")
print(f"GEMINI_API_KEY present: {bool(os.getenv('GEMINI_API_KEY'))}")

try:
    print("Attempting to build course for 'python'...")
    result = build_course("python", "Beginner")
    if "error" in result:
        print(f"ERROR: {result['error']}")
    else:
        print("SUCCESS! Generated modules:")
        for mod in result['modules']:
            print(f"- {mod['module_title']}")
except Exception as e:
    print(f"CRITICAL EXCEPTION: {e}")
    import traceback
    traceback.print_exc()
