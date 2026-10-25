import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { Activity, AlertTriangle, Building2, CloudSun, HardHat, Image, MessageSquareText, Ruler, ShieldCheck, Upload, Wallet } from "lucide-react";
import "./styles.css";

const API = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
const money = (n) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);

function App() {
  const [tab, setTab] = useState("overview");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState(null);
  const [file, setFile] = useState(null);
  const [valuation, setValuation] = useState({ structure_type: "Residential", built_up_sqft: 1800, location_tier: "Tier 2", completion_percent: 35 });
  const [weather, setWeather] = useState({ condition: "High Wind", activity: "Crane operations" });
  const [question, setQuestion] = useState("What should be checked before concrete pouring?");
  const [context, setContext] = useState("Residential building, 2 floors");

  async function callApi(path, options = {}) {
    setBusy(true); setMessage(""); setResult(null);
    try {
      const response = await fetch(`${API}${path}`, options);
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Request failed");
      setResult(data);
      setMessage("Analysis complete");
    } catch (err) {
      setMessage(`Could not reach the API: ${err.message}. Make sure the FastAPI backend is running.`);
    } finally { setBusy(false); }
  }

  function imageRequest(path) {
    if (!file) { setMessage("Please select an image first."); return; }
    const body = new FormData(); body.append("file", file);
    callApi(path, { method: "POST", body });
  }

  const nav = [
    ["overview", "Overview", Activity], ["safety", "Site Safety Audit", ShieldCheck],
    ["cracks", "Crack Diagnostics", Image], ["valuation", "Planning & Valuation", Wallet],
    ["weather", "Weather Advisory", CloudSun], ["assistant", "Site Assistant", MessageSquareText]
  ];

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><HardHat size={23}/></div><div><strong>BuildSense<span> AI</span></strong><small>CONSTRUCTION INTELLIGENCE</small></div></div>
      <div className="nav-label">WORKSPACE</div>
      {nav.map(([id, label, Icon]) => <button key={id} className={`nav-item ${tab === id ? "active" : ""}`} onClick={() => { setTab(id); setResult(null); setMessage(""); }}><Icon size={18}/><span>{label}</span></button>)}
      <div className="sidebar-bottom"><div className="status-dot"></div><div><b>Prototype environment</b><small>AI-assisted decision support</small></div></div>
    </aside>
    <main className="main">
      <header className="topbar"><div><span className="eyebrow">CAPSTONE PROJECT / REAL ESTATE</span><h1>Multimodal Construction Intelligence</h1></div><div className="top-status"><span className="pulse"></span> System workspace</div></header>
      {tab === "overview" && <section>
        <div className="hero"><div className="hero-copy"><div className="hero-chip"><Activity size={14}/> SMART CONSTRUCTION PLATFORM</div><h2>Make better site decisions.<br/><em>Build with confidence.</em></h2><p>AI-assisted visual inspections, project estimates, and practical site advisories in one workspace.</p><button className="primary" onClick={() => setTab("safety")}>Start site assessment <span>→</span></button></div><div className="hero-art"><div className="art-circle"></div><Building2 size={116} strokeWidth={1.1}/><div className="art-tag"><ShieldCheck size={16}/> SAFETY + PLANNING</div></div></div>
        <div className="section-heading"><div><span className="eyebrow">YOUR WORKSPACE</span><h2>Intelligence modules</h2></div><span className="subtle">6 connected capabilities</span></div>
        <div className="module-grid">
          <Module icon={<ShieldCheck/>} title="Site Safety & PPE" desc="Review uploaded site images for visible PPE and possible hazards." onClick={() => setTab("safety")} tag="IMAGE AI"/>
          <Module icon={<Image/>} title="Crack Diagnostics" desc="Get a cautious preliminary assessment of visible surface defects." onClick={() => setTab("cracks")} tag="VISION"/>
          <Module icon={<Wallet/>} title="Project Valuation" desc="Estimate a budget, incurred cost, and indicative asset value." onClick={() => setTab("valuation")} tag="ESTIMATOR"/>
          <Module icon={<Ruler/>} title="Construction Planning" desc="Use project inputs to create a starting point for material planning." onClick={() => setTab("valuation")} tag="PLANNING"/>
          <Module icon={<CloudSun/>} title="Weather Advisory" desc="Generate rule-based precautions for selected weather conditions." onClick={() => setTab("weather")} tag="SAFETY"/>
          <Module icon={<MessageSquareText/>} title="Site Assistant" desc="Ask construction workflow questions and receive practical guidance." onClick={() => setTab("assistant")} tag="GENAI"/>
        </div>
        <div className="notice"><AlertTriangle size={18}/><p><b>Responsible use:</b> Outputs are preliminary decision support, not certified safety inspections, structural diagnoses, or professional valuations.</p></div>
      </section>}
      {tab === "safety" && <Feature title="Site Safety & PPE Audit" eyebrow="EPIC 2 / IMAGE-BASED ANALYSIS" intro="Upload a construction site photo to review visible PPE indicators and potential hazards." icon={<ShieldCheck/>}>
        <ImageUpload file={file} setFile={setFile}/><button className="primary" disabled={busy} onClick={() => imageRequest("/api/safety-audit")}>{busy ? "Analyzing…" : "Analyze site image"} <span>→</span></button>
      </Feature>}
      {tab === "cracks" && <Feature title="Crack Diagnostics" eyebrow="EPIC 2 / SURFACE ASSESSMENT" intro="Upload a concrete or wall image for cautious preliminary observations and next-step suggestions." icon={<Image/>}>
        <ImageUpload file={file} setFile={setFile}/><button className="primary" disabled={busy} onClick={() => imageRequest("/api/crack-analysis")}>{busy ? "Analyzing…" : "Assess surface image"} <span>→</span></button>
      </Feature>}
      {tab === "valuation" && <Feature title="Planning & Real Estate Valuation" eyebrow="EPIC 3 / PROJECT ESTIMATOR" intro="Change the project inputs to calculate illustrative budget and material estimates.">
        <div className="form-grid">
          <Field label="Structure type"><select value={valuation.structure_type} onChange={e => setValuation({...valuation, structure_type:e.target.value})}><option>Residential</option><option>Commercial</option><option>Industrial</option></select></Field>
          <Field label="Location tier"><select value={valuation.location_tier} onChange={e => setValuation({...valuation, location_tier:e.target.value})}><option>Tier 1</option><option>Tier 2</option><option>Tier 3</option></select></Field>
          <Field label="Built-up area (sq ft)"><input type="number" min="1" value={valuation.built_up_sqft} onChange={e => setValuation({...valuation,built_up_sqft:Number(e.target.value)})}/></Field>
          <Field label={`Completion: ${valuation.completion_percent}%`}><input type="range" min="0" max="100" value={valuation.completion_percent} onChange={e => setValuation({...valuation,completion_percent:Number(e.target.value)})}/></Field>
        </div>
        <button className="primary" disabled={busy || valuation.built_up_sqft <= 0} onClick={() => callApi("/api/valuation", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(valuation)})}>{busy ? "Calculating…" : "Calculate estimates"} <span>→</span></button>
      </Feature>}
      {tab === "weather" && <Feature title="Weather-Aware Site Advisory" eyebrow="EPIC 5 / DAILY SITE ASSISTANT" intro="Select a weather condition and activity to get a practical rule-based safety checklist. This demo does not fetch live weather.">
        <div className="form-grid"><Field label="Weather condition"><select value={weather.condition} onChange={e => setWeather({...weather,condition:e.target.value})}>{["Normal","High Wind","Heavy Rain","Extreme Heat"].map(x=><option key={x}>{x}</option>)}</select></Field><Field label="Planned activity"><select value={weather.activity} onChange={e => setWeather({...weather,activity:e.target.value})}>{["General work","Crane operations","Concrete pouring","Electrical work"].map(x=><option key={x}>{x}</option>)}</select></Field></div>
        <button className="primary" disabled={busy} onClick={() => callApi("/api/weather-advisory", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(weather)})}>{busy ? "Preparing…" : "Generate safety advisory"} <span>→</span></button>
      </Feature>}
      {tab === "assistant" && <Feature title="Construction Site Assistant" eyebrow="EPIC 5 / AI ADVISORY ENGINE" intro="Ask a construction workflow question. Configure a Gemini API key on the backend for model-generated answers.">
        <Field label="Project context"><input value={context} onChange={e=>setContext(e.target.value)} placeholder="Building type, floor count, current stage"/></Field>
        <Field label="Your question"><textarea rows="4" value={question} onChange={e=>setQuestion(e.target.value)} placeholder="Ask a construction-related question"/></Field>
        <button className="primary" disabled={busy} onClick={() => callApi("/api/assistant",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({question,project_context:context})})}>{busy ? "Thinking…" : "Ask site assistant"} <span>→</span></button>
      </Feature>}
      {message && <div className={`message ${message.includes("Could not") || message.includes("select") ? "error" : ""}`}>{message}</div>}
      {result && <ResultPanel data={result}/>}
      <footer>BUILDSENSE AI <span>•</span> Multimodal Construction Intelligence Platform <span>•</span> Capstone prototype</footer>
    </main>
  </div>
}

