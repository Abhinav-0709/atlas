from typing import Any, Literal
import httpx
from pydantic import BaseModel, ConfigDict, Field, HttpUrl
from atlas.db.models.enums import TaskType
from atlas.exceptions import TaskExecutionError
from atlas.tasks.base import BaseTask, parse_task_config

HTTPMethod = Literal["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]


class HTTPConfig(BaseModel):
    model_config = ConfigDict(extra="forbid")

    url: HttpUrl
    method: HTTPMethod = "GET"
    headers: dict[str, str] = Field(default_factory=dict)
    params: dict[str, str] = Field(default_factory=dict)
    json_body: Any = None
    timeout_seconds: float = Field(default=30.0, gt=0, le=600)
    expected_status_codes: list[int] = Field(default_factory=list)


class HTTPTask(BaseTask):
    task_type = TaskType.HTTP

    def __init__(
        self,
        configuration: dict[str, Any],
        *,
        transport: httpx.AsyncBaseTransport | None = None,
    ) -> None:
        super().__init__(configuration)
        self.config = parse_task_config(HTTPConfig, self.task_type, configuration)
        self._transport = transport

    async def execute(self) -> dict[str, Any]:
        async with httpx.AsyncClient(
            timeout=self.config.timeout_seconds,
            transport=self._transport,
        ) as client:
            response = await client.request(
                self.config.method,
                str(self.config.url),
                headers=self.config.headers or None,
                params=self.config.params or None,
                json=self.config.json_body,
            )

        self._assert_acceptable(response)
        return {
            "status_code": response.status_code,
            "headers": dict(response.headers),
            "body": self._decode_body(response),
        }

    def _assert_acceptable(self, response: httpx.Response) -> None:
        expected = self.config.expected_status_codes
        if expected:
            if response.status_code not in expected:
                raise TaskExecutionError(
                    f"HTTP {response.status_code} from {response.request.url}, "
                    f"expected one of {expected}"
                )
        elif not response.is_success:
            raise TaskExecutionError(
                f"HTTP {response.status_code} from {response.request.url}"
            )

    @staticmethod
    def _decode_body(response: httpx.Response) -> Any:
        if "json" in response.headers.get("content-type", ""):
            try:
                return response.json()
            except ValueError:
                pass
        return response.text
