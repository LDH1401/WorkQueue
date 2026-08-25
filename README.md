# WorkQueue — Phần mềm quản lý công việc

Ứng dụng quản lý công việc theo nhóm, xây dựng bằng **React (Vite) + Express + MongoDB (Mongoose)**.

![stack](https://img.shields.io/badge/React-18-61dafb) ![stack](https://img.shields.io/badge/Express-4-black) ![stack](https://img.shields.io/badge/MongoDB-7-47A248)

## Tính năng

- **Xác thực JWT**: đăng ký, đăng nhập, đổi mật khẩu, cập nhật hồ sơ.
- **Bảng Kanban**: 4 cột (Cần làm / Đang làm / Chờ duyệt / Hoàn thành), **kéo thả** để đổi trạng thái và thứ tự.
- **Danh sách công việc**: lọc theo trạng thái, độ ưu tiên, dự án, người thực hiện, hạn chót; tìm kiếm; sắp xếp; phân trang.
- **Công việc**: tiêu đề, mô tả, độ ưu tiên, hạn chót, thẻ (tag), người thực hiện, dự án, **bình luận**.
- **Dự án**: tạo/sửa/xoá, gán thành viên, màu nhận diện, theo dõi tiến độ.
- **Dashboard**: thống kê tổng quan, tỉ lệ hoàn thành, việc quá hạn, deadline sắp tới.
- **Phân quyền dữ liệu**: chỉ thấy công việc do mình tạo, được giao cho mình, hoặc thuộc dự án mình tham gia.
- Giao diện tiếng Việt, responsive (dùng tốt trên điện thoại).

## Yêu cầu

- Node.js >= 18
- MongoDB (chọn 1 trong 3 cách):
  - **Docker** (nhanh nhất): `docker run -d --name workqueue-mongo -p 27017:27017 mongo:7`
  - **Cài trực tiếp**: [MongoDB Community Server](https://www.mongodb.com/try/download/community)
  - **MongoDB Atlas** (miễn phí, chạy trên cloud): lấy chuỗi kết nối `mongodb+srv://...`

## Cài đặt & chạy

```bash
# 1. Cài dependencies cho cả server và client
npm install          # cài concurrently ở thư mục gốc
npm run setup        # cài cho server/ và client/

# 2. Tạo file cấu hình
cp server/.env.example server/.env
#   → mở server/.env và sửa MONGO_URI, JWT_SECRET

# 3. (Tuỳ chọn) Tạo dữ liệu mẫu để xem thử
npm run seed

# 4. Chạy đồng thời API + giao diện
npm run dev
```

- Giao diện: <http://localhost:5173>
- API: <http://localhost:5000/api>

**Tài khoản demo** (sau khi chạy `npm run seed`):

| Email | Mật khẩu |
| --- | --- |
| demo@workqueue.dev | 123456 |
| binh@workqueue.dev | 123456 |
| chi@workqueue.dev | 123456 |

### Các lệnh khác

| Lệnh | Mô tả |
| --- | --- |
| `npm run dev` | Chạy song song API (cổng 5000) và web (cổng 5173) |
| `npm run dev:server` | Chỉ chạy API, tự khởi động lại khi sửa code |
| `npm run dev:client` | Chỉ chạy giao diện |
| `npm run seed` | Xoá sạch DB và nạp lại dữ liệu mẫu |
| `npm run build` | Build giao diện ra `client/dist` |

## Cấu trúc thư mục

```
WorkQueue/
├── vercel.json                   # Cấu hình deploy "tất cả trên Vercel"
├── api/
│   └── [...path].js              # Điểm vào serverless (chỉ Vercel dùng)
├── server/                       # Backend Express
│   ├── .env.example
│   └── src/
│       ├── config/db.js          # Kết nối MongoDB
│       ├── models/               # User, Project, Task (Mongoose)
│       ├── controllers/          # Xử lý nghiệp vụ
│       ├── routes/               # Định nghĩa endpoint
│       ├── middleware/           # Xác thực JWT, bắt lỗi tập trung
│       ├── utils/                # ApiError, bộ lọc phân quyền
│       ├── seed.js               # Script tạo dữ liệu mẫu
│       ├── app.js                # Khởi tạo Express
│       └── server.js             # Điểm vào
└── client/                       # Frontend React + Vite
    └── src/
        ├── api/client.js         # Axios + interceptor gắn token
        ├── context/              # AuthContext, ToastContext
        ├── hooks/                # useWorkspace
        ├── components/           # Layout, TaskCard, TaskDialog, ui.jsx
        ├── pages/                # Dashboard, Board, Tasks, Projects, Settings, Login, Register
        └── styles.css
```

## API

Mọi endpoint (trừ `/register`, `/login`, `/health`) yêu cầu header `Authorization: Bearer <token>`.

### Xác thực

| Method | Endpoint | Mô tả |
| --- | --- | --- |
| POST | `/api/auth/register` | Đăng ký `{ name, email, password }` |
| POST | `/api/auth/login` | Đăng nhập `{ email, password }` |
| GET | `/api/auth/me` | Thông tin người dùng hiện tại |
| PATCH | `/api/auth/me` | Cập nhật `{ name, avatarColor }` |
| PATCH | `/api/auth/password` | Đổi `{ currentPassword, newPassword }` |
| GET | `/api/auth/users` | Danh sách người dùng (để gán việc) |

### Công việc

| Method | Endpoint | Mô tả |
| --- | --- | --- |
| GET | `/api/tasks` | Danh sách có lọc & phân trang |
| GET | `/api/tasks/board` | Công việc gom theo cột Kanban |
| GET | `/api/tasks/stats` | Số liệu cho dashboard |
| POST | `/api/tasks` | Tạo công việc |
| GET | `/api/tasks/:id` | Chi tiết |
| PATCH | `/api/tasks/:id` | Cập nhật |
| PATCH | `/api/tasks/:id/move` | Kéo thả `{ status, index }` |
| DELETE | `/api/tasks/:id` | Xoá |
| POST | `/api/tasks/:id/comments` | Thêm bình luận `{ body }` |
| DELETE | `/api/tasks/:id/comments/:commentId` | Xoá bình luận của mình |

Tham số lọc của `GET /api/tasks`:

`status`, `priority`, `project` (id hoặc `none`), `assignee` (id, `me`, `none`), `tag`, `q` (từ khoá),
`due` (`overdue` \| `today` \| `week`), `sort` (`createdAt` \| `oldest` \| `dueDate` \| `priority` \| `title`), `page`, `limit`.

### Dự án

| Method | Endpoint | Mô tả |
| --- | --- | --- |
| GET | `/api/projects` | Danh sách kèm tiến độ |
| POST | `/api/projects` | Tạo dự án |
| GET | `/api/projects/:id` | Chi tiết |
| PATCH | `/api/projects/:id` | Cập nhật |
| DELETE | `/api/projects/:id` | Xoá (chỉ chủ dự án) |

## Triển khai (deploy)

Database luôn phải nằm trên **MongoDB Atlas** (MongoDB chạy trên máy cá nhân không thể truy cập từ internet). Phần còn lại có 2 cách:

| | Cách A — Tất cả trên Vercel | Cách B — Vercel + Railway |
| --- | --- | --- |
| Số nền tảng | 1 | 2 |
| Domain | 1 (không có CORS) | 2 (phải cấu hình CORS) |
| Backend chạy kiểu | Serverless, ngủ khi rảnh | Server thường trực |
| Request đầu sau khi rảnh | Chậm ~1–3s (cold start) | Nhanh ngay |
| Phù hợp | Đồ án, portfolio, traffic thấp | Ứng dụng chạy thật, cần độ trễ ổn định |

### Chuẩn bị chung

1. Đẩy code lên GitHub (cả Vercel và Railway đều deploy từ đó).
2. Atlas → **Network Access** → *Add IP Address* → `0.0.0.0/0`.
   Bắt buộc, vì IP của Vercel/Railway thay đổi liên tục.
3. Chuỗi kết nối phải có tên database trước dấu `?`:
   `mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/workqueue?retryWrites=true&w=majority`

---

### Cách A — Tất cả trên Vercel

Đã cấu hình sẵn trong repo:

| File | Vai trò |
| --- | --- |
| [api/[...path].js](api/%5B...path%5D.js) | Điểm vào serverless, nhận mọi request `/api/*` rồi chuyển cho app Express |
| [vercel.json](vercel.json) | Build frontend ra `client/dist`, mọi đường dẫn không phải `/api` trả về `index.html` |
| `dependencies` trong [package.json](package.json) | Bản sao của `server/package.json` để Vercel cài được thư viện cho function |

**Các bước:**

1. [vercel.com](https://vercel.com) → *Add New Project* → chọn repo.
2. **Root Directory để nguyên là thư mục gốc** (không đổi thành `client`).
3. Thêm biến môi trường:

| Biến | Giá trị |
| --- | --- |
| `MONGO_URI` | Chuỗi kết nối Atlas |
| `JWT_SECRET` | Chuỗi ngẫu nhiên dài (`openssl rand -base64 32`) |

Không cần đặt `VITE_API_URL` (frontend gọi thẳng `/api` cùng domain) và không cần `CLIENT_URL` (không có CORS).

4. Deploy, rồi kiểm tra `https://<domain>/api/health`.

> **Lưu ý về serverless:** hàm `connectDB` trong [server/src/config/db.js](server/src/config/db.js) cache kết nối trên `globalThis`. Không có nó, mỗi cold start sẽ mở một kết nối MongoDB mới và nhanh chóng chạm trần 500 kết nối của Atlas M0.

---

### Cách B — Frontend Vercel + Backend Railway

**Backend:** Root Directory = `server`, start command = `npm start`, biến môi trường:

| Biến | Giá trị |
| --- | --- |
| `MONGO_URI` | Chuỗi kết nối Atlas |
| `JWT_SECRET` | Chuỗi ngẫu nhiên dài |
| `CLIENT_URL` | Domain frontend, ví dụ `https://workqueue.vercel.app` |
| `NODE_ENV` | `production` |

Không cần đặt `PORT` — nền tảng tự cấp, code đã đọc `process.env.PORT`.

**Frontend:** Root Directory = `client` (khi đó [client/vercel.json](client/vercel.json) được dùng thay cho file ở gốc), thêm biến:

| Biến | Giá trị |
| --- | --- |
| `VITE_API_URL` | `https://<domain-api>/api` (nhớ có `/api` ở cuối) |

Cuối cùng quay lại backend cập nhật `CLIENT_URL` cho khớp domain frontend rồi redeploy, nếu không trình duyệt sẽ chặn vì CORS.

---

### Tạo dữ liệu mẫu trên production

```bash
MONGO_URI="<chuỗi Atlas>" npm --prefix server run seed
```

> ⚠️ Script này **xoá sạch database** rồi nạp lại. Chỉ chạy khi database còn trống.

### Checklist bảo mật

- [ ] `JWT_SECRET` là chuỗi ngẫu nhiên, khác giá trị trong `.env.example`
- [ ] File `.env` không bị commit (đã có trong `.gitignore`)
- [ ] User database Atlas chỉ có quyền `readWrite` trên database `workqueue`
- [ ] Không đặt secret vào biến `VITE_*` — chúng bị nhúng thẳng vào code frontend, ai cũng đọc được
