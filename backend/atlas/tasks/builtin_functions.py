from typing import Any
from atlas.tasks.registry import register_function


@register_function("reserve_inventory")
def reserve_inventory(order_id: str = "ord-1001", quantity: int = 1) -> dict:
    """Simulates placing an inventory hold for an order."""
    if quantity <= 0:
        quantity = 1
    return {
        "order_id": order_id,
        "quantity_reserved": quantity,
        "hold_id": f"hold-{order_id}",
        "expires_in_seconds": 900,
        "status": "RESERVED",
    }


@register_function("generate_embeddings")
def generate_embeddings(corpus: str = "regulatory compliance documentation feed", dimensions: int = 8) -> dict:
    """Simulates a neural embedding transform over a text corpus."""
    if not corpus:
        corpus = "default sample document corpus"
    tokens = corpus.split()
    vector = [round((len(tokens) * (i + 1)) % 97 / 97, 4) for i in range(dimensions)]
    return {"token_count": len(tokens), "dimensions": dimensions, "vector": vector}


@register_function("commit_vector_index")
def commit_vector_index(vector: list[float] | None = None, namespace: str = "regulatory") -> dict:
    """Simulates committing an embedding vector to the vector store."""
    if not vector:
        vector = [0.8722, 0.1443, 0.2165, 0.2887, 0.3608, 0.433, 0.5052, 0.5774]
    return {"namespace": namespace, "committed": True, "vector_size": len(vector)}
