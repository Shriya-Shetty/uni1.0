# NivaaranAI

## Problem Statement
PS5- Unified Customer Complaint Communication Dashboard. 
This project addresses the problem of fragmented customer complaint management in banking systems by providing a Gen-AI powered unified complaint communication dashboard that automates complaint analysis, categorization, SLA tracking, escalation management, and intelligent resolution support.


## Live Demo

🔗 Live Demo: https://uni1-0.vercel.app/ (Since the backend is quite heavy, it has not been deployed.)

🎥 Demo Video: https://youtu.be/6-mUK39SssM?si=2eZJiWRHsjdb61fc 

Run locally using instructions below.

## Tech Stack

### Frontend
- React 18 with TypeScript  
- Vite  
- Tailwind CSS  
- Shadcn UI  
- React Query  
- Axios  
- Recharts  

### Backend
- Python 3.11  
- FastAPI  
- MongoDB  
- Motor Driver  

### AI / NLP
- Hugging Face Transformers (BART, RoBERTa)  
- Sentence Transformers (MiniLM-L6-v2)  
- FAISS Vector Similarity Search  
- Groq Cloud (Llama 3)  
- Vosk + Whisperflow (Voice Processing)  

### Other Tools
- PyPDF2  
- React Hook Form + Zod  
- Python-dotenv  

---

## How to Run Locally

### Backend Setup

1. Clone the repository:
```bash
git clone https://github.com/Shriya-Shetty/uni1.0.git
```

2. Navigate to backend:
```bash
cd backend
```

3. Create virtual environment:
```bash
python -m venv venv
```

4. Activate virtual environment:
```bash
venv\Scripts\activate
```

5. Install dependencies:
```bash
pip install -r requirements.txt
```

6. Create `.env` file:
```env
    GROQ_API_KEY=your_groq_api_key_here
   MONGODB_URL=mongodb+srv://shravaniparte_db_user:B0pLrR5D97Xoz6OC@clustercomplaint.yehgsfc.mongodb.net/smart_resolve_db
   DATABASE_NAME=smart_resolve_db
   PORT=8000
```
Generate Your Groq API Key
Visit the Groq Console: https://console.groq.com/keys
Click on Create API Key
Enter a display name for your key
Click Generate
Copy the generated API key
Replace your_groq_api_key_here in the .env file with your generated API key

7. Run backend server:
```bash
uvicorn main:app --reload
```

Backend runs at:
```bash
http://localhost:8000
```

---

### Frontend Setup

1. Navigate to frontend:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
VITE_API_BASE_URL=http://localhost:8000
```

4. Start frontend:
```bash
npm run dev
```

Frontend runs at:
```bash
http://localhost:5173
```

---

## Project Structure

```bash
uni1.0/
├── backend/
│   ├── main.py              # FastAPI application entry point
│   ├── ai_engine.py         # Core AI processing logic
│   ├── constants.py         # Product classifications, issue types, severity mappings
│   ├── database.py          # MongoDB connection and operations
│   ├── models.py            # Pydantic models for data validation
│   ├── services.py          # Business logic for complaint operations
│   └── requirements.txt     # Python dependencies
│
└── frontend/
    ├── src/
    │   ├── components/      # Reusable UI components
    │   ├── pages/           # Page components (Index, Login, etc.)
    │   ├── api/             # API service functions
    │   ├── hooks/           # Custom React hooks
    │   └── lib/             # Utility functions
    ├── public/              # Static assets
    ├── package.json         # Node.js dependencies and scripts
    └── vite.config.ts       # Vite configuration
