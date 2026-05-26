from datetime import datetime, timedelta
import uuid
from database import get_collection
from models import Complaint, ComplaintCreate
from ai_engine import AIEngine
from constants import SLA_DAYS, SIMILARITY_CONFIG
from typing import List, Optional

import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

ai_engine = AIEngine()

async def register_complaint(complaint_data: ComplaintCreate) -> dict:
    try:
        # 1. Generate Unique Complaint ID
        complaint_id = f"CMP-{uuid.uuid4().hex[:8].upper()}"
        logger.info(f"Registering complaint {complaint_id}")
        
        # 2. AI Categorization and Analysis
        text_content = complaint_data.consumer_complaint_narrative
        if not text_content:
            raise ValueError("Complaint narrative cannot be empty")
            
        ai_results = ai_engine.categorize_complaint(text_content)
        sentiment_score = 1.0 if ai_results["sentiment"] == "Negative" else (0.5 if ai_results["sentiment"] == "Neutral" else 0.0)
        
        # 3. Calculate SLA and Severity
        severity_score = ai_results["severity"] / 10.0 # Normalize to 0-1
        severity_label = "Medium"
        if ai_results["severity"] >= 9:
            severity_label = "Critical"
        elif ai_results["severity"] >= 7:
            severity_label = "High"
        elif ai_results["severity"] >= 4:
            severity_label = "Medium"
        else:
            severity_label = "Low"
            
        days_to_resolve = SLA_DAYS.get(severity_label, 7)
        sla_deadline = datetime.utcnow() + timedelta(days=days_to_resolve)
        
        # 4. Duplicate Detection
        embedding = ai_engine.get_embedding(text_content)
        similar_complaints = ai_engine.find_similar_complaints(embedding)
        
        is_duplicate = False
        duplicate_of = None
        related_complaints = []
        
        for other_id, score in similar_complaints:
            if score >= SIMILARITY_CONFIG["duplicate_threshold"]:
                is_duplicate = True
                duplicate_of = other_id
                break
            elif score >= SIMILARITY_CONFIG["related_threshold"]:
                related_complaints.append(other_id)
                
        # 5. Generate AI Draft Response and Keywords
        draft = await ai_engine.generate_draft_response(
            text_content, 
            ai_results["product"], 
            ai_results["issue_subtype"]
        )
        keywords = await ai_engine.extract_keywords(text_content)
        
        # 6. Priority Rank Calculation
        fraud_risk = 0.8 if "Fraud" in ai_results["issue_type"] or "Unauthorized" in text_content else 0.1
        regulatory_risk = 0.7 if severity_label == "Critical" else 0.2
        
        # Calculate a composite priority score (0 to 1)
        priority_score = (severity_score * 0.4) + (sentiment_score * 0.2) + (fraud_risk * 0.2) + (regulatory_risk * 0.2)
        
        # 7. Create Complaint Object
        new_complaint = {
            "_id": str(uuid.uuid4()),
            "complaint_id": complaint_id,
            "date_received": datetime.utcnow(),
            "product": ai_results["product"], # Always use AI extracted product
            "sub_product": complaint_data.sub_product or "General",
            "issue": ai_results["issue_type"],
            "sub_issue": ai_results["issue_subtype"],
            "consumer_complaint_narrative": text_content,
            "company": complaint_data.company or "Union Bank",
            "state": complaint_data.state or "Unknown",
            "zip_code": complaint_data.zip_code or "000000",
            "tags": None,
            "consumer_consent_provided": complaint_data.consumer_consent_provided,
            "submitted_via": complaint_data.submitted_via,
            "date_sent_to_company": datetime.utcnow(),
            "company_response_to_consumer": None,
            "timely_response": "Yes",
            "consumer_disputed": "No",
            "language_detected": "en",
            "sentiment_label": ai_results["sentiment"],
            "sentiment_score": sentiment_score,
            "severity_label": severity_label,
            "severity_score": severity_score,
            "financial_impact_amount": complaint_data.financial_impact_amount or 0.0,
            "keywords_extracted": keywords,
            "embedding_id": str(uuid.uuid4()),
            "duplicate_detected": is_duplicate,
            "duplicate_cluster_id": duplicate_of,
            "similar_complaints_count": len(related_complaints),
            "root_cause_category": ai_results["issue_subtype"],
            "sla_deadline": sla_deadline,
            "sla_status": "On Track",
            "escalation_level": "None",
            "ai_generated_response": draft,
            "ai_suggested_resolution_template": draft,
            "human_review_status": "Pending",
            "status": "Open",
            "audit_log_enabled": True,
            "communication_history": [
                {
                    "type": "created",
                    "actor": "System",
                    "description": "Complaint Registered via " + complaint_data.submitted_via,
                    "timestamp": datetime.utcnow().isoformat()
                },
                {
                    "type": "ai_analysis",
                    "actor": "AI Engine",
                    "description": f"Categorized as {ai_results['product']} with {severity_label} severity",
                    "timestamp": datetime.utcnow().isoformat()
                }
            ],
            "priority_rank": priority_score
        }
        
        # 8. Save to Database
        collection = await get_collection("complaints")
        await collection.insert_one(new_complaint)
        logger.info(f"Complaint {complaint_id} saved to DB")
        
        # 9. Calculate Relative Rank (Serial Order)
        all_open = await collection.find({"status": "Open"}).sort("priority_rank", -1).to_list(length=1000)
        serial_order = 1
        for i, c in enumerate(all_open):
            if c["complaint_id"] == complaint_id:
                serial_order = i + 1
                break
        
        new_complaint["serial_priority_order"] = serial_order
        
        # 10. Update AI Engine Index
        ai_engine.add_to_index(new_complaint["_id"], embedding)
        
        # 11. Volume-based Escalation Check
        if len(related_complaints) > 10:
            await collection.update_one(
                {"_id": new_complaint["_id"]},
                {"$set": {"escalation_level": "Branch", "priority_rank": priority_score + 0.1, "status": "Escalated"}}
            )
            new_complaint["escalation_level"] = "Branch"
            new_complaint["status"] = "Escalated"
            
        return new_complaint
    except Exception as e:
        logger.error(f"Error registering complaint: {str(e)}", exc_info=True)
        raise e

