import os
import json
import re
import logging
from typing import Dict, List, Any, Optional

# =============================================================================
# CONFIGURATION
# =============================================================================
logger = logging.getLogger("AIExtractionService")

# Feature Flags
# Only enable Gemini if the package is installed AND the key is present
ENABLE_GEMINI = False
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

try:
    import google.generativeai as genai
    if GEMINI_API_KEY:
        genai.configure(api_key=GEMINI_API_KEY)
        ENABLE_GEMINI = True
        logger.info("✅ Gemini AI Configured")
    else:
        logger.info("ℹ️ Gemini AI Key missing (Using Rule-Based Fallback)")
except ImportError:
    logger.warning("⚠️ google-generativeai not installed. AI features disabled.")

# =============================================================================
# EXTRACTION ENGINE
# =============================================================================

def extract_profile_from_interview(transcript: str) -> Dict[str, Any]:
    """
    Extracts structured profile data from unstructured text.
    Reliability: Tries AI first, then Regex, then Defaults. Never crashes.
    """
    if not transcript or len(transcript) < 10:
        return _get_default_profile()

    # 1. Try AI Extraction
    if ENABLE_GEMINI:
        try:
            return _extract_with_gemini(transcript)
        except Exception as e:
            logger.error(f"Gemini Extraction Failed: {e}")
            # Fall through to rule-based

    # 2. Rule-Based Fallback (The "Safety Net")
    logger.info("Using Rule-Based Extraction")
    return _extract_rule_based(transcript)

# =============================================================================
# STRATEGIES
# =============================================================================

def _extract_with_gemini(transcript: str) -> Dict[str, Any]:
    """AI-Powered Extraction using Google Gemini Pro."""
    model = genai.GenerativeModel('gemini-pro')
    
    prompt = f"""
    You are a Hiring Assistant. Analyze this interview transcript and extract a JSON profile.
    
    Transcript: "{transcript}"
    
    Output JSON strictly matching this schema:
    {{
        "roleTitle": "Current or Desired Job Title",
        "skills": ["List", "of", "hard", "skills"],
        "experienceYears": number (float),
        "summary": "Professional summary (max 200 chars)",
        "location": "City or Country inferred"
    }}
    """
    
    try:
        # Generate
        response = model.generate_content(prompt)
        raw_text = response.text.strip()
        
        # Cleanup Markdown Code Blocks (Common LLM artifact)
        if raw_text.startswith("```"):
            raw_text = re.sub(r"^```(json)?|```$", "", raw_text, flags=re.MULTILINE).strip()
            
        data = json.loads(raw_text)
        
        # Validation
        return {
            "roleTitle": str(data.get("roleTitle", "Professional")),
            "skills": list(data.get("skills", [])),
            "experienceYears": float(data.get("experienceYears", 0)),
            "summary": str(data.get("summary", "Extracted from interview.")),
            "location": str(data.get("location", "Remote"))
        }
        
    except json.JSONDecodeError:
        logger.error("Gemini returned invalid JSON")
        raise ValueError("Invalid JSON from AI")

def _extract_rule_based(transcript: str) -> Dict[str, Any]:
    """
    Deterministic extraction using Regex keywords.
    Focused on 'Blue Collar' & 'Tech' roles common in your examples.
    """
    text = transcript.lower()
    
    # 1. Role Detection
    role_map = {
        "driver": ["driving", "truck", "vehicle", "license", "hmv", "lmv", "delivery"],
        "developer": ["software", "code", "python", "java", "react", "programming"],
        "mechanic": ["repair", "engine", "maintenance", "technician"],
        "sales": ["selling", "customer", "retail", "marketing"],
        "nurse": ["patient", "medical", "hospital", "care"]
    }
    
    detected_role = "Candidate"
    max_matches = 0
    
    for role, keywords in role_map.items():
        matches = sum(1 for k in keywords if k in text)
        if matches > max_matches:
            max_matches = matches
            detected_role = role.title()

    # 2. Experience Detection
    # Look for "X years", "X yrs"
    exp_match = re.search(r'(\d+)\+?\s*(?:years?|yrs?)', text)
    experience = float(exp_match.group(1)) if exp_match else 0.0
    
    # 3. Skills Extraction
    common_skills = [
        "driving", "maintenance", "repair", "safety", "logistics", # Blue collar
        "python", "javascript", "react", "sql", "aws", "docker",   # Tech
        "sales", "communication", "management", "excel"            # General
    ]
    
    found_skills = [s.title() for s in common_skills if s in text]
    
    # 4. Summary Generation
    summary = f"{detected_role} with {experience} years experience."
    if found_skills:
        summary += f" Skilled in {', '.join(found_skills[:3])}."

    return {
        "roleTitle": detected_role,
        "skills": found_skills or ["General"],
        "experienceYears": experience,
        "summary": summary,
        "location": "Unknown" # Hard to regex reliable locations without a massive list
    }

def _get_default_profile() -> Dict[str, Any]:
    """Fail-safe return value."""
    return {
        "roleTitle": "New Candidate",
        "skills": [],
        "experienceYears": 0.0,
        "summary": "Profile created automatically.",
        "location": "Remote"
    }

# =============================================================================
# AUDIO TRANSCRIPTION (Simulated for MVP)
# =============================================================================

async def transcribe_audio(file_path: str) -> str:
    """
    Placeholder for Whisper/Google Speech-to-Text.
    In a real app, this calls an external API.
    """
    logger.info(f"Simulating transcription for: {file_path}")
    
    # In production, integrate 'openai-whisper' or Google Cloud Speech here.
    return (
        "I am an experienced professional looking for new opportunities. "
        "I have strong technical skills and excellent communication abilities."
    )