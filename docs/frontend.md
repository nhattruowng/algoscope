# Frontend Stateless

## Mục Tiêu

Frontend được mở rộng để giống một công cụ kỹ thuật hoàn chỉnh hơn nhưng vẫn trung thực với kiến trúc stateless. Toàn bộ biểu đồ, logs, heatmap và metadata đều xuất phát từ response tức thời của backend hoặc từ `sessionStorage` trong cùng phiên làm việc.

## Các Trang Chính

- `Dashboard`
- `New Simulation`
- `Analyze Code`
- `Run Detail`
- `Compare Inline`

## Dashboard

`Dashboard` giờ đóng vai trò control plane của phiên hiện tại:

- hiển thị health, capability và cache snapshot từ API
- hiển thị recent runs từ `sessionStorage`
- hiển thị latest analyze snapshot
- hiển thị latest compare snapshot

## New Simulation

- Monaco editor cho code Python
- Preset selector và preset quick actions
- Form scenario đầy đủ
- `profile_label` để gắn tên logic cho report
- Capability hint để biết giới hạn runtime hiện tại

Khi chạy xong:

- lưu `SimulationResponse` vào local session history
- điều hướng sang route chi tiết của session run

## Analyze Code

Trang này tách riêng flow phân tích:

- không gọi sandbox
- chỉ gửi `/analyze`
- render explanation, warning, recommendation và heatmap annotation

## Run Detail

`Run Detail` không fetch dữ liệu theo `run_id` từ backend. Thay vào đó:

- đọc record từ local session history
- render charts, logs, metrics table, raw sample table
- render execution metadata
- cho phép export toàn bộ response JSON

## Compare Inline

- hai Monaco editor
- một shared scenario
- preset benchmark chung
- biểu đồ runtime, memory, risk
- delta runtime, memory, CPU và risk

## Session Layer

`apps/web/src/lib/session-result.ts` quản lý:

- recent simulation sessions
- latest analyze result
- latest compare result

Mục tiêu là nâng trải nghiệm người dùng trong cùng session mà không biến frontend thành một persistence layer phức tạp.
