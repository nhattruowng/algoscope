import ast
import contextlib
import importlib.util
import io
import json
import random
import signal
import sys
import tempfile
import time
import tracemalloc
from pathlib import Path


class TimeoutExceededError(Exception):
    pass


def _timeout_handler(_signum, _frame):
    raise TimeoutExceededError("Function execution timed out.")


def detect_entrypoint(code: str, requested: str | None) -> str | None:
    if requested:
        return requested
    tree = ast.parse(code)
    for node in tree.body:
        if isinstance(node, ast.FunctionDef):
            return node.name
    return None


def generate_input(size: int, shape: str, seed: int, custom_data: dict | None):
    rng = random.Random(seed + size)
    if shape == "sorted":
        return list(range(size))
    if shape == "reverse":
        return list(range(size, 0, -1))
    if shape == "duplicate-heavy":
        return [rng.randint(0, max(1, size // 10)) for _ in range(size)]
    if shape == "custom" and custom_data:
        values = custom_data.get(str(size)) or custom_data.get("values")
        if values is not None:
            return values
    return [rng.randint(0, size * 10 + 1) for _ in range(size)]


def load_callable(module_path: Path, entrypoint: str):
    spec = importlib.util.spec_from_file_location("submitted_code", module_path)
    module = importlib.util.module_from_spec(spec)
    assert spec and spec.loader
    spec.loader.exec_module(module)
    fn = getattr(module, entrypoint, None)
    if not callable(fn):
        raise ValueError(f"Entrypoint `{entrypoint}` was not found or is not callable.")
    return fn


def main() -> int:
    payload = json.loads(sys.stdin.read())
    code = payload["code"]
    entrypoint = detect_entrypoint(code, payload.get("entrypoint"))
    if not entrypoint:
        raise ValueError("No callable entrypoint could be detected.")

    stdout_chunks: list[str] = []
    stderr_chunks: list[str] = []
    samples: list[dict] = []

    with tempfile.TemporaryDirectory() as tmp_dir:
        module_path = Path(tmp_dir) / "submitted_code.py"
        module_path.write_text(code, encoding="utf-8")
        target = load_callable(module_path, entrypoint)

        timeout_seconds = max(payload.get("timeout_ms", 3000) / 1000.0, 0.1)
        signal.signal(signal.SIGALRM, _timeout_handler)

        for input_size in payload["input_sizes"]:
            dataset = generate_input(
                size=input_size,
                shape=payload.get("data_shape", "random"),
                seed=payload.get("random_seed", 42),
                custom_data=payload.get("custom_data"),
            )
            for iteration_index in range(payload.get("iterations", 1)):
                stream_out = io.StringIO()
                stream_err = io.StringIO()
                tracemalloc.start()
                start_wall = time.perf_counter()
                start_cpu = time.process_time()
                exit_code = 0
                timeout_triggered = False

                try:
                    signal.setitimer(signal.ITIMER_REAL, timeout_seconds)
                    with contextlib.redirect_stdout(stream_out), contextlib.redirect_stderr(stream_err):
                        target(dataset)
                except TimeoutExceededError as exc:
                    exit_code = 124
                    timeout_triggered = True
                    stream_err.write(str(exc))
                except Exception as exc:
                    exit_code = 1
                    stream_err.write(str(exc))
                finally:
                    signal.setitimer(signal.ITIMER_REAL, 0)

                current, peak = tracemalloc.get_traced_memory()
                tracemalloc.stop()
                end_wall = time.perf_counter()
                end_cpu = time.process_time()
                wall_seconds = max(end_wall - start_wall, 1e-6)
                cpu_percent = min((end_cpu - start_cpu) / wall_seconds * 100.0, 100.0)

                stdout_value = stream_out.getvalue()
                stderr_value = stream_err.getvalue()
                stdout_chunks.append(stdout_value)
                stderr_chunks.append(stderr_value)
                samples.append(
                    {
                        "input_size": input_size,
                        "iteration_index": iteration_index,
                        "runtime_ms": round(wall_seconds * 1000, 3),
                        "memory_mb": round(peak / (1024 * 1024), 3),
                        "cpu_percent": round(cpu_percent, 3),
                        "exit_code": exit_code,
                        "timeout_triggered": timeout_triggered,
                    }
                )

                if exit_code != 0:
                    result = {
                        "detected_entrypoint": entrypoint,
                        "exit_code": exit_code,
                        "stdout": "".join(stdout_chunks).strip(),
                        "stderr": "".join(stderr_chunks).strip(),
                        "samples": samples,
                        "runtime_info": {
                            "python_version": sys.version.split()[0],
                            "sandbox_runner": "python",
                        },
                    }
                    sys.stdout.write(json.dumps(result))
                    return 0

    result = {
        "detected_entrypoint": entrypoint,
        "exit_code": 0,
        "stdout": "".join(stdout_chunks).strip(),
        "stderr": "".join(stderr_chunks).strip(),
        "samples": samples,
        "runtime_info": {
            "python_version": sys.version.split()[0],
            "sandbox_runner": "python",
        },
    }
    sys.stdout.write(json.dumps(result))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
