# Ví Dụ API Stateless

## Gọi `/simulate`

```bash
curl -X POST http://localhost:8000/api/v1/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "language": "python",
    "entrypoint": "solve",
    "profile_label": "sorted-baseline",
    "code": "def solve(data):\n    return sorted(data)",
    "scenario": {
      "input_sizes": [100, 1000, 5000],
      "iterations": 3,
      "random_seed": 42,
      "timeout_ms": 3000,
      "memory_cap_mb": 256,
      "cpu_cap": 1.0,
      "data_shape": "reverse"
    }
  }'
```

## Gọi `/analyze`

```bash
curl -X POST http://localhost:8000/api/v1/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "language": "python",
    "entrypoint": "solve",
    "profile_label": "analysis-pass",
    "code": "def solve(data):\n    for x in data:\n        for y in data:\n            print(x + y)"
  }'
```

## Gọi `/compare-inline`

```bash
curl -X POST http://localhost:8000/api/v1/compare-inline \
  -H "Content-Type: application/json" \
  -d '{
    "left": {
      "label": "A",
      "language": "python",
      "entrypoint": "solve",
      "code": "def solve(data):\n    return sum(data)"
    },
    "right": {
      "label": "B",
      "language": "python",
      "entrypoint": "solve",
      "code": "def solve(data):\n    return sorted(data)"
    },
    "scenario": {
      "input_sizes": [100, 1000],
      "iterations": 3,
      "random_seed": 42,
      "timeout_ms": 3000,
      "memory_cap_mb": 256,
      "cpu_cap": 1.0,
      "data_shape": "random"
    }
  }'
```

## Gọi `/scenario-presets`

```bash
curl http://localhost:8000/api/v1/scenario-presets
```

## Gọi `/capabilities`

```bash
curl http://localhost:8000/api/v1/capabilities
```

## Ví Dụ Response `/simulate`

```json
{
  "status": "success",
  "summary": {
    "avg_runtime_ms": 31.4,
    "peak_memory_mb": 58.2,
    "cpu_avg_percent": 44.8,
    "total_runtime_ms": 94.2,
    "p95_runtime_ms": 35.6
  },
  "results": [
    {
      "input_size": 100,
      "avg_runtime_ms": 0.8,
      "peak_memory_mb": 12.1,
      "cpu_avg_percent": 10.3,
      "samples": []
    }
  ],
  "stdout": "",
  "stderr": "",
  "exit_code": 0,
  "insights": {
    "explanation": "Giải thích heuristic cho đoạn mã.",
    "detected_entrypoint": "solve",
    "warnings": ["Phát hiện vòng lặp lồng nhau"],
    "hotspots": [
      {
        "line_start": 3,
        "line_end": 5,
        "severity": "high",
        "type": "time",
        "label": "Nested loop hotspot"
      }
    ],
    "complexity_hints": ["Có dấu hiệu hành vi O(n^2)"],
    "annotations": [],
    "recommendations": [
      {
        "title": "Giảm vòng lặp lồng nhau",
        "detail": "Cân nhắc thay bằng cấu trúc dữ liệu tra cứu nhanh hơn.",
        "category": "time",
        "priority": "high"
      }
    ],
    "risk_score": 72
  },
  "execution": {
    "timeout_triggered": false,
    "memory_limit_mb": 256,
    "cpu_limit": 1,
    "network_disabled": true,
    "runtime_info": {
      "language": "python"
    }
  },
  "report": {
    "generated_at": "2026-04-05T10:15:00Z",
    "export_filename": "algoscope-sorted-baseline-a1b2c3d4.json",
    "profile_label": "sorted-baseline",
    "cache_hit": false
  }
}
