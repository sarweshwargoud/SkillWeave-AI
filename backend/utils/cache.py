import time
from functools import wraps
import hashlib
import json

# Simple In-Memory Cache with TTL
# Structure: {key: {value: ..., expiry: timestamp}}
_CACHE = {}
DEFAULT_TTL = 3600  # 1 hour

def get_cache_key(*args, **kwargs):
    """
    Generates a consistent hash key for the cache based on arguments.
    """
    key_str = json.dumps({"args": args, "kwargs": kwargs}, sort_keys=True, default=str)
    return hashlib.md5(key_str.encode()).hexdigest()

def cache_with_ttl(ttl_seconds: int = DEFAULT_TTL):
    """
    Decorator to cache function results.
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            key = f"{func.__module__}:{func.__name__}:{get_cache_key(*args, **kwargs)}"
            
            # Check cache
            if key in _CACHE:
                item = _CACHE[key]
                if time.time() < item["expiry"]:
                    print(f"[{func.__name__}] Serving from cache")
                    return item["value"]
                else:
                    # Expired
                    del _CACHE[key]
            
            # Execute
            result = func(*args, **kwargs)
            
            # Save
            _CACHE[key] = {
                "value": result,
                "expiry": time.time() + ttl_seconds
            }
            return result
        return wrapper
    return decorator

def clear_cache():
    _CACHE.clear()
