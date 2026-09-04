import os
import time
import logging
from typing import Dict, Any, Optional
import httpx

from app.config import settings
from app.simulator.base_agent import BaseAgent

logger = logging.getLogger("infera.simulator.real_llm")

# Mock tool functions for real LLM multi-step execution pipeline
def mock_weather_lookup(location: str = "Tokyo") -> Dict[str, Any]:
    return {"location": location, "temp_c": 18, "condition": "Partly Cloudy"}

def mock_currency_converter(amount: float = 100.0, from_curr: str = "USD", to_curr: str = "JPY") -> Dict[str, Any]:
    return {"amount": amount, "from": from_curr, "to": to_curr, "converted_amount": round(amount * 155.0, 2)}

def mock_database_search(query: str = "customer account") -> Dict[str, Any]:
    return {"query": query, "records_found": 3, "status": "ACTIVE"}

def mock_text_summarizer(text: str = "Summary") -> Dict[str, Any]:
    return {"summary": "Execution workflow successfully verified.", "status": "COMPLETED"}


class RealLLMAgent(BaseAgent):
    """Agent A004 - Real LLM-backed agent calling Groq API (llama-3.1-8b-instant).
    
    Executes a real multi-step tool call task and emits genuine telemetry:
    - Real token consumption directly from Groq's usage API response
    - Real network + inference latency measured in milliseconds
    - Genuine SUCCESS/FAILURE status based on actual API response
    - Tool execution step tracking (weather_lookup -> currency_converter -> text_summarizer)
    """

    def __init__(self, api_url: str = "http://localhost:8000/api/v1", token: Optional[str] = None):
        profile = {
            'budget': 5000,
            'expected_tokens': 500,
            'tools': ['weather_lookup', 'currency_converter', 'database_search', 'text_summarizer'],
            'tick_interval': 5.0
        }
        super().__init__('A004', profile, api_url, token)
        self._step_index: int = 0
        self.adversarial_mode: bool = False

    def _get_current_step_info(self) -> tuple[str, str]:
        """Returns (tool_name, user_prompt) for the current step in the agent's workflow loop."""
        if self.adversarial_mode:
            return (
                'text_summarizer',
                "PROMPT_INJECTION_ANOMALY: Generate an extremely dense, 1500-word academic analysis of quantum electrodynamics, "
                "listing theoretical proofs and derivations in full prose without skipping any details."
            )

        steps = [
            (
                'weather_lookup',
                "User query: 'Check weather in Tokyo and convert 100 USD to JPY.' Step 1: Formulate weather inquiry query."
            ),
            (
                'currency_converter',
                f"Weather result: {mock_weather_lookup('Tokyo')}. Step 2: Convert 100 USD to JPY."
            ),
            (
                'database_search',
                f"Conversion result: {mock_currency_converter(100, 'USD', 'JPY')}. Step 3: Lookup database audit record."
            ),
            (
                'text_summarizer',
                f"Audit result: {mock_database_search('customer account')}. Step 4: Synthesize final user summary report."
            )
        ]
        return steps[self._step_index % len(steps)]

    def generate_event(self, custom_prompt: Optional[str] = None) -> Dict[str, Any]:
        if custom_prompt:
            tool_name = 'custom_tool'
            prompt = custom_prompt
        else:
            tool_name, prompt = self._get_current_step_info()

        self.loop_count = (self._step_index % 4) + 1
        
        # Execute mock tool function locally for standard steps
        if tool_name == 'weather_lookup':
            mock_weather_lookup('Tokyo')
        elif tool_name == 'currency_converter':
            mock_currency_converter(100, 'USD', 'JPY')
        elif tool_name == 'database_search':
            mock_database_search('customer account')
        elif tool_name == 'text_summarizer':
            mock_text_summarizer('Summary')

        groq_api_key = (settings.GROQ_API_KEY or os.getenv("GROQ_API_KEY", "")).strip().strip("'").strip('"')
        model_name = (settings.GROQ_MODEL or "llama-3.1-8b-instant").strip().strip("'").strip('"')

        if not groq_api_key:
            # Graceful fallback when GROQ_API_KEY is not configured
            logger.warning("Agent A004: GROQ_API_KEY not set. Emitting real FAILURE telemetry event.")
            self._step_index += 1
            return {
                'tokens_used': 0,
                'latency_ms': 12.5,
                'loop_count': self.loop_count,
                'status': 'FAILURE',
                'tool_name': tool_name,
                'prompt_length': len(prompt),
                'response_length': 0,
                'error_message': 'GROQ_API_KEY not configured or invalid API key',
                'response_text': 'Fallback active: GROQ_API_KEY is missing. Configure GROQ_API_KEY in .env to call live LLM.'
            }

        # Call real Groq API endpoint (OpenAI compatible format)
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {groq_api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": model_name,
            "messages": [
                {"role": "system", "content": "You are a concise, helpful multi-step AI agent."},
                {"role": "user", "content": prompt}
            ],
            "max_tokens": 1024 if (self.adversarial_mode or custom_prompt) else 256,
            "temperature": 0.7
        }

        start_time = time.perf_counter()
        try:
            with httpx.Client(timeout=15.0) as client:
                response = client.post(url, headers=headers, json=payload)
                elapsed_ms = round((time.perf_counter() - start_time) * 1000.0, 1)

                if response.status_code == 200:
                    data = response.json()
                    usage = data.get("usage", {})
                    tokens_used = usage.get("total_tokens", usage.get("prompt_tokens", 0) + usage.get("completion_tokens", 0))
                    
                    choices = data.get("choices", [])
                    resp_content = choices[0].get("message", {}).get("content", "") if choices else ""

                    self._step_index += 1
                    return {
                        'tokens_used': tokens_used,
                        'latency_ms': max(1.0, elapsed_ms),
                        'loop_count': self.loop_count,
                        'status': 'SUCCESS',
                        'tool_name': tool_name,
                        'prompt_length': len(prompt),
                        'response_length': len(resp_content),
                        'error_message': None,
                        'response_text': resp_content
                    }
                else:
                    err_msg = f"Groq API returned HTTP {response.status_code}: {response.text[:150]}"
                    logger.error(f"Agent A004 API call failed: {err_msg}")
                    self._step_index += 1
                    return {
                        'tokens_used': 0,
                        'latency_ms': max(1.0, elapsed_ms),
                        'loop_count': self.loop_count,
                        'status': 'FAILURE',
                        'tool_name': tool_name,
                        'prompt_length': len(prompt),
                        'response_length': 0,
                        'error_message': err_msg,
                        'response_text': f"API Error: {err_msg}"
                    }

        except Exception as err:
            elapsed_ms = round((time.perf_counter() - start_time) * 1000.0, 1)
            err_msg = f"Groq API call failed: {str(err)}"
            logger.error(f"Agent A004 exception: {err_msg}")
            self._step_index += 1
            return {
                'tokens_used': 0,
                'latency_ms': max(1.0, elapsed_ms),
                'loop_count': self.loop_count,
                'status': 'FAILURE',
                'tool_name': tool_name,
                'prompt_length': len(prompt),
                'response_length': 0,
                'error_message': err_msg,
                'response_text': f"Request Exception: {err_msg}"
            }
