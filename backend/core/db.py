import json
import requests
from typing import Optional, List, Dict, Any
from core.config import settings
from core.encryption import encrypt_data, decrypt_data

def _supabase_headers(user_token: Optional[str] = None) -> Dict[str, str]:
    """
    Returns standard Supabase headers.
    If user_token is provided, PostgREST executes under that user's identity (RLS enforced).
    Otherwise uses service_role key with server-side ownership filters.
    """
    auth = f"Bearer {user_token}" if user_token else f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_SECRET_KEY}"
    return {
        "apikey": settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_SECRET_KEY,
        "Authorization": auth,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }

# ----------------- WORKSPACE SETTINGS -----------------

def get_workspace_settings(user_id: str) -> Dict[str, Any]:
    url = f"{settings.SUPABASE_URL}/rest/v1/workspace_settings?user_id=eq.{user_id}&select=*"
    resp = requests.get(url, headers=_supabase_headers(), timeout=5)
    if resp.status_code == 200 and resp.json():
        return resp.json()[0]
    return {
        "user_id": user_id,
        "theme": "dark",
        "sidebar_width": 280,
        "ai_panel_width": 360,
        "terminal_height": 220,
        "sidebar_collapsed": False,
        "ai_panel_collapsed": False,
        "terminal_collapsed": False,
        "active_tab": "video",
        "open_tabs": [],
        "active_sidebar_view": "explorer"
    }

