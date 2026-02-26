import User from '../models/User.js'
import Profile from '../models/Profile.js'
// Experience.js is legacy; data now stored in ExperienceMetadata
import Experience from '../models/Experience.js'
import ExperienceMetadata from '../models/ExperienceMetadata.js'
import Opportunity from '../models/Opportunity.js'
import Meeting from '../models/Meeting.js'
import Log from '../models/Log.js'
import ExperienceRound from '../models/ExperienceRound.js'
import ExperienceMaterial from '../models/ExperienceMaterial.js'

// Helper to get admin IDs
const getAdminIds = async () => {
    const admins = await User.find({ role: 'admin' }).select('_id')
    return admins.map(a => a._id)
}

// Get high-level stats for the dashboard
export const getStats = async (req, res) => {
    try {
        const adminIds = await getAdminIds()

const [totalStudents, totalPlacedStudents, totalExperiences, totalPendingOpportunities] = await Promise.all([
            Profile.countDocuments({ userId: { $nin: adminIds }, placementStatus: 'not-placed' }),
            Profile.countDocuments({ userId: { $nin: adminIds }, placementStatus: 'placed' }),
            // experiences count (uses metadata)
    ExperienceMetadata.countDocuments({ status: { $in: ['approved', 'pending'] } }),
            Opportunity.countDocuments({ approved: false })
        ])

        const totalUsers = totalStudents + totalPlacedStudents

        // Aggregations
        const [studentsByYear, experiencesByDifficulty, experiencesOverTime, placedByCompany, placedByRole, placedByYear] = await Promise.all([
            // Students by Passing Year (Batch)
            Profile.aggregate([
                { $match: { userId: { $nin: adminIds } } },
                { $group: { _id: '$batch', count: { $sum: 1 } } },
                { $sort: { _id: 1 } }
            ]),
            // Experiences by Difficulty Rating
            ExperienceMetadata.aggregate([
                { $match: { status: { $in: ['approved', 'pending'] } } },
                { $group: { _id: '$difficultyRating', count: { $sum: 1 } } },
                { $sort: { _id: 1 } }
            ]),
            // Experiences Uploaded Over Time (per month)
            ExperienceMetadata.aggregate([
                { $match: { status: { $in: ['approved', 'pending'] } } },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } },
                { $limit: 6 }
            ]),
            // Placed Students by Company
            Profile.aggregate([
                { $match: { placementStatus: 'placed', userId: { $nin: adminIds } } },
                { $group: { _id: '$company', value: { $sum: 1 } } },
                { $sort: { value: -1 } },
                { $limit: 5 }
            ]),
            // Placed Students by Role
            Profile.aggregate([
                { $match: { placementStatus: 'placed', userId: { $nin: adminIds } } },
                { $group: { _id: '$role', value: { $sum: 1 } } },
                { $sort: { value: -1 } },
                { $limit: 5 }
            ]),
            // Students Placed by Passing Year
            Profile.aggregate([
                { $match: { placementStatus: 'placed', userId: { $nin: adminIds } } },
                { $group: { _id: '$batch', count: { $sum: 1 } } },
                { $sort: { _id: 1 } }
            ])
        ])

        const placementDistribution = [
            { name: 'Students', value: totalStudents },
            { name: 'Placed', value: totalPlacedStudents }
        ]

        res.json({
            summary: { totalUsers, totalStudents, totalPlacedStudents, totalExperiences, totalPendingOpportunities },
            charts: {
                studentsByYear,
                experiencesByDifficulty,
                placementDistribution,
                experiencesOverTime,
                placedByCompany,
                placedByRole,
                placedByYear
            }
        })
    } catch (error) {
        console.error('Stats Error:', error)
        res.status(500).json({ status: 'error', message: error.message })
    }
}

// Unified User List
export const getManageableUsers = async (req, res) => {
    try {
        const { search, page = 1, limit = 10 } = req.query
        const skip = (parseInt(page) - 1) * parseInt(limit)
        const adminIds = await getAdminIds()

        const query = { userId: { $nin: adminIds } }
        if (search) {
            query.$or = [
                { fullName: { $regex: search.trim(), $options: 'i' } },
                { collegeEmail: { $regex: search.trim(), $options: 'i' } }
            ]
        }

        const [students, total] = await Promise.all([
            Profile.find(query)
                .populate('userId', 'email role')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Profile.countDocuments(query)
        ])

        res.json({
            students,
            pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) }
        })
    } catch (error) {
        console.error('Users Error:', error)
        res.status(500).json({ status: 'error', message: error.message })
    }
}

// Get Experiences List
// Legacy alias kept for compatibility
export const getProblems = async (req, res) => await getExperiences(req, res)

