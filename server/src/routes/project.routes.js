import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import {
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
} from '../controllers/project.controller.js';

const router = Router();
router.use(protect);

router.route('/').get(listProjects).post(createProject);
router.route('/:id').get(getProject).patch(updateProject).delete(deleteProject);

export default router;
