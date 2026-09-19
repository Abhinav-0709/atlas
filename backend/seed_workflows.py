import urllib.request
import json

def seed_workflows():
    # Workflow 1
    wf1 = {
        "name": "Order Fulfillment Pipeline",
        "description": "Multi-stage payment verification, inventory hold, and shipping dispatch with automated retries.",
        "definition": {
            "name": "Order Fulfillment Pipeline",
            "description": "Multi-stage payment verification, inventory hold, and shipping dispatch with automated retries.",
            "tasks": [
                {"key": "validate_payment", "name": "Validate Payment", "type": "HTTP", "dependencies": []},
                {"key": "reserve_inventory", "name": "Reserve Inventory", "type": "PYTHON_FUNCTION", "dependencies": ["validate_payment"]},
                {"key": "notify_warehouse", "name": "Notify Warehouse", "type": "HTTP", "dependencies": ["reserve_inventory"]},
                {"key": "send_confirmation", "name": "Send Customer Confirmation", "type": "DELAY", "dependencies": ["notify_warehouse"]}
            ]
        }
    }
    
    req1 = urllib.request.Request(
        "https://atlas-api.abhinav.sbs/workflows",
        data=json.dumps(wf1).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    
    try:
        with urllib.request.urlopen(req1) as response:
            print("Workflow 1:", response.status, response.read().decode('utf-8'))
    except Exception as e:
        print("Workflow 1 Failed:", e)

    # Workflow 2
    wf2 = {
        "name": "Data Ingestion & Embedding Sync",
        "description": "Scrapes regulatory feeds, executes neural embedding transform, and updates vector store.",
        "definition": {
            "name": "Data Ingestion & Embedding Sync",
            "description": "Scrapes regulatory feeds, executes neural embedding transform, and updates vector store.",
            "tasks": [
                {"key": "fetch_raw_corpus", "name": "Fetch Corpus", "type": "HTTP", "dependencies": []},
                {"key": "generate_embeddings", "name": "Neural Embeddings", "type": "PYTHON_FUNCTION", "dependencies": ["fetch_raw_corpus"]},
                {"key": "commit_vector_index", "name": "Commit Vector Store", "type": "PYTHON_FUNCTION", "dependencies": ["generate_embeddings"]}
            ]
        }
    }
    
    req2 = urllib.request.Request(
        "https://atlas-api.abhinav.sbs/workflows",
        data=json.dumps(wf2).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    
    try:
        with urllib.request.urlopen(req2) as response:
            print("Workflow 2:", response.status, response.read().decode('utf-8'))
    except Exception as e:
        print("Workflow 2 Failed:", e)

if __name__ == "__main__":
    seed_workflows()
