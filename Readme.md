# 🧠 Personality Intelligence Platform

> **A scientifically-backed, AI-powered personality assessment platform built on the semantic web (OWL Ontology) and large language models.**

<!-- Badges -->
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)

<br/>

<details>
<summary><b>📑 Table of Contents</b> (Click to expand)</summary>

- [Project Overview](#project-overview)
- [Live Demo](#live-demo)
- [Screenshots](#screenshots)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Architecture](#project-architecture)
- [Folder Structure](#folder-structure)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Running the Project](#running-the-project)
- [API Overview](#api-overview)
- [How It Works](#how-it-works)
- [Technical Highlights](#technical-highlights)
- [Design Decisions](#design-decisions)
- [Security](#security)
- [Performance](#performance)
- [Testing](#testing)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgements](#acknowledgements)
- [Contact](#contact)
</details>

---

## 🎯 Project Overview

**Problem:** Most online personality tests are simplistic, static, and provide generic horiscope-like advice. They lack deep scientific grounding and fail to offer actionable, context-aware insights.

**Solution:** The Personality Intelligence Platform revolutionizes self-discovery by combining the **IPIP-50 Big Five framework** with a **Semantic Web OWL Ontology** and **Groq-powered Large Language Models (LLMs)**. It evaluates a user's personality traits, infers predictive life outcomes (like job performance and leadership potential) using deterministic graph traversal, and then uses a RAG pipeline to generate hyper-personalized career and growth guidance.

**Target Users:** Professionals seeking career direction, students exploring their strengths, and psychology enthusiasts looking for deep, scientifically-backed introspection.

**Unique Aspects:**
* **Ontology-Driven Logic:** Questions, traits, and correlations are not hardcoded. They are dynamically inferred from an RDF/OWL semantic knowledge graph using `owlready2`.
* **AI Guidance:** Leverages LLaMA-3 (via Groq) + RAG to provide personalized psychiatrist-level advice.

---

## 🚀 Live Demo

- **Live Application:** [https://personality-intelligence-platform.vercel.app](https://personality-intelligence-platform.vercel.app) 
- **API Documentation:** [https://personality-intelligence-platform.fly.dev/docs](https://personality-intelligence-platform.fly.dev/docs) 

---

## 📸 Screenshots

| Landing Page | Assessment Question |
|:---:|:---:|
| ![Landing Page](./assets/screenshots/landing-page.png) | ![Assessment Question](./assets/screenshots/assessment-question.png) |

| Profile Results | Predicted Outcomes |
|:---:|:---:|
| ![Profile Results](./assets/screenshots/profile-results.png) | ![Predicted Outcomes](./assets/screenshots/predicted-outcomes.png) |

| Participant Details |
|:---:|
| ![Participant Details](./assets/screenshots/participant-details.png) |

---

## ✨ Features

### 🧠 Assessment & Scoring
* **IPIP-50 Inventory:** Scientifically validated 50-item personality assessment.
* **OWL Ontology Reasoning:** Extracts traits and predicts outcomes dynamically using semantic knowledge graphs.
* **Percentile Ranking:** Scores are normalized against a massive real-world dataset.

### 🤖 AI & Insights
* **Groq Integration:** Ultra-low latency inference using LLaMA-3.
* **RAG Pipeline:** Augments prompts with psychological contexts and lifestyle questionnaire answers.
* **Personalized Strategy:** Generates actionable growth and career plans.

### 📊 Reporting
* **Dynamic PDF Generation:** Exports highly customized, multi-page professional PDF reports (`reportlab`).
* **Interactive Data Viz:** Real-time charting of personality distributions.

### 🛡️ Architecture & Security
* **Stateless Deployment:** Serverless-ready FastAPI backend.
* **MongoDB Persistence:** Asynchronous, secure cloud database integration (`Motor`).
* **Responsive Design:** Premium glassmorphism UI optimized for desktop and mobile.

---

## 🛠️ Tech Stack

| Technology | Purpose | Version |
|---|---|---|
| **React** | Frontend UI Framework | `18.2` |
| **Vite** | Frontend Build Tool | `5.0` |
| **TailwindCSS** | Utility-First Styling | `3.4` |
| **Framer Motion** | UI Animations & Transitions | `11.0` |
| **FastAPI** | High-Performance Backend Framework | `0.138.0` |
| **Motor** | Async MongoDB Driver | `3.7.1` |
| **Owlready2** | Semantic Web / OWL Reasoning | `0.49` |
| **LangChain** | LLM Orchestration & RAG | `1.3.11` |
| **Groq** | Ultra-Fast LLM Inference Provider | *Cloud* |
| **ReportLab** | Dynamic PDF Generation | `4.2.5` |

---

## 🏗️ Project Architecture

```mermaid
graph TD
    User([User]) -->|HTTP/HTTPS| Vercel[Frontend - React/Vite on Vercel]
    Vercel -->|REST API| Fly[Backend - FastAPI on Fly.io]
    
    subgraph Backend Services
        Fly -->|Ontology Reasoning| OWL[(Big Five OWL/RDF Graph)]
        Fly -->|Async R/W| Mongo[(MongoDB Atlas)]
        Fly -->|PDF Export| PDF[ReportLab Service]
        Fly -->|Context Retrieval| RAG[RAG Document Store]
        Fly -->|LLM Inference| Groq[Groq API / LLaMA-3]
    end
    
    RAG --> Groq
    OWL --> Fly
```

---

## 📁 Folder Structure

```text
d:\personality-traits-ontology-main
├── backend/                  # FastAPI Application
│   ├── app/
│   │   ├── db/               # MongoDB asynchronous connection and queries
│   │   ├── models/           # Pydantic schemas for data validation
│   │   ├── routes/           # API Endpoints (assessment, guidance, results, etc.)
│   │   ├── services/         # Business logic (LLM, RAG, Ontology, PDF)
│   │   ├── knowledge/        # Markdown documents used for RAG
│   │   ├── bigfive.rdf       # The core Semantic Web knowledge graph
│   │   └── ontology.owl      
│   ├── api.py                # FastAPI entry point & CORS configuration
│   ├── Dockerfile            # Production container configuration
│   ├── fly.toml              # Fly.io deployment config
│   └── requirements.txt      # Python dependencies
├── frontend/                 # React Application
│   ├── src/
│   │   ├── components/       # Reusable React components (Pages, Forms, Modals)
│   │   ├── lib/              # Utility functions and API helpers
│   │   ├── App.jsx           # Main React Router setup
│   │   └── main.jsx          # React DOM entry
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js    # Design system tokens and plugins
│   └── vite.config.js        # Build configuration
└── run.ps1                   # Automation script for local dev
```

---

## ⚙️ Installation

### Prerequisites
* **Node.js** (v18+)
* **Python** (v3.10+)
* **MongoDB Atlas** account (or local MongoDB)
* **Groq API Key** (Free tier available)

### 1. Clone Repository
```bash
git clone https://github.com/your-username/personality-intelligence-platform.git
cd personality-traits-ontology-main
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate | Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```

---

## 🔐 Environment Variables

Create a `.env` file in **both** the `frontend` and `backend` directories.

### `backend/.env`
| Variable | Required | Description | Example |
|---|---|---|---|
| `MONGODB_URI` | Yes | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/...` |
| `GROQ_API_KEY` | Yes | API key for LLM inference | `gsk_abc123...` |
| `ADMIN_PASSWORD_HASH` | Yes | SHA256 hash of admin password | `7b8992...` |
| `ALLOWED_ORIGINS` | No | Comma-separated CORS origins | `http://localhost:5173,https://myapp.com` |

### `frontend/.env`
| Variable | Required | Description | Example |
|---|---|---|---|
| `VITE_API_URL` | Yes | URL pointing to the FastAPI backend | `http://localhost:8000/api` |

*(Do not commit real API keys to version control. An `.env.example` file is provided).*

---

## 🏃‍♂️ Running the Project

### The Easy Way (Windows)
Run the provided PowerShell script from the root directory to start both servers simultaneously:
```powershell
.\run.ps1
```

### The Manual Way
**Terminal 1 (Backend):**
```bash
cd backend
# Make sure venv is activated
uvicorn api:app --reload
```
*API will run at `http://localhost:8000`*

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```
*UI will run at `http://localhost:5173`*

---

## 🌐 API Overview

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/questions` | `GET` | Parses the OWL ontology and returns 50 IPIP questions and Likert scales. |
| `/api/submit` | `POST` | Validates responses, calculates T-Scores and Percentiles, and saves to MongoDB. |
| `/api/results/{id}` | `GET` | Fetches a completed assessment from MongoDB. |
| `/api/export/pdf/{id}`| `GET` | Streams a dynamically generated, multi-page PDF report. |
| `/api/guidance/stream`| `POST` | Streams personalized LLM guidance via Server-Sent Events (SSE). |

---

## 🔄 How It Works

1. **Initialization:** On the first request, the backend parses `bigfive.rdf` into memory using `owlready2` (Lazy Loading).
2. **Assessment:** The user takes the 50-item test. 
3. **Scoring:** The backend normalizes the raw scores against a 1-million respondent dataset, calculating exact percentiles.
4. **Graph Traversal:** The ontology graph is traversed to discover correlations (e.g., *High Conscientiousness* predicts *Job Performance*).
5. **Persistence:** Results are stored asynchronously in MongoDB.
6. **RAG & Insights:** The user answers lifestyle questions. These answers + trait scores are fed into a RAG pipeline. Groq's LLaMA-3 synthesizes this with psychological literature to stream personalized advice.

---

## 🔬 Technical Highlights & Design Decisions

### Why OWL/RDF (Semantic Web)?
Instead of hardcoding questions and traits in a database, the platform uses an **Ontology**. This allows the system to logically infer relationships (e.g., recognizing that a question is *negatively keyed* to *Neuroticism*, which in turn *negatively correlates* with *Leadership*). 

### Why FastAPI & Async?
Python was chosen due to its monopoly on AI and semantic web libraries (`owlready2`, `langchain`). FastAPI with `Motor` allows non-blocking I/O, ensuring that database saves and Groq API streaming do not block the main thread.

### Lazy-Loaded Ontology
Loading an OWL graph takes ~70 seconds. If loaded during app startup in a serverless environment (like Fly.io), health checks fail and deployments crash. **Solution:** The ontology is completely bypassed during startup and is lazy-loaded on the very first HTTP request.

---

## 🔒 Security

* **Environment Separation:** API keys are never exposed to the frontend. All LLM and DB calls occur securely on the backend.
* **Pydantic Validation:** Every incoming JSON payload is strictly validated to prevent injection or malformed data.
* **CORS:** FastAPI is configured to strictly allow only the Vercel production domain and `localhost`.

---

## 🚀 Deployment

### Backend (Fly.io)
1. Install Fly CLI.
2. Navigate to `backend/`.
3. Add secrets: `fly secrets set MONGODB_URI="..." GROQ_API_KEY="..."`
4. Deploy: `fly deploy`

*(Note: `min_machines_running = 1` is configured in `fly.toml` to prevent the Fly instance from going to sleep, avoiding 40-second wake-up timeouts).*

### Frontend (Vercel)
1. Push your code to GitHub.
2. Import the `frontend` folder as a project in Vercel.
3. Set Environment Variable: `VITE_API_URL = https://your-fly-app.fly.dev/api`
4. Deploy.

---

## 🛠️ Troubleshooting

<details>
<summary><b>MongoDB Connection Fails (500 Error on Save/PDF)</b></summary>
MongoDB Atlas blocks all external IP addresses by default. If your backend is deployed to Fly.io, you must log into MongoDB Atlas, go to <b>Network Access</b>, and add <code>0.0.0.0/0</code> (Allow Access from Anywhere) so Fly.io can connect.
</details>

<details>
<summary><b>PDF Download Button is Disabled</b></summary>
If the database save fails (see above), the assessment doesn't generate an ID. Without an ID in the database, the PDF cannot be generated, so the button disables itself. Fix the MongoDB connection, and the button will work.
</details>

<details>
<summary><b>Frontend "Connection Error" on First Load</b></summary>
The very first request after a server restart triggers the 70-second Ontology load. Ensure your Vercel/frontend timeout limits aren't set too strictly (Vercel free tier times out at 10s by default, meaning you may need a Vercel Pro account or a different host if you can't cache the initial load).
</details>

---

## 🗺️ Roadmap

- [x] IPIP-50 Integration
- [x] OWL Ontology Reasoning
- [x] Groq LLM RAG Pipeline
- [x] MongoDB Persistence
- [x] Fly.io & Vercel Deployment
- [ ] Add Google/GitHub OAuth Authentication
- [ ] Implement team/group analytics comparisons
- [ ] Compile Ontology to SQLite for instant cold-starts

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:
1. Fork the project.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 🙏 Acknowledgements

* [IPIP (International Personality Item Pool)](https://ipip.ori.org/) for the open-source psychological datasets.
* [Groq](https://groq.com/) for ultra-fast LPU inference.
* [Owlready2](https://owlready2.readthedocs.io/) for Python ontology parsing.

---


