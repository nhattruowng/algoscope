import json
import socket

import docker
from docker.errors import DockerException

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

        try:
            client = docker.from_env()
            client.ping()
        except DockerException as exc:
            raise SandboxExecutionError(
                "Docker daemon không khả dụng từ API container. Hãy kiểm tra Docker Desktop và mount /var/run/docker.sock."
            ) from exc

        container = None
        try:
            container = client.containers.create(
                image=self.settings.sandbox_image,
                command=["python", "/app/runner.py"],
                detach=True,
                stdin_open=True,
                mem_limit=f"{policy['memory_cap_mb']}m",
                nano_cpus=int(float(policy["cpu_cap"]) * 1_000_000_000),
                network_disabled=policy["network_disabled"],
            )
            container.start()

            sock = container.attach_socket(params={"stdin": 1, "stream": 1, "stdout": 1, "stderr": 1})
            try:
                raw_socket = sock._sock
                raw_socket.sendall(json.dumps(payload).encode("utf-8"))
                raw_socket.shutdown(socket.SHUT_WR)
            finally:
                sock.close()

            wait_result = container.wait(timeout=max(10, int(policy["timeout_ms"] / 1000) + 10))
            exit_code = int(wait_result.get("StatusCode", 1))
            stdout = container.logs(stdout=True, stderr=False).decode("utf-8", errors="replace")
            stderr = container.logs(stdout=False, stderr=True).decode("utf-8", errors="replace")
        except DockerException as exc:
            raise SandboxExecutionError(f"Không thể chạy sandbox container: {exc}") from exc
        finally:
            if container is not None:
                try:
                    container.remove(force=True)
                except DockerException:
                    pass

        if exit_code != 0:
            raise SandboxExecutionError(stderr.strip() or "Sandbox execution failed.")

        try:
            return json.loads(stdout)
        except json.JSONDecodeError as exc:
            raise SandboxExecutionError("Sandbox trả về output không hợp lệ.") from exc
