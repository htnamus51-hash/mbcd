import asyncio
import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from backend.database import users_collection, clients_collection

async def main():
    email = "nidhi0@gmail.com"
    print(f"Checking for {email}...")
    
    user = await users_collection.find_one({"email": email})
    if user:
        print(f"Found in USERS collection: {user}")
    else:
        print("Not found in USERS collection")
        
    client = await clients_collection.find_one({"email": email})
    if client:
        print(f"Found in CLIENTS collection: {client}")
    else:
        print("Not found in CLIENTS collection")

    from backend.database import contacts_collection
    contact = await contacts_collection.find_one({"email": email})
    if contact:
        print(f"Found in CONTACTS collection: {contact}")
    else:
        print("Not found in CONTACTS collection")

    # Also list all clients just in case
    print("\nRecent Clients:")
    async for c in clients_collection.find({}).limit(5):
        print(c)

if __name__ == '__main__':
    asyncio.run(main())
