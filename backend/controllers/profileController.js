import Profile from '../models/Profile.js'
import User from '../models/User.js'

export const createProfile = async (req, res) => {
  try {
    const userId = req.user.userId
    const profileData = req.body

    // Check if profile already exists
    let profile = await Profile.findOne({ userId })
    if (profile) {
      return res.status(400).json({
        success: false,
        message: 'Profile already exists',
      })
    }

    // Create new profile
    profile = new Profile({
      userId,
      ...profileData,
    })

    await profile.save()

    // Update user profileCompleted flag
    await User.findByIdAndUpdate(userId, { profileCompleted: true })

    res.status(201).json({
      success: true,
      message: 'Profile created successfully',
      profile,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

export const getProfile = async (req, res) => {
  try {
    const userId = req.user.userId

    const profile = await Profile.findOne({ userId })
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found',
      })
    }

    res.status(200).json({
      success: true,
      profile,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId
    const profileData = req.body

    let profile = await Profile.findOne({ userId })
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found',
      })
    }

    // Enforce business rules before updating
    // a user must already be marked placed in their existing profile to turn mentoring on
    if (profileData.willingToMentor && profile.placementStatus !== 'placed') {
      return res.status(400).json({
        success: false,
        message: 'Users can only opt‑in to mentor after they are marked placed',
      })
    }

    // Update profile fields
    Object.assign(profile, profileData)
    profile.updatedAt = new Date()

    await profile.save()

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      profile,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}