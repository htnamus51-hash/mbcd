import os
import certifi
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load .env locally (for development only)
load_dotenv()

# MongoDB Atlas connection - use environment variable
MONGO_URI = os.getenv("MONGO_URI")

if not MONGO_URI:
    raise ValueError("MONGO_URI environment variable not set. Please set it in your .env file.")

print(f"[DEBUG] Connecting to MongoDB with URI: {MONGO_URI[:50]}...")

# Motor client with connection pooling
try:
    # Create client with SSL/TLS configuration
    # Note: connect=False prevents immediate connection, allowing lazy connection
    client = AsyncIOMotorClient(
        MONGO_URI,
        serverSelectionTimeoutMS=15000,
        socketTimeoutMS=15000,
        connectTimeoutMS=15000,
        tlsCAFile=certifi.where() # Use certifi bundle strictly
    )
    # Switch to 'mbc' database which actually contains the data
    db = client.get_database("mbc")
    users_collection = db.users
    appointments_collection = db.appointments
    clients_collection = db.clients
    notes_collection = db.notes
    messages_collection = db.messages
    conversations_collection = db.conversations
    contacts_collection = db.contacts

    # Second database for external patient registrations
    db_patients = client.get_database("mbc_patients")
    patients_collection = db_patients.patients

    print("[DEBUG] MongoDB connection initialized successfully")
except Exception as e:
    print(f"[ERROR] Failed to initialize MongoDB: {e}")
    raise

