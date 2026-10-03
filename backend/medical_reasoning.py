import logging
from typing import Dict, List, Optional
from groq import Groq
import os
from dotenv import load_dotenv
import json

load_dotenv()

logger = logging.getLogger(__name__)

class MedicalReasoningEngine:
    """AI-powered medical reasoning engine with safety mechanisms"""
    
    SYSTEM_PROMPT = """You are an AI Medical Triage Assistant. Your role is to:

1. GATHER INFORMATION through clarifying questions
2. NEVER provide definitive diagnosis
3. ALWAYS suggest professional consultation for serious symptoms
4. Ask about: duration, severity (1-10), location, triggers, medical history
5. Provide general wellness advice for minor issues
6. Flag RED FLAGS immediately (chest pain, difficulty breathing, severe bleeding, etc.)

CRITICAL RULES:
- Always include disclaimer: "I am not a doctor. This is not medical advice."
- For emergencies: "Please call emergency services immediately"
- For serious symptoms: "Please consult a healthcare provider within 24 hours"
- Be empathetic but professional
- Ask ONE question at a time
- Summarize symptoms periodically

RED FLAG SYMPTOMS (immediate medical attention):
- Chest pain, pressure, tightness
- Severe difficulty breathing
- Sudden severe headache
- Loss of consciousness
- Severe bleeding
- Signs of stroke (FAST: Face drooping, Arm weakness, Speech difficulty, Time)
- High fever with stiff neck
- Severe abdominal pain
- Suicidal thoughts"""

    def __init__(self):
        self.groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        self.model = "llama-3.3-70b-versatile"
        
    def analyze_symptoms(self, 
                        conversation_history: List[Dict],
                        current_input: str,
                        session_data: Dict) -> Dict:
        """
        Analyze symptoms and generate appropriate response
        
        Args:
            conversation_history: List of previous messages
            current_input: Current user input
            session_data: Session metadata (age, conditions, etc.)
        
        Returns:
            Dict with response, severity, and recommendations
        """
        
        # Build conversation context
        messages = [{"role": "system", "content": self.SYSTEM_PROMPT}]
        
        # Add session context
        if session_data:
            context = f"\nPatient Context: {json.dumps(session_data)}\n"
            messages.append({"role": "system", "content": context})
        
        # Add conversation history
        for msg in conversation_history:
            messages.append(msg)
        
        # Add current input
        messages.append({"role": "user", "content": current_input})
        
        try:
            # Call Groq LLM
            response = self.groq_client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.7,
                max_tokens=500
            )
            
            ai_response = response.choices[0].message.content
            
            # Analyze severity
            severity = self._assess_severity(current_input, ai_response)
            
            # Generate recommendations
            recommendations = self._generate_recommendations(
                current_input, 
                ai_response, 
                severity
            )
            
            return {
                "response": ai_response,
                "severity": severity,
                "recommendations": recommendations,
                "requires_immediate_attention": severity in ["critical", "high"]
            }
            
        except Exception as e:
            logger.error(f"Error in medical reasoning: {e}")
            return {
                "response": "I apologize, but I'm experiencing technical difficulties. For safety, please consult a healthcare provider if you have concerning symptoms.",
                "severity": "unknown",
                "recommendations": ["Consult healthcare provider"],
                "requires_immediate_attention": True
            }
    
    def _assess_severity(self, user_input: str, ai_response: str) -> str:
        """Assess symptom severity based on red flags"""
        
        user_lower = user_input.lower()
        
        # Critical red flags
        critical_keywords = [
            "chest pain", "can't breathe", "difficulty breathing",
            "severe bleeding", "unconscious", "stroke", "heart attack",
            "severe headache", "suicidal", "overdose"
        ]
        
        # High priority
        high_keywords = [
            "high fever", "vomiting blood", "severe pain",
            "persistent vomiting", "dehydration", "confusion"
        ]
        
        # Moderate
        moderate_keywords = [
            "fever", "vomiting", "diarrhea", "headache",
            "cough", "sore throat"
        ]
        
        for keyword in critical_keywords:
            if keyword in user_lower:
                return "critical"
        
        for keyword in high_keywords:
            if keyword in user_lower:
                return "high"
        
        for keyword in moderate_keywords:
            if keyword in user_lower:
                return "moderate"
        
        return "low"
    
    def _generate_recommendations(self, 
                                 user_input: str, 
                                 ai_response: str,
                                 severity: str) -> List[str]:
        """Generate actionable recommendations"""
        
        recommendations = []
        
        if severity == "critical":
            recommendations.append("🚨 CALL EMERGENCY SERVICES (911) IMMEDIATELY")
            recommendations.append("Do not wait - seek emergency care now")
        elif severity == "high":
            recommendations.append("⚠️ Seek medical attention within 4-6 hours")
            recommendations.append("Visit urgent care or emergency room")
        elif severity == "moderate":
            recommendations.append("📋 Consider consulting doctor within 24-48 hours")
            recommendations.append("Monitor symptoms - seek care if worsening")
        else:
            recommendations.append("💊 Self-care measures may help")
            recommendations.append("Consult doctor if symptoms persist beyond 3-5 days")
        
        # General recommendations
        recommendations.extend([
            "Stay hydrated",
            "Rest adequately",
            "Monitor temperature and symptoms"
        ])
        
        return recommendations
    
    def generate_summary(self, conversation_history: List[Dict]) -> str:
        """Generate conversation summary for patient records"""
        
        summary_prompt = """Summarize this medical conversation in a structured format:

CHIEF COMPLAINT:
SYMPTOMS:
DURATION:
SEVERITY (1-10):
ADDITIONAL NOTES:
RECOMMENDATIONS GIVEN:

Be concise and professional."""

        messages = conversation_history + [
            {"role": "system", "content": summary_prompt}
        ]
        
        try:
            response = self.groq_client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.5,
                max_tokens=400
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"Error generating summary: {e}")
            return "Summary generation failed"