```

---

## Dataset

Dataset

The project does not require a dedicated training dataset, as it uses pre-trained NLP and Gen-AI models for complaint analysis and response generation. During development and testing, sample banking complaint records were manually created to validate functionalities such as complaint classification, sentiment analysis, severity scoring, duplicate detection, SLA tracking, and escalation workflows.

The sample complaints cover common banking scenarios, including:

UPI transaction issues
ATM-related complaints
Credit/Debit card disputes
Loan-related grievances
Internet and mobile banking issues
Fraud and security concerns

No real customer banking data was used during development or testing

---
## INSTRUCTIONS — Synthetic data generation for Union Bank Grievance AI System

Goal: Generate synthetic complaint records + derived analytics that match the backend schema (backend/models.py) and render correctly in the frontend.

## 1) What to generate

Generate synthetic instances for:

1. *Complaints (core dataset)*
   - Individual complaint records with narrative + extracted/derived fields.
   - Used by admin UI tables/detail pages and analytics widgets.

2. *Analytics aggregates (derived datasets)*
   - Trend time series (e.g., complaints/resolved/escalated per day)
   - Product distribution
   - Severity distribution
   - SLA breakdown / SLA risk buckets

You can generate (2) after (1) by aggregating your complaint records.

## 2) Backend schema mapping (source of truth)

Backend complaint model is defined in *backend/models.py* as ComplaintCreate and Complaint.

### 2.1 Required fields for record creation (ComplaintCreate)

- customer_id (string)
- customer_name (string)
- product (string, optional default usually “General”)
- sub_product (string | null)
- issue (string, optional default usually “General Inquiry”)
- sub_issue (string | null)
- consumer_complaint_narrative (string) ✅ *must be present*
- company (string, default “Union Bank”)
- state (string | null)
- zip_code (string | null)
- submitted_via (string) (Email, OCR, Chatbot, Voice, Web) ✅
- consumer_consent_provided (string, default “Yes”)
- financial_impact_amount (number | null; default 0.0)

### 2.2 Derived/extra fields in Complaint (stored + enriched)

When persisting, ensure your synthetic pipeline also fills:

- Identity / timing
  - id / complaint_id
  - date_received (datetime)
  - date_sent_to_company (datetime)
  - sla_deadline (datetime)

- Categorization
  - product, sub_product, issue, sub_issue
  - keywords_extracted (list[str])
  - root_cause_category (optional)

- Sentiment & severity
  - sentiment_label (e.g., en labels used by your system)
  - sentiment_score (float)
  - severity_label (Critical/High/Medium/Low)
  - severity_score (float)

- SLA status
  - sla_status in {On Track, At Risk, Breached}
  - timely_response (string like “Yes”)

- Escalation & priority
  - escalation_level (Branch, Regional Office, MD/CEO Desk)
  - priority_rank (float)

- Duplicate metadata
  - duplicate_detected (bool)
  - duplicate_cluster_id (optional string)
  - similar_complaints_count (int)

- Communications / AI
  - human_review_status (Pending/Approved/Rejected)
  - status (Open/In Progress/Resolved/Escalated)
  - ai_generated_response (optional string)
  - ai_suggested_resolution_template (optional string)
  - company_response_to_consumer (optional string)
  - communication_history (list of dicts)

## 3) Frontend-consumable fields

The frontend renders complaint details and uses the stored fields similarly. Ensure at minimum that each complaint record includes:

- identifiers: complaint_id
- narrative: consumer_complaint_narrative
- categorization: product, issue, sub_issue
- operational state: status, human_review_status
- SLA: sla_deadline, sla_status
- customer: customer_name
- derived quality signals: sentiment_label, severity_label, keywords_extracted

## 4) Synthetic text generation rules (narrative + keywords)

### 4.1 Build product/type templates
Use a library of complaint “templates” and swap entities/values.

For each generated complaint:
1. Pick a *product* (e.g., Credit Card, ATM, UPI, Cheque, Savings Account, Net Banking, Loan, Fixed Deposit).
2. Pick an *issue* and *sub_issue* pair consistent with the chosen product.
3. Generate a narrative paragraph containing:
   - what happened
   - key amounts and/or IDs (UTR, transaction ref, cheque number)
   - approximate dates/time (“on 25th Feb at 8:15 AM”)
   - desired action (refund/reversal/credit card block/manual correction)
   - urgency indicators (e.g., “need money urgently”, “financial hardship”, “sent today”, “still not credited”)

### 4.2 Keyword extraction (must be consistent)
Create keywords_extracted by:
- using a controlled vocabulary (issue-specific keywords)
- plus 2–6 narrative keywords (amount markers, UTR/ATM IDs, locations, “refund”, “reversal”, “OTP”, “not received”, etc.)

Keep keywords stable across duplicate complaint clusters (see section 6).

## 5) SLA deadline generation logic

Generate SLA fields in a consistent, explainable way.

1. Choose a date_received (random datetime within your dataset range).
2. Pick an SLA duration per (product, issue/sub_issue).
3. Set:
   - sla_deadline = date_received + sla_duration
4. Determine sla_status based on “current time” or a synthetic “reporting time”:
   - *On Track*: now < sla_deadline - buffer
   - *At Risk*: within buffer window (e.g., last 20–30% of SLA)
   - *Breached*: now > sla_deadline

Tip: If you’re generating a dataset for a static UI snapshot, set “now” to a fixed timestamp and compute SLA status deterministically.

## 6) Duplicates & similarity clusters

To test duplicate detection and clustering features:

1. Create *duplicate clusters* of size 2–5.
2. Within a cluster:
   - keep the same product, issue, sub_issue
   - reuse core keywords and narrative pattern
   - vary customer/amount/date slightly
3. Set:
   - duplicate_detected = true for all cluster members (or for all but one)
   - duplicate_cluster_id = <cluster id>
   - similar_complaints_count = cluster_size - 1

## 7) Status, escalation level, and priority rank

Create operational realism:

### 7.1 Status transitions
Allowed statuses (from stored model comments):
- Open, In Progress, Resolved, Escalated

A simple deterministic rule:
- Very recent + high severity ⇒ Open/In Progress
- Past SLA or high urgency ⇒ Escalated
- After a “resolution step” time ⇒ Resolved

### 7.2 Escalation level
Map severity + SLA breach to escalation:
- Critical / breached ⇒ MD/CEO Desk (or Regional Office)
- High / at risk ⇒ Regional Office
- Medium / on track ⇒ Branch

### 7.3 priority_rank
Compute priority_rank as a float derived from:
- severity weight (Critical highest)
- + escalation weight
- + SLA risk weight
- + financial_impact_amount normalization

Ensure it is monotonic: higher-risk complaints get higher priority_rank.

## 8) communication_history generation

Fill communication_history as a chronological list of dict entries.

Each entry shape should include at least:
- timestamp (datetime string)
- actor (Customer / System / Agent / Moderator / AI)
- message (short text)

Recommended event types:
- created
- ai_analysis (categorization, urgency)
- assigned
- agent_review
- resolution / response_sent
- agent_approval

## 9) Analytics aggregates generation (derived)

Given complaints dataset:

### 9.1 Trend data
For each day/week bucket:
- complaints = count(status != Deleted)
- resolved = count(status == Resolved)
- escalated = count(status == Escalated)

### 9.2 Product distribution
Group by product and compute value as count.

### 9.3 Severity distribution
Group by severity_label and compute value as count.

### 9.4 SLA data
Group by (product, issue/sub_issue, severity_label) and compute:
- count
- avg_resolution_hours (if you generate resolution timestamps)
- sla_hours (from your SLA mapping)
- template (optional: pick a resolution template corresponding to issue)

## 10) Dataset size guidance

Common dataset sizes for good dashboard performance:
- *Starter*: 50–200 complaints
- *Better analytics*: 500–1500 complaints
- *Stress testing*: 5000+ complaints (if your environment can handle it)

Maintain coverage across:
- all products
- all severities
- all submitted_via channels
- duplicate clusters (at least 10–20 clusters for 200–500 records)

## 11) Example synthetic record (Complaint-like)

Use values consistent with your chosen vocabulary.

json
{
  "complaint_id": "UBI-2026-00142",
  "customer_id": "CUST-78432",
  "customer_name": "Rajesh Kumar Sharma",
  "consumer_complaint_narrative": "I noticed two unauthorized transactions of ₹8,500 and ₹6,500 on my credit card ending 4523 on 27th Feb. I have not shared my card or OTP. This is fraud. I want immediate reversal and the card blocked.",
  "company": "Union Bank",
  "submitted_via": "email",
  "product": "Credit Card",
  "sub_product": null,
  "issue": "Fraud",
  "sub_issue": null,
  "state": "Maharashtra",
  "zip_code": "400053",
  "consumer_consent_provided": "Yes",
  "financial_impact_amount": 15000,

  "date_received": "2026-02-28T14:23:00",
  "date_sent_to_company": "2026-02-28T14:23:10",
  "sla_deadline": "2026-03-03T10:00:00",

  "sentiment_label": "very_negative",
  "sentiment_score": 0.92,
  "severity_label": "Critical",
  "severity_score": 0.95,

  "keywords_extracted": ["credit card", "unauthorized", "fraud", "reversal", "blocked", "OTP"],

  "sla_status": "Breached",
  "timely_response": "No",
  "consumer_disputed": "Yes",

  "escalation_level": "MD/CEO Desk",
  "status": "Escalated",
  "human_review_status": "Pending",
  "priority_rank": 0.98,

  "duplicate_detected": true,
  "duplicate_cluster_id": "CLST-CC-FRAUD-001",
  "similar_complaints_count": 2,

  "root_cause_category": "Card fraud / unauthorized transaction",

  "ai_generated_response": "We have initiated an investigation and initiated immediate safety actions.",
  "ai_suggested_resolution_template": "Credit Card:Fraud",

  "communication_history": [
    {"timestamp": "2026-02-28T14:23:00", "actor": "System", "message": "Complaint registered via email."},
    {"timestamp": "2026-02-28T14:23:05", "actor": "AI Engine", "message": "Categorized: Credit Card → Fraud; Critical severity."},
    {"timestamp": "2026-02-28T14:25:00", "actor": "System", "message": "Escalated due to Critical severity."}
  ],

  "audit_log_enabled": true
}

## 12) Deterministic generation for repeatability

For stable evaluation/testing:
- Use a fixed seed for pseudo-random generation.
- Use fixed “today/now” timestamp to compute SLA statuses.
- Keep mappings of product→issue→SLA duration and severity weights constant.

## 13) Minimal generation checklist

For every complaint record:
- narrative matches product/issue/sub_issue
- keywords_extracted derived from the same vocabulary
- sla_deadline computed from date_received + SLA rules
- sla_status computed using the fixed reporting time
- status, escalation_level, and priority_rank reflect severity + SLA state
- duplicates: cluster ids set consistently
- communication history is ordered chronologically

---

## Model Performance (on Synthetic Data)
BERT SCORE
Precision: 0.9981 | Recall: 0.9969 |F1 Score: 0.9975

BLEU Score: 100.0000

Running Chatbot Elo Rating Simulation ---
Initial Ratings -> Groq_Llama: 1200, Local_Transformers: 1000
Final Ratings   -> Groq_Llama: 1232.02, Local_Transformers: 967.98

Running ROUGE Evaluation ---
ROUGE-1: 0.9857
ROUGE-2: 0.9757
ROUGE-L: 0.9857 

> Note: Results are based on synthetic complaint datasets and would require fine-tuning on real banking complaint data for production deployment.

---

## Known Limitations

- Currently trained and tested on synthetic complaint datasets only.  
- Real banking deployment would require integration with core banking systems.  
- Voice processing accuracy may vary depending on audio quality and accents.  
- AI-generated responses still require human review for regulatory compliance.  

---

## Team

Shravani Parte — AI/ML Engine Development (Complaint Classification + Root Cause Analysis)

Shriya Shetty — Backend & Data Pipeline (Database + API Development)

Navya Goel — Frontend Dashboard & Visualizations (React/TypeScript)

Samruddhi Ambre — Integration, Testing & Documentation (QA + DevOps) 


---

## Contact

For any queries about this submission:

Team Name: Nerd.js

Institute: K.J Somaiya School of Engineering

Email IDs:

Shravani Parte- shravani.parte@somaiya.edu

Shriya Shetty- shriya09@somaiya.edu

Navya Goel- navya.goel@somaiya.edu

Samruddhi Ambre- samruddhi.ambre@somaiya.edu

iDEA 2.0 Phase 2 Submission
