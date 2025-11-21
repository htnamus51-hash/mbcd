import sys
import os

# Add backend directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Apply Pydantic v1 + Python 3.13 compatibility patch BEFORE importing FastAPI
from pydantic_fix import *  # noqa: F401, F403

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from bson import ObjectId
from datetime import datetime, timedelta

from database import users_collection, appointments_collection, clients_collection, notes_collection
from schemas import (
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    SimpleMessage,
    AppointmentCreate,
    AppointmentResponse,
    ClientCreate,
    ClientResponse,
    NoteCreate,
    NoteResponse,
)

app = FastAPI()

# Temporary: allow all origins during development while we debug preflight issues.
# Replace with a specific origin like "http://localhost:5173" when finished.
origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/auth/login", response_model=LoginResponse)
async def login(payload: LoginRequest):
    user = await users_collection.find_one({"email": payload.email})

    if not user or user.get("password") != payload.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    role = user.get("role")
    if role == "admin":
        return LoginResponse(role="admin", message="Admin login successful")
    elif role == "doctor":
        return LoginResponse(role="doctor", message="Doctor login successful")
    else:
        raise HTTPException(status_code=400, detail="Unknown role")


@app.post("/api/auth/register", response_model=SimpleMessage)
async def register(payload: RegisterRequest):
    # Debugging: print incoming role and show that request reached the route
    # (This will only run for POST; OPTIONS is handled by CORSMiddleware.)
    print(f"Register attempt: email={payload.email}, role={payload.role}")
    existing = await users_collection.find_one({"email": payload.email})
    if existing:
        raise HTTPException(status_code=409, detail="User already exists")

    if not payload.password or len(payload.password) < 4:
        raise HTTPException(status_code=400, detail="Password too short")

    await users_collection.insert_one(
        {
            "email": payload.email,
            "password": payload.password,  # TODO: hash later
            "role": payload.role,
        }
    )

    if payload.role == "admin":
        msg = "Admin account created successfully"
    elif payload.role == "doctor":
        msg = "Doctor account created successfully"
    else:
        raise HTTPException(status_code=400, detail="Unsupported role")

    return SimpleMessage(message=msg)


@app.post("/api/appointments", response_model=AppointmentResponse)
async def create_appointment(payload: AppointmentCreate):
    """Create a new appointment and save to MongoDB after checking availability."""
    
    # Parse the datetime to check for conflicts
    appt_start = datetime.fromisoformat(payload.datetime.replace('Z', '+00:00'))
    appt_end = appt_start + timedelta(minutes=payload.duration)
    
    # Extract date string for comparison (YYYY-MM-DD)
    appt_date = appt_start.strftime("%Y-%m-%d")
    
    # Get all appointments for this doctor on the same date
    existing_appts = await appointments_collection.find({
        "doctor": payload.doctor,
        "status": {"$ne": "cancelled"}
    }).to_list(None)
    
    # Check for time overlap in Python (simpler and more reliable)
    for existing in existing_appts:
        existing_start = datetime.fromisoformat(existing["datetime"].replace('Z', '+00:00'))
        existing_date = existing_start.strftime("%Y-%m-%d")
        
        # Only check if on the same date
        if existing_date != appt_date:
            continue
        
        existing_end = existing_start + timedelta(minutes=existing.get("duration", 60))
        
        # Check for overlap: new starts before existing ends AND new ends after existing starts
        if appt_start < existing_end and appt_end > existing_start:
            raise HTTPException(
                status_code=409,
                detail=f"Time slot conflict! Doctor {payload.doctor} is already booked from {existing_start.strftime('%H:%M')} to {existing_end.strftime('%H:%M')} on {appt_date}. Please choose another time."
            )
    
    appointment_doc = {
        "doctor": payload.doctor,
        "datetime": payload.datetime,
        "purpose": payload.purpose,
        "client": payload.client,
        "duration": payload.duration,
        "status": "scheduled",
        "created_at": datetime.utcnow(),
    }
    result = await appointments_collection.insert_one(appointment_doc)
    appointment_doc["id"] = str(result.inserted_id)
    return AppointmentResponse(**appointment_doc)


@app.get("/api/appointments")
async def get_appointments(doctor: str = None):
    """Get all appointments or filter by doctor."""
    query = {}
    if doctor:
        query["doctor"] = doctor
    
    appointments = await appointments_collection.find(query).to_list(None)
    return [
        {
            "id": str(appt["_id"]),
            "doctor": appt.get("doctor"),
            "datetime": appt.get("datetime"),
            "purpose": appt.get("purpose"),
            "client": appt.get("client"),
            "duration": appt.get("duration", 60),
            "status": appt.get("status", "scheduled"),
        }
        for appt in appointments
    ]


