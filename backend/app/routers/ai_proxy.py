"""
AI Proxy router - proxies requests to Groq API.
"""
from fastapi import APIRouter, HTTPException, status
import httpx
from app.schemas.ai import AIRequest, AIResponse
from app.config import settings

router = APIRouter(prefix="/ai", tags=["AI"])


@router.post("/chat", response_model=AIResponse)
async def chat_with_ai(data: AIRequest):
    """
    Proxy chat requests to Groq API.
    Called from Qt WebView AI page.
    No authentication required (AI page is embedded in desktop app).
    """
    if not settings.GROQ_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service not configured"
        )
    
    # Create system message for library management system
    system_message = """You are Libro AI, an intelligent assistant for an Integrated Library Management System (ILMS).
You help users with library-related tasks including:
- Book search and recommendations
- Library policies and procedures
- Account information and services
- Reservation and checkout processes
- Library hours and contact information
- General library system navigation

Be helpful, professional, and knowledgeable about library operations.
Provide clear, concise answers and ask for clarification when needed."""
    
    request_body = {
        "model": settings.GROQ_MODEL,
        "messages": [
            {"role": "system", "content": system_message},
            {"role": "user", "content": data.message}
        ],
        "temperature": 0.7,
        "max_tokens": 2048
    }
    
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                settings.GROQ_API_URL,
                json=request_body,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {settings.GROQ_API_KEY}"
                }
            )
            
            if response.status_code == 429:
                return AIResponse(
                    success=False,
                    error="rate_limit",
                    message="Rate limit exceeded. Please wait a moment and try again."
                )
            
            if response.status_code != 200:
                return AIResponse(
                    success=False,
                    error="api_error",
                    message=f"AI service error: {response.status_code}"
                )
            
            result = response.json()
            ai_response = result["choices"][0]["message"]["content"]
            
            return AIResponse(
                success=True,
                response=ai_response
            )
            
    except httpx.TimeoutException:
        return AIResponse(
            success=False,
            error="timeout",
            message="AI service timed out. Please try again."
        )
    except Exception as e:
        return AIResponse(
            success=False,
            error="error",
            message=f"An error occurred: {str(e)}"
        )
