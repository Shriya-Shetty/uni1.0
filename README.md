# Union Bank Smart Resolve Bot

An AI-powered complaint registration and management system for Union Bank that enables customers to file grievances through multiple channels (web form, voice, PDF upload, AI chatbot) and provides bank administrators with tools to track, analyze, and resolve complaints efficiently.

## Features

### Customer-Facing Features
- **Multiple Submission Channels**: File complaints via web form, voice input, PDF document upload, or AI-powered chatbot
- **AI-Powered Assistance**: 
  - Chatbot guides users through the complaint filing process step-by-step
  - Voice-to-text using Vosk + Whisperflow for accurate transcription
  - PDF text extraction for document-based complaints
  - Automatic categorization of complaints using NLP models
- **Real-time Feedback**: Instant confirmation and complaint ID generation upon submission

### Admin/Dashboard Features
- **Complaint Overview**: Visual dashboard showing complaint statistics and trends
- **Complaint Management**: Search, filter, and view detailed complaint information
- **SLA Tracking**: Monitor complaint resolution against service level agreements
- **Root Cause Analysis**: AI-powered identification of recurring issues and systemic problems
- **Priority Queuing**: AI-driven prioritization of complaints based on severity and impact

## Architecture

### Backend (Python/FastAPI)
- **API**: RESTful endpoints for complaint management
- **AI Engine**: 
  - Zero-shot classification for product/issue categorization
  - Sentiment analysis for complaint urgency
  - Named entity recognition for key information extraction
  - Similarity matching for duplicate detection
  - Groq-powered LLM for chatbot and response generation
- **Database**: MongoDB for complaint storage
- **Services**: PDF processing, voice handling, analytics

### Frontend (React/Vite/TypeScript)
- **UI Framework**: Shadcn UI components with Tailwind CSS
- **State Management**: React Query for server state, useState for client state
- **Routing**: React Router for navigation between views
- **Real-time Updates**: WebSocket-ready architecture for live updates

## Technology Stack

### Backend
- **Framework**: FastAPI
- **AI/ML**: 
  - Hugging Face Transformers (BART, RoBERTa)
  - Sentence Transformers for embeddings
  - FAISS for vector similarity search
  - Groq (Llama 3) for LLM capabilities
- **Database**: MongoDB with Motor driver
- **Other**: PyPDF2, python-multipart, python-dotenv

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Components**: Shadcn UI (Radix UI primitives)
- **State Management**: React Query
- **HTTP Client**: Axios
- **Charts**: Recharts
- **Notifications**: Sonner
- **Forms**: React Hook Form with Zod validation

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- Python 3.11+
- MongoDB instance
- Groq API key (for AI features)

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file with the following variables:
   ```
   GROQ_API_KEY=your_groq_api_key_here
   MONGODB_URL=mongodb://localhost:27017
   DB_NAME=smart_resolve_bot
   ```

5. Start the backend server:
   ```bash
   uvicorn main:app --reload
   ```
   The API will be available at `http://localhost:8000`

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the frontend directory with:
   ```
   VITE_API_BASE_URL=http://localhost:8000
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:5173`

## Usage

### For Customers
1. Access the application at `http://localhost:5173`
2. Choose your role (user/admin) - users start in complaint submission mode
3. Select a submission channel:
   - **Online Form**: Fill out the complaint details manually
   - **Voice**: Speak your complaint (powered by Vosk + Whisperflow)
   - **PDF**: Upload a document containing your complaint details
   - **Chatbot**: Interact with the AI assistant to file your complaint step-by-step
4. Submit your complaint and receive a complaint ID with estimated resolution timeline

### For Administrators
1. Access the application at `http://localhost:5173`
2. Login as admin (admin credentials would be configured separately)
3. View the dashboard for an overview of all complaints
4. Navigate to different sections:
   - **Complaints**: Browse, search, and filter complaints
   - **Overview**: See statistics and trends
   - **Trends**: Analyze complaint patterns over time
   - **SLA**: Monitor resolution timelines
   - **Root Cause**: View AI-generated insights on recurring issues
5. Click on any complaint to view detailed information and update its status

## API Endpoints

### Complaint Management
- `GET /` - API health check
- `POST /complaints/` - Register a new complaint
- `GET /complaints/` - Retrieve all complaints
- `PATCH /complaints/{complaint_id}` - Update complaint status

### Channels
- `POST /channels/pdf-extract` - Extract text from PDF documents
- `POST /channels/ocr` - Process OCR inputs (mock)
- `POST /channels/voice` - Process voice inputs (mock)

### Chatbot
- `POST /chatbot/chat` - Interact with AI complaint assistant

### Analytics
- `GET /analytics/root-cause/{product}` - Get root cause analysis for a product
- `GET /system/db-status` - Check database connection status

## AI Capabilities

The system leverages multiple AI technologies:

1. **Complaint Classification**: Uses zero-shot learning to automatically categorize complaints by product and issue type
2. **Sentiment Analysis**: Determines customer emotion to prioritize urgent cases
3. **Named Entity Recognition**: Extracts key information like amounts, dates, and customer details
4. **Similarity Matching**: Identifies duplicate or related complaints using vector embeddings
5. **Conversational AI**: Powers the chatbot assistant using Groq's Llama 3 models
6. **Root Cause Analysis**: Analyzes patterns in complaints to identify systemic issues
7. **Response Generation**: Creates standardized acknowledgment responses for complaints

## Project Structure

```
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

## Future Enhancements

1. **Multi-language Support**: Add support for regional languages
2. **Integration with Banking Systems**: Connect to actual banking core systems for real-time validation
3. **Advanced Analytics**: Add predictive analytics for complaint volume forecasting
4. **Mobile Applications**: Develop native iOS/Android applications
5. **Voice Biometrics**: Add voice authentication for secure complaint filing
6. **Blockchain Integration**: For immutable complaint tracking and audit trails

## License

This project is proprietary software developed for Union Bank's internal use.

## Contact

For support or inquiries, please contact the Union Bank Digital Innovation Team.