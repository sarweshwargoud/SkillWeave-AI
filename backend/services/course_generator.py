from services.syllabus_service import generate_syllabus
from services.youtube_service import search_videos
from services.continuity_service import check_video_continuity
from services.style_service import analyze_style
from typing import List, Dict

def build_course(topic: str, level: str, accent_preference: str = "Any"):
    """
    Orchestrates the full course generation.
    """
    # 1. Generate Syllabus
    syllabus = generate_syllabus(topic, level)
    if not syllabus:
        return {"error": "Failed to generate syllabus"}
        
    course_plan = {
        "title": syllabus.get("course_title", topic),
        "modules": []
    }
    
    previous_video_id = None
    
    # 2. Find Videos for each Module
    for module_idx, module in enumerate(syllabus.get("modules", [])):
        best_video = None
        candidates = []
        
        try:
            # Search using the generated queries
            for query in module.get("search_queries", [])[:1]: # Limit to 1 query per module for speed
                results = search_videos(query, max_results=5)
                candidates.extend(results)
                
            # Deduplicate
            unique_candidates = {v['id']: v for v in candidates}.values()
            
            scored_candidates = []
            
            for vid in unique_candidates:
                score = vid.get("rankingScore", 0)
                
                # Check Style if preference is set (optimization: skip if loose requirements)
                if accent_preference != "Any":
                    try:
                        style = analyze_style(vid['id'], vid['channelTitle'])
                        if accent_preference.lower() in style['accent'].lower():
                            score += 20 # BIIIG boost for accent match
                        # Also boost for reasonable WPM
                        if 120 <= style['wpm'] <= 160:
                             score += 5
                    except Exception as e:
                        print(f"Style analysis failed for {vid['id']}: {e}")
                
                # Check Continuity with previous video
                continuity_bonus = 0
                if previous_video_id:
                    # This is the "expensive" check (LLM calls)
                    # Optimization: Only check top 2 candidates from base ranking
                    try:
                        continuity_result = check_video_continuity(previous_video_id, vid['id'])
                        if continuity_result and continuity_result['continuity_score'] > 70:
                            continuity_bonus = continuity_result['continuity_score'] / 2 # Scale 0-50
                    except Exception as e:
                        print(f"Continuity check failed for {vid['id']}: {e}")
                        
                final_score = score + continuity_bonus
                scored_candidates.append({**vid, "final_score": final_score})
                
            # Sort and pick winner
            scored_candidates.sort(key=lambda x: x["final_score"], reverse=True)
            
            if scored_candidates:
                best_video = scored_candidates[0]
                previous_video_id = best_video['id']
                
                course_plan["modules"].append({
                    "module_title": module["title"],
                    "description": module.get("description", "No description available"),
                    "video": best_video
                })
        except Exception as e:
            print(f"Error processing module {module_idx}: {e}")
            continue
            
    return course_plan
