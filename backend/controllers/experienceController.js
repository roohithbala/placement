import ExperienceMetadata from '../models/ExperienceMetadata.js'
import ExperienceRound from '../models/ExperienceRound.js'
import ExperienceMaterial from '../models/ExperienceMaterial.js'
import Profile from '../models/Profile.js'
import Question from '../models/Question.js'
import mongoose from 'mongoose'

// --- Metadata Handling ---
export const saveExperienceMetadata = async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId
    const { _id, ...data } = req.body

    let experience

    if (_id) {
      // Update existing
      experience = await ExperienceMetadata.findOneAndUpdate(
        { _id, userId }, // Ensure user owns it
        { $set: data },
        { new: true, runValidators: true }
      )
    } else {
      // Duplicate Logic: Check if user already has an experience for this company/month
      // We need data.companyName and data.interviewMonth to be present for this check
      if (data.companyName && data.interviewMonth) {
        const existing = await ExperienceMetadata.findOne({
          userId,
          companyName: data.companyName,
          interviewMonth: data.interviewMonth,
          // Optional: check interviewYear too if needed, but user said "id, month, company name"
        });

        if (existing) {
          return res.status(400).json({
            success: false,
            message: `You already have an experience entry for ${data.companyName} in month ${data.interviewMonth}`
          });
        }
      }

      // Create new (auto-save generic initial draft if needed, or fully filled form)
      experience = new ExperienceMetadata({
        ...data,
        userId,
        status: 'draft',
      })
      await experience.save()
    }

    if (!experience) {
      return res.status(404).json({ success: false, message: 'Experience not found or unauthorized' })
    }

    res.status(200).json({ success: true, experienceId: experience._id, experience })
  } catch (error) {
    console.error('Error saving metadata:', error)
    res.status(500).json({ success: false, message: 'Failed to save metadata', error: error.message })
  }
}

// --- Options Helper ---
export const getMetadataOptions = async (req, res) => {
  try {
    const companies = await ExperienceMetadata.distinct('companyName');
    const roles = await ExperienceMetadata.distinct('roleAppliedFor');

    // Sort them for better UX
    companies.sort();
    roles.sort();

    res.status(200).json({ success: true, companies, roles });
  } catch (error) {
    console.error('Error fetching options:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch options' });
  }
}

// --- Rounds Handling ---
export const saveExperienceRounds = async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId
    const { experienceId } = req.params
    const { rounds } = req.body

    if (!experienceId) {
      return res.status(400).json({ success: false, message: 'Experience ID is required' })
    }

    // Verify experience ownership first
    const metadata = await ExperienceMetadata.findOne({ _id: experienceId, userId })
    if (!metadata) {
      return res.status(404).json({ success: false, message: 'Experience not found' })
    }

    const experienceRounds = await ExperienceRound.findOneAndUpdate(
      { experienceId },
      {
        $set: {
          experienceId,
          userId,
          rounds: Array.isArray(rounds) ? rounds : []
        }
      },
      { new: true, upsert: true }
    )

    res.status(200).json({ success: true, rounds: experienceRounds })
  } catch (error) {
    console.error('Error saving rounds:', error)
    res.status(500).json({ success: false, message: 'Failed to save rounds', error: error.message })
  }
}

// --- Materials Handling ---
export const saveExperienceMaterials = async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId
    const { experienceId } = req.params
    const { materials } = req.body

    if (!experienceId) {
      return res.status(400).json({ success: false, message: 'Experience ID is required' })
    }

    // Verify experience ownership
    const metadata = await ExperienceMetadata.findOne({ _id: experienceId, userId })
    if (!metadata) {
      return res.status(404).json({ success: false, message: 'Experience not found' })
    }

    const experienceMaterials = await ExperienceMaterial.findOneAndUpdate(
      { experienceId },
      {
        $set: {
          experienceId,
          userId,
          materials: Array.isArray(materials) ? materials : []
        }
      },
      { new: true, upsert: true }
    )

    res.status(200).json({ success: true, materials: experienceMaterials })
  } catch (error) {
    console.error('Error saving materials:', error)
    res.status(500).json({ success: false, message: 'Failed to save materials', error: error.message })
  }
}

