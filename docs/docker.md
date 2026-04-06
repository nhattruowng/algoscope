# Docker Và Chạy Local

## Thành Phần Docker

- `api`: FastAPI stateless API
- `web`: React + Vite frontend
- `sandbox-runner`: image thực thi benchmark trong container cô lập

Không còn:

- PostgreSQL
- Redis
- Worker service

## Khởi Động

1. Sao chép `.env.example` thành `.env`
2. Chạy `make up`
3. Mở `http://localhost:3001`
4. Mở `http://localhost:8001/docs`

## Lệnh Chính

- `make up`
- `make down`
- `make logs`
- `make test`
- `make build`
- `sh infra/scripts/docker-dev.sh up`
- `sh infra/scripts/docker-dev.sh up-fresh`

## Hành Vi Sandbox

- API cần truy cập Docker socket của host
- Mỗi lần simulate tạo một container ngắn hạn
- Container bị giới hạn timeout, memory và CPU
- Network bị tắt theo mặc định
- File tạm chỉ tồn tại trong vòng đời container

## Ghi Chú Thực Tế

- Preset catalog và capability metadata không yêu cầu thêm service nào ngoài API
- In-memory cache nằm trong chính process API
- Nếu restart API, cache bị reset hoàn toàn
- API local được map ra cổng `8001` để giảm khả năng đụng cổng `8000` trên máy dev
- `docker-dev.sh up` dùng cache để vòng lặp dev nhanh hơn
- `docker-dev.sh up-fresh` dùng khi cần build sạch và reset volume
- Nếu `npm install` hoặc `pip install` trong Docker build bị lỗi mạng, hãy khai báo `HTTP_PROXY`, `HTTPS_PROXY`, `NO_PROXY`, `NPM_CONFIG_REGISTRY`, `PIP_INDEX_URL` trong `.env`
- Frontend image dùng `package-lock.json` cùng `npm ci` để build ổn định và ít sai khác dependency giữa các lần chạy

## Giới Hạn

- Nếu Docker daemon không khả dụng, `/simulate` sẽ thất bại
- Thời gian phản hồi phụ thuộc trực tiếp vào benchmark time và sandbox timeout
