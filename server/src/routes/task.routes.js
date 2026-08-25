import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import {
  listTasks,
  boardTasks,
  getTask,
  createTask,
  updateTask,
  moveTask,
  deleteTask,
  addComment,
  deleteComment,
  taskStats,
} from '../controllers/task.controller.js';

const router = Router();
router.use(protect);

router.get('/board', boardTasks);
router.get('/stats', taskStats);

router.route('/').get(listTasks).post(createTask);
router.route('/:id').get(getTask).patch(updateTask).delete(deleteTask);
router.patch('/:id/move', moveTask);
router.post('/:id/comments', addComment);
router.delete('/:id/comments/:commentId', deleteComment);

export default router;
