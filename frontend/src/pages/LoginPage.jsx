'use client';

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authAPI } from '../services/api'
import LoginForm from '../components/LoginForm'

function LoginPage() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (formData) => {
    setLoading(true)
    setError('')

    try {
      const response = await authAPI.login(formData)
      if (response.data.success) {
        localStorage.setItem('authToken', response.data.token)
        localStorage.setItem('userId', response.data.userId)
        localStorage.setItem('userRole', response.data.role)

        if (response.data.role === 'admin') {
          navigate('/admin')
        } else if (response.data.profileCompleted) {
          navigate('/home')
        } else {
          navigate('/profile-setup')
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden font-sans">

      {/* --- Animated Background Decorative Elements --- */}
      <div className="absolute inset-0 z-0">
        {/* Large soft glow top left */}
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-secondary/20 rounded-full blur-[120px] animate-pulse" />
        {/* Subtle accent glow bottom right */}
        <div className="absolute -bottom-[10%] -right-[10%] w-[30%] h-[30%] bg-accent/30 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-lg px-4">
        {/* --- Main Card --- */}
        <div className="bg-white/80 backdrop-blur-2xl rounded-3xl shadow-[0_20px_50px_rgba(7,25,82,0.15)] border border-white/50 p-8 md:p-10 transition-all duration-300">

          {/* Header Section */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-primary via-secondary to-accent rounded-2xl shadow-lg mb-5 transform transition-transform hover:scale-110 duration-300">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>

            <h1 className="text-4xl font-extrabold text-primary tracking-tight mb-2">
              Place<span className="text-secondary">Hub</span>
            </h1>
            <p className="text-gray-500 font-medium">Accelerate your career journey</p>
          </div>

          {/* Error Message Section */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg animate-shake">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Login Form Wrapper */}
          <div className="space-y-4">
            <LoginForm onSubmit={handleLogin} isLoading={loading} />
          </div>

          {/* Footer Links */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="text-center text-sm">
              <span className="text-gray-500">Don't have an account?</span>{' '}
              <Link to="/signup" className="font-bold text-secondary hover:text-primary transition-colors duration-200">
                Sign up for free
              </Link>
            </div>
          </div>
        </div>

        {/* Minimal Footer Info */}

      </div>
    </div>
  )
}

export default LoginPage