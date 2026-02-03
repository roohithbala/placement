'use client';

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authAPI } from '../services/api'
import SignupForm from '../components/SignupForm'

function SignupPage() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignup = async (formData) => {
    setLoading(true)
    setError('')

    try {
      const response = await authAPI.signup(formData)
      if (response.data.success) {
        localStorage.setItem('authToken', response.data.token)
        localStorage.setItem('userId', response.data.userId)
        localStorage.setItem('userRole', response.data.role)
        navigate('/profile-setup')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary rounded-full mix-blend-multiply filter blur-3xl" />
        <div className="absolute top-40 right-10 w-72 h-72 bg-secondary rounded-full mix-blend-multiply filter blur-3xl" />
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-accent rounded-full mix-blend-multiply filter blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        <div className="bg-white rounded-2xl shadow-2xl p-8 backdrop-blur-xl bg-opacity-95 border border-white border-opacity-20">
          <div className="text-center mb-8">
            <div className="inline-block p-3 bg-gradient-to-br from-primary to-secondary rounded-lg mb-4">
              <svg
                className="w-8 h-8 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M10.5 1.5H3.75A2.25 2.25 0 001.5 3.75v12.5A2.25 2.25 0 003.75 18.5h12.5a2.25 2.25 0 002.25-2.25V9.5M10.5 1.5v8m0-8h6m-6 8l8-8M6.5 12.5h7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-primary mb-2">Create Account</h1>
            <p className="text-gray-600">Join PlaceHub Today</p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          )}

          <SignupForm onSubmit={handleSignup} isLoading={loading} />

          <div className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-primary hover:text-secondary transition">
              Sign in here
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SignupPage
