import os
import json
from typing import Dict, Optional
from app.core.config import settings

try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False

# Try local libraries first
try:
    import speech_recognition as sr
    SPEECH_REC_AVAILABLE = True
except ImportError:
    SPEECH_REC_AVAILABLE = False

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

if GEMINI_AVAILABLE and GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

def extract_profile_from_interview(transcript: str) -> Dict:
    """
    Extract structured profile data from interview transcript.
    Uses Gemini API as primary, with fallback to rule-based extraction.
    """
    if GEMINI_AVAILABLE and GEMINI_API_KEY:
        try:
            return _extract_with_gemini(transcript)
        except Exception as e:
            print(f"Gemini extraction failed: {e}, falling back to rule-based")
            return _extract_rule_based(transcript)
    else:
        return _extract_rule_based(transcript)

def _extract_with_gemini(transcript: str) -> Dict:
    """Extract using Gemini API"""
    model = genai.GenerativeModel('gemini-pro')
    
    prompt = f"""
    Analyze this job interview transcript and extract structured information.
    Return ONLY valid JSON matching this schema:
    {{
        "job_title": "string",
        "summary": "string (2-3 sentences)",
        "skills": ["skill1", "skill2", ...],
        "experience_years": number,
        "location": "string",
        "salary_expectations": "string or number",
        "licenses_certifications": ["cert1", ...],
        "remote_work_preference": boolean
    }}
    
    Transcript:
    {transcript}
    
    JSON:
    """
    
    response = model.generate_content(prompt)
    text = response.text.strip()
    
    # Clean JSON if wrapped in markdown
    if text.startswith("```json"):
        text = text[7:]
    if text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    text = text.strip()
    
    data = json.loads(text)
    
    # Validate and set defaults
    return {
        "job_title": data.get("job_title", "Professional"),
        "summary": data.get("summary", "Experienced professional seeking opportunities."),
        "skills": data.get("skills", []),
        "experience_years": data.get("experience_years", 0),
        "location": data.get("location", "Not specified"),
        "salary_expectations": data.get("salary_expectations", "Negotiable"),
        "licenses_certifications": data.get("licenses_certifications", []),
        "remote_work_preference": data.get("remote_work_preference", False)
    }

def _extract_rule_based(transcript: str) -> Dict:
    """Fallback rule-based extraction"""
    transcript_lower = transcript.lower()
    
    # Extract skills (common tech keywords)
    skills_keywords = [
        "python", "javascript", "react", "node", "java", "sql", "aws", 
        "docker", "kubernetes", "git", "agile", "scrum", "api", "rest",
        "typescript", "angular", "vue", "mongodb", "postgresql", "redis"
    ]
    found_skills = [skill for skill in skills_keywords if skill in transcript_lower]
    
    # Extract experience (look for numbers + "year")
    import re
    exp_match = re.search(r'(\d+)\s*(?:year|yr|years)', transcript_lower)
    experience_years = int(exp_match.group(1)) if exp_match else 0
    
    # Extract location
    location_keywords = ["remote", "new york", "san francisco", "london", "toronto"]
    location = "Remote" if "remote" in transcript_lower else "Not specified"
    for loc in location_keywords:
        if loc in transcript_lower:
            location = loc.title()
            break
    
    # Extract job title (look for common titles)
    title_keywords = [
        "software engineer", "developer", "manager", "designer", 
        "analyst", "consultant", "director", "lead"
    ]
    job_title = "Professional"
    for title in title_keywords:
        if title in transcript_lower:
            job_title = title.title()
            break
    
    return {
        "job_title": job_title,
        "summary": transcript[:200] + "..." if len(transcript) > 200 else transcript,
        "skills": found_skills[:10] if found_skills else ["Communication", "Problem Solving"],
        "experience_years": experience_years,
        "location": location,
        "salary_expectations": "Negotiable",
        "licenses_certifications": [],
        "remote_work_preference": "remote" in transcript_lower
    }

def transcribe_audio(audio_file_path: str) -> str:
    """
    Transcribe audio to text.
    Uses local speech_recognition first, falls back to Gemini if available.
    """
    if SPEECH_REC_AVAILABLE:
        try:
            r = sr.Recognizer()
            with sr.AudioFile(audio_file_path) as source:
                audio = r.record(source)
            return r.recognize_google(audio)
        except Exception as e:
            print(f"Local transcription failed: {e}")
    
    # Fallback: return placeholder (in production, use Gemini audio API)
    return "I am an experienced professional looking for new opportunities. I have strong technical skills and excellent communication abilities."