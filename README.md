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

The project currently uses synthetic banking complaint data generated for testing and development purposes. The dataset simulates customer complaints across multiple banking products and channels including:

- UPI transactions  
- ATM issues  
- Credit/Debit card complaints  
- Loan-related grievances  
- Internet and mobile banking issues  
- Fraud and security complaints  

Each complaint contains:
- Complaint text  
- Product category  
- Issue type  
- Sentiment score  
- Severity score  
- SLA information  
- Escalation status  
- Duplicate complaint mappings  

No real customer banking data was used.

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
