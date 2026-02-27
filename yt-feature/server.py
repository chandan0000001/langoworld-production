"""
TubeInsight API Server
Flask API wrapper for transcript extraction.
Runs as a local backend that the Next.js app calls.
"""

import os
import logging
import uuid
import json
import tempfile
import time
import threading
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import google.generativeai as genai

from services.youtube import get_video_id, get_video_info
from services.transcript import get_youtube_transcript

# Language detection
from langdetect import detect, detect_langs
from langdetect.lang_detect_exception import LangDetectException

load_dotenv()

app = Flask(__name__)
CORS(app)


# ─── Global Error Handlers (ensure JSON responses, no HTML) ───

@app.errorhandler(400)
@app.errorhandler(404)
@app.errorhandler(405)
@app.errorhandler(500)
def handle_http_errors(e):
    return jsonify({
        "status": "error",
        "message": str(e)
    }), getattr(e, "code", 500)


@app.errorhandler(Exception)
def handle_unexpected_error(e):
    logging.error(f"[Flask] Uncaught exception: {e}")
    return jsonify({
        "status": "error",
        "message": "Internal server error",
        "details": str(e)
    }), 500


# Global in-memory job storage for async video processing
video_jobs = {}

# All language codes supported by the LangoWorld project
SUPPORTED_LANG_CODES = {
    "en", "es", "fr", "de", "it", "pt", "nl", "pl", "ru",
    "ja", "ko", "zh", "ar", "hi", "pa", "bn", "ta", "te",
    "mr", "ur", "gu", "tr", "sv", "no", "da", "fi",
    "th", "vi", "id", "ms", "uk", "cs",
}

# Map langdetect codes to our project codes
LANG_CODE_MAP = {
    "zh-cn": "zh",
    "zh-tw": "zh",
}

logging.basicConfig(level=logging.INFO, format="[TubeInsight] %(message)s")

# Max time allowed for video processing pipeline (seconds)
MAX_PROCESSING_SECONDS = 180


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "TubeInsight"})


@app.route("/api/detect-language", methods=["POST"])
def detect_language():
    """
    Detect the language of input text using Google's langdetect.

    Body: { "text": "some text to detect" }
    Returns: { "code": "gu", "confidence": 0.99 }
    """
    try:
        data = request.get_json()
        text = (data.get("text", "") if data else "").strip()

        if not text or len(text) < 2:
            return jsonify({"code": "en", "confidence": 0.0, "reason": "text too short"})

        # Get all possible languages with probabilities
        results = detect_langs(text)

        if not results:
            return jsonify({"code": "en", "confidence": 0.0, "reason": "no detection"})

        # Best result
        best = results[0]
        detected_code = str(best.lang)
        confidence = round(float(best.prob), 4)

        # Map to our project codes (e.g. zh-cn → zh)
        mapped_code = LANG_CODE_MAP.get(detected_code, detected_code)

        # If not in our supported list, fall back to English
        if mapped_code not in SUPPORTED_LANG_CODES:
            logging.info(f"[Detect] '{text[:50]}' → {detected_code} ({confidence}) — unsupported, fallback to en")
            return jsonify({"code": "en", "confidence": 0.0, "reason": "unsupported language"})

        logging.info(f"[Detect] '{text[:50]}' → {detected_code} ({confidence}) → mapped: {mapped_code}")

        return jsonify({
            "code": mapped_code,
            "confidence": confidence,
            "raw": detected_code,
        })

    except LangDetectException as e:
        logging.warning(f"[Detect] LangDetect error: {e}")
        return jsonify({"code": "en", "confidence": 0.0, "reason": str(e)})
    except Exception as e:
        logging.error(f"[Detect] Unexpected error: {e}")
        return jsonify({"code": "en", "confidence": 0.0, "reason": "error"})


@app.route("/api/transcript", methods=["POST"])
def get_transcript():
    """
    Extract transcript from a YouTube video.

    Body: { "url": "https://youtube.com/watch?v=..." }
    Returns: { "transcript": "...", "lang": "...", "video_info": {...}, "method": "captions" }
    """
    data = request.get_json()
    url = data.get("url", "").strip()

    if not url:
        return jsonify({"error": "YouTube URL is required"}), 400

    result = get_youtube_transcript(url)

    if "error" in result:
        return jsonify(result), 400

    return jsonify(result)


@app.route("/api/video-info", methods=["POST"])
def video_info():
    """Get video metadata."""
    data = request.get_json()
    url = data.get("url", "").strip()

    if not url:
        return jsonify({"error": "YouTube URL is required"}), 400

    info = get_video_info(url)
    return jsonify(info)


