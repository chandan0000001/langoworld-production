"""
TubeInsight API Server
Flask API wrapper for transcript extraction.
Runs as a local backend that the Next.js app calls.
"""

import os
import logging
import uuid
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

from services.youtube import get_video_id, get_video_info
from services.transcript import get_youtube_transcript

# Language detection
from langdetect import detect, detect_langs
from langdetect.lang_detect_exception import LangDetectException

load_dotenv()

app = Flask(__name__)
CORS(app)

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


@app.route("/api/video-understand", methods=["POST"])
def video_understand():
    """
    Process and analyze an uploaded video.

    Body: { "video_url": "https://..." }
    Returns: { "summary": "...", "keyPoints": [...], ... }
    """
    try:
        data = request.get_json()
        video_url = (data.get("video_url", "") if data else "").strip()

        if not video_url:
            return jsonify({"error": "video_url is required"}), 400

        logging.info(f"[VideoUnderstand] Processing video: {video_url}")

        # Generate unique ID
        summary_id = str(uuid.uuid4())
        summary_text = "This is a placeholder summary for the uploaded video."
        video_title = "Uploaded Video"
        channel = "Video"

        # Insert into Supabase
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

        if not supabase_url or not supabase_key:
            logging.error("[VideoUnderstand] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
            return jsonify({"error": "Server configuration error"}), 500

        insert_payload = {
            "id": summary_id,
            "video_title": video_title,
            "channel": channel,
            "summary": summary_text,
            "user_id": None,
            "video_url": video_url,
            "source": "upload",
        }

        headers = {
            "apikey": supabase_key,
            "Authorization": f"Bearer {supabase_key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        }

        supabase_insert_url = f"{supabase_url}/rest/v1/summaries"
        logging.info(f"[VideoUnderstand] Inserting summary {summary_id} into Supabase")

        insert_res = requests.post(supabase_insert_url, json=insert_payload, headers=headers)

        if insert_res.status_code not in (200, 201):
            logging.error(f"[VideoUnderstand] Supabase insert failed: {insert_res.status_code} {insert_res.text}")
            return jsonify({"error": "Failed to save summary", "details": insert_res.text}), 500

        logging.info(f"[VideoUnderstand] Successfully inserted summary {summary_id}")

        # Build response
        response = {
            "summary": summary_text,
            "keyPoints": [
                {"timestamp": "0:00", "point": "Video starts"}
            ],
            "explanation": "Video analysis will be implemented here.",
            "chapters": [
                {"content": "Placeholder chapter content", "startTime": "0:00"}
            ],
            "transcript": "Transcript extraction pending implementation.",
            "ttsSummary": "TTS summary placeholder.",
            "summaryPageId": summary_id,
            "summaryPageUrl": f"/video/summary/{summary_id}",
            "videoTitle": video_title,
            "channel": channel,
            "source": "upload",
            "videoAnalyzed": False,
        }

        logging.info(f"[VideoUnderstand] Returning response for: {video_url}")
        return jsonify(response)

    except Exception as e:
        logging.error(f"[VideoUnderstand] Error processing video: {e}")
        return jsonify({"error": "Video processing failed", "details": str(e)}), 500


if __name__ == "__main__":
    port = int(os.getenv("PORT", os.getenv("TUBEINSIGHT_PORT", "5123")))
    is_production = os.getenv("RENDER") is not None
    logging.info(f"Starting TubeInsight API on port {port}")
    app.run(host="0.0.0.0", port=port, debug=not is_production)
