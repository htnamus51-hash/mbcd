import asyncio
import os
import certifi
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")

if not MONGO_URI:
    print("Error: MONGO_URI not found in .env")
    exit(1)

async def check_db():
    print(f"Connecting to: {MONGO_URI.split('@')[1]}") # Print host part only for privacy
    
    try:
        client = AsyncIOMotorClient(
            MONGO_URI,
            serverSelectionTimeoutMS=10000,
            tlsCAFile=certifi.where()
        )
        
        # List all databases
        dbs = await client.list_database_names()
        print(f"\nFound Databases: {dbs}")
        
        for db_name in dbs:
            if db_name in ['admin', 'local', 'config']:
                continue
                
            print(f"\nScanning Database: '{db_name}'")
            db = client[db_name]
            
            # List collections
            collections = await db.list_collection_names()
            print(f"  Collections: {collections}")
            
            for col_name in collections:
                count = await db[col_name].count_documents({})
                print(f"    - {col_name}: {count} documents")
                
                if count > 0:
                    sample = await db[col_name].find_one({})
                    # Strip sensitive data for printing
                    if 'password' in sample: sample['password'] = '***'
                    print(f"      Sample: {sample}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(check_db())
