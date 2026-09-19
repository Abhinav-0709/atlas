# How to Use Atlas Workflows

The reason your workflow runs are instantly failing (showing up as failed or dead-lettered) is because the "demo workflows" we seeded into the database don't have actual execution instructions for their tasks. 

Atlas is a strict task execution engine. When the Worker picks up an `HTTP` task, it strictly requires a URL. When it picks up a `DELAY` task, it strictly requires a duration. Because we left the `configuration` payload completely empty for the demo tasks, the Worker's strict validation (using Pydantic) threw an error and failed the tasks!

Here is how you actually use Atlas and define valid workflows:

## 1. Defining HTTP Tasks

To make an HTTP request, the task `type` must be `"HTTP"`, and you **must** provide a `url` in the `configuration`. You can optionally provide `method`, `headers`, and `json_body`.

```json
{
  "key": "fetch_user_data",
  "name": "Fetch User from API",
  "type": "HTTP",
  "dependencies": [],
  "configuration": {
    "url": "https://jsonplaceholder.typicode.com/users/1",
    "method": "GET"
  }
}
```

## 2. Defining DELAY Tasks

To make the workflow pause, use the `"DELAY"` type. You **must** provide `seconds` in the `configuration`.

```json
{
  "key": "wait_5_seconds",
  "name": "Pause before retrying",
  "type": "DELAY",
  "dependencies": ["fetch_user_data"],
  "configuration": {
    "seconds": 5.0
  }
}
```

## 3. Defining Python Function Tasks

If you want Atlas to execute raw Python code, use `"PYTHON_FUNCTION"`. However, you cannot just send raw Python code from the frontend for security reasons.

Instead, you must write the Python function in your backend code and **register** it using the `@register_function` decorator.

**Backend Python Code:**
```python
from atlas.tasks.registry import register_function

@register_function("calculate_tax")
def calculate_tax(amount: float, rate: float = 0.2) -> dict:
    return {"total_tax": amount * rate}
```

**Frontend Workflow JSON:**
```json
{
  "key": "tax_step",
  "name": "Calculate Taxes",
  "type": "PYTHON_FUNCTION",
  "dependencies": [],
  "configuration": {
    "function": "calculate_tax",
    "kwargs": {
      "amount": 100.0,
      "rate": 0.05
    }
  }
}
```

## How to Test This

If you want to see a workflow actually turn green, you can hit your API to create a simple, valid workflow using Postman or cURL:

```bash
curl -X POST https://atlas-api.abhinav.sbs/workflows \
-H "Content-Type: application/json" \
-d '{
  "name": "Valid Test Workflow",
  "description": "This one will succeed!",
  "definition": {
    "name": "Valid Test Workflow",
    "description": "This one will succeed!",
    "tasks": [
      {
        "key": "step_1",
        "name": "Wait 3 Seconds",
        "type": "DELAY",
        "dependencies": [],
        "configuration": {
          "seconds": 3.0
        }
      },
      {
        "key": "step_2",
        "name": "Ping Google",
        "type": "HTTP",
        "dependencies": ["step_1"],
        "configuration": {
          "url": "https://www.google.com",
          "method": "GET"
        }
      }
    ]
  }
}'
```

If you register the workflow above, it will show up on your dashboard. When you click **Trigger Run**, the worker will pick it up, pause for 3 seconds, ping Google, and mark the run as **Completed (Green)**!
