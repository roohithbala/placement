import express from 'express'
import authMiddleware from '../middlewares/authMiddleware.js'
import multer from 'multer'
import path from 'path'

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

// multer configuration - store under uploads/experiences (backend/server.js already creates base uploads)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.cwd(), 'uploads', 'experiences')
    cb(null, dir)
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_')
    cb(null, `${Date.now()}_${safeName}`)
  }
})
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } })

const router = express.Router()

// Protected routes
router.post('/metadata', authMiddleware, saveExperienceMetadata)
router.post('/rounds/:experienceId', authMiddleware, saveExperienceRounds)
// allow both JSON payloads (base64) and multipart file uploads
router.post('/materials/:experienceId', authMiddleware, upload.single('file'), saveExperienceMaterials)
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