async def get_all_complaints():
    collection = await get_collection("complaints")
    cursor = collection.find({})
    complaints = await cursor.to_list(length=1000)
    
    # Dynamically update SLA status, Escalation, and Rank
    now = datetime.utcnow()
    
    # 1. Separate unresolved to calculate ranks
    unresolved = [c for c in complaints if c.get("status", "").lower() not in ["resolved", "closed"]]
    
    def get_dynamic_score(c):
        p_base = c.get("priority_rank", 0)
        t_start = c.get("date_received")
        t_sla = c.get("sla_deadline")
        
        if not t_start or not t_sla:
            return p_base
            
        if now <= t_sla:
            total_sla = (t_sla - t_start).total_seconds()
            elapsed = (now - t_start).total_seconds()
            u_time = (elapsed / total_sla) * 0.5 if total_sla > 0 else 0.5
        else:
            overdue = (now - t_sla).total_seconds()
            days_overdue = overdue / (60 * 60 * 24)
            u_time = 0.5 + (days_overdue * 0.2)
        return p_base + u_time

    # Sort by dynamic score
    unresolved_sorted = sorted(unresolved, key=get_dynamic_score, reverse=True)
    
    # Create a map for quick rank lookup
    rank_map = {c["complaint_id"]: i + 1 for i, c in enumerate(unresolved_sorted)}
    
    updated_complaints = []
    for c in complaints:
        is_unresolved = c.get("status", "").lower() not in ["resolved", "closed"]
        
        if is_unresolved:
            # Update rank
            c["serial_priority_order"] = rank_map.get(c["complaint_id"], 1)
            
            # Update SLA/Escalation
            sla_deadline = c.get("sla_deadline")
            current_sla = c.get("sla_status", "On Track")
            current_escalation = c.get("escalation_level", "None")
            
            needs_update = False
            new_sla = current_sla
            new_escalation = current_escalation
            
            if sla_deadline and now > sla_deadline:
                if current_sla != "Breached":
                    new_sla = "Breached"
                    needs_update = True
                if current_escalation == "None":
                    new_escalation = "Branch"
                    needs_update = True
            
            if needs_update:
                await collection.update_one(
                    {"_id": c["_id"]},
                    {"$set": {"sla_status": new_sla, "escalation_level": new_escalation, "serial_priority_order": c["serial_priority_order"]}}
                )
                c["sla_status"] = new_sla
                c["escalation_level"] = new_escalation
        
        updated_complaints.append(c)
        
    return updated_complaints

async def update_complaint_status(complaint_id: str, status: str, resolution: Optional[str] = None):
    collection = await get_collection("complaints")
    
    # Get current complaint to append to history
    current = await collection.find_one({"_id": complaint_id})
    if not current:
        return None
        
    history_entry = {
        "type": "status_update",
        "actor": "Admin",
        "description": f"Complaint status updated to {status}",
        "timestamp": datetime.utcnow().isoformat()
    }
    
    if status.lower() == "resolved":
        history_entry["type"] = "resolution"
        history_entry["description"] = "Complaint marked as Resolved"
    elif status.lower() == "in progress":
        history_entry["type"] = "ongoing"
        history_entry["description"] = "Complaint marked as Ongoing"
        
    update_data = {
        "status": status,
        "updated_at": datetime.utcnow()
    }
    
    if resolution:
        update_data["resolution_text"] = resolution
        
    await collection.update_one(
        {"_id": complaint_id}, 
        {
            "$set": update_data,
            "$push": {"communication_history": history_entry}
        }
    )
    return await collection.find_one({"_id": complaint_id})
