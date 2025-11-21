"""
Async MongoDB Atlas Data API client helpers.
Will use environment variables:
- ATLAS_DATA_API_URL : base URL for Data API, e.g. https://data.mongodb-api.com/app/<app-id>/endpoint/data/v1
- ATLAS_DATA_API_KEY : API key
- ATLAS_DATA_SOURCE : replica set / cluster name (default: Cluster0)
- ATLAS_DATABASE : database name (default: mbc)

Provides async functions: find_one(collection, filter), insert_one(collection, document)
"""
from typing import Any, Dict, Optional
import os
import httpx

ATLAS_DATA_API_URL = os.getenv("ATLAS_DATA_API_URL")
ATLAS_DATA_API_KEY = os.getenv("ATLAS_DATA_API_KEY")
ATLAS_DATA_SOURCE = os.getenv("ATLAS_DATA_SOURCE", "Cluster0")
ATLAS_DATABASE = os.getenv("ATLAS_DATABASE", "mbc")

USE_DATA_API = bool(ATLAS_DATA_API_URL and ATLAS_DATA_API_KEY)

async def _post_action(action: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    url = f"{ATLAS_DATA_API_URL}/action/{action}"
    headers = {
        "Content-Type": "application/json",
        "api-key": ATLAS_DATA_API_KEY,
    }
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.post(url, json=payload, headers=headers)
        r.raise_for_status()
        return r.json()

async def find_one(collection: str, filter: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    if not USE_DATA_API:
        raise RuntimeError("Data API not configured")
    payload = {
        "dataSource": ATLAS_DATA_SOURCE,
        "database": ATLAS_DATABASE,
        "collection": collection,
        "filter": filter,
    }
    res = await _post_action("findOne", payload)
    # Data API returns document in 'document' key or null
    return res.get("document")

async def insert_one(collection: str, document: Dict[str, Any]) -> Dict[str, Any]:
    if not USE_DATA_API:
        raise RuntimeError("Data API not configured")
    payload = {
        "dataSource": ATLAS_DATA_SOURCE,
        "database": ATLAS_DATABASE,
        "collection": collection,
        "document": document,
    }
    res = await _post_action("insertOne", payload)
    # res contains insertedId
    return res
