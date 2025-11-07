from fastapi import FastAPI, UploadFile, Form, HTTPException, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from utils.ai_api import call_ai_edit_image, generate_questions
from utils.file_manager import save_image_file, encode_image_base64, image_to_base64_to_front_end, load_characters, save_characters, UPLOAD_DIR
from utils.question_loader import load_questions_for_character
from typing import List
import base64
import os
import requests
import asyncio


app = FastAPI(title="AI Millionaire Game")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)


# ==================== ADMIN PASSWORD AUTHENTICATION API ====================
def verify_admin_password(password: str) -> bool:
    """
    Helper function to verify admin password
    """
    file_path = "password_admin.txt"
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            correct_password = f.read().strip()
        return password.strip() == correct_password
    except FileNotFoundError:
        return False

@app.post("/api/verify-password")
async def verify_password(password: str = Form(...)):
    """
    Verify the admin password using the file password_admin.txt
    """
    if verify_admin_password(password):
        return {"valid": True, "message": "✅ Authentication successful!"}
    else:
        return {"valid": False, "message": "❌ Incorrect password!"}


# ===============================================
# 🔹 API: Get prompt suggestions
# ===============================================
@app.get("/api/prompts")
async def get_prompts():
    """
    Return list of prompt suggestions from suggested_prompts.json
    """
    import json
    prompts_file = "suggested_prompts.json"
    try:
        with open(prompts_file, "r", encoding="utf-8") as f:
            prompts = json.load(f)
        return {"prompts": prompts}
    except FileNotFoundError:
        return {"prompts": []}
    except Exception as e:
        print(f"❌ Error reading suggested_prompts.json: {e}")
        return {"prompts": []}


# ===============================================
# 🔹 API 1: Get all characters
# ===============================================

@app.get("/api/characters")
async def get_characters(request: Request, offset: int = 0, platform: str = "desktop"):
    """
    Return a list of characters filtered by status and owner
    - status == "public" OR (owner == user_id)
    - Supports pagination with offset parameter
    - Backend automatically determines limit based on platform (desktop: 10, mobile: 8)
    """
    # Read x-user-id header
    user_id = request.headers.get("x-user-id", None)
    
    # Determine limit based on platform
    if platform.lower() == "mobile":
        limit = 8
    else:
        limit = 10  # Default to desktop
    
    characters = load_characters()
    
    # Filter characters: status == "public" OR owner == user_id
    filtered_characters = []
    for char in characters:
        status = char.get("status", "public")  # Default to "public" if status field doesn't exist
        owner = char.get("owner", "public")  # Default to "public" if owner field doesn't exist
        
        if status == "public" or owner == user_id:
            filtered_characters.append(char)
    
    # Apply pagination
    total = len(filtered_characters)
    # Calculate how many characters to return (limit or remaining if less)
    remaining = total - offset
    actual_limit = min(limit, remaining) if remaining > 0 else 0
    
    if actual_limit > 0:
        filtered_characters = filtered_characters[offset:offset + actual_limit]
    else:
        filtered_characters = []
    
    # Add image data to each character
    for char in filtered_characters:
        img_path = char.get("original_image")
        if img_path:
            char["image"] = image_to_base64_to_front_end(img_path)

    return {
        "characters": filtered_characters,
        "total": total,
        "limit": actual_limit,
        "offset": offset,
        "platform": platform
    }


# ===============================================
# 🔹 API: Admin - Get all characters (no filtering)
# ===============================================
@app.get("/api/admin/characters")
async def get_all_characters_admin(request: Request, offset: int = 0, platform: str = "desktop", sort: str = "oldest"):
    """
    Return all characters without filtering (admin only)
    Requires admin password in x-admin-password header
    Supports pagination with offset parameter
    Supports sorting with sort parameter: "oldest", "newest", "name_asc", "name_desc"
    - Backend automatically determines limit based on platform (desktop: 10, mobile: 8)
    """
    password = request.headers.get("x-admin-password", None)
    if not password or not verify_admin_password(password):
        raise HTTPException(status_code=401, detail="Unauthorized: Invalid admin password")
    
    # Determine limit based on platform
    if platform.lower() == "mobile":
        limit = 8
    else:
        limit = 10  # Default to desktop
    
    characters = load_characters()
    
    # Apply sorting before pagination
    if sort == "oldest":
        # Sort by ID ascending (oldest first)
        characters = list(characters)
    elif sort == "newest":
        # Sort by ID descending (newest first)
        characters = list(reversed(characters))
    elif sort == "name_asc":
        # Sort by name A-Z
        characters = sorted(characters, key=lambda x: x.get("name", "").lower())
    elif sort == "name_desc":
        # Sort by name Z-A
        characters = sorted(characters, key=lambda x: x.get("name", "").lower(), reverse=True)
    # If sort is invalid, default to oldest (no change)
    
    # Apply pagination after sorting
    total = len(characters)
    # Calculate how many characters to return (limit or remaining if less)
    remaining = total - offset
    actual_limit = min(limit, remaining) if remaining > 0 else 0
    
    if actual_limit > 0:
        characters = characters[offset:offset + actual_limit]
    else:
        characters = []
    
    # Add image data to each character
    for char in characters:
        img_path = char.get("original_image")
        if img_path:
            char["image"] = image_to_base64_to_front_end(img_path)

    return {
        "characters": characters,
        "total": total,
        "limit": actual_limit,
        "offset": offset,
        "platform": platform,
        "sort": sort
    }


