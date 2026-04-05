# Kiến Trúc Stateless Mở Rộng

## Tổng Quan

AlgoScope hiện là một hệ thống stateless nhưng đã được mở rộng thành một lab benchmark thực dụng hơn. Backend không dùng database và không có queue nền. Mỗi request được xử lý trọn vẹn trong một vòng đời request-response, còn frontend giữ một lớp session cục bộ để cải thiện trải nghiệm sử dụng.

## Sơ Đồ Luồng

1. Frontend gửi request tới API.
2. API validate payload bằng Pydantic.
3. API lấy preset hoặc capability metadata nếu cần.
4. API chạy heuristic analyzer.
5. API gọi Docker sandbox runner trực tiếp cho flow simulate.
6. API tổng hợp sample metric trong bộ nhớ.
7. API build report metadata và trả response.
8. Frontend render chart, logs, annotations, recommendations và lưu local session history nếu phù hợp.

## Thành Phần Hệ Thống

### Web

- Gửi `/simulate`, `/analyze`, `/compare-inline`
- Lấy `scenario-presets`, `capabilities`, `health`
- Lưu recent runs trong `sessionStorage`
- Render Monaco heatmap và các chart trực tiếp từ response

### API

- Validate request
- Orchestrate benchmark và analysis
- Gọi sandbox runner trực tiếp
- Cache catalog và analysis ngắn hạn trong bộ nhớ
- Trả response hoàn chỉnh với report metadata

### Sandbox Runner

- Chạy snippet Python trong container cô lập
- Áp dụng timeout, memory limit và CPU limit
- Tắt mạng theo mặc định
- Trả JSON chứa sample metric, stdout, stderr và exit code

## Các Lớp Logic Chính

- `app/services/simulation_service.py`: orchestration chính
- `app/services/catalog_service.py`: catalog preset và capability metadata
- `app/services/report_service.py`: sinh metadata cho export/report
- `app/cache/memory_cache.py`: TTL cache nhẹ trong bộ nhớ
- `app/analyzers/python_heuristics.py`: heuristic explanation, warning, hotspot và recommendation
- `app/runners/docker_runner.py`: wrapper gọi sandbox runner
- `app/profiling/aggregator.py`: tổng hợp sample thành summary

## Session Layer Ở Frontend

Frontend có session layer cục bộ để nâng UX nhưng không phá vỡ tính stateless:

- lưu latest simulation
- lưu recent simulation sessions
- lưu latest analyze result
- lưu latest compare result

Tất cả dữ liệu này chỉ tồn tại ở `sessionStorage` trong trình duyệt.

## In-Memory Cache Ở API

API có cache TTL ngắn hạn cho hai mục tiêu:

- giảm chi phí phân tích lặp lại cùng một snippet
- trả catalog preset/capabilities nhanh hơn

Cache này không phải persistence. Khi restart service, dữ liệu cache mất hoàn toàn.

## Giới Hạn Kiến Trúc

- Không có run history phía backend
- Không có saved comparison
- Không có artifact storage bền vững
- Không có analytics tích lũy qua thời gian
- Không có queue cho tác vụ dài
