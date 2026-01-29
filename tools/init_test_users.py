#!/usr/bin/env python3
"""Initialize test users in the database with proper hashing."""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import asyncio
from backend.database import users_collection
from backend.auth import hash_password

async def main():
    """Create or update test users."""
    test_users = [
        {"email": "ram@gmail.com", "password": "password", "role": "doctor", "name": "Ram"},
        {"email": "admin@mbctherapy.com", "password": "admin123", "role": "admin", "name": "Admin"},
    ]
    
    for user_data in test_users:
        email = user_data["email"]
        hashed_pw = hash_password(user_data["password"])
        
        result = await users_collection.update_one(
            {"email": email},
            {
                "$set": {
                    "password": hashed_pw,
                    "role": user_data["role"],
                    "name": user_data["name"],
                }
            },
            upsert=True
        )
        
        action = "created" if result.upserted_id else "updated"
        print(f"✓ {action.capitalize()} {email} (role: {user_data['role']})")
    
    print("\nTest users initialized successfully!")
    print("You can now log in with:")
    print("  - Email: ram@gmail.com | Password: password (Doctor)")
    print("  - Email: admin@mbctherapy.com | Password: admin123 (Admin)")

if __name__ == "__main__":
    asyncio.run(main())
