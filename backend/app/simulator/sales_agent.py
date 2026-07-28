import random
from typing import Dict, Any
from app.simulator.base_agent import BaseAgent

class SalesAgent(BaseAgent):
    """Agent A003 - Sales Representative Archetype"""
    def __init__(self, api_url: str = "http://localhost:8000/api/v1", token: str = None):
        profile = {
            'tokens_range': (100, 200),
            'latency_range': (300.0, 900.0),
            'loop_range': (1, 2),
            'success_rate': 0.90,
            'budget': 4000,
            'expected_tokens': 1200,
            'tools': ['crm_lookup', 'lead_score', 'schedule_meeting', 'send_followup'],
            'tick_interval': 2.5
        }
        super().__init__('A003', profile, api_url, token)

    def generate_event(self) -> Dict[str, Any]:
        tokens = random.randint(*self.profile['tokens_range'])
        latency = round(random.uniform(*self.profile['latency_range']), 1)
        loop_count = random.randint(*self.profile['loop_range'])
        status = 'SUCCESS' if random.random() <= self.profile['success_rate'] else 'FAILURE'
        tool_name = random.choice(self.profile['tools'])
        
        return {
            'tokens_used': tokens,
            'latency_ms': latency,
            'loop_count': loop_count,
            'status': status,
            'tool_name': tool_name,
            'prompt_length': random.randint(200, 500),
            'response_length': random.randint(250, 600),
            'error_message': None if status == 'SUCCESS' else 'CRM API authentication timeout'
        }
