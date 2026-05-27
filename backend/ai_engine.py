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

    async def get_chatbot_response(self, message: str, history: List[Dict[str, str]]) -> Dict[str, Any]:
        """
        Stateful chatbot response. 
        Returns a dict with 'answer' (for user) and 'metadata' (for backend).
        """
        system_prompt = f"""
        You are a Union Bank AI Grievance Assistant. Your goal is to gather all necessary details to file a formal complaint.
        
        REQUIRED FIELDS:
        - customer_name: Full name of the customer
        - customer_id: Bank Customer ID (usually 8-10 digits)
        - product: Must be one of {BANK_PRODUCTS}
        - sub_product: Specific product variant (e.g., Gold Credit Card, Savings Max, etc.)
        - issue: Must be one of the main categories in the issue hierarchy.
        - sub_issue: Specific sub-category.
        - transaction_date: The date the issue/transaction occurred.
        - amount: The financial amount involved (if applicable, else 'N/A').
        - narrative: A detailed description of what happened, including merchant names or specific locations if relevant.
        
        ISSUE HIERARCHY:
        {ISSUE_TYPES}
        
        WORKFLOW:
        1. GATHERING: Ask for missing details one by one. Do NOT move to CONFIRMING until you have all the fields above, especially the date and amount if it's a transaction issue. Be empathetic.
        2. CONFIRMING: Once ALL fields are known, generate a comprehensive "Complaint Narrative" that includes the date, amount, and all specific details provided. Ask the user to confirm if this summary is accurate and if they are ready to register (Yes/No).
        3. REGISTERED: If the user confirms the narrative (e.g., says "Yes", "Correct", "Register it"), set status to 'REGISTERED'.
        
        OUTPUT FORMAT:
        You MUST always output your response in this JSON format:
        {{
            "answer": "Your natural language response to the user here",
            "metadata": {{
                "status": "GATHERING" | "CONFIRMING" | "REGISTERED",
                "fields": {{
                    "customer_name": "...",
                    "customer_id": "...",
                    "product": "...",
                    "sub_product": "...",
                    "issue": "...",
                    "sub_issue": "...",
                    "transaction_date": "...",
                    "amount": "...",
                    "narrative": "..."
                }},
                "narrative_to_confirm": "The comprehensive generated narrative if in CONFIRMING state"
            }}
        }}
        
        Keep your "answer" concise and professional.
        """
        
        messages = [{"role": "system", "content": system_prompt}]
        
        # Add history (limit to last 10 for better context)
        for msg in history[-10:]:
            role = "assistant" if msg["role"] == "bot" else msg["role"]
            content = msg["content"]
            # If the history contains our JSON, only send the 'answer' part to the AI for next turn
            # to avoid confusing it with its own metadata, or keep it if it helps state.
            # Actually, keeping the metadata helps the AI remember the state.
            messages.append({"role": role, "content": content})
        
        messages.append({"role": "user", "content": message})
        
        try:
            completion = self.groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile", # Updated from decommissioned 3.1 model
                messages=messages,
                temperature=0.2, # Lower temperature for more consistent JSON
                response_format={ "type": "json_object" }
            )
            import json
            raw_response = completion.choices[0].message.content
            return json.loads(raw_response)
        except Exception as e:
            print(f"Chatbot error: {e}")
            return {
                "answer": "I'm having a bit of trouble processing your request. Could you please state your name and the issue you're facing?",
                "metadata": {"status": "GATHERING", "fields": {}}
            }

    async def generate_draft_response(self, complaint_text: str, product: str, issue: str, complaint_id: str, sla_deadline: str) -> str:
        # Truncate text to avoid context window issues
        safe_text = complaint_text[:4000]
        prompt = f"""
        You are a Bank Grievance Officer drafting an official complaint acknowledgement response.
        
        STRICT RULES — follow without exception:
        1. Maximum 4 sentences. No exceptions.
        2. Do NOT offer, suggest, or imply any compensation, refund, waiver, discount, goodwill gesture, or financial relief of any kind.
        3. Do NOT make any commitment to a specific resolution outcome.
        4. Do NOT use placeholders like [Name], [Date], [Amount], [Reference Number].
        5. Do NOT apologize more than once.
        6. Write in formal, neutral banking language. No emotional language.
        7. Output only the response text. No subject line, no headers, no bullet points.
        
        STRUCTURE TO FOLLOW (exactly 4 sentences):
        Sentence 1 — Acknowledge receipt of the complaint regarding {issue} on {product}.
        Sentence 2 — Confirm the complaint has been registered and is under review by the concerned team.
        Sentence 3 — State that the resolution is expected by {sla_deadline} without committing to an outcome.
        Sentence 4 — Provide the complaint reference ID {complaint_id} and invite further contact if needed.
        
        Complaint Details:
        Product: {product}
        Issue: {issue}
        Complaint: {safe_text}
        
        Output only the 4-sentence response. Nothing else.
        """
        
        try:
            completion = self.groq_client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1, # Lower temperature for stricter adherence to rules
                max_tokens=500
            )
            return completion.choices[0].message.content.strip()
        except Exception as e:
            print(f"Draft generation error: {e}")
            return f"We have received your complaint regarding {issue} on {product} and it is currently under review by our concerned team. We expect to provide a resolution by {sla_deadline}. Your complaint reference ID is {complaint_id}; please contact us if you require further assistance."

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
