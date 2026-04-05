import json
import subprocess

from app.config.settings import get_settings
from app.security.sandbox_policy import build_sandbox_policy


class SandboxExecutionError(RuntimeError):
    pass


class DockerSandboxRunner:
    def __init__(self) -> None:
        self.settings = get_settings()

    def run(self, payload: dict) -> dict:
        policy = build_sandbox_policy(
            memory_cap_mb=payload.get("memory_cap_mb"),
            cpu_cap=payload.get("cpu_cap"),
            timeout_ms=payload.get("timeout_ms"),
        )

        command = [
            "docker",
            "run",
            "--rm",
            "--memory",
            f"{policy['memory_cap_mb']}m",
            "--cpus",
            str(policy["cpu_cap"]),
        ]

        if policy["network_disabled"]:
            command.extend(["--network", "none"])

        command.extend([self.settings.sandbox_image, "python", "/app/runner.py"])

        try:
            completed = subprocess.run(
                command,
                input=json.dumps(payload),
                text=True,
                capture_output=True,
                timeout=max(10, int(policy["timeout_ms"] / 1000) + 10),
                check=False,
            )
        except FileNotFoundError as exc:
            raise SandboxExecutionError("Docker CLI không khả dụng trong môi trường hiện tại.") from exc
        except subprocess.TimeoutExpired as exc:
            raise SandboxExecutionError("Sandbox container vượt quá thời gian chờ ở tầng hạ tầng.") from exc

        if completed.returncode != 0:
            raise SandboxExecutionError(completed.stderr.strip() or "Sandbox execution failed.")

        try:
            return json.loads(completed.stdout)
        except json.JSONDecodeError as exc:
            raise SandboxExecutionError("Sandbox trả về output không hợp lệ.") from exc

