import os
from transformers import pipeline
from sentence_transformers import SentenceTransformer
import faiss
import numpy as np
from groq import Groq
from dotenv import load_dotenv
from constants import BANK_PRODUCTS, ISSUE_TYPES, BASE_SEVERITY, SIMILARITY_CONFIG
from typing import Dict, List, Tuple, Any

load_dotenv()

class AIEngine:
    def __init__(self):
        # Initialize models
        # Note: In a real production environment, these would be loaded once
        self.classifier = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")
        self.sentiment_analyzer = pipeline("sentiment-analysis", model="cardiffnlp/twitter-roberta-base-sentiment-latest")
        self.embedder = SentenceTransformer(SIMILARITY_CONFIG["embedding_model"])
        
        # Initialize Groq client
        self.groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        
        # Initialize FAISS index
        self.dimension = 384 # MiniLM-L6-v2 dimension
        self.index = faiss.IndexFlatL2(self.dimension)
        self.complaint_ids = [] # To map index to complaint IDs

    def categorize_complaint(self, text: str) -> Dict[str, Any]:
        if not text or len(text.strip()) < 5:
            return {
                "product": "General",
                "issue_type": "General Inquiry",
                "issue_subtype": "General Inquiry",
                "sentiment": "Neutral",
                "severity": 5
            }
            
        try:
            # 1. Product Categorization
            product_result = self.classifier(text[:1000], BANK_PRODUCTS, multi_label=False)
            product = product_result['labels'][0]
            
            # 2. Issue Type Categorization
            all_issue_subtypes = []
            for main_type, subtypes in ISSUE_TYPES.items():
                all_issue_subtypes.extend(subtypes)
            
            issue_result = self.classifier(text[:1000], all_issue_subtypes, multi_label=False)
            issue_subtype = issue_result['labels'][0]
            
            # Find the parent issue type
            issue_type = "Other"
            for main_type, subtypes in ISSUE_TYPES.items():
                if issue_subtype in subtypes:
                    issue_type = main_type
                    break
                    
            # 3. Sentiment Analysis
            sentiment_result = self.sentiment_analyzer(text[:500])[0]
            label_map = {"positive": "Positive", "neutral": "Neutral", "negative": "Negative"}
            sentiment = label_map.get(sentiment_result['label'].lower(), "Neutral")
            
            # 4. Severity
            severity = BASE_SEVERITY.get(issue_subtype, 5)
            
            return {
                "product": product,
                "issue_type": issue_type,
                "issue_subtype": issue_subtype,
                "sentiment": sentiment,
                "severity": severity
            }
        except Exception as e:
            print(f"Categorization error: {e}")
            return {
                "product": "General",
                "issue_type": "General Inquiry",
                "issue_subtype": "General Inquiry",
                "sentiment": "Neutral",
                "severity": 5
            }

    async def extract_keywords(self, text: str) -> List[str]:
        # Truncate text to avoid context window issues
        safe_text = text[:4000]
        prompt = f"Extract exactly 5-7 key financial or complaint-related keywords from this text. Output only comma-separated keywords.\n\nText: {safe_text}"
        try:
            completion = self.groq_client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=100
            )
            keywords = completion.choices[0].message.content.split(',')
            return [k.strip() for k in keywords if k.strip()]
        except Exception as e:
            print(f"Keyword extraction error: {e}")
            return ["complaint", "banking"] # Fallback

    def get_embedding(self, text: str) -> np.ndarray:
        return self.embedder.encode([text[:1000]])[0] # Embed first 1000 chars

    def find_similar_complaints(self, embedding: np.ndarray, threshold: float = 0.78) -> List[Tuple[str, float]]:
        if self.index.ntotal == 0:
            return []
        
        # Normalize for cosine similarity if using IndexFlatIP
        # For IndexFlatL2, we just use distances
        D, I = self.index.search(np.array([embedding]).astype('float32'), 5)
        
        results = []
        for dist, idx in zip(D[0], I[0]):
            if idx != -1:
                # Convert L2 distance to a similarity score (approximate)
                similarity = 1 / (1 + dist)
                if similarity >= threshold:
                    results.append((self.complaint_ids[idx], similarity))
        
        return results

    def add_to_index(self, complaint_id: str, embedding: np.ndarray):
        self.index.add(np.array([embedding]).astype('float32'))
        self.complaint_ids.append(complaint_id)

    async def transcribe_with_whisperflow(self, audio_data: bytes) -> str:
        """
        High-accuracy final transcription using Whisperflow.
        This would typically call a hosted Whisper API or a local Whisper model.
        """
        # Placeholder for actual Whisper integration
        # response = self.openai_client.audio.transcriptions.create(model="whisper-1", file=audio_data)
        return "Whisper-refined transcript placeholder"

    async def get_chatbot_response(self, message: str, history: List[Dict[str, str]]) -> str:
        messages = [
            {"role": "system", "content": "You are a helpful and professional Union Bank AI Assistant. Your goal is to help customers file a complaint. Be empathetic and professional. If you don't have the customer's name yet, ask for it. If they haven't described their issue, ask for details. Keep responses concise."}
        ]
        # Add history (limit to last 5 for context)
        for msg in history[-5:]:
            # Map 'bot' role from frontend to 'assistant' for Groq
            role = "assistant" if msg["role"] == "bot" else msg["role"]
            messages.append({"role": role, "content": msg["content"]})
        
        # Add current message
        messages.append({"role": "user", "content": message})
        
        try:
            completion = self.groq_client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=messages,
                temperature=0.7,
                max_tokens=300
            )
            return completion.choices[0].message.content
        except Exception as e:
            return f"I'm here to help, but I'm having a bit of trouble connecting to my brain right now. Could you please describe your issue directly? (Error: {str(e)})"

    async def generate_draft_response(self, complaint_text: str, product: str, issue: str) -> str:
        # Truncate text to avoid context window issues
        safe_text = complaint_text[:4000]
        prompt = f"""
        You are a helpful and professional Bank Grievance Officer. 
        A customer has submitted the following complaint:
        Product: {product}
        Issue: {issue}
        Complaint: {safe_text}
        
        Generate a professional, empathetic, and concise draft resolution response of maximum 150 words. 
        Ensure it follows bank regulatory standards.
        Do not include any placeholders like [Name].
        Do NOT offer, suggest, or imply any compensation, refund, waiver, discount, goodwill gesture, or financial relief of any kind.
        Write in formal, neutral banking language. No emotional language. 
        Just provide the response text.
        """
        
        try:
            completion = self.groq_client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=500
            )
            return completion.choices[0].message.content
        except Exception as e:
            print(f"Draft generation error: {e}")
            return f"Thank you for reaching out. We have received your complaint regarding {product} and are looking into the issue: {issue}. Our team will get back to you shortly."

    async def identify_root_cause(self, narratives: List[str], product: str) -> str:
        # Sample narratives to fit in context window
        sample_size = min(10, len(narratives))
        sampled = narratives[:sample_size]
        combined_text = "\n---\n".join(sampled)
        
        prompt = f"""
        You are a Senior Root Cause Analyst for a Bank.
        Analyze the following complaint narratives for the product '{product}':
        
        {combined_text}
        
        Identify the primary root cause patterns and provide a concise summary with:
        1. Top 3 common underlying issues
        2. Recommended systemic fix
        3. Predicted risk level if not addressed
        """
        
        try:
            completion = self.groq_client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.5,
                max_tokens=800
            )
            return completion.choices[0].message.content
        except Exception as e:
            return f"Analysis failed: {str(e)}"
