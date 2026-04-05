from app.cache.memory_cache import TTLMemoryCache
from app.catalog.scenario_presets import SCENARIO_PRESETS
from app.config.settings import get_settings


catalog_cache = TTLMemoryCache(ttl_seconds=300, max_entries=16)


class CatalogService:
    def list_scenario_presets(self) -> list[dict]:
        cache_key = catalog_cache.make_key("scenario-presets")
        cached = catalog_cache.get(cache_key)
        if cached is not None:
            return cached
        catalog_cache.set(cache_key, SCENARIO_PRESETS)
        return SCENARIO_PRESETS

    def get_capabilities(self) -> dict:
        settings = get_settings()
        cache_key = catalog_cache.make_key("capabilities", settings.sandbox_image)
        cached = catalog_cache.get(cache_key)
        if cached is not None:
            return cached

        payload = {
            "stateless": True,
            "supported_languages": ["python"],
            "features": [
                "simulate",
                "analyze",
                "compare-inline",
                "scenario-presets",
                "local-export-json",
                "local-session-history",
            ],
            "resource_limits": {
                "default_timeout_ms": settings.sandbox_default_timeout_ms,
                "default_memory_mb": settings.sandbox_default_memory_mb,
                "default_cpu_cap": settings.sandbox_default_cpu_cap,
                "network_disabled_by_default": settings.sandbox_disable_network,
            },
        }
        catalog_cache.set(cache_key, payload)
        return payload