def update_workspace_settings(user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    payload = {
        "user_id": user_id,
        "theme": data.get("theme", "dark"),
        "sidebar_width": int(data.get("sidebar_width", 280)),
        "ai_panel_width": int(data.get("ai_panel_width", 360)),
        "terminal_height": int(data.get("terminal_height", 220)),
        "sidebar_collapsed": bool(data.get("sidebar_collapsed", False)),
        "ai_panel_collapsed": bool(data.get("ai_panel_collapsed", False)),
        "terminal_collapsed": bool(data.get("terminal_collapsed", False)),
        "active_tab": data.get("active_tab", "video"),
        "open_tabs": data.get("open_tabs", []),
        "active_sidebar_view": data.get("active_sidebar_view", "explorer"),
        "updated_at": "now()"
    }
    url = f"{settings.SUPABASE_URL}/rest/v1/workspace_settings"
    headers = _supabase_headers()
    headers["Prefer"] = "resolution=merge-duplicates,return=representation"
    resp = requests.post(url, json=payload, headers=headers, timeout=5)
    if resp.status_code in [200, 201] and resp.json():
        return resp.json()[0]
    return payload

# ----------------- COURSES (USER SCOPED) -----------------

def get_courses_for_user(user_id: str, course_id: Optional[str] = None) -> List[Dict[str, Any]]:
    query = f"user_id=eq.{user_id}"
    if course_id:
        query += f"&id=eq.{course_id}"
    url = f"{settings.SUPABASE_URL}/rest/v1/courses?{query}&order=created_at.desc&select=*"
    resp = requests.get(url, headers=_supabase_headers(), timeout=5)
    if resp.status_code == 200:
        return resp.json()
    return []

def save_course_for_user(user_id: str, course_data: Dict[str, Any]) -> Dict[str, Any]:
    payload = {
        "id": course_data.get("id"),
        "user_id": user_id, # STRICT: Force ownership to authenticated user
        "title": course_data.get("title", "Untitled Course"),
        "description": course_data.get("description", ""),
        "thumbnail": course_data.get("thumbnail", ""),
        "total_videos": course_data.get("total_videos", 1),
        "total_duration": course_data.get("total_duration", "30m"),
        "progress": course_data.get("progress", 0),
        "status": course_data.get("status", "In Progress"),
        "modules": course_data.get("modules", []),
        "channel": course_data.get("channel", "YouTube Academy"),
        "roadmap": course_data.get("roadmap", {})
    }
    url = f"{settings.SUPABASE_URL}/rest/v1/courses"
    headers = _supabase_headers()
    headers["Prefer"] = "resolution=merge-duplicates,return=representation"
    resp = requests.post(url, json=payload, headers=headers, timeout=5)
    if resp.status_code in [200, 201] and resp.json():
        return resp.json()[0]
    return payload

def delete_course_for_user(user_id: str, course_id: str) -> bool:
    url = f"{settings.SUPABASE_URL}/rest/v1/courses?id=eq.{course_id}&user_id=eq.{user_id}"
    resp = requests.delete(url, headers=_supabase_headers(), timeout=5)
    return resp.status_code in [200, 204]

# ----------------- PROJECTS (USER SCOPED) -----------------

def get_projects_for_user(user_id: str, project_id: Optional[str] = None) -> List[Dict[str, Any]]:
    query = f"user_id=eq.{user_id}"
    if project_id:
        query += f"&id=eq.{project_id}"
    url = f"{settings.SUPABASE_URL}/rest/v1/projects?{query}&order=created_at.desc&select=*"
    resp = requests.get(url, headers=_supabase_headers(), timeout=5)
    if resp.status_code == 200:
        return resp.json()
    return []

def save_project_for_user(user_id: str, project_data: Dict[str, Any]) -> Dict[str, Any]:
    payload = {
        "user_id": user_id, # STRICT: Force ownership
        "title": project_data.get("title", "Custom Project"),
        "description": project_data.get("description", ""),
        "level": project_data.get("level", "Beginner"),
        "accent": project_data.get("accent", "Any"),
        "status": project_data.get("status", "In Progress"),
        "progress": project_data.get("progress", 0),
        "roadmap_data": project_data.get("roadmap_data"),
        "custom_tasks": project_data.get("custom_tasks", [])
    }
    if project_data.get("id"):
        payload["id"] = project_data["id"]
        
    url = f"{settings.SUPABASE_URL}/rest/v1/projects"
    headers = _supabase_headers()
    headers["Prefer"] = "resolution=merge-duplicates,return=representation"
    resp = requests.post(url, json=payload, headers=headers, timeout=5)
    if resp.status_code in [200, 201] and resp.json():
        return resp.json()[0]
    return payload

def delete_project_for_user(user_id: str, project_id: str) -> bool:
    url = f"{settings.SUPABASE_URL}/rest/v1/projects?id=eq.{project_id}&user_id=eq.{user_id}"
    resp = requests.delete(url, headers=_supabase_headers(), timeout=5)
    return resp.status_code in [200, 204]

# ----------------- NOTES (USER SCOPED + ENCRYPTION AT REST) -----------------

def get_notes_for_user(user_id: str, note_id: Optional[str] = None) -> List[Dict[str, Any]]:
    query = f"user_id=eq.{user_id}"
    if note_id:
        query += f"&id=eq.{note_id}"
    url = f"{settings.SUPABASE_URL}/rest/v1/notes?{query}&order=created_at.desc&select=*"
    resp = requests.get(url, headers=_supabase_headers(), timeout=5)
    if resp.status_code == 200:
        rows = resp.json()
        for r in rows:
            # If server-encrypted, decrypt before returning to authenticated owner
            if r.get("is_encrypted") and isinstance(r.get("notes_data"), dict) and "ciphertext" in r.get("notes_data", {}):
                try:
                    r["notes_data"] = decrypt_data(r["notes_data"])
                except Exception:
                    r["notes_data"] = {"error": "Decryption failed or invalid key"}
        return rows
    return []

def save_note_for_user(user_id: str, note_data: Dict[str, Any], encrypt_at_rest: bool = True) -> Dict[str, Any]:
    raw_content = note_data.get("notes_data", {})
    is_encrypted = False
    stored_data = raw_content
    
    # Check if client already provided E2EE ciphertext:
    if isinstance(raw_content, dict) and raw_content.get("e2ee") is True:
        is_encrypted = True
        stored_data = raw_content
    elif encrypt_at_rest:
        # Apply authenticated server-side AES-256-GCM envelope
        stored_data = encrypt_data(raw_content)
        is_encrypted = True

    payload = {
        "user_id": user_id, # STRICT: Force ownership
        "video_id": note_data.get("video_id", "general"),
        "title": note_data.get("title", "Study Notes"),
        "notes_data": stored_data,
        "is_encrypted": is_encrypted
    }
    if note_data.get("id"):
        payload["id"] = note_data["id"]

    url = f"{settings.SUPABASE_URL}/rest/v1/notes"
    headers = _supabase_headers()
    headers["Prefer"] = "resolution=merge-duplicates,return=representation"
    resp = requests.post(url, json=payload, headers=headers, timeout=5)
    if resp.status_code in [200, 201] and resp.json():
        result = resp.json()[0]
        # Return decrypted content to the caller
        result["notes_data"] = raw_content
        return result
    return payload

def delete_note_for_user(user_id: str, note_id: str) -> bool:
    url = f"{settings.SUPABASE_URL}/rest/v1/notes?id=eq.{note_id}&user_id=eq.{user_id}"
    resp = requests.delete(url, headers=_supabase_headers(), timeout=5)
    return resp.status_code in [200, 204]