# ===============================================
# 🔹 API: Admin - Delete character
# ===============================================
@app.delete("/api/admin/characters/{character_id}")
async def delete_character(character_id: int, request: Request):
    """
    Delete a character and its folder (admin only)
    Requires admin password in x-admin-password header
    """
    password = request.headers.get("x-admin-password", None)
    if not password or not verify_admin_password(password):
        raise HTTPException(status_code=401, detail="Unauthorized: Invalid admin password")
    
    import shutil
    
    characters = load_characters()
    char = next((c for c in characters if c["id"] == character_id), None)
    
    if not char:
        raise HTTPException(status_code=404, detail="Character not found")
    
    # Delete the character folder
    folder_path = char.get("folder")
    if folder_path and os.path.exists(folder_path):
        try:
            shutil.rmtree(folder_path)
            print(f"✅ Deleted folder: {folder_path}")
        except Exception as e:
            print(f"⚠️ Error deleting folder {folder_path}: {e}")
    
    # Remove from characters list
    characters = [c for c in characters if c["id"] != character_id]
    save_characters(characters)
    
    return {"message": f"Character {character_id} deleted successfully"}


# ===============================================
# 🔹 API: Admin - Make character public
# ===============================================
@app.put("/api/admin/characters/{character_id}/make-public")
async def make_character_public(character_id: int, request: Request):
    """
    Set character status to "public" (admin only)
    Requires admin password in x-admin-password header
    """
    password = request.headers.get("x-admin-password", None)
    if not password or not verify_admin_password(password):
        raise HTTPException(status_code=401, detail="Unauthorized: Invalid admin password")
    
    characters = load_characters()
    char = next((c for c in characters if c["id"] == character_id), None)
    
    if not char:
        raise HTTPException(status_code=404, detail="Character not found")
    
    # Update status to "public"
    char["status"] = "public"
    save_characters(characters)
    
    return {"message": f"Character {character_id} is now public", "character": char}


# ===============================================
# 🔹 API: Admin - Make character private
# ===============================================
@app.put("/api/admin/characters/{character_id}/make-private")
async def make_character_private(character_id: int, request: Request):
    """
    Set character status to "private" (admin only)
    Requires admin password in x-admin-password header
    """
    password = request.headers.get("x-admin-password", None)
    if not password or not verify_admin_password(password):
        raise HTTPException(status_code=401, detail="Unauthorized: Invalid admin password")
    
    characters = load_characters()
    char = next((c for c in characters if c["id"] == character_id), None)
    
    if not char:
        raise HTTPException(status_code=404, detail="Character not found")
    
    # Update status to "private"
    char["status"] = "private"
    save_characters(characters)
    
    return {"message": f"Character {character_id} is now private", "character": char}




