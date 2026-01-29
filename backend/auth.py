from passlib.context import CryptContext
from typing import Tuple

# Use argon2 primarily with bcrypt as fallback to avoid bcrypt initialization issues
try:
    pwd_context = CryptContext(
        schemes=["argon2", "bcrypt"],
        deprecated="auto",
        argon2__rounds=3,
    )
except Exception:
    # Fallback if argon2 not available
    pwd_context = CryptContext(
        schemes=["bcrypt"],
        deprecated="auto",
        bcrypt__rounds=12,
    )

# bcrypt has a 72-byte limit for passwords
MAX_PASSWORD_BYTES = 72


def _truncate_password(password: str) -> str:
    """Truncate password to 72 bytes for bcrypt compatibility."""
    return password.encode('utf-8')[:MAX_PASSWORD_BYTES].decode('utf-8', errors='ignore')


def hash_password(password: str) -> str:
    truncated = _truncate_password(password)
    return pwd_context.hash(truncated)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        truncated = _truncate_password(plain_password)
        return pwd_context.verify(truncated, hashed_password)
    except Exception:
        return False


def needs_rehash(hashed_password: str) -> bool:
    try:
        return pwd_context.needs_update(hashed_password)
    except Exception:
        return False