@app.get("/api/appointments/check-availability")
async def check_availability(doctor: str, datetime_str: str, duration: int = 60):
    """
    Check if a doctor is available for a given time slot.
    Returns: { "available": true/false, "message": "..." }
    """
    try:
        appt_start = datetime.fromisoformat(datetime_str.replace('Z', '+00:00'))
        appt_end = appt_start + timedelta(minutes=duration)
        appt_date = appt_start.strftime("%Y-%m-%d")
        
        # Get all appointments for this doctor on the same date
        existing_appts = await appointments_collection.find({
            "doctor": doctor,
            "status": {"$ne": "cancelled"}
        }).to_list(None)
        
        # Check for time overlap in Python
        for existing in existing_appts:
            existing_start = datetime.fromisoformat(existing["datetime"].replace('Z', '+00:00'))
            existing_date = existing_start.strftime("%Y-%m-%d")
            
            # Only check if on the same date
            if existing_date != appt_date:
                continue
            
            existing_end = existing_start + timedelta(minutes=existing.get("duration", 60))
            
            # Check for overlap
            if appt_start < existing_end and appt_end > existing_start:
                return {
                    "available": False,
                    "message": f"Doctor is busy from {existing_start.strftime('%H:%M')} to {existing_end.strftime('%H:%M')} on {appt_date}"
                }
        
        return {"available": True, "message": "Time slot is available"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid datetime format: {str(e)}")


@app.delete("/api/appointments/{appointment_id}")
async def delete_appointment(appointment_id: str):
    """Delete an appointment."""
    from bson.errors import InvalidId
    try:
        result = await appointments_collection.delete_one({"_id": ObjectId(appointment_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Appointment not found")
        return SimpleMessage(message="Appointment deleted successfully")
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid appointment ID")


@app.post("/api/clients", response_model=ClientResponse)
async def create_client(payload: ClientCreate):
    """Create a new client and save to MongoDB."""
    client_doc = {
        "first_name": payload.first_name,
        "last_name": payload.last_name,
        "email": payload.email,
        "phone": payload.phone,
        "date_of_birth": payload.date_of_birth,
        "gender": payload.gender,
        "created_at": datetime.utcnow(),
    }
    result = await clients_collection.insert_one(client_doc)
    client_doc["id"] = str(result.inserted_id)
    return ClientResponse(**client_doc)


@app.get("/api/clients")
async def list_clients():
    clients = await clients_collection.find({}).to_list(None)
    return [
        {
            "id": str(c.get("_id")),
            "first_name": c.get("first_name"),
            "last_name": c.get("last_name"),
            "email": c.get("email"),
            "phone": c.get("phone"),
            "date_of_birth": c.get("date_of_birth"),
            "gender": c.get("gender"),
        }
        for c in clients
    ]


@app.get("/api/clients/{client_id}")
async def get_client(client_id: str):
    from bson.errors import InvalidId
    try:
        client = await clients_collection.find_one({"_id": ObjectId(client_id)})
        if not client:
            raise HTTPException(status_code=404, detail="Client not found")

        return {
            "id": str(client.get("_id")),
            "first_name": client.get("first_name"),
            "last_name": client.get("last_name"),
            "email": client.get("email"),
            "phone": client.get("phone"),
            "date_of_birth": client.get("date_of_birth"),
            "gender": client.get("gender"),
        }
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid client ID")


# ==================== NOTES ENDPOINTS ====================

@app.post("/api/notes", response_model=NoteResponse)
async def create_note(payload: NoteCreate):
    """Create a new note and save to MongoDB."""
    note_doc = {
        "note_type": payload.note_type,
        "content": payload.content,
        "client_id": payload.client_id,
        "reminder_date": payload.reminder_date,
        "reminder_time": payload.reminder_time,
        "created_at": datetime.utcnow().isoformat() + "Z",
        "created_by": "Dr. Admin",
    }
    result = await notes_collection.insert_one(note_doc)
    note_doc["id"] = str(result.inserted_id)
    return NoteResponse(**note_doc)


@app.get("/api/notes")
async def get_notes(client_id: str = None):
    """Get all notes or filter by client."""
    query = {}
    if client_id:
        query["client_id"] = client_id
    
    notes = await notes_collection.find(query).sort("created_at", -1).to_list(None)
    return [
        {
            "id": str(note["_id"]),
            "note_type": note.get("note_type"),
            "content": note.get("content"),
            "client_id": note.get("client_id"),
            "reminder_date": note.get("reminder_date"),
            "reminder_time": note.get("reminder_time"),
            "created_at": note.get("created_at"),
            "created_by": note.get("created_by", "Dr. Admin"),
            "completed": note.get("completed", False),
        }
        for note in notes
    ]


@app.delete("/api/notes/{note_id}")
async def delete_note(note_id: str):
    """Delete a note."""
    from bson.errors import InvalidId
    try:
        result = await notes_collection.delete_one({"_id": ObjectId(note_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Note not found")
        return SimpleMessage(message="Note deleted successfully")
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid note ID")


@app.patch("/api/notes/{note_id}/complete")
async def complete_note(note_id: str):
    """Mark a note as completed."""
    from bson.errors import InvalidId
    try:
        result = await notes_collection.update_one(
            {"_id": ObjectId(note_id)},
            {"$set": {"completed": True}}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Note not found")
        
        # Return updated note
        note = await notes_collection.find_one({"_id": ObjectId(note_id)})
        return {
            "id": str(note["_id"]),
            "note_type": note.get("note_type"),
            "content": note.get("content"),
            "client_id": note.get("client_id"),
            "reminder_date": note.get("reminder_date"),
            "reminder_time": note.get("reminder_time"),
            "created_at": note.get("created_at"),
            "created_by": note.get("created_by", "Dr. Admin"),
            "completed": note.get("completed", True),
        }
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid note ID")