# =====================================================
# 🧠 API: Upload + Generate images + Save character
# =====================================================
@app.post("/api/upload")
async def upload(
    request: Request,
    background_tasks: BackgroundTasks,
    name: str = Form(...),
    api_key: str = Form(...),
    prompts: List[str] = Form(...),
    image: UploadFile = None,
    questions_json: str = Form(None)
):
    """
    Receive character information (name, base image, prompts, api_key, questions)
    → Save the new character and generate corresponding images using AI
    """
    # Read x-user-id header
    user_id = request.headers.get("x-user-id", None)
    import json
    validated_questions = None
    
    # Validate questions JSON if provided (BEFORE generating images)
    if questions_json:
        try:
            questions = json.loads(questions_json)
            
            # Check if it's an array
            if not isinstance(questions, list):
                raise HTTPException(status_code=400, detail="Questions must be an array")
            
            # Validate each question
            for idx, q in enumerate(questions, start=1):
                # Check required fields
                if not isinstance(q, dict):
                    raise HTTPException(status_code=400, detail=f"Question {idx} must be an object")
                
                required_fields = ["id", "question", "options", "answer"]
                for field in required_fields:
                    if field not in q:
                        raise HTTPException(status_code=400, detail=f"Question {idx} missing required field: {field}")
                
                # Validate options
                if not isinstance(q["options"], list):
                    raise HTTPException(status_code=400, detail=f"Question {idx}: options must be an array")
                
                if len(q["options"]) != 4:
                    raise HTTPException(status_code=400, detail=f"Question {idx}: must have exactly 4 options")
                
                # Validate that answer is one of the options
                if q["answer"] not in q["options"]:
                    raise HTTPException(status_code=400, detail=f"Question {idx}: answer '{q['answer']}' must be one of the options")
            
            validated_questions = questions
            print(f"✅ All {len(questions)} questions validated successfully")
            
        except json.JSONDecodeError as e:
            raise HTTPException(status_code=400, detail=f"Invalid JSON format: {str(e)}")
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error validating questions: {str(e)}")

    # Ensure the uploads directory exists
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    # === Determine the new character ID ===
    characters = load_characters()
    new_id = len(characters) + 1
    existing_ids = {c.get("id", 0) for c in characters}
    while new_id in existing_ids:
        new_id += 1


    # === Normalize folder name: "id_name" ===
    safe_name = name.replace(" ", "_").lower()
    folder_name = f"{new_id}_{safe_name}"
    character_folder = os.path.join(UPLOAD_DIR, folder_name)
    os.makedirs(character_folder, exist_ok=True)

    # Save the original character image in a separate folder
    image_ext = os.path.splitext(image.filename)[1] or ".png"
    image_path = os.path.join(character_folder, f"0{image_ext}")
    original_image =image_path

    with open(image_path, "wb") as f:
        f.write(await image.read())

    # Save questions JSON and character info first
    if validated_questions:
        try: 
            # Edit id to increase from 1
            for idx, q in enumerate(validated_questions, start=1):
                q['id'] = idx
            questions_path = os.path.join(character_folder, "questions.json")
            with open(questions_path, "w", encoding="utf-8") as f:
                json.dump(validated_questions, f, ensure_ascii=False, indent=2)
            print(f"✅ Questions saved to {questions_path}")
        except Exception as e:
            print(f"⚠️ Error saving questions: {e}")

    # Update character information in JSON file
    characters = load_characters()
    new_character = {
        "id": new_id,
        "name": name,
        "original_image": original_image,
        "folder": character_folder,
        "owner": user_id if user_id else "No one",
        "status": "private"  # Default status is private
    }
    characters.append(new_character)
    save_characters(characters)

    # Define background task for generating images
    def generate_images_background():
        """Generate images in the background to avoid blocking other requests"""
        # Generate images through the AI API
        # Use the original image for every prompt (do not update image_path)
        for idx, prompt in enumerate(prompts, start=1):
            print(f"🎨 Processing prompt {idx}/{len(prompts)}: {prompt[:60]}...")

            # Always use the original image for each call
            result_url = call_ai_edit_image(api_key, original_image, prompt)

            if not result_url:
                print(f"⚠️ Prompt {idx} failed, skipping.")
                continue

            try:
                # Send request to download the result image
                res = requests.get(result_url, timeout=60)
                res.raise_for_status()

                # Rename the file sequentially: 1.jpg, 2.jpg, ...
                new_filename = f"{idx}{image_ext}"
                new_path = os.path.join(character_folder, new_filename)

                with open(new_path, "wb") as out_file:
                    out_file.write(res.content)

                print(f"✅ Image {idx} saved at: {new_path}")

            except Exception as e:
                print(f"❌ Error downloading image {idx}: {e}")
                continue
    
    # Add background task
    background_tasks.add_task(generate_images_background)

    return {
        "message": f"✅ Character '{name}' has been added successfully! Images are being generated in the background.",
        "character": new_character
    }


