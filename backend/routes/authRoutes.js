import express from 'express'
import passport from 'passport'
import { signup, login, forgotPassword, resetPassword, verifyResetToken, authCallback, getMe, updatePreferences } from '../controllers/authController.js'
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

// Google OAuth routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }))
router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  authCallback
)

// GitHub OAuth routes
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }))
router.get('/github/callback',
  passport.authenticate('github', { failureRedirect: '/login' }),
  authCallback
)

export default router