from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from core.auth import get_current_user, AuthenticatedUser
from core.db import (
    get_workspace_settings,
    update_workspace_settings,
    get_courses_for_user,
    save_course_for_user,
    delete_course_for_user,
    get_projects_for_user,
    save_project_for_user,
    delete_project_for_user,
    get_notes_for_user,
    save_note_for_user,
    delete_note_for_user
)

router = APIRouter(prefix="/user", tags=["User Workspace & Cloud Hub"])

# --- Request Models ---
class WorkspaceSettingsPayload(BaseModel):
    theme: Optional[str] = "dark"
    sidebar_width: Optional[int] = 280
    ai_panel_width: Optional[int] = 360
    terminal_height: Optional[int] = 220
    sidebar_collapsed: Optional[bool] = False
    ai_panel_collapsed: Optional[bool] = False
    terminal_collapsed: Optional[bool] = False
    active_tab: Optional[str] = "video"
    open_tabs: Optional[List[Dict[str, Any]]] = []
    active_sidebar_view: Optional[str] = "explorer"

class CoursePayload(BaseModel):
    id: Optional[str] = None
    title: str
    description: Optional[str] = ""
    thumbnail: Optional[str] = ""
    total_videos: Optional[int] = 1
    total_duration: Optional[str] = "30m"
    progress: Optional[int] = 0
    status: Optional[str] = "In Progress"
    modules: Optional[List[Dict[str, Any]]] = []
    channel: Optional[str] = "YouTube Academy"
    roadmap: Optional[Dict[str, Any]] = {}

class ProjectPayload(BaseModel):
    id: Optional[str] = None
    title: str
    description: Optional[str] = ""
    level: Optional[str] = "Beginner"
    accent: Optional[str] = "Any"
    status: Optional[str] = "In Progress"
    progress: Optional[int] = 0
    roadmap_data: Optional[Dict[str, Any]] = None
    custom_tasks: Optional[List[Dict[str, Any]]] = []

class NotePayload(BaseModel):
    id: Optional[str] = None
    video_id: str
    title: str
    notes_data: Any
    encrypt_at_rest: Optional[bool] = True

# --- Endpoints ---

@router.get("/me")
def get_user_me(user: AuthenticatedUser = Depends(get_current_user)):
    """
    Returns cryptographically verified user identity from Supabase Auth token.
    """
    return {
        "id": user.id,
        "email": user.email,
        "role": user.role
    }

# Workspace Layout Settings
@router.get("/workspace-settings")
def get_settings(user: AuthenticatedUser = Depends(get_current_user)):
    return get_workspace_settings(user.id)

@router.put("/workspace-settings")
def update_settings(
    payload: WorkspaceSettingsPayload,
    user: AuthenticatedUser = Depends(get_current_user)
):
    return update_workspace_settings(user.id, payload.dict())

# User Courses (Strict User Isolation)
@router.get("/courses")
def list_courses(user: AuthenticatedUser = Depends(get_current_user)):
    return get_courses_for_user(user.id)

@router.get("/courses/{course_id}")
def get_course(course_id: str, user: AuthenticatedUser = Depends(get_current_user)):
    results = get_courses_for_user(user.id, course_id=course_id)
    if not results:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found or access denied."
        )
    return results[0]

@router.post("/courses")
def create_or_update_course(
    course: CoursePayload,
    user: AuthenticatedUser = Depends(get_current_user)
):
    return save_course_for_user(user.id, course.dict())

@router.delete("/courses/{course_id}")
def remove_course(course_id: str, user: AuthenticatedUser = Depends(get_current_user)):
    # Verify course exists and belongs to user first
    existing = get_courses_for_user(user.id, course_id=course_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found or access denied."
        )
    delete_course_for_user(user.id, course_id)
    return {"success": True, "message": "Course deleted successfully."}

# User Projects (Strict User Isolation)
@router.get("/projects")
def list_projects(user: AuthenticatedUser = Depends(get_current_user)):
    return get_projects_for_user(user.id)

@router.get("/projects/{project_id}")
def get_project(project_id: str, user: AuthenticatedUser = Depends(get_current_user)):
    results = get_projects_for_user(user.id, project_id=project_id)
    if not results:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found or access denied."
        )
    return results[0]

@router.post("/projects")
def create_or_update_project(
    project: ProjectPayload,
    user: AuthenticatedUser = Depends(get_current_user)
):
    return save_project_for_user(user.id, project.dict())

@router.delete("/projects/{project_id}")
def remove_project(project_id: str, user: AuthenticatedUser = Depends(get_current_user)):
    existing = get_projects_for_user(user.id, project_id=project_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found or access denied."
        )
    delete_project_for_user(user.id, project_id)
    return {"success": True, "message": "Project deleted successfully."}

# User Notes (Strict User Isolation + At-Rest & E2EE Support)
@router.get("/notes")
def list_notes(user: AuthenticatedUser = Depends(get_current_user)):
    return get_notes_for_user(user.id)

@router.get("/notes/{note_id}")
def get_note(note_id: str, user: AuthenticatedUser = Depends(get_current_user)):
    results = get_notes_for_user(user.id, note_id=note_id)
    if not results:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found or access denied."
        )
    return results[0]

@router.post("/notes")
def create_or_update_note(
    note: NotePayload,
    user: AuthenticatedUser = Depends(get_current_user)
):
    return save_note_for_user(user.id, note.dict(), encrypt_at_rest=note.encrypt_at_rest)

@router.delete("/notes/{note_id}")
def remove_note(note_id: str, user: AuthenticatedUser = Depends(get_current_user)):
    existing = get_notes_for_user(user.id, note_id=note_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found or access denied."
        )
    delete_note_for_user(user.id, note_id)
    return {"success": True, "message": "Note deleted successfully."}
