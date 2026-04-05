def test_health_endpoint_exposes_stateless_metadata(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    body = response.json()
    assert body["mode"] == "stateless"
    assert "analysis" in body["cache"]


def test_scenario_presets_endpoint_returns_catalog(client):
    response = client.get("/api/v1/scenario-presets")
    assert response.status_code == 200
    body = response.json()
    assert len(body) >= 2
    assert body[0]["scenario"]["input_sizes"]


def test_capabilities_endpoint_returns_features(client):
    response = client.get("/api/v1/capabilities")
    assert response.status_code == 200
    body = response.json()
    assert body["stateless"] is True
    assert "simulate" in body["features"]


def test_analyze_endpoint_returns_insights(client):
    response = client.post(
        "/api/v1/analyze",
        json={
            "language": "python",
            "entrypoint": "solve",
            "code": "def solve(data):\n    return sorted(data)\n",
            "profile_label": "analysis-lab",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "success"
    assert "explanation" in body["insights"]
    assert "recommendations" in body["insights"]
    assert body["report"]["profile_label"] == "analysis-lab"


def test_simulate_endpoint_returns_rich_stateless_result(client, monkeypatch):
    def fake_run(self, payload):  # noqa: ARG001
        return {
            "detected_entrypoint": payload["entrypoint"],
            "exit_code": 0,
            "stdout": "",
            "stderr": "",
            "samples": [
                {
                    "input_size": 10,
                    "iteration_index": 0,
                    "runtime_ms": 1.2,
                    "memory_mb": 5.0,
                    "cpu_percent": 15.0,
                    "exit_code": 0,
                    "timeout_triggered": False,
                },
                {
                    "input_size": 100,
                    "iteration_index": 0,
                    "runtime_ms": 3.4,
                    "memory_mb": 7.0,
                    "cpu_percent": 21.0,
                    "exit_code": 0,
                    "timeout_triggered": False,
                },
            ],
            "runtime_info": {"python_version": "3.12.0", "sandbox_runner": "python"},
        }

    monkeypatch.setattr("app.services.simulation_service.DockerSandboxRunner.run", fake_run)

    response = client.post(
        "/api/v1/simulate",
        json={
            "language": "python",
            "entrypoint": "solve",
            "profile_label": "sum-check",
            "code": "def solve(data):\n    return sum(data)\n",
            "scenario": {
                "input_sizes": [10, 100],
                "iterations": 1,
                "random_seed": 7,
                "timeout_ms": 2000,
                "memory_cap_mb": 128,
                "cpu_cap": 1.0,
                "data_shape": "random",
            },
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "success"
    assert body["summary"]["avg_runtime_ms"] == 2.3
    assert len(body["results"]) == 2
    assert body["execution"]["memory_limit_mb"] == 128
    assert body["report"]["profile_label"] == "sum-check"
    assert "recommendations" in body["insights"]


def test_compare_inline_returns_two_results(client, monkeypatch):
    def fake_run(self, payload):  # noqa: ARG001
        code = payload["code"]
        runtime = 1.0 if "sum" in code else 2.0
        memory = 4.0 if "sum" in code else 6.0
        risk = 10.0 if "sum" in code else 20.0
        return {
            "detected_entrypoint": payload["entrypoint"],
            "exit_code": 0,
            "stdout": "",
            "stderr": "",
            "samples": [
                {
                    "input_size": 100,
                    "iteration_index": 0,
                    "runtime_ms": runtime,
                    "memory_mb": memory,
                    "cpu_percent": risk,
                    "exit_code": 0,
                    "timeout_triggered": False,
                }
            ],
            "runtime_info": {"python_version": "3.12.0", "sandbox_runner": "python"},
        }

    monkeypatch.setattr("app.services.simulation_service.DockerSandboxRunner.run", fake_run)

    response = client.post(
        "/api/v1/compare-inline",
        json={
            "left": {
                "label": "Left",
                "language": "python",
                "entrypoint": "solve",
                "code": "def solve(data):\n    return sum(data)\n",
            },
            "right": {
                "label": "Right",
                "language": "python",
                "entrypoint": "solve",
                "code": "def solve(data):\n    return sorted(data)\n",
            },
            "scenario": {
                "input_sizes": [100],
                "iterations": 1,
                "random_seed": 7,
                "timeout_ms": 2000,
                "memory_cap_mb": 128,
                "cpu_cap": 1.0,
                "data_shape": "random",
            },
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "success"
    assert body["comparison"]["faster_label"] == "Left"
    assert body["comparison"]["lower_memory_label"] == "Left"
