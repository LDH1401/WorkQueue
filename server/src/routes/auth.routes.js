import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { register, login, me, updateProfile, changePassword } from '../controllers/auth.controller.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, me);
router.patch('/me', protect, updateProfile);
router.patch('/password', protect, changePassword);

export default router;
