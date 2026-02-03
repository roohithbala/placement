import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

const OAuthSuccessPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const token = searchParams.get('token')
    const userId = searchParams.get('userId')
    const profileCompleted = searchParams.get('profileCompleted')
    const role = searchParams.get('role')

    if (token && userId) {
      localStorage.setItem('authToken', token)
      localStorage.setItem('userId', userId)
      if (role) localStorage.setItem('userRole', role)

      // Redirect based on role and profile completion status
      if (role === 'admin') {
        navigate('/admin')
      } else if (profileCompleted === 'true') {
        navigate('/home')
      } else {
        navigate('/profile-setup')
      }
    } else {
      navigate('/login')
    }
  }, [navigate, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Completing authentication...</p>
      </div>
    </div>
  )
}

export default OAuthSuccessPage