def process_video_job(job_id: str, video_url: str, user_id: str, video_title_input: str, file_name: str):
    """
    Background worker function to process video analysis.
    Updates video_jobs[job_id] with status and result.
    """
    global video_jobs
    temp_file_path = None
    uploaded_file = None
    start_time = time.time()
    
    def check_timeout():
        """Check if processing has exceeded max time."""
        return time.time() - start_time > MAX_PROCESSING_SECONDS
    
    def is_quota_error(error):
        """Check if error is a quota/rate limit error."""
        error_str = str(error).lower()
        return "429" in error_str or "quota" in error_str or "rate limit" in error_str or "resource exhausted" in error_str
    
    try:
        logging.info(f"[VideoJob {job_id}] Processing video: {video_url}")

        # ─── Configure Gemini ───
        gemini_api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
        if not gemini_api_key:
            logging.error(f"[VideoJob {job_id}] Missing GOOGLE_API_KEY or GEMINI_API_KEY")
            video_jobs[job_id]["status"] = "error"
            video_jobs[job_id]["error"] = "AI service not configured"
            return

        genai.configure(api_key=gemini_api_key)

        # ─── Download video to temp file ───
        logging.info(f"[VideoJob {job_id}] Downloading video from R2...")
        
        video_response = requests.get(video_url, stream=True, timeout=120)
        if video_response.status_code != 200:
            logging.error(f"[VideoJob {job_id}] Failed to download video: {video_response.status_code}")
            video_jobs[job_id]["status"] = "error"
            video_jobs[job_id]["error"] = "Failed to download video from CDN"
            return

        # Determine mime type from content-type header or file extension
        content_type = video_response.headers.get("content-type", "video/mp4")
        if ";" in content_type:
            content_type = content_type.split(";")[0].strip()
        
        # Map common extensions to mime types
        ext = file_name.split(".")[-1].lower() if "." in file_name else "mp4"
        mime_map = {
            "mp4": "video/mp4",
            "webm": "video/webm",
            "mov": "video/quicktime",
            "avi": "video/x-msvideo",
            "mkv": "video/x-matroska",
            "m4v": "video/mp4",
        }
        mime_type = mime_map.get(ext, content_type)

        # Save to temp file
        suffix = f".{ext}" if ext else ".mp4"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            for chunk in video_response.iter_content(chunk_size=8192):
                temp_file.write(chunk)
            temp_file_path = temp_file.name
        
        logging.info(f"[VideoJob {job_id}] Downloaded to temp file: {temp_file_path} ({mime_type})")

        # ─── Check timeout before Gemini upload ───
        if check_timeout():
            logging.warning(f"[VideoJob {job_id}] Timeout before Gemini upload")
            video_jobs[job_id]["status"] = "error"
            video_jobs[job_id]["error"] = "Video processing took too long. Please try again later."
            return

        # ─── Upload to Gemini File API ───
        logging.info(f"[VideoJob {job_id}] Uploading video to Gemini File API...")
        
        try:
            uploaded_file = genai.upload_file(
                path=temp_file_path,
                mime_type=mime_type,
                display_name=video_title_input
            )
        except Exception as upload_error:
            if is_quota_error(upload_error):
                logging.error(f"[VideoJob {job_id}] Quota exceeded during upload: {upload_error}")
                video_jobs[job_id]["status"] = "error"
                video_jobs[job_id]["error"] = "AI service temporarily unavailable. Please try again later."
                return
            raise
        
        logging.info(f"[VideoJob {job_id}] Upload started: {uploaded_file.name}")

        # Wait for file to be processed (with timeout)
        max_wait_seconds = 300  # 5 minutes max
        wait_interval = 5
        total_waited = 0
        
        while uploaded_file.state.name == "PROCESSING":
            # Check global processing timeout
            if check_timeout():
                logging.warning(f"[VideoJob {job_id}] Global timeout during Gemini processing")
                video_jobs[job_id]["status"] = "error"
                video_jobs[job_id]["error"] = "Video processing took too long. Please try again later."
                return
            
            if total_waited >= max_wait_seconds:
                logging.error(f"[VideoJob {job_id}] Video processing timed out")
                video_jobs[job_id]["status"] = "error"
                video_jobs[job_id]["error"] = "Video processing took too long. Please try again later."
                return
            
            logging.info(f"[VideoJob {job_id}] Waiting for video processing... ({total_waited}s)")
            time.sleep(wait_interval)
            total_waited += wait_interval
            
            try:
                uploaded_file = genai.get_file(uploaded_file.name)
            except Exception as get_file_error:
                if is_quota_error(get_file_error):
                    logging.error(f"[VideoJob {job_id}] Quota exceeded during file check: {get_file_error}")
                    video_jobs[job_id]["status"] = "error"
                    video_jobs[job_id]["error"] = "AI service temporarily unavailable. Please try again later."
                    return
                raise

        if uploaded_file.state.name == "FAILED":
            logging.error(f"[VideoJob {job_id}] Video processing failed: {uploaded_file.state.name}")
            video_jobs[job_id]["status"] = "error"
            video_jobs[job_id]["error"] = "Video processing failed on AI server"
            return

        logging.info(f"[VideoJob {job_id}] Video ready: {uploaded_file.state.name}")

        # ─── Check timeout before analysis ───
        if check_timeout():
            logging.warning(f"[VideoJob {job_id}] Timeout before Gemini analysis")
            video_jobs[job_id]["status"] = "error"
            video_jobs[job_id]["error"] = "Video processing took too long. Please try again later."
            return

        # ─── Analyze with Gemini ───
        logging.info(f"[VideoJob {job_id}] Analyzing video with Gemini 2.5 Flash...")
        
        model = genai.GenerativeModel("gemini-2.5-flash")
        
        analysis_prompt = f"""You are an expert video analyst. Analyze this uploaded video thoroughly.

Video title: {video_title_input}

Return ONLY valid JSON (no markdown, no code blocks, no extra text):
{{
  "summary": "2-3 paragraph comprehensive summary of the video content",
  "keyPoints": [
    {{ "timestamp": "M:SS", "point": "description of key moment or topic" }}
  ],
  "explanation": "3-5 paragraph conversational explanation as if you're a personal tutor explaining the video to someone",
  "chapters": [
    {{ "content": "detailed description of this section", "startTime": "M:SS" }}
  ]
}}

Rules:
- Provide 5-10 key points with estimated timestamps spread across the video
- Use "M:SS" format for timestamps (e.g. "0:00", "1:30", "5:45")
- Create 3-5 chapters covering major sections of the video
- Make the explanation engaging and educational
- If the video has speech, include key quotes or topics discussed
- If the video is visual (no speech), describe what happens visually
- Everything must be in English"""

        try:
            response = model.generate_content(
                [uploaded_file, analysis_prompt],
                generation_config=genai.GenerationConfig(
                    max_output_tokens=8000,
                    temperature=0.7,
                )
            )
        except Exception as gen_error:
            if is_quota_error(gen_error):
                logging.error(f"[VideoJob {job_id}] Quota exceeded during analysis: {gen_error}")
                video_jobs[job_id]["status"] = "error"
                video_jobs[job_id]["error"] = "AI service temporarily unavailable. Please try again later."
                return
            raise

        # ─── Check timeout after analysis ───
        if check_timeout():
            logging.warning(f"[VideoJob {job_id}] Timeout after Gemini analysis")
            video_jobs[job_id]["status"] = "error"
            video_jobs[job_id]["error"] = "Video processing took too long. Please try again later."
            return

        raw_response = response.text
        logging.info(f"[VideoJob {job_id}] Got {len(raw_response)} chars from Gemini")

        # ─── Parse JSON response ───
        def parse_gemini_json(raw: str) -> dict:
            """Safely parse JSON from Gemini response."""
            cleaned = raw.strip()
            
            # Remove markdown code fences
            if cleaned.startswith("```"):
                cleaned = cleaned.split("\n", 1)[-1] if "\n" in cleaned else cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned.rsplit("```", 1)[0]
            if cleaned.startswith("json"):
                cleaned = cleaned[4:].strip()
            
            cleaned = cleaned.strip()
            
            # Try direct parse
            try:
                return json.loads(cleaned)
            except json.JSONDecodeError:
                pass
            
            # Extract JSON object using brace matching
            start_idx = cleaned.find("{")
            if start_idx != -1:
                depth = 0
                end_idx = -1
                for i in range(start_idx, len(cleaned)):
                    if cleaned[i] == "{":
                        depth += 1
                    elif cleaned[i] == "}":
                        depth -= 1
                        if depth == 0:
                            end_idx = i
                            break
                
                if end_idx != -1:
                    extracted = cleaned[start_idx:end_idx + 1]
                    try:
                        return json.loads(extracted)
                    except json.JSONDecodeError:
                        # Fix common issues
                        fixed = extracted.replace(",]", "]").replace(",}", "}")
                        try:
                            return json.loads(fixed)
                        except json.JSONDecodeError:
                            pass
            
            # Fallback: return parsed summary from raw text
            logging.warning(f"[VideoJob {job_id}] JSON parse failed, using fallback")
            return {
                "summary": cleaned[:2000] if len(cleaned) > 100 else "Video analysis completed but response parsing failed.",
                "keyPoints": [{"timestamp": "0:00", "point": "Video content analyzed"}],
                "explanation": cleaned if len(cleaned) > 100 else "Unable to parse detailed explanation.",
                "chapters": [{"content": "Full video", "startTime": "0:00"}]
            }

        result = parse_gemini_json(raw_response)

        # Extract values with safe defaults
        summary_text = result.get("summary", "Video analysis completed.")
        key_points = result.get("keyPoints", [{"timestamp": "0:00", "point": "Video analyzed"}])
        explanation = result.get("explanation", summary_text)
        chapters = result.get("chapters", [{"content": summary_text, "startTime": "0:00"}])

        # Generate TTS-friendly summary
        logging.info(f"[VideoJob {job_id}] Generating TTS summary...")
        try:
            # Check timeout before TTS generation
            if check_timeout():
                logging.warning(f"[VideoJob {job_id}] Timeout before TTS generation, using original summary")
                tts_summary = summary_text
            else:
                tts_response = model.generate_content(
                    f"""Generate a cinematic highlight-style spoken summary between 30 and 35 words based strictly on the provided summary.
Do not use greetings, filler language, or casual tone.
Make it expressive, impactful, and professional, suitable for a short narrated highlight.

Summary:
{summary_text}""",
                    generation_config=genai.GenerationConfig(
                        max_output_tokens=1000,
                        temperature=0.7,
                    )
                )
                tts_summary = tts_response.text.strip()
                logging.info(f"[VideoJob {job_id}] TTS summary: {len(tts_summary)} chars")
        except Exception as tts_error:
            if is_quota_error(tts_error):
                logging.error(f"[VideoJob {job_id}] Quota exceeded during TTS: {tts_error}")
                video_jobs[job_id]["status"] = "error"
                video_jobs[job_id]["error"] = "AI service temporarily unavailable. Please try again later."
                return
            logging.warning(f"[VideoJob {job_id}] TTS summary failed: {tts_error}")
            tts_summary = summary_text

        # ─── Generate unique ID and prepare Supabase insert ───
        summary_id = str(uuid.uuid4())[:8]  # Short ID for cleaner URLs
        video_title = video_title_input if video_title_input != "Uploaded Video" else f"Video {summary_id}"

        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

        if not supabase_url or not supabase_key:
            logging.error(f"[VideoJob {job_id}] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
            video_jobs[job_id]["status"] = "error"
            video_jobs[job_id]["error"] = "Database configuration error"
            return

        # Format chapters for storage
        chapters_data = []
        for i, ch in enumerate(chapters):
            chapters_data.append({
                "id": f"vid-ch-{i + 1}-{summary_id}",
                "title": f"Part {i + 1}",
                "content": f"<p>{ch.get('content', '').replace(chr(10), '</p><p>')}</p>",
                "textContent": ch.get("content", ""),
                "wordCount": len(ch.get("content", "").split()),
                "startTime": ch.get("startTime", "0:00"),
            })

        insert_payload = {
            "id": summary_id,
            "user_id": user_id,
            "video_url": video_url,
            "video_title": video_title,
            "channel": "Uploaded",
            "summary": summary_text,
            "key_points": key_points,
            "explanation": explanation,
            "tts_summary": tts_summary,
            "transcript": "",  # No transcript for uploaded videos
            "chapters": chapters_data,
            "source": "upload",
        }

        headers = {
            "apikey": supabase_key,
            "Authorization": f"Bearer {supabase_key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        }

        supabase_insert_url = f"{supabase_url}/rest/v1/summaries"
        logging.info(f"[VideoJob {job_id}] Inserting AI summary {summary_id} into Supabase")

        insert_res = requests.post(supabase_insert_url, json=insert_payload, headers=headers)

        if insert_res.status_code not in (200, 201):
            logging.error(f"[VideoJob {job_id}] Supabase insert failed: {insert_res.status_code} {insert_res.text}")
            video_jobs[job_id]["status"] = "error"
            video_jobs[job_id]["error"] = f"Failed to save summary: {insert_res.text}"
            return

        logging.info(f"[VideoJob {job_id}] ✅ Successfully saved AI summary {summary_id}")

        # ─── Build final response ───
        final_response = {
            "summary": summary_text,
            "keyPoints": key_points,
            "explanation": explanation,
            "chapters": chapters_data,
            "transcript": "",
            "ttsSummary": tts_summary,
            "summaryPageId": summary_id,
            "summaryPageUrl": f"/video/summary/{summary_id}",
            "videoTitle": video_title,
            "channel": "Uploaded",
            "source": "upload",
            "videoAnalyzed": True,
        }

        # Mark job as completed
        video_jobs[job_id]["status"] = "completed"
        video_jobs[job_id]["result"] = final_response
        logging.info(f"[VideoJob {job_id}] ✅ Job completed successfully for: {video_url}")

    except Exception as e:
        logging.error(f"[VideoJob {job_id}] Error processing video: {e}")
        import traceback
        traceback.print_exc()
        video_jobs[job_id]["status"] = "error"
        video_jobs[job_id]["error"] = str(e)
    
    finally:
        # Cleanup: delete temp file
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
                logging.info(f"[VideoJob {job_id}] Cleaned up temp file: {temp_file_path}")
            except Exception as cleanup_error:
                logging.warning(f"[VideoJob {job_id}] Failed to cleanup temp file: {cleanup_error}")
        
        # Cleanup: delete uploaded file from Gemini
        if uploaded_file:
            try:
                genai.delete_file(uploaded_file.name)
                logging.info(f"[VideoJob {job_id}] Cleaned up Gemini file: {uploaded_file.name}")
            except Exception as cleanup_error:
                logging.warning(f"[VideoJob {job_id}] Failed to cleanup Gemini file: {cleanup_error}")


@app.route("/api/video-understand", methods=["POST"])
def video_understand():
    """
    Process and analyze an uploaded video using Gemini AI (async).

    Body: { "video_url": "https://...", "user_id": "...", "videoTitle": "..." }
    Returns: { "job_id": "...", "status": "processing" }
    """
    global video_jobs
    
    try:
        data = request.get_json()
        video_url = (data.get("video_url", "") if data else "").strip()
        user_id = data.get("user_id") if data else None
        video_title_input = data.get("videoTitle", "Uploaded Video") if data else "Uploaded Video"
        file_name = data.get("fileName", "video.mp4") if data else "video.mp4"

        if not video_url:
            return jsonify({"error": "video_url is required"}), 400

        if not user_id:
            return jsonify({"error": "user_id is required"}), 400

        # Generate unique job ID
        job_id = str(uuid.uuid4())
        
        # Initialize job in global store
        video_jobs[job_id] = {
            "status": "processing",
            "result": None,
            "error": None
        }
        
        # Start background processing thread
        thread = threading.Thread(
            target=process_video_job,
            args=(job_id, video_url, user_id, video_title_input, file_name)
        )
        thread.start()
        
        logging.info(f"[VideoUnderstand] Started job {job_id} for video: {video_url}")
        
        # Return immediately with job ID
        return jsonify({
            "job_id": job_id,
            "status": "processing"
        })

    except Exception as e:
        logging.error(f"[VideoUnderstand] Error starting video job: {e}")
        return jsonify({"error": "Failed to start video processing", "details": str(e)}), 500


@app.route("/api/video-status/<job_id>", methods=["GET"])
def video_status(job_id):
    """
    Check the status of an async video processing job.

    Returns:
    - 404 if job not found
    - { "status": "processing" } if still running
    - { "status": "completed", "data": {...} } if finished
    - { "status": "error", "message": "..." } if failed
    """
    global video_jobs
    
    if job_id not in video_jobs:
        return jsonify({"error": "Job not found"}), 404
    
    job = video_jobs[job_id]
    status = job["status"]
    
    if status == "processing":
        return jsonify({"status": "processing"})
    
    elif status == "completed":
        return jsonify({
            "status": "completed",
            "data": job["result"]
        })
    
    elif status == "error":
        return jsonify({
            "status": "error",
            "message": job["error"]
        })
    
    # Fallback
    return jsonify({"status": status})


if __name__ == "__main__":
    port = int(os.getenv("PORT", os.getenv("TUBEINSIGHT_PORT", "5123")))
    is_production = os.getenv("RENDER") is not None
    logging.info(f"Starting TubeInsight API on port {port}")
    app.run(host="0.0.0.0", port=port, debug=not is_production)
