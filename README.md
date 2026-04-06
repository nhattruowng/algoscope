# AlgoScope

AlgoScope là một nền tảng benchmark và phân tích mã theo kiến trúc stateless. Người dùng dán code Python, chọn preset hoặc cấu hình scenario, API gọi Docker sandbox trực tiếp và trả về metric, log, insight heuristic, heatmap annotation và metadata export ngay trong một response.

## Điểm Nổi Bật

- Chạy benchmark trực tiếp qua `POST /api/v1/simulate`
- Phân tích code không cần benchmark qua `POST /api/v1/analyze`
- So sánh hai snippet trong cùng request qua `POST /api/v1/compare-inline`
- Catalog preset scenario qua `GET /api/v1/scenario-presets`
- Capability metadata qua `GET /api/v1/capabilities`
- Health endpoint có cache stats qua `GET /api/v1/health`
- Frontend có local session history, analyze workspace và export JSON

## Trạng Thái Kiến Trúc

Phiên bản hiện tại cố ý giữ stateless:

- Không có PostgreSQL
- Không có SQLAlchemy hoặc Alembic
- Không có Redis hoặc Celery
- Không lưu submissions, jobs, runs, metrics hoặc insights ở backend
- Không có run history server-side

## Luồng Hoạt Động

1. Frontend gửi request tới FastAPI.
2. API xác thực payload và chuẩn bị input benchmark.
3. API gọi Docker sandbox runner trực tiếp.
4. API phân tích mã bằng heuristic analyzer.
5. API tổng hợp metric trong bộ nhớ.
6. API trả về JSON giàu dữ liệu.
7. Frontend render charts, logs, heatmap, recommendation và metadata ngay từ response.

## Cấu Trúc Monorepo

```text
algoscope/
  apps/
    api/
    web/
  packages/
    shared-types/
  infra/
    docker/
  docs/
  README.md
  PLANS.md
  TASKS.md
```

## Công Nghệ Sử Dụng

- Frontend: React, TypeScript, Vite, Tailwind CSS, Monaco Editor, Recharts
- Backend: FastAPI, Pydantic 2
- Sandbox: Docker sandbox runner gọi trực tiếp từ API
- Chất lượng: pytest, vitest, Makefile, Docker Compose
- Frontend dependencies được khóa bằng `package-lock.json` và Docker build dùng `npm ci`

## Các Trang Chính

- `Dashboard`: control plane của session hiện tại
- `New Simulation`: chạy benchmark với preset, scenario tùy chỉnh và profile label
- `Analyze Code`: xem explanation, warnings, hotspot và recommendation mà không chạy sandbox
- `Run Detail`: xem kết quả chi tiết của lần chạy trong session, export JSON và heatmap
- `Compare Inline`: so sánh hai snippet với cùng scenario

## Khởi Chạy Nhanh

```powershell
Copy-Item .env.example .env
make up
```

Hoặc dùng script shell đã kèm trong repo:

```bash
sh infra/scripts/docker-dev.sh up
```

Sau đó mở:

- Web UI: `http://localhost:3001`
- API docs: `http://localhost:8001/docs`

## Chạy Bằng Script Docker

Repo có sẵn script [infra/scripts/docker-dev.sh](infra/scripts/docker-dev.sh) để build và chạy Docker stack theo đúng flow hiện tại.

Các lệnh thường dùng:

```bash
sh infra/scripts/docker-dev.sh up
sh infra/scripts/docker-dev.sh build
sh infra/scripts/docker-dev.sh up-fresh
sh infra/scripts/docker-dev.sh build-fresh
sh infra/scripts/docker-dev.sh down
sh infra/scripts/docker-dev.sh logs
sh infra/scripts/docker-dev.sh logs api
sh infra/scripts/docker-dev.sh test
sh infra/scripts/docker-dev.sh ps
```

Script sẽ:

- tự tạo `.env` từ `.env.example` nếu chưa có
- kiểm tra Docker daemon
- hỗ trợ mode nhanh bằng cache cho vòng lặp dev hằng ngày
- hỗ trợ mode sạch hoàn toàn khi cần reset môi trường

Khuyến nghị:

- `up`: chạy nhanh bằng cache, nên dùng hằng ngày
- `up-fresh`: build sạch hoàn toàn, nên dùng khi nghi ngờ lỗi do image/volume cũ

Nếu Docker build bị lỗi mạng khi cài `npm` hoặc `pip`, hãy cấu hình thêm trong `.env`:

```env
HTTP_PROXY=http://your-proxy:port
HTTPS_PROXY=http://your-proxy:port
NO_PROXY=localhost,127.0.0.1
NPM_CONFIG_REGISTRY=https://registry.npmjs.org/
```

Nếu công ty bạn có npm mirror nội bộ, chỉ cần đổi `NPM_CONFIG_REGISTRY`.

### Windows

Nếu dùng Windows và PowerShell không có `sh`, hãy chạy script bằng Git Bash hoặc WSL:

Git Bash:

```bash
cd /d/AlgoScope/algoscope
sh infra/scripts/docker-dev.sh up
```

WSL:

```bash
cd /mnt/d/AlgoScope/algoscope
sh infra/scripts/docker-dev.sh up
```

Nếu muốn chạy native trong PowerShell thì dùng lệnh tương đương:

```powershell
docker compose --env-file .env up -d --build api web
```

Mặc định local stack map API ra cổng `8001` và UI ra cổng `3001` để tránh va chạm với các service khác đang dùng `8000` hoặc `5173`.

## Các Lệnh Chính

- `make up`: build image cần thiết và khởi động `api` cùng `web`
- `make down`: dừng stack
- `make logs`: theo dõi log Docker Compose
- `make test`: chạy test backend và frontend
- `make build`: build image

## Dịch Vụ Local

- `api`: FastAPI stateless API
- `web`: frontend React chạy bằng Vite
- `sandbox-runner`: image Docker được API sử dụng để thực thi code trong container ngắn hạn

## Tính Năng Mở Rộng Đã Có

- Preset benchmark cho sanity, scaling và memory pressure
- Report metadata gồm `generated_at`, `export_filename`, `profile_label`, `cache_hit`
- In-memory cache ngắn hạn cho catalog và heuristic analysis
- Local session history lưu trong `sessionStorage`
- Capability-driven UI để frontend biết giới hạn runtime hiện tại

## Giới Hạn Hiện Tại

- Không có persistence backend
- Không có run history sau khi đóng session trình duyệt
- Không có saved comparison
- Không có dashboard analytics tích lũy
- Chỉ hỗ trợ Python snippet
- Heuristic heatmap chưa phải line profiler thật
- Sandbox phù hợp cho local MVP, chưa phải môi trường multi-tenant harden hoàn chỉnh

## Tài Liệu

- [docs/architecture.md](docs/architecture.md)
- [docs/backend.md](docs/backend.md)
- [docs/frontend.md](docs/frontend.md)
- [docs/docker.md](docs/docker.md)
- [docs/testing.md](docs/testing.md)
- [docs/api-examples.md](docs/api-examples.md)

## Hướng Mở Rộng Tiếp Theo

- Thêm profiler trace thật để thay thế một phần heuristic
- Bổ sung multi-language runner
- Thêm streaming log hoặc progress signal
- Thêm session workspace giàu hơn ở frontend mà vẫn không cần persistence backend