function Module({icon,title,desc,onClick,tag}) { return <button className="module-card" onClick={onClick}><div className="module-top"><div className="module-icon">{icon}</div><span className="module-tag">{tag}</span></div><h3>{title}</h3><p>{desc}</p><div className="module-link">Open module <span>↗</span></div></button> }
function Feature({title,eyebrow,intro,icon,children}) { return <section className="feature-page"><div className="feature-head"><div className="feature-icon">{icon}</div><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2><p>{intro}</p></div></div><div className="panel">{children}</div></section> }
function Field({label,children}) { return <label className="field"><span>{label}</span>{children}</label> }
function ImageUpload({file,setFile}) { return <label className="upload-box"><input type="file" accept="image/*" onChange={e=>setFile(e.target.files?.[0] || null)}/><div className="upload-icon"><Upload/></div><b>{file ? file.name : "Choose an image to upload"}</b><span>{file ? `${(file.size/1024/1024).toFixed(2)} MB selected` : "JPG or PNG · Maximum 10 MB"}</span></label> }
function ResultPanel({data}) {
  const pretty = (value) => typeof value === "object" && value !== null ? JSON.stringify(value,null,2) : String(value);
  if (data.estimated_project_budget_inr !== undefined) return <div className="result-panel"><div className="result-title"><div><span className="eyebrow">ESTIMATION RESULTS</span><h3>Project estimate summary</h3></div><span className="result-mode">Illustrative</span></div><div className="metric-grid"><Metric label="Estimated budget" value={money(data.estimated_project_budget_inr)}/><Metric label="Cost incurred" value={money(data.estimated_capex_incurred_inr)}/><Metric label="Indicative asset value" value={money(data.illustrative_market_asset_value_inr)}/><Metric label="Steel estimate" value={`${data.estimated_steel_kg.toLocaleString("en-IN")} kg`}/></div><p className="disclaimer">{data.disclaimer}</p><details><summary>View full JSON response</summary><pre>{JSON.stringify(data,null,2)}</pre></details></div>;
  if (data.answer) return <div className="result-panel"><div className="result-title"><h3>Assistant response</h3><span className="result-mode">{data.mode}</span></div><p className="answer-text">{data.answer}</p></div>;
  if (data.alerts) return <div className="result-panel"><div className="result-title"><h3>Site safety checklist</h3><span className="result-mode">Rule-based</span></div><ul className="alerts">{data.alerts.map((x,i)=><li key={i}>{x}</li>)}</ul><p className="disclaimer">This is not a live weather report. Follow the site's approved safety plan and competent supervisor's instructions.</p></div>;
  return <div className="result-panel"><div className="result-title"><div><span className="eyebrow">ANALYSIS OUTPUT</span><h3>{data.feature === "site_safety_audit" ? "Site safety analysis" : "Surface assessment"}</h3></div><span className="result-mode">{data.mode}</span></div><pre>{JSON.stringify(data.analysis,null,2)}</pre><p className="disclaimer">AI outputs may be incorrect. This result is preliminary and must not replace professional inspection.</p></div>;
}
function Metric({label,value}) { return <div className="metric"><span>{label}</span><strong>{value}</strong></div> }

createRoot(document.getElementById("root")).render(<App/>);
