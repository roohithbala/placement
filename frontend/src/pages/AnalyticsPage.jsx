import { useState, useEffect } from 'react'
import MainLayout from '../components/MainLayout'
import { FileText, Building2, MessageCircle, Users, GraduationCap, UserCheck } from 'lucide-react'
import { experienceAPI, adminAPI } from '../services/api'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'

const COLORS = ['#1e40af', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

function AnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [platformStats, setPlatformStats] = useState(null)
  const [adminStats, setAdminStats] = useState(null)

  const userRole = localStorage.getItem('userRole')
  const isAdmin = userRole === 'admin'

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        // fetch platform stats (open to all)
        const pRes = await experienceAPI.getPlatformStats()
        if (pRes.data.success) setPlatformStats(pRes.data.stats)
      } catch (err) {
        console.error('Platform stats error', err)
        setError('Failed to load platform analytics')
      }

      if (isAdmin) {
        try {
          const aRes = await adminAPI.getStats()
          setAdminStats(aRes.data)
        } catch (err) {
          console.error('Admin stats error', err)
          // don't override existing error if platform data is fine
          if (!platformStats) setError('Failed to load admin analytics')
        }
      }

      setLoading(false)
    }

    load()
  }, [isAdmin])

  if (loading) {
    return (
      <MainLayout>
        <div className="py-32 flex justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-secondary" />
        </div>
      </MainLayout>
    )
  }

  if (error) {
    return (
      <MainLayout>
        <div className="py-32 text-center text-red-600 font-semibold">{error}</div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-primary mb-8">Platform Analytics</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <div className="bg-white shadow rounded-lg p-6 flex items-center gap-4">
            <FileText size={28} className="text-secondary" />
            <div>
              <p className="text-sm text-gray-500">Experiences</p>
              <p className="text-2xl font-bold">{platformStats?.totalExperiences || 0}</p>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6 flex items-center gap-4">
            <Building2 size={28} className="text-secondary" />
            <div>
              <p className="text-sm text-gray-500">Companies</p>
              <p className="text-2xl font-bold">{platformStats?.totalCompanies || 0}</p>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6 flex items-center gap-4">
            <MessageCircle size={28} className="text-secondary" />
            <div>
              <p className="text-sm text-gray-500">Questions</p>
              <p className="text-2xl font-bold">{platformStats?.totalQuestions || 0}</p>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6 flex items-center gap-4">
            <Users size={28} className="text-secondary" />
            <div>
              <p className="text-sm text-gray-500">Mentors</p>
              <p className="text-2xl font-bold">{platformStats?.totalMentors || 0}</p>
            </div>
          </div>
        </div>

        {isAdmin && adminStats && (
          <>
            <h2 className="text-2xl font-semibold text-primary mt-12 mb-6">Admin Overview</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              <div className="bg-white shadow rounded-lg p-6 flex items-center gap-4">
                <Users size={28} className="text-secondary" />
                <div>
                  <p className="text-sm text-gray-500">Total Users</p>
                  <p className="text-2xl font-bold">{adminStats.summary.totalUsers}</p>
                </div>
              </div>
              <div className="bg-white shadow rounded-lg p-6 flex items-center gap-4">
                <GraduationCap size={28} className="text-secondary" />
                <div>
                  <p className="text-sm text-gray-500">Students</p>
                  <p className="text-2xl font-bold">{adminStats.summary.totalStudents}</p>
                </div>
              </div>
              <div className="bg-white shadow rounded-lg p-6 flex items-center gap-4">
                <UserCheck size={28} className="text-secondary" />
                <div>
                  <p className="text-sm text-gray-500">Placed</p>
                  <p className="text-2xl font-bold">{adminStats.summary.totalPlacedStudents}</p>
                </div>
              </div>
            </div>

            {/* placement distribution pie */}
            <div className="mt-10">
              <h3 className="text-xl font-semibold mb-4">Placement distribution</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      dataKey="value"
                      data={adminStats.charts.placementDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {adminStats.charts.placementDistribution.map((entry, idx) => (
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  )
}

export default AnalyticsPage
