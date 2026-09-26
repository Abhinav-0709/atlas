import asyncio
import json
import logging
import os
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

logger = logging.getLogger("atlas.ml.telemetry")

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "ml"
TELEMETRY_FILE = DATA_DIR / "execution_telemetry.jsonl"


@dataclass
class ExecutionRecord:
    job_id: str
    task_key: str
    job_type: str
    input_size_bytes: int
    worker_id: str
    worker_cpu_pct: float
    worker_mem_pct: float
    queue_depth: int
    retry_count: int
    execution_time_seconds: float
    is_success: bool
    error_message: str | None = None
    timestamp: str = ""

    def __post_init__(self):
        if not self.timestamp:
            self.timestamp = datetime.now(timezone.utc).isoformat()


class TelemetryCollector:
    """Non-blocking telemetry collector for ML dataset generation."""

    def __init__(self, target_file: Path = TELEMETRY_FILE):
        self.target_file = target_file
        self._ensure_dir()
        self._queue: asyncio.Queue[ExecutionRecord] = asyncio.Queue()
        self._worker_task: asyncio.Task | None = None

    def _ensure_dir(self):
        self.target_file.parent.mkdir(parents=True, exist_ok=True)

    def record(self, record: ExecutionRecord):
        """Asynchronously appends a record without blocking the caller."""
        try:
            with open(self.target_file, "a", encoding="utf-8") as f:
                f.write(json.dumps(asdict(record)) + "\n")
        except Exception as e:
            logger.warning(f"Failed to persist execution telemetry: {e}")

    def load_records(self, limit: int = 10000) -> list[dict[str, Any]]:
        """Loads historical execution records for model training."""
        if not self.target_file.exists():
            return []
        records = []
        try:
            with open(self.target_file, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line:
                        records.append(json.loads(line))
                        if len(records) >= limit:
                            break
        except Exception as e:
            logger.error(f"Error reading telemetry records: {e}")
        return records


telemetry_collector = TelemetryCollector()
