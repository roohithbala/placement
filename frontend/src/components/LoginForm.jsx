'use client';

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BACKEND_BASE_URL } from '../services/api'

const API_BASE_URL = `${BACKEND_BASE_URL}/api`

function LoginForm({ onSubmit, isLoading }) {
  // Load saved credentials from localStorage on initial render
  const [formData, setFormData] = useState(() => {
    const savedCredentials = localStorage.getItem('rememberedCredentials');
    if (savedCredentials) {
      const { email, password } = JSON.parse(savedCredentials);
      return {
        email: email || '',
        password: password || '',
        rememberMe: true,
      };
    }
    return {
      email: '',
      password: '',
      rememberMe: false,
    };
  })
  const [showPassword, setShowPassword] = useState(false)

  // Save or remove credentials when rememberMe changes or form submits
  useEffect(() => {
    if (formData.rememberMe && formData.email && formData.password) {
      localStorage.setItem('rememberedCredentials', JSON.stringify({
        email: formData.email,
        password: formData.password,
      }));
    } else if (!formData.rememberMe) {
      localStorage.removeItem('rememberedCredentials');
    }
  }, [formData.rememberMe, formData.email, formData.password]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // Save credentials if rememberMe is checked
    if (formData.rememberMe) {
      localStorage.setItem('rememberedCredentials', JSON.stringify({
        email: formData.email,
        password: formData.password,
      }));
    } else {
      localStorage.removeItem('rememberedCredentials');
    }
    onSubmit({
      email: formData.email,
      password: formData.password,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
          Email Address
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="your.email@college.edu"
          required
          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-gray-50 transition"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
          Password
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
            required
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-gray-50 transition"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-primary transition"
          >
            {showPassword ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path
                  fillRule="evenodd"
                  d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-14-14zM10 4.5c-3.6 0-6.8 2.3-8 5.5 1.2 3.2 4.4 5.5 8 5.5 1.1 0 2.2-.2 3.2-.6l-1.8-1.8c-.5.1-1 .2-1.4.2-2.2 0-4-1.8-4-4s1.8-4 4-4c.5 0 .9.1 1.4.2l1.8-1.8c-1-.4-2.1-.6-3.2-.6z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="rememberMe"
            name="rememberMe"
            checked={formData.rememberMe}
            onChange={handleChange}
            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
          />
          <label htmlFor="rememberMe" className="ml-2 text-sm text-gray-600 cursor-pointer">
            Remember me
          </label>
        </div>
        <Link
          to="/forgot-password"
          className="text-sm font-medium text-primary hover:text-secondary transition"
        >
          Forgot password?
        </Link>
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2.5 px-4 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-lg hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Signing in...
          </>
        ) : (
          'Sign In'
        )}
      </button>
    </form>
  )
}

export default LoginForm