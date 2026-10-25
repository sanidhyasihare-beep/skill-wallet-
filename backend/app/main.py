import base64
import json
import os
from typing import Literal, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

load_dotenv()

app = FastAPI(
    title="Multimodal Construction Intelligence Platform API",
    version="1.0.0",
    description="Capstone prototype for construction image analysis, planning, valuation, and advisory."
)

origins = [x.strip() for x in os.getenv("FRONTEND_ORIGINS", "http://localhost:5173").split(",") if x.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

def gemini_client():
    key = os.getenv("GEMINI_API_KEY", "").strip()
    if not key:
        return None
    try:
        from google import genai
        return genai.Client(api_key=key)
    except Exception:
        return None

def generate_ai(prompt: str, image_bytes: Optional[bytes] = None, mime_type: str = "image/jpeg") -> Optional[str]:
    client = gemini_client()
    if client is None:
        return None
    try:
        from google.genai import types
        contents = [prompt]
        if image_bytes:
            contents.append(types.Part.from_bytes(data=image_bytes, mime_type=mime_type))
        response = client.models.generate_content(
            model=os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),
            contents=contents,
        )
        return getattr(response, "text", None)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"AI provider request failed: {exc}")

def parse_json_response(text: str):
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.split("\n", 1)[-1]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
    start, end = cleaned.find("{"), cleaned.rfind("}")
    if start >= 0 and end > start:
        try:
            return json.loads(cleaned[start:end + 1])
        except json.JSONDecodeError:
            pass
    return {"summary": cleaned}

@app.get("/")
def root():
    return {"name": "Multimodal Construction Intelligence Platform", "status": "ok", "docs": "/docs"}

@app.get("/health")
def health():
    return {"status": "healthy", "ai_configured": bool(os.getenv("GEMINI_API_KEY", "").strip())}

class ValuationRequest(BaseModel):
    structure_type: Literal["Residential", "Commercial", "Industrial"] = "Residential"
    built_up_sqft: float = Field(gt=0, le=1_000_000)
    location_tier: Literal["Tier 1", "Tier 2", "Tier 3"] = "Tier 2"
    completion_percent: float = Field(ge=0, le=100)
    cost_per_sqft: Optional[float] = Field(default=None, gt=0, le=100000)

@app.post("/api/valuation")
def valuation(data: ValuationRequest):
    default_rates = {
        "Residential": {"Tier 1": 2600, "Tier 2": 2100, "Tier 3": 1750},
        "Commercial": {"Tier 1": 3600, "Tier 2": 3000, "Tier 3": 2450},
        "Industrial": {"Tier 1": 2200, "Tier 2": 1850, "Tier 3": 1550},
    }
    rate = data.cost_per_sqft or default_rates[data.structure_type][data.location_tier]
    budget = data.built_up_sqft * rate
    incurred = budget * data.completion_percent / 100
    # Indicative asset-value multiplier; not a formal property valuation.
    market_value = budget * 1.22
    steel_kg = data.built_up_sqft * (3.5 if data.structure_type == "Residential" else 4.5)
    cement_bags = data.built_up_sqft * (0.4 if data.structure_type == "Residential" else 0.48)
    return {
        "structure_type": data.structure_type,
        "built_up_sqft": data.built_up_sqft,
        "location_tier": data.location_tier,
        "assumed_cost_per_sqft_inr": round(rate, 2),
        "estimated_project_budget_inr": round(budget, 2),
        "estimated_capex_incurred_inr": round(incurred, 2),
        "illustrative_market_asset_value_inr": round(market_value, 2),
        "estimated_steel_kg": round(steel_kg, 2),
        "estimated_cement_bags": round(cement_bags, 2),
        "completion_percent": data.completion_percent,
        "disclaimer": "Indicative demo estimates only. Actual rates and quantities depend on drawings, location, specifications, and professional assessment."
    }

class WeatherRequest(BaseModel):
    condition: Literal["Normal", "High Wind", "Heavy Rain", "Extreme Heat"]
    activity: Literal["General work", "Crane operations", "Concrete pouring", "Electrical work"] = "General work"

