
import asyncio
import os
import certifi
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import pymongo

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
print(f"Testing connection to: {MONGO_URI.split('@')[1] if '@' in MONGO_URI else '***'}")

async def test_connect():
    import ssl
    import socket
    print(f"OpenSSL Version: {ssl.OPENSSL_VERSION}")
    
    # Check DNS
    try:
        host = "cluster0.ncihy4i.mongodb.net"
        print(f"\nResolving {host}...")
        infos = socket.getaddrinfo(host, 443)
        for family, type, proto, canonname, sockaddr in infos:
            print(f" - {sockaddr}")
    except Exception as e:
        print(f"DNS Check Failed: {e}")

    # Test 8: OCSP Disabled ONLY (Valid Certs expected but no revocation check)
    print("\nAttempt 8: tlsDisableOCSPEndpointCheck=True (Strict Certs)...")
    try:
        client = AsyncIOMotorClient(
            MONGO_URI,
            serverSelectionTimeoutMS=5000,
            tls=True,
            tlsDisableOCSPEndpointCheck=True
        )
        await client.admin.command('ping')
        print("SUCCESS: Disable OCSP worked!")
    except Exception as e:
        print(f"FAILED (Disable OCSP Only): {e}")

    print("\nAttempt 9: Legacy OpenSSL Options...")
    # Clean patch
    original_create_default_context = ssl.create_default_context
    def patched_create_default_context(*args, **kwargs):
        ctx = original_create_default_context(*args, **kwargs)
        try:
            # Enable legacy server connect (0x4 in strict openssl headers, but accessible via attribute in py3.12+ hopefully)
            # secure_renegotiation is enforced in SSL 3.0.
            # We want to allow unsafe legacy renegotiation if that's the issue.
            
            # OP_LEGACY_SERVER_CONNECT = 0x00000004
            ctx.options |= 0x00000004 
            
            # Reduce security level via string
            ctx.set_ciphers('DEFAULT@SECLEVEL=0')
            ctx.check_hostname = False
            ctx.verify_mode = ssl.CERT_NONE
        except Exception as e:
            print(f"Patch warning: {e}")
        return ctx
    
    ssl.create_default_context = patched_create_default_context
    
    try:
        client = AsyncIOMotorClient(
            MONGO_URI,
            serverSelectionTimeoutMS=5000,
            tls=True,
            tlsAllowInvalidCertificates=True
        )
        await client.admin.command('ping')
        print("SUCCESS: Legacy Options worked!")
    except Exception as e:
        print(f"FAILED (Legacy Options): {e}")
    finally:
        ssl.create_default_context = original_create_default_context

    # Back to original logic...

    print("Attempt 1: Standard connection with certifi...")
    try:
        client = AsyncIOMotorClient(
            MONGO_URI,
            serverSelectionTimeoutMS=5000,
            tlsCAFile=certifi.where()
        )
        await client.admin.command('ping')
        print("SUCCESS: Standard connection with certifi worked!")
        return
    except Exception as e:
        print(f"FAILED: {e}")

    print("\nAttempt 2: tlsAllowInvalidCertificates=True...")
    try:
        client = AsyncIOMotorClient(
            MONGO_URI,
            serverSelectionTimeoutMS=5000,
            tls=True,
            tlsAllowInvalidCertificates=True
        )
        await client.admin.command('ping')
        print("SUCCESS: tlsAllowInvalidCertificates=True worked!")
        return
    except Exception as e:
        print(f"FAILED: {e}")

    print("\nAttempt 3: No explicit TLS settings (rely on defaults)...")
    try:
        client = AsyncIOMotorClient(
            MONGO_URI,
            serverSelectionTimeoutMS=5000
        )
        await client.admin.command('ping')
        print("SUCCESS: Default settings worked!")
        return
    except Exception as e:
        print(f"FAILED: {e}")
        
if __name__ == "__main__":
    asyncio.run(test_connect())
