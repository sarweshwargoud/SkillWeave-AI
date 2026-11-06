import pytest
import time
import jwt
from fastapi.testclient import TestClient
from main import app
from core.encryption import encrypt_data, decrypt_data
from core.config import settings

client = TestClient(app)

def test_security_headers_present():
    """Verify OWASP security headers are present in responses."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.headers.get("X-Content-Type-Options") == "nosniff"
    assert response.headers.get("X-Frame-Options") == "DENY"
    assert response.headers.get("X-XSS-Protection") == "1; mode=block"
    assert response.headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"

def test_protected_routes_reject_missing_token():
    """Protected endpoints must reject unauthenticated requests with HTTP 401."""
    endpoints = [
        ("GET", "/api/v1/user/me"),
        ("GET", "/api/v1/user/workspace-settings"),
        ("GET", "/api/v1/user/courses"),
        ("GET", "/api/v1/user/projects"),
        ("GET", "/api/v1/user/notes"),
    ]
    for method, path in endpoints:
        res = client.request(method, path)
        assert res.status_code == 401, f"Expected 401 for {method} {path}, got {res.status_code}"
        assert "WWW-Authenticate" in res.headers

def test_protected_routes_reject_invalid_token():
    """Tokens with malformed signatures or invalid structures must return HTTP 401."""
    res = client.get(
        "/api/v1/user/me",
        headers={"Authorization": "Bearer invalid.fake.token"}
    )
    assert res.status_code == 401

def test_protected_routes_reject_expired_token():
    """Tokens with past expiration must be rejected with HTTP 401."""
    expired_payload = {
        "sub": "00000000-0000-0000-0000-000000000001",
        "aud": "authenticated",
        "exp": int(time.time()) - 3600
    }
    expired_token = jwt.encode(expired_payload, "dummy_secret", algorithm="HS256")
    res = client.get(
        "/api/v1/user/me",
        headers={"Authorization": f"Bearer {expired_token}"}
    )
    assert res.status_code == 401
    assert "expired" in res.json()["detail"].lower()

def test_encryption_at_rest_roundtrip():
    """AES-256-GCM envelope encryption and decryption roundtrip."""
    secret_payload = {
        "title": "Confidential Study Notes",
        "code_snippet": "secret_key = 'super_secret'",
        "summary": "Master-level AI engineering notes"
    }
    envelope = encrypt_data(secret_payload)
    assert envelope["version"] == 1
    assert envelope["algorithm"] == "AES-256-GCM"
    assert "iv" in envelope
    assert "tag" in envelope
    assert "ciphertext" in envelope

    decrypted = decrypt_data(envelope)
    assert decrypted == secret_payload

def test_tampered_ciphertext_fails_decryption():
    """Modifying ciphertext or tag must fail authenticated decryption."""
    envelope = encrypt_data("Original unaltered string")
    # Tamper with the ciphertext
    tampered = dict(envelope)
    import base64
    raw_ct = bytearray(base64.b64decode(tampered["ciphertext"]))
    raw_ct[0] ^= 0xFF # flip bits
    tampered["ciphertext"] = base64.b64encode(raw_ct).decode("utf-8")

    with pytest.raises(ValueError) as excinfo:
        decrypt_data(tampered)
    assert "authenticity check failed" in str(excinfo.value).lower()


def test_user_isolation_anti_idor(monkeypatch):
    """
    CRITICAL USER-ISOLATION & ANTI-IDOR VERIFICATION:
    1. User A creates a note and course.
    2. User B attempts to access User A's note and course via direct ID.
    3. User B MUST receive 404 (Resource not found for User B).
    4. User B cannot delete User A's note.
    5. Even if User A includes 'user_id' of User B in request body, the backend
       MUST override it with current_user.id from the verified JWT.
    """
    from core.auth import get_current_user, User
    import routers.user_workspace as uw_router

    # In-memory storage mock
    fake_notes = []
    fake_courses = []

    def mock_save_note(user_id, note_data, encrypt_at_rest=True):
        record = dict(note_data)
        record["id"] = f"note-{len(fake_notes) + 1}"
        record["user_id"] = user_id
        fake_notes.append(record)
        return record

    def mock_get_notes(user_id, note_id=None):
        results = [n for n in fake_notes if n["user_id"] == user_id]
        if note_id:
            results = [n for n in results if n["id"] == note_id]
        return results

    def mock_delete_note(user_id, note_id):
        nonlocal fake_notes
        initial_len = len(fake_notes)
        fake_notes = [n for n in fake_notes if not (n["user_id"] == user_id and n["id"] == note_id)]
        return len(fake_notes) < initial_len

    def mock_save_course(user_id, course_data):
        record = dict(course_data)
        record["id"] = f"course-{len(fake_courses) + 1}"
        record["user_id"] = user_id
        fake_courses.append(record)
        return record

    def mock_get_courses(user_id, course_id=None):
        results = [c for c in fake_courses if c["user_id"] == user_id]
        if course_id:
            results = [c for c in results if c["id"] == course_id]
        return results

    monkeypatch.setattr(uw_router, "save_note_for_user", mock_save_note)
    monkeypatch.setattr(uw_router, "get_notes_for_user", mock_get_notes)
    monkeypatch.setattr(uw_router, "delete_note_for_user", mock_delete_note)
    monkeypatch.setattr(uw_router, "save_course_for_user", mock_save_course)
    monkeypatch.setattr(uw_router, "get_courses_for_user", mock_get_courses)


    # Define User A and User B
    user_a = User(id="11111111-1111-1111-1111-111111111111", email="user_a@example.com", role="authenticated")
    user_b = User(id="22222222-2222-2222-2222-222222222222", email="user_b@example.com", role="authenticated")

    # Act as User A
    app.dependency_overrides[get_current_user] = lambda: user_a

    # User A creates a private study note
    create_res = client.post("/api/v1/user/notes", json={
        "video_id": "vid-python-101",
        "title": "User A Secret Notes",
        "notes_data": "Super sensitive personal learning notes",
        "user_id": user_b.id # User A attempts to spoof User B!
    })
    assert create_res.status_code == 200
    created_note = create_res.json()
    note_id = created_note["id"]

    # Verify that backend IGNORED the spoofed body user_id and enforced User A's id
    assert created_note["user_id"] == user_a.id

    # User A creates a course
    course_res = client.post("/api/v1/user/courses", json={
        "title": "User A Python Mastery",
        "topic": "Python",
        "user_id": user_b.id # Malicious spoof attempt
    })
    assert course_res.status_code == 200
    created_course = course_res.json()
    course_id = created_course["id"]
    assert created_course["user_id"] == user_a.id

    # User A can read their own note and course
    assert client.get(f"/api/v1/user/notes/{note_id}").status_code == 200
    assert client.get(f"/api/v1/user/courses/{course_id}").status_code == 200

    # NOW SWITCH TO USER B (Attacker / Unrelated Authenticated User)
    app.dependency_overrides[get_current_user] = lambda: user_b

    # 1. User B tries to read User A's note by direct ID -> Anti-IDOR: 404
    idor_note_res = client.get(f"/api/v1/user/notes/{note_id}")
    assert idor_note_res.status_code == 404
    assert "not found" in idor_note_res.json()["detail"].lower()

    # 2. User B tries to read User A's course by direct ID -> Anti-IDOR: 404
    idor_course_res = client.get(f"/api/v1/user/courses/{course_id}")
    assert idor_course_res.status_code == 404
    assert "not found" in idor_course_res.json()["detail"].lower()

    # 3. User B tries to delete User A's note -> Anti-IDOR: 404
    delete_note_res = client.delete(f"/api/v1/user/notes/{note_id}")
    assert delete_note_res.status_code == 404

    # 4. User B checks their own list of notes and courses
    user_b_notes = client.get("/api/v1/user/notes").json()
    assert len(user_b_notes) == 0 # User A's note is NOT visible in User B's list

    user_b_courses = client.get("/api/v1/user/courses").json()
    assert len(user_b_courses) == 0 # User A's course is NOT visible in User B's list

    # Clean up dependency override
    app.dependency_overrides.clear()

