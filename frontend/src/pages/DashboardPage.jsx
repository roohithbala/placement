

'use client';

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import MainLayout from '../components/MainLayout'
import { TrendingUp, BookOpen, Users, Briefcase, ArrowRight, Star, FileText } from 'lucide-react'
import ChatWidgetButton from '../components/chat/ChatWidgetButton.jsx'
import ChatContainer from '../components/chat/ChatContainer.jsx'
import { experienceAPI, opportunitiesAPI, adminAPI } from '../services/api'

function DashboardPage() {
  const [experiences, setExperiences] = useState([])
  const [opportunities, setOpportunities] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isChatOpen, setIsChatOpen] = useState(false)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        const [expRes, oppRes, statsRes] = await Promise.allSettled([
          experienceAPI.getAll(),
          opportunitiesAPI.list({ limit: 3 }),
          experienceAPI.getPlatformStats()
        ])

        if (expRes.status === 'fulfilled' && expRes.value.data.success) {
          setExperiences(expRes.value.data.experiences || [])
        } else {
          console.error('Experiences fetch failed:', expRes.reason)
        }

        if (oppRes.status === 'fulfilled' && oppRes.value.data.success) {
          // Handle both 'items' and 'opportunities' responses
          const opps = oppRes.value.data.items || oppRes.value.data.opportunities || []
          setOpportunities(opps)
        } else {
          console.error('Opportunities fetch failed:', oppRes.reason)
        }

        if (statsRes.status === 'fulfilled' && statsRes.value.data.success) {
          setStats(statsRes.value.data.stats)
        } else {
          console.error('Stats fetch failed:', statsRes.reason)
          // Set default stats
          setStats({ totalExperiences: 4, totalCompanies: 4, totalMaterials: 12, totalMentors: 3 })
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        setStats({ totalExperiences: 0, totalCompanies: 0, totalMaterials: 0, totalMentors: 0 })
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const materials = [
    { id: 1, title: 'DSA Complete Guide', downloads: 2340, category: 'Data Structures' },
    { id: 2, title: 'System Design Patterns', downloads: 1850, category: 'System Design' },
    { id: 3, title: 'DBMS Interview Questions', downloads: 3120, category: 'Databases' },
    { id: 4, title: 'OOP Concepts Explained', downloads: 2560, category: 'Core CS' },
    { id: 5, title: 'CN Quick Reference', downloads: 1940, category: 'Networks' },
    { id: 6, title: 'Behavioral Interview Tips', downloads: 3450, category: 'HR' },
    { id: 7, title: 'Coding Patterns 2024', downloads: 2780, category: 'Coding' },
    { id: 8, title: 'Resume Building Guide', downloads: 2210, category: 'Placement Prep' },
  ]

  const trendingTopics = [
    'System Design', 'DSA', 'Behavioral', 'DBMS', 'Networking', 'ML/AI', 'Cloud', 'API Design'
  ]

  const quickStats = [
    { label: 'Experiences Shared', value: stats?.totalExperiences || 0, icon: FileText },
    { label: 'Companies Covered', value: stats?.totalCompanies || 0, icon: Briefcase },
    { label: 'Materials Available', value: stats?.totalMaterials || 0, icon: BookOpen },
    { label: 'Active Mentors', value: stats?.totalMentors || 0, icon: Users },
  ]

  return (
    <MainLayout>
      
  <section className="w-full bg-[#deeaed] border-b border-[#071952]/10 pt-24 pb-12 md:pt-28 md:pb-20 transition-all">
  <div className="max-w-7xl mx-auto px-6">
    <div className="flex flex-col items-start lg:w-3/4">
      
      {/* Reduced mb-4 for tighter grouping */}
      <span className="inline-block px-4 py-1.5 mb-4 text-xs font-bold tracking-widest uppercase bg-[#071952] text-white rounded-full shadow-sm">
        Empowering Careers
      </span>

      {/* Heading - Reduced mb-4 */}
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-4 text-[#071952] tracking-tight">
        Your Complete <span className="text-[#088395]">Placement Preparation</span> Hub
      </h1>
      
      {/* Subtext - Reduced mb-8 */}
      <p className="text-base md:text-lg lg:text-xl text-[#071952]/80 leading-relaxed mb-8 max-w-2xl font-medium">
        Learn from real placement experiences, access curated materials, and connect with mentors to ace your interviews.
      </p>

      {/* CTA Buttons */}
      <div className="flex flex-wrap gap-4 w-full sm:w-auto">
        <Link
          to="/share-experience"
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#071952] text-white font-bold hover:brightness-110 transition-all shadow-lg flex items-center justify-center gap-2"
        >
          Share Your Experience <ArrowRight size={18} />
        </Link>
        
        <Link
          to="/materials"
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#088395] text-white font-bold hover:brightness-110 transition-all shadow-lg flex items-center justify-center gap-2"
        >
          Explore Materials <ArrowRight size={18} />
        </Link>
        
        <Link
          to="/analytics"
          className="w-full sm:w-auto px-6 py-3 rounded-xl border-2 border-[#071952] text-[#071952] font-bold hover:bg-white transition-all flex items-center justify-center gap-2"
        >
          View Analytics <ArrowRight size={18} />
        </Link>
      </div>
    </div>
  </div>
</section>
      {/* --- PAGE CONTENT (RESTRICTED WIDTH) --- */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        
        {/* Quick Stats */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-primary mb-8">Platform Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickStats.map((stat) => (
              <div
                key={stat.label}
                className="bg-card rounded-xl shadow-md p-6 hover:shadow-lg transition-all border border-border hover:border-accent"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-muted-foreground text-sm font-semibold mb-2">{stat.label}</p>
                    <p className="text-4xl font-bold text-primary">{stat.value.toLocaleString()}</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center text-secondary">
                    <stat.icon size={24} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Experiences */}
        <section className="mb-16">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-primary">Recent Placement Experiences</h2>
            <Link to="/experiences" className="text-secondary font-semibold hover:text-accent hover:underline transition">
              View All
            </Link>
          </div>
          {loading ? (
            <div className="text-center py-12 text-primary">Loading experiences...</div>
          ) : experiences && experiences.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {experiences.map((exp) => (
                <div
                  key={exp._id}
                  className="bg-card rounded-xl shadow-md hover:shadow-xl transition-all border border-border hover:border-accent relative overflow-hidden group"
                >
                  <div className="p-6 relative z-10">
                    <div className="mb-4">
                      <h3 className="text-2xl font-bold text-primary mb-2">{exp.companyName || 'Company'}</h3>
                      <p className="text-muted-foreground text-lg font-medium">{exp.roleAppliedFor || 'Role'}</p>
                    </div>

                    <div className="flex justify-between items-center mb-4 pb-4 border-b border-border">
                      <span className="text-sm text-muted-foreground font-medium bg-background px-3 py-1 rounded-full">
                        Batch {exp.batch || 'N/A'}
                      </span>
                      <div className="flex items-center gap-1 bg-yellow-50 px-3 py-1 rounded-full">
                        <Star size={16} className="text-yellow-500 fill-yellow-500" />
                        <span className="font-semibold text-gray-700">{exp.overallExperienceRating || 0}</span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-semibold ${
                        (exp.difficultyRating || 0) >= 4 ? 'bg-error/10 text-error border border-error/20' :
                        (exp.difficultyRating || 0) >= 3 ? 'bg-warning/10 text-warning border border-warning/20' :
                        'bg-success/10 text-success border border-success/20'
                      }`}>
                        {(exp.difficultyRating || 0) >= 4 ? 'Hard' : (exp.difficultyRating || 0) >= 3 ? 'Medium' : 'Easy'} Difficulty
                      </span>
                    </div>

                    <Link to={`/experience/${exp._id}`} className="block w-full text-center px-4 py-2.5 rounded-lg bg-secondary text-secondary-foreground font-semibold hover:brightness-110 transition shadow-md">
                      Read Experience
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No experiences available yet.
            </div>
          )}
        </section>

        {/* Featured Materials */}
        <section className="mb-16">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-primary">Featured Materials</h2>
            <Link to="/materials" className="text-secondary font-semibold hover:text-accent hover:underline transition">
              View All
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {materials.map((material) => (
              <div key={material.id} className="bg-card rounded-xl shadow-md p-6 hover:shadow-lg transition-all border border-border hover:border-accent">
                <div className="mb-4 p-4 bg-accent/10 rounded-lg flex items-center justify-center h-20">
                  <BookOpen className="text-secondary" size={32} />
                </div>
                <h3 className="font-bold text-primary mb-2 line-clamp-2">{material.title}</h3>
                <p className="text-sm text-secondary font-medium mb-4">{material.category}</p>
                <p className="text-xs text-muted-foreground">{material.downloads.toLocaleString()} downloads</p>
              </div>
            ))}
          </div>
        </section>

        {/* Trending Topics */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-primary mb-8">Trending Topics</h2>
          <div className="flex flex-wrap gap-3">
            {trendingTopics.map((topic) => (
              <button
                key={topic}
                className="px-6 py-3 rounded-full bg-card border-2 border-primary text-primary font-semibold hover:bg-primary hover:text-primary-foreground transition shadow-md"
              >
                {topic}
              </button>
            ))}
          </div>
        </section>

        {/* Latest Opportunities */}
        <section className="mb-16">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-primary">Latest Opportunities</h2>
            <Link to="/opportunities" className="text-secondary font-semibold hover:text-accent hover:underline transition">
              View All
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {opportunities && opportunities.length > 0 ? (
              opportunities.map((opp) => (
                <div key={opp._id || opp.id} className="bg-card rounded-xl shadow-md p-6 hover:shadow-lg transition-all border border-border hover:border-accent">
                  <h3 className="text-xl font-bold text-primary mb-2">{opp.companyName || opp.company || 'Company'}</h3>
                  <p className="text-primary font-semibold mb-4">{opp.title || opp.role || 'Position'}</p>
                  <div className="space-y-2 mb-6 text-sm text-muted-foreground">
                    <p className="font-medium">Location: <span className="text-primary">{opp.location || 'Remote'}</span></p>
                    <p className="font-medium">Deadline: <span className="text-primary">{opp.deadline ? new Date(opp.deadline).toLocaleDateString() : 'Not specified'}</span></p>
                  </div>
                  <Link to={`/opportunities/${opp._id || opp.id}`} className="block w-full text-center px-4 py-2.5 rounded-lg bg-secondary text-secondary-foreground font-semibold hover:brightness-110 transition shadow-md">
                    Apply Now
                  </Link>
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center py-8 text-muted-foreground">
                No opportunities available at the moment.
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Floating Chat Components */}
      <ChatWidgetButton isOpen={isChatOpen} onToggle={() => setIsChatOpen(!isChatOpen)} />

      {isChatOpen && (
        <div className="fixed inset-0 sm:inset-auto sm:bottom-24 sm:right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <ChatContainer />
        </div>
      )}
    </MainLayout>
  )
}

export default DashboardPage;