# =====================================================
# 🧠 API: Generate questions using AI
# =====================================================
@app.post("/api/generate-questions")
async def generate_questions_api(
    api_key: str = Form(...),
    topic: str = Form(...),
    difficulties: List[int] = Form(...),
    num_questions: int = Form(...)
):
    """
    Generate quiz questions using AI API based on topic and difficulty levels.
    """
    try:
        # Convert difficulties from FormData (strings) to integers
        difficulties_int = [int(d) for d in difficulties]
        
        # Run generate_questions in a separate thread to avoid blocking
        loop = asyncio.get_event_loop()
        questions = await loop.run_in_executor(
            None,
            generate_questions,
            api_key,
            topic,
            difficulties_int,
            num_questions
        )
        
        if questions:
            return {
                "success": True,
                "questions": questions,
                "count": len(questions)
            }
        else:
            return {
                "success": False,
                "message": "Failed to generate questions. Please try again."
            }
    except Exception as e:
        print(f"❌ Error generating questions: {e}")
        return {
            "success": False,
            "message": f"Error: {str(e)}"
        }


@app.post("/api/question/{qid}")
async def get_question(qid: int, character_id: int = Form(...)):
    """
    Return the question and corresponding image
    """
    # Find character by ID
    characters = load_characters()
    char = next((c for c in characters if c["id"] == character_id), None)
    if not char:
        return {"error": "❌ Character not found!"}

    # Path to the folder containing image files
    folder_path = char["folder"]

    # Load questions for this character
    try:
        questions = load_questions_for_character(folder_path)
    except FileNotFoundError as e:
        return {"error": str(e)}

    if qid > len(questions):
        return {"done": True, "message": "🎉 You have completed the game!"}

    question = questions[qid - 1]


    # Get list of files image
    image_extensions = (".jpg", ".jpeg", ".png", ".gif", ".webp")
    files = [
        f for f in os.listdir(folder_path)
        if os.path.isfile(os.path.join(folder_path, f))
        and f.lower().endswith(image_extensions)
    ]

    # Sort alphabetically
    files.sort()

    image = files[qid - 1] if qid - 1 < len(files) else ""
    image_path = os.path.join(folder_path, image)
    image_data = image_to_base64_to_front_end(image_path)
    
    return {"question": question, "image": image_data, "character_name": char["name"]}


@app.post("/api/answer")
async def submit_answer(question_id: int = Form(...), answer: str = Form(...), character_id: int = Form(...)):
    """
    Check the answer. If correct → unlock the next image.
    If the player wins → return the final image.
    """

    # Folder containing images
    # Find character
    characters = load_characters()
    char = next((c for c in characters if c["id"] == character_id), None)
    if not char:
        return {"correct": False, "message": "❌ Character not found!"}

    folder_path = char["folder"]

    # Load questions for the character
    try:
        questions = load_questions_for_character(folder_path)
    except FileNotFoundError as e:
        return {"correct": False, "message": str(e)}

    question = questions[question_id - 1]
    correct = (answer.strip().lower() == question["answer"].strip().lower())

    if not correct:
        return {"correct": False, "message": "❌ Wrong answer! Game Over."}

    next_id = question_id + 1

    

    # Get list of files image
    image_extensions = (".jpg", ".jpeg", ".png", ".gif", ".webp")
    files = [
        f for f in os.listdir(folder_path)
        if os.path.isfile(os.path.join(folder_path, f))
        and f.lower().endswith(image_extensions)
    ]
    files.sort()

    # If the player wins (no more questions)
    if next_id > len(questions) or next_id > len(files)-1:
        last_img = files[-1] if len(files) > 0 else None
        image_data = None
        if last_img:
            img_path = os.path.join(folder_path, last_img)
            ext = os.path.splitext(img_path)[1].lower()
            mime_type = "image/png" if ext not in [".jpg", ".jpeg"] else "image/jpeg"
            with open(img_path, "rb") as image_file:
                b64 = base64.b64encode(image_file.read()).decode("utf-8")
                image_data = f"data:{mime_type};base64,{b64}"

        return {
            "correct": True,
            "message": "🎉 Congratulations! You won!",
            "next_question": None,
            "next_image": image_data,
        }

    # If there are still more questions
    next_q = questions[next_id - 1]
    next_img = files[next_id - 1] if next_id - 1 < len(files) else ""
    next_img_path = os.path.join(folder_path, next_img)

    image_data = image_to_base64_to_front_end(next_img_path)

    return {
        "correct": True,
        "next_question": next_q,
        "next_image": image_data,
    }