"use client"

import { useState, useRef } from 'react'
import { GLOBAL_COMPANIES, GLOBAL_ROLES } from '../../constants/companies'

function PlacementStatusStep({ formData, onChange }) {
  const [filteredCompanies, setFilteredCompanies] = useState([])
  const [filteredRoles, setFilteredRoles] = useState([])
  const [showCompanySuggestions, setShowCompanySuggestions] = useState(false)
  const [showRoleSuggestions, setShowRoleSuggestions] = useState(false)
  const companyRef = useRef(null)
  const roleRef = useRef(null)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    const newVal = type === 'checkbox' ? checked : value
    onChange({ [name]: newVal })

    if (name === 'company') {
      if (value && value.length > 0) {
        const q = value.toLowerCase()
        setFilteredCompanies(GLOBAL_COMPANIES.filter((c) => c.toLowerCase().includes(q)).slice(0, 8))
        setShowCompanySuggestions(true)
      } else {
        setShowCompanySuggestions(false)
      }
    }

    if (name === 'role') {
      if (value && value.length > 0) {
        const q = value.toLowerCase()
        setFilteredRoles(GLOBAL_ROLES.filter((r) => r.toLowerCase().includes(q)).slice(0, 8))
        setShowRoleSuggestions(true)
      } else {
        setShowRoleSuggestions(false)
      }
    }
  }

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold text-primary mb-6">Placement Status</h2>

      {/* Placement Status Radio */}
      <div className="space-y-3">
        <label className="flex items-center p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-primary transition hover:bg-primary hover:bg-opacity-5">
          <input
            type="radio"
            name="placementStatus"
            value="not-placed"
            checked={formData.placementStatus === 'not-placed'}
            onChange={handleChange}
            className="w-5 h-5 text-primary"
          />
          <span className="ml-3">
            <span className="font-semibold text-gray-800">Not Placed Yet</span>
            <p className="text-sm text-gray-600">Still looking for opportunities</p>
          </span>
        </label>

        <label className="flex items-center p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-primary transition hover:bg-primary hover:bg-opacity-5">
          <input
            type="radio"
            name="placementStatus"
            value="placed"
            checked={formData.placementStatus === 'placed'}
            onChange={handleChange}
            className="w-5 h-5 text-primary"
          />
          <span className="ml-3">
            <span className="font-semibold text-gray-800">Already Placed</span>
            <p className="text-sm text-gray-600">Tell us about your placement</p>
          </span>
        </label>
      </div>

      {/* Placed Details */}
      {formData.placementStatus === 'placed' && (
        <div className="p-6 bg-green-50 border border-green-200 rounded-lg space-y-4 relative">
          <h3 className="font-semibold text-green-900">Placement Details</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">Company Name *</label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                ref={companyRef}
                placeholder="e.g., Google, Microsoft"
                autoComplete="off"
                className="w-full px-4 py-2.5 rounded-lg border border-green-300 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
              />

              {formData.company && (
                <p className="mt-2 text-sm text-green-700">You entered: <span className="font-semibold">{formData.company}</span></p>
              )}

              {showCompanySuggestions && filteredCompanies.length > 0 && (
                <ul className="absolute left-0 right-0 mt-1 bg-white border rounded shadow-sm max-h-44 overflow-auto z-50">
                  {filteredCompanies.map((c) => (
                    <li
                      key={c}
                      onMouseDown={() => {
                        onChange({ company: c })
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

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">Position/Role *</label>
              <input
                type="text"
                name="role"
                value={formData.role}
                onChange={handleChange}
                ref={roleRef}
                placeholder="e.g., Software Engineer"
                autoComplete="off"
                className="w-full px-4 py-2.5 rounded-lg border border-green-300 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
              />

              {showRoleSuggestions && filteredRoles.length > 0 && (
                <ul className="absolute left-0 right-0 mt-1 bg-white border rounded shadow-sm max-h-44 overflow-auto z-50">
                  {filteredRoles.map((r) => (
                    <li
                      key={r}
                      onMouseDown={() => {
                        onChange({ role: r })
                        setShowRoleSuggestions(false)
                      }}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                    >
                      {r}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Type *</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="internshipType"
                  value="internship"
                  checked={formData.internshipType === 'internship'}
                  onChange={handleChange}
                  className="w-4 h-4 text-green-600"
                />
                <span className="ml-2 text-gray-700">Internship</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="internshipType"
                  value="full-time"
                  checked={formData.internshipType === 'full-time'}
                  onChange={handleChange}
                  className="w-4 h-4 text-green-600"
                />
                <span className="ml-2 text-gray-700">Full-time</span>
              </label>
            </div>
          </div>

          <label className="flex items-center p-3 bg-white border border-green-300 rounded-lg cursor-pointer">
            <input
              type="checkbox"
              name="willingToMentor"
              checked={formData.willingToMentor}
              onChange={handleChange}
              className="w-4 h-4 text-green-600 rounded"
            />
            <span className="ml-3 text-gray-700">
              <span className="font-medium">I'd like to mentor juniors</span>
              <p className="text-xs text-gray-600">Help students in your college to succeed</p>
            </span>
          </label>
        </div>
      )}

      {/* Not Placed Message */}
      {formData.placementStatus === 'not-placed' && (
        <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex gap-3">
            <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zm-11-1a1 1 0 11-2 0 1 1 0 012 0zM8 9a1 1 0 100-2 1 1 0 000 2zm4-1a1 1 0 11-2 0 1 1 0 012 0zm4 0a1 1 0 11-2 0 1 1 0 012 0z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">Keep Going!</h4>
              <p className="text-sm text-blue-800">
                Your placement journey is unique. Don't worry, PlaceHub is here to help you find the right opportunities
                and prepare for success.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PlacementStatusStep