// New name matching domain
export const getExperiences = async (req, res) => {
    try {
        const { difficulty, search, page = 1, limit = 10, status } = req.query
        const skip = (parseInt(page) - 1) * parseInt(limit)

        // default to pending+approved if no status specified
        const query = {}
        if (status && status !== 'All') {
            // allow multiple statuses comma-separated
            if (status.includes(',')) {
                query.status = { $in: status.split(',') }
            } else {
                query.status = status
            }
        } else {
            query.status = { $in: ['approved', 'pending'] }
        }

        if (difficulty && difficulty !== 'All') {
            query.difficultyRating = parseInt(difficulty)
        }
        if (search) {
            query.$or = [
                { companyName: { $regex: search.trim(), $options: 'i' } },
                { roleAppliedFor: { $regex: search.trim(), $options: 'i' } }
            ]
        }

        const [problems, total] = await Promise.all([
            ExperienceMetadata.find(query)
                .populate('userId', 'email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            ExperienceMetadata.countDocuments(query)
        ])

        // Safe profile enrichment
        const problemsWithProfile = await Promise.all(problems.map(async (p) => {
            const profile = p.userId ? await Profile.findOne({ userId: p.userId._id }) : null
            return { ...p.toObject(), profile }
        }))

        res.json({
            experiences: problemsWithProfile,
            pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) }
        })
    } catch (error) {
        console.error('Problems Error:', error)
        res.status(500).json({ status: 'error', message: error.message })
    }
}

