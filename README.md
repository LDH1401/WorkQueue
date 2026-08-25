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

Dự án gồm 3 phần chạy ở 3 nơi khác nhau:

| Phần | Nền tảng gợi ý | Ghi chú |
| --- | --- | --- |
| Database | **MongoDB Atlas** (free M0) | Bắt buộc dùng cloud, không dùng được MongoDB trên máy cá nhân |
| Backend `server/` | **Railway** / Render / Fly.io | Cần host chạy Node liên tục |
| Frontend `client/` | **Vercel** / Netlify / Cloudflare Pages | Chỉ là file tĩnh sau khi build |

### Bước 1 — Database (Atlas)

Vào **Network Access** → *Add IP Address* → `0.0.0.0/0`.
Bắt buộc, vì IP của Railway/Render thay đổi liên tục, không thể whitelist từng IP.

Chuỗi kết nối phải có tên database trước dấu `?`:

```
mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/workqueue?retryWrites=true&w=majority
```

### Bước 2 — Backend

Đặt **Root Directory** = `server`, start command = `npm start`, rồi khai báo biến môi trường:

| Biến | Giá trị |
| --- | --- |
| `MONGO_URI` | Chuỗi kết nối Atlas |
| `JWT_SECRET` | Chuỗi ngẫu nhiên dài (`openssl rand -base64 32`) |
| `CLIENT_URL` | Domain frontend, ví dụ `https://workqueue.vercel.app` |
| `NODE_ENV` | `production` |

Không cần đặt `PORT` — nền tảng tự cấp, code đã đọc `process.env.PORT`.

Kiểm tra: mở `https://<domain-api>/api/health`, phải trả về JSON `success: true`.

### Bước 3 — Frontend

Đặt **Root Directory** = `client`, build command = `npm run build`, output = `dist`, và khai báo:

| Biến | Giá trị |
| --- | --- |
| `VITE_API_URL` | `https://<domain-api>/api` (nhớ có `/api` ở cuối) |

Biến `VITE_*` được nhúng vào code **lúc build**, nên mỗi lần đổi giá trị phải build lại (redeploy).

File [client/vercel.json](client/vercel.json) và [client/public/_redirects](client/public/_redirects) đã cấu hình sẵn fallback về `index.html` — thiếu chúng thì tải thẳng `/board` hay F5 giữa chừng sẽ ra lỗi 404.

### Bước 4 — Nối hai đầu

Sau khi có domain frontend, quay lại backend cập nhật `CLIENT_URL` cho khớp rồi redeploy, nếu không trình duyệt sẽ chặn vì CORS.

### Tạo dữ liệu mẫu trên production

```bash
MONGO_URI="<chuỗi Atlas>" npm --prefix server run seed
```

> ⚠️ Script này **xoá sạch database** rồi nạp lại. Chỉ chạy khi database còn trống.

### Checklist bảo mật

- [ ] `JWT_SECRET` là chuỗi ngẫu nhiên, khác giá trị trong `.env.example`
- [ ] File `.env` không bị commit (đã có trong `.gitignore`)
- [ ] User database Atlas chỉ có quyền `readWrite` trên database `workqueue`
- [ ] `CLIENT_URL` trỏ đúng domain thật, không để `*`
