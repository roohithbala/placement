'use client';

import { useState, useEffect } from 'react'
import PersonalDetailsStep from './steps/PersonalDetailsStep'
import AcademicDetailsStep from './steps/AcademicDetailsStep'
import SkillsLinksStep from './steps/SkillsLinksStep'
import PlacementStatusStep from './steps/PlacementStatusStep'
import { authAPI } from '../services/api' // to fetch current user info

const STEPS = [
  { id: 1, title: 'Personal Details', component: PersonalDetailsStep },
  { id: 2, title: 'Academic Details', component: AcademicDetailsStep },
  { id: 3, title: 'Skills & Links', component: SkillsLinksStep },
  { id: 4, title: 'Placement Status', component: PlacementStatusStep },
]

function MultiStepForm({ onSubmit, isLoading }) {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState(() => ({
    fullName: '',
    rollNumber: '',
    collegeEmail: localStorage.getItem('userEmail') || '',
    whatsappNumber: '',
    year: '',
    branch: '',
    batch: new Date().getFullYear() + 4,
    skills: [],
    linkedinUrl: '',
    githubUrl: '',
    profilePicture: '',
    placementStatus: 'not-placed',
    company: '',
    role: '',
    internshipType: 'full-time',
    willingToMentor: false,
  }))

  const handleStepChange = (data) => {
    setFormData((prev) => {
      const updated = { ...prev, ...data }
      // keep the localStorage copy of the email in sync
      if (data.collegeEmail !== undefined) {
        localStorage.setItem('userEmail', data.collegeEmail)
      }
      return updated
    })
  }

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = () => {
    onSubmit(formData)
  }

  const CurrentStepComponent = STEPS[currentStep - 1].component
  const progress = ((currentStep - 1) / STEPS.length) * 100

  // ensure email spot is filled; if not in localStorage, fetch from server
  useEffect(() => {
    const stored = localStorage.getItem('userEmail')
    if (stored && !formData.collegeEmail) {
      setFormData((prev) => ({ ...prev, collegeEmail: stored }))
    } else if (!stored) {
      authAPI.getMe()
        .then((res) => {
          if (res.data.success && res.data.user?.email) {
            const email = res.data.user.email
            localStorage.setItem('userEmail', email)
            setFormData((prev) => ({ ...prev, collegeEmail: email }))
          }
        })
        .catch(() => {
          // ignore - maybe not authenticated or network error
        })
    }
  }, [formData.collegeEmail])

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between mb-3">
          {STEPS.map((step) => (
            <div
              key={step.id}
              className={`flex flex-col items-center flex-1 ${step.id !== STEPS.length ? 'relative' : ''}`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition ${
                  step.id <= currentStep
                    ? 'bg-gradient-to-r from-primary to-secondary text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {step.id}
              </div>
              <span
                className={`text-xs mt-2 text-center font-medium ${
                  step.id <= currentStep ? 'text-primary' : 'text-gray-500'
                }`}
              >
                {step.title}
              </span>
              {step.id !== STEPS.length && (
                <div
                  className={`absolute top-5 left-1/2 w-1/2 h-0.5 transition ${
                    step.id < currentStep
                      ? 'bg-gradient-to-r from-primary to-secondary'
                      : 'bg-gray-200'
                  }`}
                  style={{ transform: 'translateX(50%)' }}
                />
              )}
            </div>
          ))}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1">
          <div
            className="bg-gradient-to-r from-primary to-secondary h-1 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Current Step */}
      <div className="my-8">
        <CurrentStepComponent formData={formData} onChange={handleStepChange} />
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between gap-4">
        <button
          onClick={handlePrevious}
          disabled={currentStep === 1 || isLoading}
          className="px-6 py-2.5 rounded-lg border-2 border-primary text-primary font-semibold hover:bg-primary hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>

        {currentStep === STEPS.length ? (
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-8 py-2.5 rounded-lg bg-gradient-to-r from-primary to-secondary text-white font-semibold hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Profile'
            )}
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="px-8 py-2.5 rounded-lg bg-gradient-to-r from-primary to-secondary text-white font-semibold hover:shadow-lg transform hover:scale-105 transition-all"
          >
            Next
          </button>
        )}
      </div>
    </div>
  )
}

export default MultiStepForm
