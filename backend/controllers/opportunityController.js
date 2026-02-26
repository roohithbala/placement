import Opportunity from '../models/Opportunity.js'
import Profile from '../models/Profile.js'
import User from '../models/User.js'

const SORT_MAP = {
  recent: { createdAt: -1 },
  closingSoon: { deadline: 1 },
}

const deriveDisplayName = ({ profileName, email }) => {
  if (profileName?.trim()) return profileName.trim()
  if (email) {
    const handle = email.split('@')[0]
    if (handle) {
      return handle
        .split(/[._-]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')
    }
  }
  return 'PlaceHub Member'
}

const buildFilters = (query) => {
  const filter = { status: 'active' }

  if (query.category && query.category !== 'All') {
    filter.category = query.category
  }

  if (query.type && query.type !== 'all') {
    filter.opportunityType = query.type
  }

  if (query.locationType && query.locationType !== 'all') {
    filter.locationType = query.locationType
  }

  if (query.experience && query.experience !== 'all') {
    filter.experienceLevel = query.experience
  }

  if (query.company) {
    filter.companyName = query.company
  }

  if (query.status) {
    filter.status = query.status
  }

  if (query.search) {
    filter.$text = { $search: query.search.trim() }
  }

  return filter
}

export const listOpportunities = async (req, res) => {
  try {
    const page = Number(req.query.page) > 0 ? Number(req.query.page) : 1
    const limit = Number(req.query.limit) > 0 ? Math.min(Number(req.query.limit), 24) : 9
    const sortBy = SORT_MAP[req.query.sortBy] ? req.query.sortBy : 'recent'

    // public listing only shows approved & active opportunities
    const filter = buildFilters(req.query)
    if (!req.user || req.user.role !== 'admin') {
      filter.approved = true
    }

    const sort = SORT_MAP[sortBy]

    const [items, total, stats] = await Promise.all([
      Opportunity.find(filter)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Opportunity.countDocuments(filter),
      Opportunity.aggregate([
        { $match: { status: 'active' } },
        {
          $facet: {
            categoryCounts: [
              { $group: { _id: '$category', count: { $sum: 1 } } },
              { $sort: { count: -1 } },
            ],
            typeCounts: [
              { $group: { _id: '$opportunityType', count: { $sum: 1 } } },
              { $sort: { count: -1 } },
            ],
            locations: [
              { $group: { _id: '$locationType', count: { $sum: 1 } } },
            ],
          },
        },
      ]),
    ])

    const posterIds = items.map((item) => item.postedBy).filter(Boolean)
    const profiles = posterIds.length
      ? await Profile.find({ userId: { $in: posterIds } }, 'userId fullName').lean()
      : []
    const profileMap = profiles.reduce((acc, profile) => {
      acc[profile.userId.toString()] = profile.fullName
      return acc
    }, {})
    const missingUserIds = posterIds.filter((id) => !profileMap[id.toString()])
    const userDocs = missingUserIds.length
      ? await User.find({ _id: { $in: missingUserIds } }, 'email').lean()
      : []
    const userMap = userDocs.reduce((acc, user) => {
      acc[user._id.toString()] = user.email
      return acc
    }, {})

    const opportunitiesWithNames = items.map((item) => {
      const key = item.postedBy ? item.postedBy.toString() : ''
      return {
        ...item,
        postedByName: item.postedByName || deriveDisplayName({ profileName: profileMap[key], email: userMap[key] }),
      }
    })

    return res.json({
      success: true,
      opportunities: opportunitiesWithNames,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1,
      },
      stats: stats[0] || { categoryCounts: [], typeCounts: [], locations: [] },
    })
  } catch (error) {
    console.error('Failed to list opportunities', error)
    return res.status(500).json({ success: false, message: 'Unable to load opportunities right now.' })
  }
}

export const getOpportunityFilters = async (_req, res) => {
  try {
    const [categories, companies, types, locationTypes, experienceLevels, titles] = await Promise.all([
      Opportunity.distinct('category', { status: 'active' }),
      Opportunity.distinct('companyName', { status: 'active' }),
      Opportunity.distinct('opportunityType', { status: { $exists: true } }),
      Opportunity.distinct('locationType', { status: { $exists: true } }),
      Opportunity.distinct('experienceLevel', { status: { $exists: true } }),
      Opportunity.distinct('title', { status: 'active' }),
    ])

    return res.json({
      success: true,
      filters: {
        categories,
        companies,
        types,
        locationTypes,
        experienceLevels,
        titles,
      },
    })
  } catch (error) {
    console.error('Failed to load opportunity filters', error)
    return res.status(500).json({ success: false, message: 'Unable to load filters.' })
  }
}

export const getOpportunityById = async (req, res) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id).lean()
    if (!opportunity) {
      return res.status(404).json({ success: false, message: 'Opportunity not found' })
    }

    if (opportunity.postedBy) {
      const key = opportunity.postedBy.toString()
      if (!opportunity.postedByName) {
        const [profile, user] = await Promise.all([
          Profile.findOne({ userId: opportunity.postedBy }, 'fullName').lean(),
          User.findById(opportunity.postedBy, 'email').lean(),
        ])
        opportunity.postedByName = deriveDisplayName({ profileName: profile?.fullName, email: user?.email })
      }
    }

    return res.json({ success: true, opportunity })
  } catch (error) {
    console.error('Failed to load opportunity', error)
    return res.status(500).json({ success: false, message: 'Unable to load opportunity.' })
  }
}

export const createOpportunity = async (req, res) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }

    const [profile, user] = await Promise.all([
      Profile.findOne({ userId }).lean(),
      User.findById(userId, 'email role').lean(),
    ])
    const payload = {
      ...req.body,
      postedBy: userId,
      postedByName: deriveDisplayName({ profileName: profile?.fullName, email: user?.email }),
      // admin submissions auto-approved
      approved: user.role === 'admin',
    }

    const opportunity = await Opportunity.create(payload)
    return res.status(201).json({ success: true, opportunity })
  } catch (error) {
    console.error('Failed to create opportunity', error)
    return res.status(400).json({
      success: false,
      message: error.message || 'Unable to create opportunity.',
    })
  }
}