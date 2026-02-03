'use client';

import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Menu, X, LogOut, User, Settings, FileText, Briefcase } from 'lucide-react'
import { profileAPI } from '../services/api'

function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const [userInitial, setUserInitial] = useState('')
  const [userName, setUserName] = useState('')
  const [userPicture, setUserPicture] = useState('')
  const [workStatus, setWorkStatus] = useState(null)
  const dropdownRef = useRef(null)
  const userRole = localStorage.getItem('userRole')

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('authToken')
      const userEmail = localStorage.getItem('userEmail')

      // Set initial from email as placeholder
      if (userEmail) {
        setUserInitial(userEmail.charAt(0).toUpperCase())
      }

      // If we have a token, fetch from API
      if (token) {
        try {
          const response = await profileAPI.get()

          if (response.data.success) {
            const profile = response.data.profile

            // Update profile picture
            if (profile.profilePicture) {
              setUserPicture(profile.profilePicture)
            }

            // Update user name and initial
            if (profile.fullName) {
              setUserName(profile.fullName)
              setUserInitial(profile.fullName.charAt(0).toUpperCase())
            }

            // Update work status
            if (profile.role && profile.company) {
              setWorkStatus({ role: profile.role, company: profile.company })
            }

            // Update localStorage for caching
            localStorage.setItem('user', JSON.stringify({
              fullName: profile.fullName,
              profilePicture: profile.profilePicture,
              role: profile.role,
              company: profile.company
            }))
          }
        } catch (err) {
          console.log('Navbar profile fetch error:', err)

          // Fallback to localStorage if API fails
          const userDataStr = localStorage.getItem('user')
          if (userDataStr) {
            try {
              const userData = JSON.parse(userDataStr)
              if (userData.profilePicture) setUserPicture(userData.profilePicture)
              if (userData.fullName) {
                setUserName(userData.fullName)
                setUserInitial(userData.fullName.charAt(0).toUpperCase())
              }
              if (userData.role && userData.company) {
                setWorkStatus({ role: userData.role, company: userData.company })
              }
            } catch (parseErr) {
              console.error('Error parsing cached user data:', parseErr)
            }
          }
        }
      }
    }

    fetchUserData()
  }, [location.pathname]) // Re-fetch on navigation to catch updates

  const navLinks = [
    { label: 'Home', path: '/home' },
    // { label: 'Materials', path: '/materials' },
    { label: 'Experiences', path: '/experiences' },
    { label: 'Analytics', path: '/analytics' },
    { label: 'Opportunities', path: '/opportunities' },
    { label: 'Mentorship', path: '/mentorship' },
    { label: 'About', path: '/about' },
    { label: 'Contact', path: '/contact' },


  ]

  const isActive = (path) => location.pathname === path

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('userId')
    localStorage.removeItem('userEmail')
    localStorage.removeItem('rememberedEmail')
    localStorage.removeItem('profileCompleted')
    localStorage.removeItem('userRole')
    navigate('/login')
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#F8FAFC] shadow-lg border-b-2 border-accent">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <button
            onClick={() => {
              navigate(userRole === 'admin' ? '/admin' : '/home')
              setMobileMenuOpen(false)
            }}
            className="flex items-center gap-3 hover:opacity-90 transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-lg shadow-md">
              P
            </div>
            <span className="text-2xl font-bold text-primary">PlaceHub</span>
          </button>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex gap-2">
            {userRole !== 'admin' && navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${isActive(link.path)
                  ? 'bg-primary text-white shadow-md'
                  : 'text-gray-700 hover:bg-background hover:text-secondary'
                  }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            {/* Display Work Status if exists
            {workStatus && (
              <div className="hidden md:flex items-center gap-2 px-4 py-2.5 rounded-lg bg-background text-primary font-semibold shadow-md">
                <Briefcase size={18} />
                <div className="text-left">
                  <div className="text-xs text-gray-600">Working at</div>
                  <div className="text-sm font-bold">{workStatus.company}</div>
                </div>
              </div>
            )} */}

            {/* Share Experience Button */}
            {userRole !== 'admin' && (
              <Link
                to="/share-experience"
                className="hidden md:flex px-6 py-2.5 rounded-lg bg-secondary text-white font-semibold hover:bg-accent transition-all shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <FileText size={18} />
                Share Experience
              </Link>
            )}

            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-secondary text-white flex items-center justify-center font-bold hover:shadow-xl transition-all hover:scale-105 overflow-hidden border-2 border-white shadow-sm"
                title="Profile Menu"
              >
                {userPicture ? (
                  <img src={userPicture} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  userInitial
                )}
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border-2 border-accent py-2 animate-in fade-in-50">
                  {/* User Name Display */}
                  {userName && (
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-bold text-primary truncate">{userName}</p>
                      <p className="text-xs text-gray-600">View & Edit Profile</p>
                    </div>
                  )}

                  {/* Work Status */}
                  {workStatus && (
                    <>
                      <div className="px-4 py-2 border-b border-gray-200">
                        <p className="text-xs text-gray-600">Current Status</p>
                        <p className="text-sm font-bold text-primary">{workStatus.role}</p>
                        <p className="text-xs text-gray-700">{workStatus.company}</p>
                      </div>
                    </>
                  )}
                  {userRole !== 'admin' && (
                    <>
                      <Link
                        to="/profile"
                        className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-background hover:text-secondary transition-all font-medium"
                      >
                        <User size={18} />
                        My Profile
                      </Link>
                      {/* <Link
                        to="/settings"
                        className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-background hover:text-secondary transition-all font-medium"
                      >
                        <Settings size={18} />
                        Settings
                      </Link> */}
                      <Link
                        to="/my-experiences"
                        className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-background hover:text-secondary transition-all font-medium"
                      >
                        <FileText size={18} />
                        My Experiences
                      </Link>
                    </>
                  )}
                  <hr className="my-2 border-gray-200" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-red-600 hover:bg-red-50 transition-all font-semibold"
                  >
                    <LogOut size={18} />
                    Logout
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 hover:bg-background rounded-lg transition-all text-primary hover:text-secondary"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && userRole !== 'admin' && (
          <div className="lg:hidden mt-4 space-y-2 pb-4 border-t-2 border-accent pt-4">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-2.5 rounded-lg font-semibold transition-all ${isActive(link.path)
                  ? 'bg-primary text-white shadow-md'
                  : 'text-gray-700 hover:bg-background hover:text-secondary'
                  }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              to="/share-experience"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-secondary text-white font-semibold hover:bg-accent transition-all shadow-md"
            >
              <FileText size={18} />
              Share Experience
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar

