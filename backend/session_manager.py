from typing import Dict, List, Optional
from datetime import datetime
import json
import logging

logger = logging.getLogger(__name__)

class SessionManager:
    """Manage conversation sessions and patient context"""
    
    def __init__(self):
        # In production, use Redis or database
        self.sessions: Dict[str, Dict] = {}
    
    def create_session(self, session_id: str, patient_info: Optional[Dict] = None) -> Dict:
        """Create a new conversation session"""
        
        session = {
            "session_id": session_id,
            "created_at": datetime.utcnow().isoformat(),
            "conversation_history": [],
            "patient_info": patient_info or {},
            "symptoms_mentioned": [],
            "severity_level": "unknown",
            "questions_asked": {
                "duration": False,
                "severity_scale": False,
                "location": False,
                "medical_history": False,
                "current_medications": False
            },
            "metadata": {
                "total_messages": 0,
                "session_active": True
            }
        }
        
        self.sessions[session_id] = session
        logger.info(f"Created session: {session_id}")
        return session
    
    def get_session(self, session_id: str) -> Optional[Dict]:
        """Retrieve session data"""
        return self.sessions.get(session_id)
    
    def update_session(self, session_id: str, updates: Dict) -> Dict:
        """Update session with new information"""
        
        if session_id not in self.sessions:
            raise ValueError(f"Session {session_id} not found")
        
        session = self.sessions[session_id]
        
        # Update conversation history
        if "message" in updates:
            session["conversation_history"].append(updates["message"])
            session["metadata"]["total_messages"] += 1
        
        # Update symptoms
        if "symptoms" in updates:
            session["symptoms_mentioned"].extend(updates["symptoms"])
        
        # Update severity
        if "severity" in updates:
            session["severity_level"] = updates["severity"]
        
        # Update questions tracking
        if "question_type" in updates:
            session["questions_asked"][updates["question_type"]] = True
        
        self.sessions[session_id] = session
        return session
    
    def end_session(self, session_id: str) -> Dict:
        """End session and return summary"""
        
        if session_id not in self.sessions:
            raise ValueError(f"Session {session_id} not found")
        
        session = self.sessions[session_id]
        session["metadata"]["session_active"] = False
        session["ended_at"] = datetime.utcnow().isoformat()
        
        return session
    
    def get_missing_questions(self, session_id: str) -> List[str]:
        """Get list of questions not yet asked"""
        
        session = self.get_session(session_id)
        if not session:
            return []
        
        missing = []
        questions_map = {
            "duration": "How long have you been experiencing these symptoms?",
            "severity_scale": "On a scale of 1-10, how severe is the pain/discomfort?",
            "location": "Can you describe the exact location of your symptoms?",
            "medical_history": "Do you have any existing medical conditions?",
            "current_medications": "Are you currently taking any medications?"
        }
        
        for q_type, asked in session["questions_asked"].items():
            if not asked:
                missing.append(questions_map[q_type])
        
        return missing
