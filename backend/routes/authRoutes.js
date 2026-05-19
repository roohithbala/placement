import express from 'express'
import { signup, login, forgotPassword, resetPassword, verifyResetToken, getMe, updatePreferences } from '../controllers/authController.js'
import { authenticate } from '../middlewares/authMiddleware.js'

const router = express.Router()

router.post('/signup', signup)
router.post('/login', login)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password', resetPassword)
router.get('/verify-reset-token/:token', verifyResetToken)

// retrieve current user info
router.get('/me', authenticate, getMe)
// allow updating preferences
router.patch('/preferences', authenticate, updatePreferences)

export default router