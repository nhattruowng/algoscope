from app.config.settings import get_settings


def build_sandbox_policy(memory_cap_mb: int | None = None, cpu_cap: float | None = None, timeout_ms: int | None = None) -> dict:
    settings = get_settings()
    return {
        "memory_cap_mb": memory_cap_mb or settings.sandbox_default_memory_mb,
        "cpu_cap": cpu_cap or settings.sandbox_default_cpu_cap,
        "timeout_ms": timeout_ms or settings.sandbox_default_timeout_ms,
        "network_disabled": settings.sandbox_disable_network,
    }

