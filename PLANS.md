# Kế Hoạch Mở Rộng AlgoScope Stateless

## Mục Tiêu

Mở rộng AlgoScope từ một stateless MVP cơ bản thành một lab benchmark và phân tích mã có trải nghiệm hoàn chỉnh hơn nhưng vẫn giữ các nguyên tắc cốt lõi:

- không dùng database
- không có hàng đợi nền giả tạo
- không lưu trạng thái bền vững ở backend
- trả kết quả đầy đủ ngay trong response

## Tầm Nhìn Phiên Bản Hiện Tại

Phiên bản mở rộng tập trung vào ba lớp giá trị:

1. Nâng orchestration backend để response giàu dữ liệu hơn.
2. Nâng UX frontend để người dùng có workflow rõ ràng hơn trong cùng một session.
3. Nâng tài liệu và cấu trúc để dự án nhìn đúng chuẩn production-minded thay vì chỉ là demo kỹ thuật.

## Các Năng Lực Mới Cần Có

- Catalog preset scenario để chạy nhanh nhiều kiểu benchmark phổ biến
- Endpoint capabilities để frontend tự mô tả năng lực runtime hiện tại
- Bộ nhớ đệm ngắn hạn trong API cho insight và catalog
- Report metadata để export JSON có ngữ cảnh rõ ràng hơn
- Analyze-only workspace tách biệt với simulate
- Compare inline giàu dữ liệu hơn, có thêm risk delta
- Local session history ở frontend để xem lại những lần chạy gần nhất mà không vi phạm kiến trúc stateless

## Các Pha Thực Hiện

### Pha 1. Nâng Backend Stateless Core

- Mở rộng schema request/response
- Bổ sung `report`, `recommendations`, `risk_score`
- Thêm `GET /api/v1/scenario-presets`
- Thêm `GET /api/v1/capabilities`
- Nâng `GET /api/v1/health` để trả metadata về cache và sandbox

### Pha 2. Nâng Trải Nghiệm Frontend

- Thêm `Analyze Code`
- Nâng `Dashboard` thành control plane của phiên làm việc hiện tại
- Nâng `New Simulation` với preset, capability hint và profile label
- Nâng `Run Detail` với export JSON, execution metadata, recommendations và local session routing
- Nâng `Compare Inline` với preset scenario và risk comparison

### Pha 3. Local Session Layer

- Lưu local history trong `sessionStorage`
- Hỗ trợ mở lại từng run trong cùng session
- Lưu latest analyze result và latest compare result để dashboard giàu ngữ cảnh hơn

### Pha 4. Quality Và Tài Liệu

- Cập nhật docs cho các endpoint và màn hình mới
- Mở rộng test backend/frontend theo contract mới
- Kiểm tra lại toàn bộ codebase không còn dead code hoặc abstraction thừa

## Giả Định

- Hệ thống vẫn ưu tiên Python-first
- Docker daemon khả dụng trong môi trường local
- Frontend được phép dùng `sessionStorage` như một lớp tiện ích trình duyệt, không được xem là persistence backend

## Rủi Ro

- Response ngày càng giàu dữ liệu nên cần giữ typing chặt
- Session history frontend có thể bị mất khi đóng tab hoặc xóa storage
- Cache API phải ngắn hạn và được mô tả trung thực để tránh ngộ nhận là persistence

## Cách Giảm Thiểu

- Dùng shared types làm contract trung tâm
- Giữ cache trong bộ nhớ với TTL rõ ràng
- Ghi rõ giới hạn trong README và docs
- Tách service catalog, report metadata và session layer để dễ bảo trì

## Hạng Mục Cố Ý Chưa Làm

- Run history backend
- Saved comparison
- Dashboard analytics tích lũy
- Streaming log thời gian thực
- Profiler line-level thật
- Multi-language runner ngoài Python
