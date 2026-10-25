# Multimodal Construction Intelligence Platform

A beginner-friendly capstone prototype with a React (Vite) frontend and FastAPI backend.

## Features
- Site safety / PPE image audit (Gemini API if configured; otherwise clearly labelled demo analysis)
- Concrete crack image assessment (AI-assisted preliminary guidance; not an engineering certification)
- Construction cost and real-estate valuation estimates
- Weather-aware safety advisory (rule-based sample; no live weather feed)
- Construction site assistant (Gemini API if configured; otherwise demo guidance)
- JSON responses and basic input validation

## Architecture
- `backend/`: FastAPI, Pydantic, optional Gemini multimodal integration
- `frontend/`: React + Vite UI

## Run locally

### 1. Backend
Python 3.10+ recommended.

```bash
cd backend
python -m venv .venv
# Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# macOS/Linux:
# source .venv/bin/activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload
```

The API runs at `http://127.0.0.1:8000`; interactive API docs at `http://127.0.0.1:8000/docs`.

### 2. Frontend (new terminal)
Install Node.js LTS first.

```bash
cd frontend
npm install
npm run dev
```
Open the local URL printed by Vite, usually `http://localhost:5173`.

## Optional Gemini API
Set `GEMINI_API_KEY` in `backend/.env`. If no key is set, image and assistant endpoints use labelled demo mode. Never commit `.env` or publish your API key.

## Deployment notes
This repository is a working starter, not a guarantee of a public live deployment. Deploy backend to a Python host that supports FastAPI and frontend to a static host such as Vercel/Netlify. Set `VITE_API_BASE_URL` to the deployed backend URL and configure `GEMINI_API_KEY` as a server-side secret on the backend host. Test both URLs before submitting them to Skill Wallet.

## Important limitations
- Image findings are preliminary AI output and can be wrong. They must not replace qualified site safety or structural engineering inspection.
- Cost and property values are illustrative estimates, not professional quantity surveying or formal valuations.
- Weather advisories are selected from a user-chosen condition; this version does not fetch live weather.
