import { useCallback, useEffect, useState } from 'react';
import api from '../api/client';

/** Nạp danh sách dự án dùng chung cho các form công việc */
export default function useWorkspace() {
  const [projects, setProjects] = useState([]);

  const reload = useCallback(async () => {
    const { data } = await api.get('/projects');
    setProjects(data.projects);
  }, []);

  useEffect(() => {
    reload().catch(() => {});
  }, [reload]);

  return { projects, reload };
}
