import random
from typing import Dict, Any
from app.simulator.base_agent import BaseAgent

class ResearchAgent(BaseAgent):
    """Agent A002 - Deep Research Archetype"""
    def __init__(self, api_url: str = "http://localhost:8000/api/v1", token: str = None):
        profile = {
            'tokens_range': (200, 400),
            'latency_range': (800.0, 2000.0),
            'loop_range': (1, 3),
            'success_rate': 0.85,
            'budget': 8000,
            'expected_tokens': 2500,
            'tools': ['web_search', 'doc_retrieve', 'summarize', 'cite'],
            'tick_interval': 3.0
        }
        super().__init__('A002', profile, api_url, token)

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
            'prompt_length': random.randint(400, 1000),
            'response_length': random.randint(500, 1200),
            'error_message': None if status == 'SUCCESS' else 'Rate limit exceeded on paper repository'
        }
