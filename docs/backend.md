# Backend Stateless

## Endpoint

- `POST /api/v1/simulate`
- `POST /api/v1/analyze`
- `POST /api/v1/compare-inline`
- `GET /api/v1/scenario-presets`
- `GET /api/v1/capabilities`
- `GET /api/v1/health`

## Luồng `/simulate`

1. Nhận `language`, `code`, `entrypoint`, `profile_label` và `scenario`
2. Chạy heuristic analysis hoặc đọc từ cache TTL
3. Validate ngôn ngữ và entrypoint
4. Gọi Docker sandbox runner trực tiếp
5. Thu sample runtime, memory, CPU, stdout, stderr, exit code
6. Tổng hợp metric theo input size và toàn cục
7. Build report metadata
8. Trả `SimulationResponse`

## Luồng `/analyze`

- Không gọi sandbox
- Chỉ chạy heuristic analyzer
- Trả `InsightsResponse` cùng `report`
- Phù hợp cho bước rà nhanh code trước khi simulate

## Luồng `/compare-inline`

- Nhận hai snippet và một scenario dùng chung
- Gọi simulate logic cho `left` và `right`
- Trả hai response đầy đủ cộng thêm `comparison`
- Có thêm `risk_score_delta`

## Catalog Và Capability

`GET /api/v1/scenario-presets` trả preset benchmark có cấu trúc rõ ràng:

- `fast-sanity`
- `scaling-sweep`
- `memory-pressure`

`GET /api/v1/capabilities` giúp frontend biết:

- mode hiện tại là `stateless`
- language hỗ trợ
- feature bật trong phiên bản hiện tại
- giới hạn timeout, memory, CPU

## Health Metadata

`GET /api/v1/health` ngoài trạng thái `ok` còn trả:

- sandbox image hiện tại
- language hỗ trợ
- thống kê hit/miss của cache analysis
- thống kê hit/miss của cache catalog

## Tổ Chức Mã

- `app/api/routes/stateless.py`: endpoint stateless và catalog
- `app/api/routes/health.py`: health metadata
- `app/services/simulation_service.py`: orchestration chính
- `app/services/catalog_service.py`: preset/capability layer
- `app/services/report_service.py`: report metadata
- `app/cache/memory_cache.py`: cache TTL trong bộ nhớ
- `app/analyzers/python_heuristics.py`: heuristic analyzer
- `app/runners/docker_runner.py`: wrapper cho Docker sandbox
- `app/profiling/aggregator.py`: tổng hợp metric

## Dữ Liệu Tạm

- Payload và response được xử lý trong bộ nhớ request
- Sandbox dùng file tạm nội bộ trong container
- Artifact tạm biến mất khi container kết thúc
- Backend không ghi bất kỳ run nào xuống storage bền vững
