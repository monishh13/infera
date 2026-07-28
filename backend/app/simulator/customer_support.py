import random
from typing import Dict, Any
from app.simulator.base_agent import BaseAgent

class CustomerSupportAgent(BaseAgent):
    """Agent A001 - Customer Support Archetype"""
    def __init__(self, api_url: str = "http://localhost:8000/api/v1", token: str = None):
        profile = {
            'tokens_range': (80, 150),
            'latency_range': (200.0, 800.0),
            'loop_range': (1, 1),  # rarely 2
            'success_rate': 0.95,
            'budget': 2000,
            'expected_tokens': 800,
            'tools': ['faq_lookup', 'ticket_create', 'escalate', 'send_email'],
            'tick_interval': 2.0
        }
        super().__init__('A001', profile, api_url, token)

    def generate_event(self) -> Dict[str, Any]:
        tokens = random.randint(*self.profile['tokens_range'])
        latency = round(random.uniform(*self.profile['latency_range']), 1)
        loop_count = 2 if random.random() < 0.05 else 1
        status = 'SUCCESS' if random.random() <= self.profile['success_rate'] else 'FAILURE'
        tool_name = random.choice(self.profile['tools'])
        
        return {
            'tokens_used': tokens,
            'latency_ms': latency,
            'loop_count': loop_count,
            'status': status,
            'tool_name': tool_name,
            'prompt_length': random.randint(100, 300),
            'response_length': random.randint(150, 400),
            'error_message': None if status == 'SUCCESS' else 'FAQ database connection timeout'
        }
