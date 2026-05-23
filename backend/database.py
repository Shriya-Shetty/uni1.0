import motor.motor_asyncio
import os
import certifi
import asyncio
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
DATABASE_NAME = os.getenv("DATABASE_NAME", "smart_resolve_db")

# In-memory mock storage for fallback
mock_db = {"complaints": []}

class MockCollection:
    def __init__(self, name):
        self.name = name
    
    async def insert_one(self, document):
        mock_db[self.name].append(document)
        return document
    
    def find(self, query=None):
        return MockCursor(mock_db[self.name])
    
    async def update_one(self, query, update):
        # Very simple mock update
        return {"modified_count": 1}

class MockCursor:
    def __init__(self, data):
        self.data = data
    
    def sort(self, key, direction=-1):
        try:
            # Simple descending sort for mock
            self.data.sort(key=lambda x: x.get(key, 0), reverse=(direction == -1))
        except:
            pass
        return self
        
    async def to_list(self, length):
        return self.data[:length]

try:
    if not MONGODB_URI:
        print("CRITICAL: MONGODB_URI not found in .env file. System will use sessional MOCK storage.")
        client = None
        db = None
    else:
        # Configuration for MongoDB Atlas connection
        mongo_kwargs = {
            "serverSelectionTimeoutMS": 5000,
            "connectTimeoutMS": 5000,
            "retryWrites": True
        }
        
        # Windows SSL fix: Use certifi
        try:
            mongo_kwargs["tlsCAFile"] = certifi.where()
            client = motor.motor_asyncio.AsyncIOMotorClient(MONGODB_URI, **mongo_kwargs)
            # Try a quick ping to verify
            # We don't await here as it's not an async block, but the first usage will trigger it
            db = client[DATABASE_NAME]
            print(f"INITIALIZED: MongoDB client created for Atlas. Target DB: {DATABASE_NAME}")
        except Exception as ssl_err:
            print(f"SSL CONFIG ERROR: {ssl_err}. Trying alternative connection...")
            # Fallback for systems where certifi still fails
            mongo_kwargs.pop("tlsCAFile", None)
            mongo_kwargs["tlsAllowInvalidCertificates"] = True
            client = motor.motor_asyncio.AsyncIOMotorClient(MONGODB_URI, **mongo_kwargs)
            db = client[DATABASE_NAME]
            print("INITIALIZED: MongoDB client created with tlsAllowInvalidCertificates=True fallback.")

except Exception as e:
    print(f"DATABASE INITIALIZATION FAILED: {e}. Falling back to sessional MOCK storage.")
    client = None
    db = None

async def get_db_status():
    """Returns the current database connection status."""
    if db is None:
        return {"status": "Mock", "message": "Using sessional in-memory storage (Data will be lost on restart)"}
    try:
        await client.admin.command('ping')
        return {"status": "Connected", "message": f"Live MongoDB Atlas ({DATABASE_NAME})"}
    except Exception as e:
        return {"status": "Disconnected", "message": f"Connection to Atlas failed: {str(e)}. Using Mock fallback."}

async def get_collection(collection_name: str):
    # Check if we have a real DB handle
    if db is None:
        return MockCollection(collection_name)
        
    try:
        # Try to ping before every collection access to ensure we haven't lost connection
        # If this fails, we switch to Mock for this request
        await client.admin.command('ping')
        return db[collection_name]
    except Exception as e:
        print(f"DATABASE CONNECTION LOST during '{collection_name}' access: {e}")
        return MockCollection(collection_name)
