# Chiến Lược Kiểm Thử

## Backend

`pytest` hiện bao phủ các nhánh chính:

- `GET /api/v1/health`
- `GET /api/v1/scenario-presets`
- `GET /api/v1/capabilities`
- `POST /api/v1/analyze`
- `POST /api/v1/simulate`
- `POST /api/v1/compare-inline`
- heuristic analyzer ở mức unit test

Trong test backend, Docker sandbox runner được monkeypatch để tránh phụ thuộc Docker thật.

## Frontend

`vitest` hiện kiểm tra:

- mapping aggregated result sang chart series
- tính delta runtime, memory, CPU, risk
- build chart rows từ compare response

## Các Hạng Mục Nên Bổ Sung Sau

- unit test cho heuristic recommendation
- component test cho Dashboard và Run Detail
- smoke test cho local session history

## Những Gì Chưa Xác Minh Hoàn Toàn Trong Workspace Này

- `pytest` trong môi trường thiếu dependency test
- `vitest` trong môi trường hiện tại nếu chưa cài dependency npm
- Docker Compose boot end-to-end với sandbox thật
