/**
 * Ứng dụng dùng cho cá nhân: mọi dữ liệu đều thuộc về người đang đăng nhập.
 * Vẫn lọc theo createdBy để nếu có nhiều tài khoản trên cùng một server
 * thì dữ liệu của từng người vẫn tách biệt hoàn toàn.
 */
export const taskAccessFilter = (userId) => ({ createdBy: userId, deletedAt: null });

export const projectAccessFilter = (userId) => ({ owner: userId });
