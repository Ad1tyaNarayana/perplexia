import asyncio
import json
import google.generativeai as genai
from fastapi import HTTPException
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

genai.configure(api_key=settings.GEMINI_API_KEY) # Configure Gemini API key
model = genai.GenerativeModel("gemini-2.0-flash")

def generate_response_with_gemini_streaming(prompt: str):
    """Calls Google Gemini API and returns a streaming response."""

    response_stream = model.generate_content(
        prompt,
        stream=True,
        generation_config={
            "temperature": 0.3,
            "max_output_tokens": 3072,
            "response_mime_type": "text/plain"
        },
    )

    async def text_streamer():
        for chunk in response_stream:
            if chunk.text:
                yield f"data: {json.dumps({'type': 'answer_chunk', 'text': chunk.text})}\n\n"
            await asyncio.sleep(0.01)
    return text_streamer()


MINDMAP_PROMPT = """Analyze the following text and create a mindmap structure.
Focus on the main concepts and their relationships.

TEXT:
{text}

Create a JSON structure with the following format:
{{
    "title": "Mindmap title",
    "nodes": [
        {{
            "id": "unique_id",
            "label": "concept name - keep labels concise (1-5 words)",
            "type": "central|topic|subtopic",
            "level": 0|1|2,
            "position": {{
                "x": "calculated_x",
                "y": "calculated_y"
            }},
            "style": {{
                "backgroundColor": "#hexcolor",
                "textColor": "#hexcolor",
                "borderColor": "#hexcolor",
                "fontSize": 14,
                "fontWeight": "normal|bold",
                "width": 180,  // Specify width based on content length
                "height": 80   // Specify height based on content length
            }}
        }}
    ],
    "links": [
        {{
            "source": "source_node_id",
            "target": "target_node_id",
            "type": "hierarchy|relationship",
            "description": "Optional short description (1-3 words)",
            "style": {{
                "strokeColor": "#hexcolor", 
                "strokeWidth": 1-3,
                "animated": false
            }}
        }}
    ]
}}

IMPROVED POSITIONING RULES:
1. Central node is at coordinates (0, 0)
2. Main topic nodes (level 1):
   - Place in a circle with radius 300 around the central node
   - For n level-1 nodes, use angles: 360°/n * index (0 to n-1)
3. Subtopic nodes (level 2):
   - Each topic's subtopics are placed in a sector facing outward from the central node
   - Use a radius of 600 from the central node
   - If a topic has m subtopics, distribute them within a 360°/n sector (where n is the number of topics)
   - The sector's center angle is determined by the parent topic's angle
4. Calculate positions using:
   x = radius * cos(angle in radians)
   y = radius * sin(angle in radians)
5. Apply node repulsion to ensure minimum distance between nodes:
   - After initial placement, check distances between all node pairs
   - If any nodes are closer than 200 units, adjust positions by pushing them apart

NODE SIZING RULES:
1. Adjust node width based on label length: 
   - Base width = 180px
   - Add 10px per character over 15 characters
2. Height should be at least 80px
3. Central node: width = max(220px, calculated width)

PRESENTATION RULES:
1. Keep node labels concise (1-5 words) to avoid layout issues
2. Limit hierarchy to 3 levels (central node, topics, subtopics)
3. Maximum 5 main topics and 3-4 subtopics per topic
4. Use consistent color schemes:
   - Central node: #2563eb (blue)
   - Topic nodes: #0891b2 (cyan)
   - Subtopic nodes: #334155 (slate)
5. Scale font size by importance:
   - Central node: 16px, bold
   - Topics: 14px, semibold
   - Subtopics: 14px, normal

Ensure the JSON is valid and properly structured with correct position calculations."""


async def generate_mindmap_with_gemini(text: str, filename: str) -> dict:
    """Generate a mindmap using Gemini LLM."""
    try:
        # Prepare the prompt with the text
        prompt = MINDMAP_PROMPT.format(text=text)
        
        # Get response from Gemini
        response = model.generate_content(
            prompt,
            generation_config={
                "temperature": 0.3,
                "response_mime_type": "text/plain"
            },
        )
        
        # Extract text from the response object
        response_text = response.text
        
        # Find and extract the JSON part of the response
        # Sometimes the model might include explanation text before/after the JSON
        import re
        json_match = re.search(r'({[\s\S]*})', response_text)
        
        if json_match:
            json_text = json_match.group(1)
            try:
                # Parse the JSON response
                mindmap = json.loads(json_text)
                # Ensure the title includes the filename
                mindmap["title"] = f"Mindmap for {filename}"
                return mindmap
            except json.JSONDecodeError as json_err:
                logger.error(f"Failed to parse JSON: {str(json_err)}\nResponse text: {json_text}")
                return generate_fallback_mindmap(filename)
        else:
            logger.error("Could not find JSON structure in response")
            return generate_fallback_mindmap(filename)
            
    except Exception as e:
        logger.error(f"Error generating mindmap with LLM: {str(e)}", exc_info=True)
        return generate_fallback_mindmap(filename)

def generate_fallback_mindmap(filename: str) -> dict:
    """Generate a basic mindmap structure if LLM fails."""
    return {
        "title": f"Mindmap for {filename}",
        "nodes": [{
            "id": "center",
            "label": filename,
            "type": "central",
            "level": 0
        }],
        "links": [],
        "metadata": {
            "error": "Failed to generate detailed mindmap"
        }
    }