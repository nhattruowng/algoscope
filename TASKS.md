# Danh Sách Công Việc Mở Rộng AlgoScope

## Backend Stateless

- [x] Mở rộng shared schema với `report`, `recommendations`, `risk_score`
- [x] Thêm catalog preset scenario
- [x] Thêm endpoint `GET /api/v1/scenario-presets`
- [x] Thêm endpoint `GET /api/v1/capabilities`
- [x] Nâng `GET /api/v1/health` với metadata cache và sandbox
- [x] Thêm in-memory cache TTL cho insight và catalog
- [x] Nâng service simulate/analyze/compare để trả metadata giàu hơn
- [x] Bổ sung thêm backend unit test cho analyzer/recommendation heuristics

## Frontend

- [x] Cập nhật shared types theo contract mới
- [x] Nâng API client cho preset, capabilities và health
- [x] Tạo local session history cho simulation result
- [x] Lưu latest analyze result trong session
- [x] Lưu latest compare result trong session
- [x] Nâng `Dashboard` thành control plane cho session hiện tại
- [x] Nâng `New Simulation` với preset, profile label và capability hint
- [x] Tạo trang `Analyze Code`
- [x] Nâng `Run Detail` với export JSON, metadata và route theo session
- [x] Nâng `Compare Inline` với preset scenario và risk delta
- [x] Cập nhật test helper frontend cho contract mới

## Hạ Tầng

- [x] Giữ Docker Compose tối giản theo kiến trúc stateless
- [x] Giữ sandbox runner tách image riêng
- [x] Duy trì Makefile và env theo flow mới
- [ ] Xác minh build frontend trong môi trường có đầy đủ dependency

## Tài Liệu

- [x] Cập nhật `README.md`
- [x] Cập nhật `PLANS.md`
- [x] Cập nhật `TASKS.md`
- [x] Cập nhật `docs/architecture.md`
- [x] Cập nhật `docs/backend.md`
- [x] Cập nhật `docs/frontend.md`
- [x] Cập nhật `docs/docker.md`
- [x] Cập nhật `docs/testing.md`
- [x] Cập nhật `docs/api-examples.md`

## Xác Thực Cuối

- [ ] Chạy build frontend
- [ ] Chạy `pytest`
- [x] Chạy kiểm tra cú pháp Python
- [ ] Chạy `vitest`
- [x] Rà soát tree cuối cùng sau khi hoàn tất