// --- Status Update (Submitting) ---
export const submitExperience = async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId
    const { experienceId } = req.params

    const experience = await ExperienceMetadata.findOneAndUpdate(
      { _id: experienceId, userId },
      { $set: { status: 'pending' } },
      { new: true }
    )

    if (!experience) {
      return res.status(404).json({ success: false, message: 'Experience not found' })
    }

    res.status(200).json({ success: true, message: 'Experience submitted successfully', experience })
  } catch (error) {
    console.error('Error submitting experience:', error)
    res.status(500).json({ success: false, message: 'Failed to submit experience', error: error.message })
  }
}

// --- Getters ---

export const getExperienceById = async (req, res) => {
  try {
    const { id } = req.params

    // Fetch generic metadata
    const metadata = await ExperienceMetadata.findById(id).populate('userId', 'email')
    if (!metadata) {
      return res.status(404).json({ success: false, message: 'Experience not found' })
    }

    // Fetch user profile for name
    const profile = await Profile.findOne({ userId: metadata.userId._id })
    const userObj = metadata.userId.toObject() // contains _id and email

    if (profile && profile.fullName) {
      userObj.fullName = profile.fullName
      userObj.batch = profile.batch
    } else if (userObj.email) {
      // Fallback to part of email if name is missing
      const emailName = userObj.email.split('@')[0];
      userObj.fullName = emailName;
    } else {
      userObj.fullName = 'Anonymous User';
    }

    // Fetch associated distinct collections
    const [roundsDoc, materialsDoc] = await Promise.all([
      ExperienceRound.findOne({ experienceId: id }),
      ExperienceMaterial.findOne({ experienceId: id })
    ])

    // Combine for frontend consumption
    const fullExperience = {
      ...metadata.toObject(),
      userId: userObj,
      rounds: roundsDoc ? roundsDoc.rounds : [],
      materials: materialsDoc ? materialsDoc.materials : []
    }

    // Increment view count if approved
    if (metadata.status === 'approved') {
      metadata.views += 1
      await metadata.save()
    }

    res.status(200).json({ success: true, experience: fullExperience })
  } catch (error) {
    console.error('Error fetching experience:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch experience', error: error.message })
  }
}

export const getUserExperiences = async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId

    // Only fetch metadata for list views
    const experiences = await ExperienceMetadata.find({ userId })
      .sort({ createdAt: -1 })

    res.status(200).json({ success: true, experiences })
  } catch (error) {
    console.error('Error fetching user experiences:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch experiences', error: error.message })
  }
}

// Helper for "draft" loading - now we might just load the latest draft or specific ID
// If the frontend needs to "resume" a draft, it can call this. 
// However, with the new flow, we might just list "drafts" in the user experiences list.
// For backwards compatibility or convenience, we can keep a "getLatestDraft"
export const getLatestDraft = async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId

    const draftMetadata = await ExperienceMetadata.findOne({ userId, status: 'draft' }).sort({ updatedAt: -1 })

    if (!draftMetadata) {
      return res.status(200).json({ success: true, draft: null });
    }

    const [roundsDoc, materialsDoc] = await Promise.all([
      ExperienceRound.findOne({ experienceId: draftMetadata._id }),
      ExperienceMaterial.findOne({ experienceId: draftMetadata._id })
    ])

    const fullDraft = {
      ...draftMetadata.toObject(),
      rounds: roundsDoc ? roundsDoc.rounds : [],
      materials: materialsDoc ? materialsDoc.materials : []
    }

    res.status(200).json({ success: true, draft: fullDraft })
  } catch (error) {
    console.error('Error fetching draft:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch draft', error: error.message })
  }
}