// Details
export const getStudentDetail = async (req, res) => {
    try {
        const { id } = req.params
        const profile = await Profile.findById(id).populate('userId', 'email')
        if (!profile) return res.status(404).json({ message: 'Student not found' })

        const [problems, meetings] = await Promise.all([
            Experience.find({ userId: profile.userId?._id }),
            Meeting.find({ $or: [{ mentorId: profile.userId?._id }, { menteeId: profile.userId?._id }] })
        ])

        res.json({ profile, problems, meetings })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

// compatibility alias
export const getProblemDetail = async (req, res) => await getExperienceDetail(req, res)

export const getExperienceDetail = async (req, res) => {
    try {
        const { id } = req.params
        console.log('admin getExperienceDetail called with id', id)
        // try metadata first
        let problem = await ExperienceMetadata.findById(id).populate('userId', 'email').lean()
        let legacy = false
        if (problem) console.log('found metadata record')
        if (!problem) {
            console.log('metadata not found, checking legacy Experience')
            problem = await Experience.findById(id).populate('userId', 'email').lean()
            legacy = true
            if (problem) console.log('found legacy Experience record')
        }
        if (!problem) {
            console.log('no experience record found for id', id)
            return res.status(404).json({ message: 'Experience not found' })
        }

        const profile = problem.userId ? await Profile.findOne({ userId: problem.userId._id }) : null
        const rounds = await ExperienceRound.findOne({ experienceId: id }).lean()
        console.log('admin getExperienceDetail rounds doc', rounds)
        const materials = await ExperienceMaterial.findOne({ experienceId: id }).lean()
        console.log('admin getExperienceDetail materials doc', materials)

        // if legacy data came from Experience, normalize keys to match metadata schema
        const normalized = legacy ? {
            ...problem,
            difficultyRating: problem.difficultyRating || problem.difficulty,
            roleAppliedFor: problem.roleAppliedFor || problem.role || '',
            companyName: problem.companyName || '',
            // preserve status if present else treat as approved
            status: problem.status || 'approved'
        } : problem

        // sanitize materials array to remove client-side temporary ids
        const sanitizedMaterials = (materials?.materials || []).map(m => {
            if (m && typeof m === 'object') {
                const { id, _id, ...rest } = m
                return rest
            }
            return m
        })
        res.json({ problem: { ...normalized, rounds: rounds?.rounds || [], materials: sanitizedMaterials }, profile })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

// Opportunity detail / update
export const getOpportunityDetail = async (req, res) => {
    try {
        const { id } = req.params
        const opp = await Opportunity.findById(id).lean()
        if (!opp) return res.status(404).json({ message: 'Opportunity not found' })
        res.json({ opportunity: opp })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const updateOpportunity = async (req, res) => {
    try {
        const { id } = req.params
        const updates = req.body
        const opp = await Opportunity.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).lean()
        if (!opp) return res.status(404).json({ message: 'Opportunity not found' })
        res.json({ opportunity: opp })
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

// Specialized lists for students/placed
export const getStudents = async (req, res) => {
    req.query.status = 'not-placed'
    return getFilteredUserList(req, res)
}

export const getPlacedStudents = async (req, res) => {
    req.query.status = 'placed'
    return getFilteredUserList(req, res)
}

const getFilteredUserList = async (req, res) => {
    try {
        const { status, search, year, page = 1, limit = 10 } = req.query
        const skip = (parseInt(page) - 1) * parseInt(limit)
        const adminIds = await getAdminIds()

        const query = { userId: { $nin: adminIds }, placementStatus: status }
        if (year) query.batch = parseInt(year)
        if (search) {
            query.$or = [
                { fullName: { $regex: search.trim(), $options: 'i' } },
                { collegeEmail: { $regex: search.trim(), $options: 'i' } }
            ]
        }

        const [students, total] = await Promise.all([
            Profile.find(query)
                .populate('userId', 'email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Profile.countDocuments(query)
        ])

        res.json({
            students,
            pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) }
        })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

// Specialised Deletions with notifications
// we renamed to deleteExperience semantically but keep deleteProblem alias
export const deleteProblem = async (req, res) => {
    try {
        const { id } = req.params
        const { reason } = req.body

        const problem = await Experience.findById(id).populate('userId', 'email')
        if (!problem) return res.status(404).json({ message: 'Experience not found' })

        const uploaderEmail = problem.userId?.email
        const experienceTitle = `${problem.companyName} - ${problem.roleAppliedFor}`

        // Delete experience
        await Experience.findByIdAndDelete(id)

        // Mock Email
        if (uploaderEmail) {
            console.log(`
                📧 EMAIL SENT TO: ${uploaderEmail}
                SUBJECT: Notification - Content Removal
                MESSAGE: Hello, your interview experience "${experienceTitle}" has been removed from the platform.
                REASON: ${reason || 'Violation of community guidelines.'}
                DETAILS: Please ensure your future contributions align with our quality standards.
            `)
        }

        res.json({ message: 'Experience removed and notification sent to uploader.' })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

// export alias
export const deleteExperience = deleteProblem


// Meetings management for admin
export const getAllMeetings = async (req, res) => {
    try {
        const meetings = await Meeting.find()
            .populate('mentorId', 'email')
            .populate('menteeId', 'email')
            .sort({ scheduledAt: -1 })
        res.json(meetings)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

// --- Opportunity moderation helpers ---
// General listing with optional approval filter.  Previously only returned pending items.
export const getOpportunities = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1
        const limit = Math.min(parseInt(req.query.limit) || 10, 50)
        const search = req.query.search
        // approved query param may be 'true' or 'false'; if omitted we return all
        const approvedQuery = req.query.approved
        const filter = {}

        if (approvedQuery === 'true' || approvedQuery === 'false') {
            filter.approved = approvedQuery === 'true'
        }

        if (search) {
            const re = new RegExp(search.trim(), 'i')
            filter.$or = [{ title: re }, { companyName: re }]
        }

        const [items, total] = await Promise.all([
            Opportunity.find(filter)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            Opportunity.countDocuments(filter),
        ])

        res.json({
            success: true,
            opportunities: items,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        })
    } catch (error) {
        console.error('Error fetching opportunities:', error)
        res.status(500).json({ success: false, message: 'Unable to load opportunities.' })
    }
}

export const approveOpportunity = async (req, res) => {
    try {
        const { id } = req.params
        const opp = await Opportunity.findByIdAndUpdate(
            id,
            { approved: true, status: 'active' },
            { new: true }
        )
        if (!opp) {
            return res.status(404).json({ success: false, message: 'Opportunity not found' })
        }
        res.json({ success: true, opportunity: opp })
    } catch (error) {
        console.error('Error approving opportunity:', error)
        res.status(500).json({ success: false, message: 'Unable to approve opportunity.' })
    }
}

export const rejectOpportunity = async (req, res) => {
    try {
        const { id } = req.params
        const opp = await Opportunity.findByIdAndUpdate(
            id,
            { status: 'closed' },
            { new: true }
        )
        if (!opp) {
            return res.status(404).json({ success: false, message: 'Opportunity not found' })
        }
        res.json({ success: true, opportunity: opp })
    } catch (error) {
        console.error('Error rejecting opportunity:', error)
        res.status(500).json({ success: false, message: 'Unable to reject opportunity.' })
    }
}

// --- Experience moderation ---
export const setExperienceStatus = async (req, res) => {
    try {
        const { id } = req.params
        const { status } = req.body
        const allowed = ['approved', 'pending', 'rejected']
        if (!allowed.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' })
        }
        const exp = await ExperienceMetadata.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        )
        if (!exp) {
            return res.status(404).json({ success: false, message: 'Experience not found' })
        }
        res.json({ success: true, experience: exp })
    } catch (error) {
        console.error('Error updating experience status:', error)
        res.status(500).json({ success: false, message: 'Unable to update status.' })
    }
}

export const updateMeeting = async (req, res) => {
    try {
        const { id } = req.params
        const updateData = req.body
        const meeting = await Meeting.findByIdAndUpdate(id, updateData, { new: true })
        res.json(meeting)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const deleteStudent = async (req, res) => {
    try {
        const { id } = req.params
        const profile = await Profile.findById(id)
        if (!profile) return res.status(404).json({ message: 'Student not found' })

        const userId = profile.userId
        await Profile.findByIdAndDelete(id)
        if (userId) {
            await User.findByIdAndDelete(userId)
            await Question.deleteMany({ userId })
        }

        res.json({ message: 'Record removed successfully' })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

// Get System Logs
export const getLogs = async (req, res) => {
    try {
        const { level, limit = 50, page = 1 } = req.query
        const skip = (parseInt(page) - 1) * parseInt(limit)

        const query = {}
        if (level && level !== 'All') query.level = level

        const [logs, total] = await Promise.all([
            Log.find(query)
                .populate('userId', 'email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Log.countDocuments(query)
        ])

        res.json({
            logs,
            pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) }
        })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}
