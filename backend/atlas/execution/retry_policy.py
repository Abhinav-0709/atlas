import random
from dataclasses import dataclass
from typing import Any, Callable
from atlas.db.models.enums import BackoffStrategy


@dataclass
class RetryPolicyConfig:
    max_attempts: int = 3
    backoff_strategy: str = BackoffStrategy.EXPONENTIAL.value
    initial_delay: float = 2.0
    max_delay: float = 60.0
    jitter: bool = True
    jitter_factor: float = 0.2

    @classmethod
    def from_dict(cls, data: dict[str, Any] | None) -> "RetryPolicyConfig":
        if not data:
            return cls()
        return cls(
            max_attempts=int(data.get("max_attempts", 3)),
            backoff_strategy=str(data.get("backoff_strategy", BackoffStrategy.EXPONENTIAL.value)).lower(),
            initial_delay=float(data.get("initial_delay", 2.0)),
            max_delay=float(data.get("max_delay", 60.0)),
            jitter=bool(data.get("jitter", True)),
            jitter_factor=float(data.get("jitter_factor", 0.2)),
        )


def should_retry(current_attempt: int, max_attempts: int) -> bool:
    """Returns True if the task has remaining retry attempts."""
    return current_attempt < max_attempts


def compute_backoff_delay(
    policy: dict[str, Any] | RetryPolicyConfig | None,
    attempt: int,
    jitter_fn: Callable[[float, float], float] | None = None,
) -> float:
    """Computes the backoff delay in seconds for a retry attempt.

    Formula:
      - FIXED: delay = initial_delay
      - LINEAR: delay = min(initial_delay * attempt, max_delay)
      - EXPONENTIAL: delay = min(initial_delay * (2 ** max(0, attempt - 1)), max_delay)
      - Jitter: delay = delay + random.uniform(0, delay * jitter_factor)

    Args:
        policy: Retry policy configuration dict or dataclass instance.
        attempt: The 1-based attempt number that just completed/failed.
        jitter_fn: Optional custom jitter generator (val_min, val_max) -> float for deterministic testing.
    """
    config = policy if isinstance(policy, RetryPolicyConfig) else RetryPolicyConfig.from_dict(policy)
    attempt_idx = max(1, attempt)

    strategy = config.backoff_strategy.lower()
    if strategy == BackoffStrategy.FIXED.value or strategy == "fixed":
        base_delay = config.initial_delay
    elif strategy == BackoffStrategy.LINEAR.value or strategy == "linear":
        base_delay = config.initial_delay * attempt_idx
    else:  # default to exponential
        base_delay = config.initial_delay * (2 ** (attempt_idx - 1))

    delay = min(base_delay, config.max_delay)

    if config.jitter and config.jitter_factor > 0:
        max_jitter = delay * config.jitter_factor
        rng = jitter_fn or random.uniform
        added_jitter = rng(0.0, max_jitter)
        delay = min(delay + added_jitter, config.max_delay)

    return round(max(0.0, delay), 3)
