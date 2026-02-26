import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Send, Sparkles, Briefcase, BookmarkPlus, Calendar } from 'lucide-react'
import MainLayout from '../components/MainLayout'
import { opportunitiesAPI } from '../services/api'

const DEFAULT_FILTERS = {
  categories: ['Software', 'Hardware', 'Design', 'Content', 'Business', 'Others'],
  types: [],
  locationTypes: [],
  experienceLevels: [],
}

const TYPE_FALLBACK = ['internship', 'full-time', 'contract', 'fellowship']
const EXPERIENCE_FALLBACK = ['fresher', '0-1 years', '1-3 years', '3+ years']
const LOCATION_FALLBACK = ['on-site', 'hybrid', 'remote']

const INITIAL_FORM = {
  title: '',
  companyName: '',
  category: DEFAULT_FILTERS.categories[0],
  opportunityType: 'internship',
  experienceLevel: 'fresher',
  location: '',
  locationType: 'hybrid',
  applicationUrl: '',
  deadline: '',
  skills: '',
}

const formatLabel = (value = '') => {
  if (!value) return ''
  return value.replace(/\b\w/g, (char) => char.toUpperCase())
}

function SubmitOpportunityPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState(INITIAL_FORM)
  const [formStatus, setFormStatus] = useState('idle')
  const [formError, setFormError] = useState('')
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [loadingFilters, setLoadingFilters] = useState(false)

  // suggestion/autocomplete state
  const [titleSuggestions, setTitleSuggestions] = useState([])
  const [companySuggestions, setCompanySuggestions] = useState([])
  const [filteredTitles, setFilteredTitles] = useState([])
  const [filteredCompanies, setFilteredCompanies] = useState([])
  const [showTitleSuggestions, setShowTitleSuggestions] = useState(false)
  const [showCompanySuggestions, setShowCompanySuggestions] = useState(false)

  useEffect(() => {
    const loadFilters = async () => {
      setLoadingFilters(true)
      try {
        const { data } = await opportunitiesAPI.getFilters()
        if (data.success) {
                  const merged = {
              ...DEFAULT_FILTERS,
              ...data.filters,
              categories:
                data.filters?.categories?.length > 0
                  ? data.filters.categories
                  : DEFAULT_FILTERS.categories,
            }
            setFilters(merged)
            // suggestions arrays
            setTitleSuggestions(merged.titles || [])
            setCompanySuggestions(merged.companies || [])
        }
      } catch (error) {
        console.error('Failed to load opportunity filters', error)
      } finally {
        setLoadingFilters(false)
      }
    }

    loadFilters()
  }, [])

  const formCategoryOptions = useMemo(() => {
    return Array.from(new Set([...DEFAULT_FILTERS.categories, ...(filters.categories || [])]))
  }, [filters.categories])
  const mergeUnique = (base, extra) => Array.from(new Set([...(base || []), ...((extra && extra.length) ? extra : [])]))
  const typeOptions = useMemo(() => mergeUnique(TYPE_FALLBACK, filters.types), [filters.types])
  const locationOptions = useMemo(
    () => mergeUnique(LOCATION_FALLBACK, filters.locationTypes),
    [filters.locationTypes]
  )
  const experienceOptions = useMemo(
    () => mergeUnique(EXPERIENCE_FALLBACK, filters.experienceLevels),
    [filters.experienceLevels]
  )

  const handleFormChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // suggestion logic
    if (name === 'title') {
      if (value && value.length > 0) {
        const q = value.toLowerCase()
        setFilteredTitles(
          titleSuggestions.filter((t) => t.toLowerCase().includes(q)).slice(0, 6)
        )
        setShowTitleSuggestions(true)
      } else {
        setShowTitleSuggestions(false)
      }
    }
    if (name === 'companyName') {
      if (value && value.length > 0) {
        const q = value.toLowerCase()
        setFilteredCompanies(
          companySuggestions.filter((c) => c.toLowerCase().includes(q)).slice(0, 6)
        )
        setShowCompanySuggestions(true)
      } else {
        setShowCompanySuggestions(false)
      }
    }
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    setFormStatus('submitting')
    setFormError('')
    try {
      const payload = {
        ...formData,
        skills: formData.skills
          ? formData.skills.split(',').map((skill) => skill.trim()).filter(Boolean)
          : undefined,
        deadline: formData.deadline ? new Date(formData.deadline) : undefined,
      }

      await opportunitiesAPI.create(payload)
      setFormStatus('success')
      setTimeout(() => {
        navigate('/opportunities', { state: { opportunityPosted: true } })
      }, 1200)
    } catch (err) {
      console.error('Failed to submit opportunity', err)
      setFormError(err.response?.data?.message || 'Unable to submit opportunity. Please try again.')
      setFormStatus('error')
    }
  }

  return (
    <MainLayout>
      <div className="bg-background min-h-screen">
        <section className="py-12 border-b border-slate-100 bg-[#dfeff4] text-[#071952]">
          <div className="max-w-3xl mx-auto px-6 text-center space-y-3">
            <p className="uppercase tracking-[0.4em] text-xs text-[#071952]/70">Submit Opportunity</p>
            <h1 className="text-4xl font-black">Add a new role to the PlaceHub board</h1>
            <p className="text-[#071952]/80 text-base">
              Fill in the details below and we will publish it after a quick moderation pass.
            </p>
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <form onSubmit={handleFormSubmit} className="bg-white rounded-3xl border border-[#d8e5ec] p-8 shadow-2xl space-y-5">
              <div className="flex items-center gap-3 font-semibold text-lg text-[#071952]">
                <Send size={20} className="text-[#088395]" />
                <span>Opportunity details</span>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-slate-600">Role title *</label>
                  <div className="relative">
                  <input
                    name="title"
                    value={formData.title}
                    onChange={handleFormChange}
                    required
                    className="w-full mt-1 rounded-2xl border border-[#d6e6ed] focus:ring-2 focus:ring-[#088395] px-4 py-3"
                    placeholder="Software Engineer"
                    autoComplete="off"
                  />
                  {showTitleSuggestions && filteredTitles.length > 0 && (
                    <ul className="absolute left-0 right-0 mt-1 bg-white border rounded shadow-sm max-h-40 overflow-auto z-50">
                      {filteredTitles.map((t) => (
                        <li
                          key={t}
                          onMouseDown={() => {
                            setFormData((prev) => ({ ...prev, title: t }))
                            setShowTitleSuggestions(false)
                          }}
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                        >
                          {t}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-600">Company *</label>
                  <div className="relative">
                  <input
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleFormChange}
                    required
                    className="w-full mt-1 rounded-2xl border border-[#d6e6ed] focus:ring-2 focus:ring-[#088395] px-4 py-3"
                    placeholder="Company name"
                    autoComplete="off"
                  />
                  {showCompanySuggestions && filteredCompanies.length > 0 && (
                    <ul className="absolute left-0 right-0 mt-1 bg-white border rounded shadow-sm max-h-40 overflow-auto z-50">
                      {filteredCompanies.map((c) => (
                        <li
                          key={c}
                          onMouseDown={() => {
                            setFormData((prev) => ({ ...prev, companyName: c }))
                            setShowCompanySuggestions(false)
                          }}
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                        >
                          {c}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-slate-600">Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleFormChange}
                    className="w-full mt-1 rounded-2xl border border-[#d6e6ed] focus:ring-2 focus:ring-[#088395] px-4 py-3"
                  >
                    {formCategoryOptions.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-semibold text-slate-600">Type</label>
                    <select
                      name="opportunityType"
                      value={formData.opportunityType}
                      onChange={handleFormChange}
                      className="w-full mt-1 rounded-2xl border border-[#d6e6ed] focus:ring-2 focus:ring-[#088395] px-4 py-3"
                    >
                      {typeOptions.map((type) => (
                        <option key={type} value={type}>
                          {formatLabel(type)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-600">Experience</label>
                    <select
                      name="experienceLevel"
                      value={formData.experienceLevel}
                      onChange={handleFormChange}
                      className="w-full mt-1 rounded-2xl border border-slate-200 px-4 py-3"
                    >
                      {experienceOptions.map((level) => (
                        <option key={level} value={level}>
                          {formatLabel(level)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-slate-600">Location</label>
                  <input
                    name="location"
                    value={formData.location}
                    onChange={handleFormChange}
                    className="w-full mt-1 rounded-2xl border border-slate-200 px-4 py-3"
                    placeholder="Bengaluru / Remote"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-600">Work mode</label>
                  <select
                    name="locationType"
                    value={formData.locationType}
                    onChange={handleFormChange}
                    className="w-full mt-1 rounded-2xl border border-slate-200 px-4 py-3"
                  >
                    {locationOptions.map((mode) => (
                      <option key={mode} value={mode}>
                        {formatLabel(mode)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-600">Deadline</label>
                <div className="relative">
                  <input
                    type="date"
                    name="deadline"
                    value={formData.deadline}
                    onChange={handleFormChange}
                    className="w-full mt-1 rounded-2xl border border-slate-200 px-4 py-3 pr-10 appearance-none"
                    style={{ WebkitAppearance: 'none', MozAppearance: 'textfield' }}
                  />
                  <Calendar className="w-5 h-5 text-slate-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-slate-600">Application link</label>
                  <input
                    name="applicationUrl"
                    value={formData.applicationUrl}
                    onChange={handleFormChange}
                    className="w-full mt-1 rounded-2xl border border-slate-200 px-4 py-3"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-600">Skills expected (comma separated)</label>
                <input
                  name="skills"
                  value={formData.skills}
                  onChange={handleFormChange}
                  className="w-full mt-1 rounded-2xl border border-slate-200 px-4 py-3"
                  placeholder="React, SQL, communication"
                />
              </div>

              <button
                type="submit"
                disabled={formStatus === 'submitting'}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[#071952] text-white font-semibold py-3 shadow-lg hover:bg-[#09335c] disabled:opacity-50"
              >
                {formStatus === 'submitting' ? 'Posting…' : 'Share with PlaceHub'}
              </button>

              {formError && <p className="text-sm text-red-600 text-center">{formError}</p>}
              {formStatus === 'success' && (
                <p className="text-sm text-secondary text-center font-semibold">Opportunity submitted! Redirecting to the board…</p>
              )}
          </form>

          {loadingFilters && <p className="text-center text-sm text-slate-500 mt-4">Refreshing filter options…</p>}
        </section>
      </div>
    </MainLayout>
  )
}

export default SubmitOpportunityPage