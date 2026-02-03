import express from 'express'
import authMiddleware from '../middlewares/authMiddleware.js'
import {
  saveExperienceMetadata,
  saveExperienceRounds,
  saveExperienceMaterials,
  submitExperience,
  getUserExperiences,
  getRecentExperiences,
  getExperienceById,
  deleteExperience,
  getLatestDraft,
  getExperiencesByCompany,
  getExperiencesByBatch,
  getMetadataOptions,
  browseExperiences,
  getPlatformStats,
} from '../controllers/experienceController.js'

const router = express.Router()

// Protected routes
router.post('/metadata', authMiddleware, saveExperienceMetadata)
router.post('/rounds/:experienceId', authMiddleware, saveExperienceRounds)
router.post('/materials/:experienceId', authMiddleware, saveExperienceMaterials)
router.post('/submit/:experienceId', authMiddleware, submitExperience)

router.get('/my', authMiddleware, getUserExperiences)
router.get('/draft', authMiddleware, getLatestDraft) // Keep for backward compat / smart loading
router.get('/stats', authMiddleware, getPlatformStats)
router.delete('/:id', authMiddleware, deleteExperience)

// Public routes
router.get('/browse', browseExperiences)
router.get('/recent', getRecentExperiences)
router.get('/options', getMetadataOptions)
router.get('/company/:company', getExperiencesByCompany)
router.get('/batch/:batch', getExperiencesByBatch)

// Wildcard ID route (Last)
router.get('/:id', getExperienceById)

export default router
