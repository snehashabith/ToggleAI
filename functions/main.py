import os
import litellm
from firebase_functions import https_fn
from semantic_router import Route
from semantic_router.layer import RouteLayer
from semantic_router.encoders import HuggingFaceEncoder

# 1. Define Routes for Semantic Router
# This classifies request intent without expensive LLM calls
easy_task = Route(name="easy", utterances=["summarize", "check grammar", "translate", "general chat"])
hard_task = Route(name="hard", utterances=["complex logic", "debug code", "architect system", "detailed analysis"])

encoder = HuggingFaceEncoder()
router = RouteLayer(encoder=encoder, routes=[easy_task, hard_task])

# 2. Simplifier Function
# Uses Flash to boil down large prompts into their 'Core Intent'
def simplify_prompt(large_text):
    simplifier_prompt = f"""Summarize the core request and essential facts from the text below. 
    Remove all fluff, legal disclaimers, and repetition. 
    Output only the 'Core Intent' in less than 200 words.
    
    TEXT: {large_text[:30000]}""" # Keep context tight
    
    response = litellm.completion(
        model="gemini/gemini-1.5-flash", 
        messages=[{"role": "user", "content": simplifier_prompt}]
    )
    return response.choices[0].message.content

# 3. Main Proxy Function
@https_fn.on_request()
def smart_proxy(req: https_fn.Request) -> https_fn.Response:
    data = req.get_json()
    user_input = data.get("prompt")
    
    # Step 1: Simplify to save tokens
    core_intent = simplify_prompt(user_input)
    
    # Step 2: Route based on the simplified concept
    route = router(core_intent)
    
    # Step 3: Select Gemini model and constraints
    if route.name == "hard":
        model = "gemini/gemini-1.5-pro"  # Use Pro for logic
        system_instruction = "You are an expert analyst. Be precise."
    else:
        model = "gemini/gemini-1.5-flash" # Use Flash for speed
        system_instruction = "You are a fast, helpful assistant. Stick to facts."

    # Step 4: Final Generation with hallucination guard (low temp)
    final_response = litellm.completion(
        model=model,
        messages=[
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": f"Task: {core_intent}\n\nFull Context: {user_input}"}
        ],
        temperature=0.1 # Lower temp = less hallucination
    )
    
    # Step 5: Log usage for Person B's Dashboard (Firestore)
    # (Firestore write code goes here)
    
    return https_fn.Response(final_response.choices[0].message.content)