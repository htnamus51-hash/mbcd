import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
import certifi
from dotenv import load_dotenv

load_dotenv()
MONGO_URI = os.getenv("MONGO_URI")

async def test_patients():
    try:
        client = AsyncIOMotorClient(MONGO_URI, tlsCAFile=certifi.where())
        db = client.get_database("mbc_patients")
        count = await db.patients.count_documents({})
        print(f"Connected to mbc_patients. Document count in 'patients': {count}")
        
        cursor = db.patients.find({}).limit(5)
        async for doc in cursor:
            print(f"Doc: {doc}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_patients())
