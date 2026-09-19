

from atlas.tasks.registry import register_function


@register_function("reserve_inventory")
def reserve_inventory(order_id: str, quantity: int = 1) -> dict:
    """Simulates placing an inventory hold for an order."""
    if quantity <= 0:
        raise ValueError("quantity must be positive")
    return {
        "order_id": order_id,
        "quantity_reserved": quantity,
        "hold_id": f"hold-{order_id}",
        "expires_in_seconds": 900,
    }


@register_function("generate_embeddings")
def generate_embeddings(corpus: str, dimensions: int = 8) -> dict:
    """Simulates a neural embedding transform over a text corpus."""
    if not corpus:
        raise ValueError("corpus must not be empty")
    tokens = corpus.split()
    vector = [round((len(tokens) * (i + 1)) % 97 / 97, 4) for i in range(dimensions)]
    return {"token_count": len(tokens), "dimensions": dimensions, "vector": vector}


@register_function("commit_vector_index")
def commit_vector_index(vector: list[float], namespace: str = "default") -> dict:
    """Simulates committing an embedding vector to the vector store."""
    if not vector:
        raise ValueError("vector must not be empty")
    return {"namespace": namespace, "committed": True, "vector_size": len(vector)}
