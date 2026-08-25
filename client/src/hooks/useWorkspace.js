import { useCallback, useEffect, useState } from 'react';
import api from '../api/client';

/** Nạp danh sách dự án + thành viên dùng chung cho các form công việc */
export default function useWorkspace() {
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);

  const reload = useCallback(async () => {
    const [p, u] = await Promise.all([api.get('/projects'), api.get('/auth/users')]);
    setProjects(p.data.projects);
    setUsers(u.data.users);
  }, []);

  useEffect(() => {
    reload().catch(() => {});
  }, [reload]);

  return { projects, users, reload };
}
