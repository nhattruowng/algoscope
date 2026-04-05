from statistics import mean


def percentile(values: list[float], q: float) -> float | None:
    if not values:
        return None
    ordered = sorted(values)
    index = int(round((len(ordered) - 1) * q))
    return ordered[index]


def summarize_samples(samples: list[dict]) -> dict:
    runtimes = [sample["runtime_ms"] for sample in samples]
    memories = [sample["memory_mb"] for sample in samples]
    cpus = [sample["cpu_percent"] for sample in samples]

    return {
        "avg_runtime_ms": round(mean(runtimes), 3) if runtimes else None,
        "peak_memory_mb": round(max(memories), 3) if memories else None,
        "cpu_avg_percent": round(mean(cpus), 3) if cpus else None,
        "total_runtime_ms": round(sum(runtimes), 3) if runtimes else None,
        "p95_runtime_ms": round(percentile(runtimes, 0.95), 3) if runtimes else None,
    }


def summarize_results_by_input_size(samples: list[dict]) -> list[dict]:
    grouped: dict[int, list[dict]] = {}
    for sample in samples:
        grouped.setdefault(sample["input_size"], []).append(sample)

    results: list[dict] = []
    for input_size in sorted(grouped):
        items = grouped[input_size]
        runtimes = [item["runtime_ms"] for item in items]
        memories = [item["memory_mb"] for item in items]
        cpus = [item["cpu_percent"] for item in items]
        results.append(
            {
                "input_size": input_size,
                "avg_runtime_ms": round(mean(runtimes), 3),
                "peak_memory_mb": round(max(memories), 3),
                "cpu_avg_percent": round(mean(cpus), 3),
                "samples": items,
            }
        )
    return results

