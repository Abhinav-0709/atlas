import json
import sys
import urllib.request

API_BASE = sys.argv[1] if len(sys.argv) > 1 else "https://atlas-api.abhinav.sbs"

# Task function names MUST match what is registered in
# atlas/backend/atlas/tasks/builtin_functions.py, and that module must be
# imported at worker startup (atlas/worker/main.py) or these tasks will fail
# with UnregisteredFunctionError at run time.
#
# Use a different workflow NAME than the broken seeded ones, otherwise the
# API returns 409 "Workflow with name '...' already exists".


def post_workflow(wf: dict) -> None:
    req = urllib.request.Request(
        f"{API_BASE}/workflows",
        data=json.dumps(wf).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req) as response:
            print("Created:", response.status, response.read().decode("utf-8"))
    except Exception as e:
        print("Failed:", e)


# Workflow 1: Order Fulfillment Pipeline v2
wf1 = {
    "name": "Order Fulfillment Pipeline v2",
    "description": (
        "Multi-stage payment verification, inventory hold, and shipping "
        "dispatch with automated retries (fixed configurations)."
    ),
    "definition": {
        "name": "Order Fulfillment Pipeline v2",
        "description": (
            "Multi-stage payment verification, inventory hold, and shipping "
            "dispatch with automated retries (fixed configurations)."
        ),
        "tasks": [
            {
                "key": "validate_payment",
                "name": "Validate Payment",
                "type": "HTTP",
                "dependencies": [],
                "configuration": {
                    "url": "https://jsonplaceholder.typicode.com/users/1",
                    "method": "GET",
                },
            },
            {
                "key": "reserve_inventory",
                "name": "Reserve Inventory",
                "type": "PYTHON_FUNCTION",
                "dependencies": ["validate_payment"],
                "configuration": {
                    "function": "reserve_inventory",
                    "kwargs": {"order_id": "ord-1001", "quantity": 2},
                },
            },
            {
                "key": "notify_warehouse",
                "name": "Notify Warehouse",
                "type": "HTTP",
                "dependencies": ["reserve_inventory"],
                "configuration": {
                    "url": "https://jsonplaceholder.typicode.com/posts",
                    "method": "POST",
                    "json_body": {
                        "order_id": "ord-1001",
                        "message": "Dispatch order ord-1001",
                    },
                },
            },
            {
                "key": "send_confirmation",
                "name": "Send Customer Confirmation",
                "type": "DELAY",
                "dependencies": ["notify_warehouse"],
                "configuration": {"seconds": 5.0},
            },
        ],
    },
}

# Workflow 2: Data Ingestion & Embedding Sync v2
wf2 = {
    "name": "Data Ingestion & Embedding Sync v2",
    "description": (
        "Scrapes regulatory feeds, executes neural embedding transform, and "
        "updates vector store (fixed configurations)."
    ),
    "definition": {
        "name": "Data Ingestion & Embedding Sync v2",
        "description": (
            "Scrapes regulatory feeds, executes neural embedding transform, "
            "and updates vector store (fixed configurations)."
        ),
        "tasks": [
            {
                "key": "fetch_raw_corpus",
                "name": "Fetch Corpus",
                "type": "HTTP",
                "dependencies": [],
                "configuration": {
                    "url": "https://jsonplaceholder.typicode.com/users",
                    "method": "GET",
                },
            },
            {
                "key": "generate_embeddings",
                "name": "Neural Embeddings",
                "type": "PYTHON_FUNCTION",
                "dependencies": ["fetch_raw_corpus"],
                "configuration": {
                    "function": "generate_embeddings",
                    "kwargs": {
                        "corpus": "regulatory feed entries fetched in previous step",
                        "dimensions": 8,
                    },
                },
            },
            {
                "key": "commit_vector_index",
                "name": "Commit Vector Store",
                "type": "PYTHON_FUNCTION",
                "dependencies": ["generate_embeddings"],
                "configuration": {
                    "function": "commit_vector_index",
                    "kwargs": {
                        "vector": [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8],
                        "namespace": "regulatory",
                    },
                },
            },
        ],
    },
}


def main() -> None:
    print(f"Seeding workflows to {API_BASE} ...")
    post_workflow(wf1)
    post_workflow(wf2)


if __name__ == "__main__":
    main()
