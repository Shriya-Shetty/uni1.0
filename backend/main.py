from fastapi import FastAPI, HTTPException, Body, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from models import ComplaintCreate, ComplaintUpdate
from services import register_complaint, get_all_complaints, update_complaint_status, ai_engine
from database import get_db_status
from typing import List, Optional
import os
import io
import PyPDF2
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Smart Resolve Bot API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Welcome to Smart Resolve Bot API"}

@app.post("/complaints/", response_model=dict)
async def create_complaint(complaint: ComplaintCreate):
    try:
        new_complaint = await register_complaint(complaint)
        return new_complaint
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"ERROR in create_complaint: {error_details}")
        raise HTTPException(status_code=500, detail={
            "error": str(e),
            "type": type(e).__name__,
            "message": "The server encountered an error while registering the complaint. This is likely a database connection issue or an AI engine timeout."
        })

@app.post("/channels/pdf-extract")
async def extract_pdf_text(file: UploadFile = File(...)):
    try:
        content = await file.read()
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
        text = ""
        for page in pdf_reader.pages:
            extracted = page.extract_text()
            if extracted:
                text += extracted + "\n"
        
        if not text.strip():
            return {"text": "No text could be extracted from this PDF. It might be an image-based PDF."}
            
        return {"text": text.strip()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF extraction failed: {str(e)}")

@app.post("/channels/ocr")
async def handle_ocr(file: UploadFile = File(...), customer_id: str = Body(...), customer_name: str = Body(...)):
    # Mock OCR logic
    text_content = f"Extracted text from {file.filename}: I have a problem with my credit card billing."
    complaint = ComplaintCreate(
        customer_id=customer_id,
        customer_name=customer_name,
        product="Credit Card",
        issue="Billing Error",
        consumer_complaint_narrative=text_content,
        submitted_via="OCR"
    )
    return await register_complaint(complaint)

@app.post("/channels/voice")
async def handle_voice(customer_id: str = Body(...), customer_name: str = Body(...), voice_text: str = Body(...)):
    # Mock voice logic
    complaint = ComplaintCreate(
        customer_id=customer_id,
        customer_name=customer_name,
        product="General",
        issue="Voice Complaint",
        consumer_complaint_narrative=voice_text,
        submitted_via="Voice"
    )
    return await register_complaint(complaint)

@app.get("/complaints/", response_model=List[dict])
async def list_complaints():
    try:
        return await get_all_complaints()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chatbot/chat")
async def chatbot_chat(payload: dict = Body(...)):
    message = payload.get("message")
    history = payload.get("history", [])
    if not message:
        raise HTTPException(status_code=400, detail="Message is required")
    
    response = await ai_engine.get_chatbot_response(message, history)
    return {"response": response}

@app.patch("/complaints/{complaint_id}")
async def update_status(complaint_id: str, update: ComplaintUpdate):
    try:
        # Map new schema fields for update
        updated = await update_complaint_status(
            complaint_id, 
            update.resolution_status, 
            update.company_response_to_consumer
        )
        if not updated:
            raise HTTPException(status_code=404, detail="Complaint not found")
        return updated
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/analytics/root-cause/{product}")
async def get_root_cause(product: str):
    try:
        complaints = await get_all_complaints()
        product_complaints = [c["consumer_complaint_narrative"] for c in complaints if c["product"] == product]
        if not product_complaints:
            return {"root_cause": "Not enough data for this product."}
        
        root_cause = await ai_engine.identify_root_cause(product_complaints, product)
        return {"root_cause": root_cause}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/system/db-status")
async def db_status():
    return await get_db_status()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
