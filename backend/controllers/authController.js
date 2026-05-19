import User from '../models/User.js'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { validateSignupData, validateLoginData } from '../utils/validationUtils.js'

const generateToken = (userId, role) => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET, { expiresIn: '7d' })
}

export const signup = async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body

    const validation = validateSignupData({ email, password, confirmPassword })

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors,
      })
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() })
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email',
      })
    }

    const user = new User({ email: email.toLowerCase().trim(), password })
    await user.save()

    const token = generateToken(user._id, user.role)

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      token,
      userId: user._id,
      role: user.role,
      email: user.email, // return email for client-side use
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    const validation = validateLoginData({ email, password })

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors,
      })
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() })
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password',
      })
    }

    const isPasswordValid = await user.comparePassword(password)
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password',
      })
    }

    const token = generateToken(user._id, user.role)

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      userId: user._id,
      profileCompleted: user.profileCompleted,
      role: user.role,
      email: user.email, // include email so UI can cache/prefill
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

// returns current authenticated user
export const getMe = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id
    const user = await User.findById(userId).select('-password -resetPasswordToken -resetPasswordExpires')
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }
    res.status(200).json({ success: true, user })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// allow users to update preference sub-object
export const updatePreferences = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id
    const updates = req.body
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    // merge only provided keys into preferences
    user.preferences = { ...user.preferences.toObject(), ...updates }
    await user.save()

    res.status(200).json({ success: true, user })
  } catch (error) {
    console.error('Preferences update error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body
    console.log('Forgot password request received for:', email)

    if (!email) {
      console.log('No email provided')
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      })
    }

    const normalizedEmail = email.toLowerCase().trim()
    console.log('Looking for user with email:', normalizedEmail)
    const user = await User.findOne({ email: normalizedEmail })

    if (!user) {
      console.log('User not found for email:', normalizedEmail)
      return res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
      })
    }

    console.log('User found:', user._id)

    if (!user.password && (user.googleId || user.githubId)) {
      return res.status(400).json({
        success: false,
        message: 'This account uses social login. Please sign in with Google or GitHub.',
      })
    }

    const resetToken = crypto.randomBytes(32).toString('hex')
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex')
    console.log('Reset token generated, saving to user...')

    user.resetPasswordToken = hashedToken
    user.resetPasswordExpires = Date.now() + 600000
    await user.save()
    console.log('Token saved to database')

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`

    res.status(200).json({
      success: true,
      message: 'Password reset link has been generated.',
      resetLink
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to process password reset request. Please try again later.',
    })
  }
}

export const resetPassword = async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Token and password are required',
      })
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match',
      })
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long',
      })
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex')

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    })

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token. Please request a new password reset.',
      })
    }

    user.password = password
    user.resetPasswordToken = undefined
    user.resetPasswordExpires = undefined
    await user.save()

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new password.',
    })
  } catch (error) {
    console.error('Reset password error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to reset password. Please try again later.',
    })
  }
}

export const verifyResetToken = async (req, res) => {
  try {
    const { token } = req.params

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token is required',
      })
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex')

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    })

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token',
      })
    }

    res.status(200).json({
      success: true,
      message: 'Token is valid',
    })
  } catch (error) {
    console.error('Verify token error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to verify token',
    })
  }
}