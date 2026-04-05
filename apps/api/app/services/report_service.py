from __future__ import annotations

from hashlib import sha1

from app.schemas.simulation import ReportResponse


class ReportService:
    def build_report_metadata(
        self,
        *,
        code: str,
        entrypoint: str | None,
        profile_label: str | None,
        cache_hit: bool = False,
        kind: str = "simulation",
    ) -> ReportResponse:
        digest = sha1(f"{entrypoint or 'auto'}::{code}".encode("utf-8")).hexdigest()[:8]
        base_label = profile_label or entrypoint or "python-snippet"
        safe_label = "".join(char if char.isalnum() or char in {"-", "_"} else "-" for char in base_label.lower()).strip("-")
        safe_label = safe_label or "python-snippet"
        return ReportResponse(
            export_filename=f"{kind}-{safe_label}-{digest}.json",
            profile_label=base_label,
            cache_hit=cache_hit,
        )
