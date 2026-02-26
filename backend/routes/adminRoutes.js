import express from 'express'
import { authMiddleware, isAdmin } from '../middlewares/authMiddleware.js'
import {
    getStats,
    getManageableUsers,
    getStudents,
    getPlacedStudents,
    // experiences instead of problems
    getExperiences,
    getProblems,         // legacy alias
    getStudentDetail,
    getExperienceDetail,
    getProblemDetail,    // legacy alias
    deleteStudent,
    deleteExperience,
    deleteProblem,       // legacy alias
    getAllMeetings,
    updateMeeting,
    getLogs,
    // new admin actions
    getOpportunities,
    approveOpportunity,
    rejectOpportunity,
    getOpportunityDetail,
    updateOpportunity,
    setExperienceStatus
} from '../controllers/adminController.js'

const router = express.Router()

// All routes are protected by auth and admin middleware
router.use(authMiddleware)
router.use(isAdmin)

router.get('/stats', getStats)
router.get('/users', getManageableUsers)
router.get('/students', getStudents)
router.get('/placed-students', getPlacedStudents)
router.get('/experiences', getExperiences)
router.get('/students/:id', getStudentDetail)
router.get('/experiences/:id', getExperienceDetail)
router.delete('/students/:id', deleteStudent)
router.delete('/users/:id', deleteStudent)
router.post('/experiences/:id/delete', deleteExperience) // Using POST for deletion to send 'reason' in body

// Meetings management
router.get('/meetings', getAllMeetings)
router.put('/meetings/:id', updateMeeting)

// Opportunity moderation
// list may accept approved=true/false to filter
router.get('/opportunities', getOpportunities)
router.get('/opportunities/:id', getOpportunityDetail)
router.put('/opportunities/:id', updateOpportunity)
router.put('/opportunities/:id/approve', approveOpportunity)
router.put('/opportunities/:id/reject', rejectOpportunity)

// Experience moderation (status updates)
router.put('/experiences/:id/status', setExperienceStatus)

// System Logs
router.get('/logs', getLogs)

export default router