// Public Listings
export const browseExperiences = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 9
    const { batch, company, outcome, type, difficulty, sort, search } = req.query

    // 1. Build Match Stage
    const matchStage = {}

    if (search) {
      const searchRegex = new RegExp(search, 'i')
      matchStage.$or = [
        { companyName: searchRegex },
        { roleAppliedFor: searchRegex }
      ]
    }

    if (batch) {
      const batches = batch.split(',')
      if (batches.length > 0) matchStage.batch = { $in: batches }
    }
    if (company) {
      const companies = company.split(',')
      if (companies.length > 0) matchStage.companyName = { $in: companies }
    }
    if (outcome) {
      const outcomes = outcome.split(',')
      if (outcomes.length > 0) matchStage.outcome = { $in: outcomes }
    }
    if (type) {
      matchStage.placementSeason = type
    }
    if (difficulty) {
      // Assuming '4' means >= 4. Simple string comparison works for single digits 1-5
      matchStage.difficultyRating = { $gte: difficulty }
    }

    // 2. Build Sort Stage
    let sortStage = { createdAt: -1 } // Default: Newest
    if (sort === 'oldest') sortStage = { createdAt: 1 }
    if (sort === 'rating') sortStage = { overallExperienceRating: -1 }
    if (sort === 'views') sortStage = { views: -1 }

    // 3. Aggregation Pipeline
    const pipeline = [
      { $match: matchStage },
      // Lookup Rounds count
      {
        $lookup: {
          from: 'experiencerounds',
          localField: '_id',
          foreignField: 'experienceId',
          as: 'roundsDoc'
        }
      },
      // Lookup Materials count
      {
        $lookup: {
          from: 'experiencematerials',
          localField: '_id',
          foreignField: 'experienceId',
          as: 'materialsDoc'
        }
      },
      // Calculate Counts
      {
        $addFields: {
          roundsCount: {
            $size: {
              $ifNull: [{ $arrayElemAt: ['$roundsDoc.rounds', 0] }, []]
            }
          },
          materialsCount: {
            $size: {
              $ifNull: [{ $arrayElemAt: ['$materialsDoc.materials', 0] }, []]
            }
          }
        }
      },
      // Remove heavy joined docs (we only needed counts)
      {
        $project: {
          roundsDoc: 0,
          materialsDoc: 0
        }
      },
      // Sort
      { $sort: sortStage },
      // Pagination Facet
      {
        $facet: {
          metadata: [{ $count: 'total' }],
          data: [{ $skip: (page - 1) * limit }, { $limit: limit }]
        }
      }
    ]

    const result = await ExperienceMetadata.aggregate(pipeline)

    const experiences = result[0].data
    const total = result[0].metadata[0] ? result[0].metadata[0].total : 0

    res.status(200).json({
      success: true,
      experiences,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error browsing experiences:', error)
    res.status(500).json({ success: false, message: 'Failed to browse experiences', error: error.message })
  }
}

export const getRecentExperiences = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 6
    const skip = (page - 1) * limit

    const experiences = await ExperienceMetadata.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    const total = await ExperienceMetadata.countDocuments({})

    res.json({
      success: true,
      experiences,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching experiences', error: error.message })
  }
}

export const getExperiencesByCompany = async (req, res) => {
  try {
    const { company } = req.params;
    const experiences = await ExperienceMetadata.find({
      companyName: company,
      status: 'approved'
    }).sort({ createdAt: -1 });

    res.json({ success: true, experiences });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export const getExperiencesByBatch = async (req, res) => {
  try {
    const { batch } = req.params;
    const experiences = await ExperienceMetadata.find({
      batch: batch,
      status: 'approved'
    }).sort({ createdAt: -1 });

    res.json({ success: true, experiences });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export const getPlatformStats = async (req, res) => {
  try {
    const [totalExperiences, totalCompanies, totalQuestions, totalMentors] = await Promise.all([
      ExperienceMetadata.countDocuments().catch(() => 0),
      ExperienceMetadata.distinct('companyName').then(list => list ? list.length : 0).catch(() => 0),
      Question.countDocuments().catch(() => 0),
      Profile.countDocuments({ willingToMentor: true }).catch(() => 0)
    ]);

    res.json({
      success: true,
      stats: {
        totalExperiences: totalExperiences || 0,
        totalCompanies: totalCompanies || 0,
        totalQuestions: totalQuestions || 0,
        totalMentors: totalMentors || 0,
        totalMaterials: (totalExperiences || 0) * 3
      }
    });
  } catch (err) {
    console.error('Error in getPlatformStats:', err);
    res.status(500).json({ success: false, message: 'Error fetching platform stats', error: err.message });
  }
}

// Delete
export const deleteExperience = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const experience = await ExperienceMetadata.findOne({ _id: id, userId });
    if (!experience) return res.status(404).json({ success: false, message: "Experience not found" });

    await Promise.all([
      ExperienceMetadata.deleteOne({ _id: id }),
      ExperienceRound.deleteOne({ experienceId: id }),
      ExperienceMaterial.deleteOne({ experienceId: id })
    ]);

    res.json({ success: true, message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}