@app.post("/api/weather-advisory")
def weather_advisory(data: WeatherRequest):
    advice = {
        "Normal": ["Follow the approved site safety plan.", "Keep walkways clear and PPE in use."],
        "High Wind": ["Pause or restrict crane and lifting operations according to site wind limits.", "Secure loose materials and temporary structures."],
        "Heavy Rain": ["Inspect drainage and slippery access routes.", "Protect electrical equipment and reassess excavation stability."],
        "Extreme Heat": ["Provide drinking water, shaded rest, and work-rest breaks.", "Watch for heat illness and adjust strenuous work schedules."]
    }[data.condition]
    if data.activity == "Crane operations" and data.condition == "High Wind":
        advice.insert(0, "Do not proceed unless the competent site supervisor confirms wind conditions are within the crane manufacturer's limits.")
    if data.activity == "Electrical work" and data.condition == "Heavy Rain":
        advice.insert(0, "Avoid exposed electrical work in wet conditions; isolate hazards and use qualified personnel.")
    return {"condition": data.condition, "activity": data.activity, "alerts": advice, "source": "Rule-based demo advisory", "live_weather": False}

async def analyse_image(file: UploadFile, mode: str):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Upload a valid image file (JPG, PNG, or another supported image format).")
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="The uploaded image is empty.")
    if len(data) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Image must be 10 MB or smaller.")
    if mode == "safety":
        prompt = """You are a construction safety assistant. Inspect this image cautiously. Return valid JSON with keys: safety_score (0-100 or null), overall_status, ppe_detection (object with helmet, high_visibility_vest, boots, harness values as 'visible', 'not_visible', or 'uncertain'), hazards (array of objects with hazard, severity, evidence, suggested_action), limitations. Do not claim certainty when an item cannot be seen. This is preliminary assistance, not a compliance certification."""
        fallback = {
            "safety_score": None,
            "overall_status": "Demo mode — image AI not configured",
            "ppe_detection": {"helmet": "uncertain", "high_visibility_vest": "uncertain", "boots": "uncertain", "harness": "uncertain"},
            "hazards": [{"hazard": "Image has not been analyzed by a configured vision model", "severity": "Unknown", "evidence": "No AI API key configured", "suggested_action": "Configure GEMINI_API_KEY or have a qualified safety officer inspect the site."}],
            "limitations": "Demo fallback; no visual conclusion has been made."
        }
    else:
        prompt = """You are a cautious construction image assistant. Inspect the visible concrete/wall surface and return valid JSON with keys: defect_type, estimated_severity, visible_observations, possible_causes, suggested_next_steps, urgency, limitations. Do not claim an exact crack width from an ordinary photo, do not assert structural safety, and recommend a qualified engineer for significant, growing, diagonal, wide, or water-ingress cracks."""
        fallback = {
            "defect_type": "Not assessed (demo mode)",
            "estimated_severity": "Unknown",
            "visible_observations": ["Image AI is not configured, so the uploaded image was not visually assessed."],
            "possible_causes": [],
            "suggested_next_steps": ["Configure GEMINI_API_KEY to enable AI analysis.", "For suspected structural cracks, obtain an inspection by a qualified structural engineer."],
            "urgency": "Unassessed",
            "limitations": "Demo fallback; no visual conclusion has been made."
        }
    generated = generate_ai(prompt, data, file.content_type)
    if generated:
        return {"mode": "gemini", "analysis": parse_json_response(generated)}
    return {"mode": "demo", "analysis": fallback}

@app.post("/api/safety-audit")
async def safety_audit(file: UploadFile = File(...)):
    result = await analyse_image(file, "safety")
    return {"feature": "site_safety_audit", **result}

@app.post("/api/crack-analysis")
async def crack_analysis(file: UploadFile = File(...)):
    result = await analyse_image(file, "crack")
    return {"feature": "crack_diagnostics", **result}

class AssistantRequest(BaseModel):
    question: str = Field(min_length=3, max_length=2000)
    project_context: str = Field(default="", max_length=2000)

@app.post("/api/assistant")
def assistant(data: AssistantRequest):
    prompt = (
        "You are a construction project information assistant. Give concise, practical, safety-first guidance. "
        "Do not replace a licensed engineer, architect, safety officer, or local code. If the user describes imminent danger, "
        "tell them to stop work, secure the area, and contact qualified site personnel. "
        f"Project context: {data.project_context or 'Not supplied'}\nQuestion: {data.question}"
    )
    generated = generate_ai(prompt)
    if generated:
        return {"mode": "gemini", "answer": generated}
    return {
        "mode": "demo",
        "answer": "Demo guidance: clarify the site conditions, check the approved drawings and method statement, follow local codes and the site safety plan, and consult the responsible qualified professional for structural, electrical, lifting, or other high-risk decisions. Configure GEMINI_API_KEY for AI-generated responses."
    }
