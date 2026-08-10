#!/usr/bin/env python3
"""
Infera SDK — Real End-to-End Monitored Agent Example

Run this script to send real Python execution telemetry to your local Infera platform:
    python sdk/examples/basic_agent.py
"""

import time
import sys
import os

# Add sdk/ directory to python path for direct local execution
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from infera_sdk import Infera

def main():
    print("==================================================")
    print("  INFERA SDK — REAL TELEMETRY DEMO AGENT")
    print("==================================================")

    # 1. Initialize Infera Client
    infera = Infera(
        endpoint=os.getenv("INFERA_ENDPOINT", "http://localhost:8000"),
        api_key="dev-key",
        environment="development",
        redact=["api_key", "authorization"]
    )

    # 2. Register / Bind AI Agent
    support_agent = infera.agent(
        id="A001",
        name="Customer Support Agent (SDK Monitored)",
        agent_type="customer_support"
    )

    print("Submitting monitored session telemetry to Infera backend...")

    # 3. Create Monitored Execution Session
    with support_agent.session() as session:
        print(f"Session Started: {session.session_id}")

        # Step 1: LLM Reasoning Span
        print(" -> Step 1: LLM Reasoning Step...")
        with session.trace(name="gpt-4o_intent_parser", step_type="llm") as span:
            time.sleep(0.12)  # Simulate real execution
            span.set_tokens(tokens=420, prompt_len=310, response_len=110)
            span.add_metadata("model", "gpt-4o")
            span.add_metadata("temperature", 0.2)
            span.add_metadata("provider", "openai")

        # Step 2: Knowledge Base Tool Call
        print(" -> Step 2: Executing Tool Call (Vector KB Search)...")
        with session.trace(name="search_vector_kb", step_type="tool") as span:
            time.sleep(0.24)  # Simulate search latency
            span.set_tokens(tokens=180, prompt_len=120, response_len=60)
            span.add_metadata("query", "How do I reset my API key?")
            span.add_metadata("top_k", 3)
            span.add_metadata("vector_db", "pinecone")

        # Step 3: Action Execution (Customer Account Lookup)
        print(" -> Step 3: Executing Database Lookup...")
        with session.trace(name="db_lookup_customer", step_type="tool") as span:
            time.sleep(0.08)
            span.set_tokens(tokens=95)
            span.add_metadata("user_id", "usr_9912")
            span.add_metadata("status", "active")

        # Step 4: Final LLM Synthesis
        print(" -> Step 4: Final Response Synthesis...")
        with session.trace(name="gpt-4o_response_generator", step_type="llm") as span:
            time.sleep(0.18)
            span.set_tokens(tokens=650, prompt_len=520, response_len=130)
            span.add_metadata("model", "gpt-4o")
            span.add_metadata("finish_reason", "stop")

    # Flush any remaining telemetry
    infera.flush()

    print("\nTelemetry session submitted successfully!")
    print(f"Inspect in Infera UI -> Agent: A001 -> Session: {session.session_id}")
    print("==================================================")

if __name__ == "__main__":
    main()
