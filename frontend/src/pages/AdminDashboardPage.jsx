'use client';

import { useState, useEffect, useCallback, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import {
    Users,
    UserCheck,
    GraduationCap,
    FileText,
    Search,
    ChevronRight,
    Trash2,
    Eye,
    TrendingUp,
    AlertCircle,
    BarChart2,
    PieChart as PieChartIcon,
    RefreshCw,
    LayoutDashboard,
    Calendar,
    Settings,
    X,
    Send,
    LineChart as LineChartIcon,
    Briefcase,
    Award,
    Activity,
    Mail,
    Phone,
    Linkedin
} from 'lucide-react'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area
} from 'recharts'
import { adminAPI, authAPI } from '../services/api'
import './Admin.css'

const COLORS = ['#1e40af', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

function AdminDashboardPage() {
    const navigate = useNavigate()

    // Persist view state in session storage
    const [view, setView] = useState('overview')
    const [subView, setSubView] = useState(null)
    const [preferences, setPreferences] = useState(null)

    const [stats, setStats] = useState(null)
    const [listData, setListData] = useState([])
    const [selectedItem, setSelectedItem] = useState(null)
    const [loading, setLoading] = useState(true)
    const [isPolling, setIsPolling] = useState(false)
    const [error, setError] = useState(null)

    // Lists State
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const [yearFilter, setYearFilter] = useState('')
    const [diffFilter, setDiffFilter] = useState('')
    const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 })

    // Deletion Reasoning
    const [confirmDelete, setConfirmDelete] = useState(null)
    const [deleteReason, setDeleteReason] = useState('')
    const [isDeleting, setIsDeleting] = useState(false)

    // Meetings State
    const [meetings, setMeetings] = useState([])
    const [editingMeeting, setEditingMeeting] = useState(null)

    // Logs State
    const [systemLogs, setSystemLogs] = useState([])
    const [logLevelFilter, setLogLevelFilter] = useState('All')

    // Sync state to MongoDB
    useEffect(() => {
        if (preferences) {
            const updatePrefs = async () => {
                try {
                    await authAPI.updatePreferences({
                        adminDashboardView: view,
                        adminDashboardSubView: subView
                    })
                } catch (err) {
                    console.error('Failed to sync preferences:', err)
                }
            }
            updatePrefs()
        }
    }, [view, subView, preferences])

    // Load preferences on mount
    useEffect(() => {
        const loadPrefs = async () => {
            try {
                const res = await authAPI.getMe()
                const prefs = res.data.user.preferences
                if (prefs) {
                    setPreferences(prefs)
                    if (prefs.adminDashboardView) setView(prefs.adminDashboardView)
                    if (prefs.adminDashboardSubView) setSubView(prefs.adminDashboardSubView)
                }
            } catch (err) {
                console.error('Failed to load user preferences:', err)
            }
        }
        loadPrefs()
    }, [])

    const fetchStatsData = async (silent = false) => {
        try {
            if (!silent) setLoading(true)
            else setIsPolling(true)

            const res = await adminAPI.getStats()
            setStats(res.data)
            setError(null)
        } catch (err) {
            console.error('Stats fetch error:', err.response || err)
            if (err.response?.status === 403) {
                setError('Access denied. Please log out and log back in to refresh your session.')
            } else if (err.response?.status === 401) {
                setError('Session expired. Please log in again.')
            } else {
                setError('Live connection interrupted. Retrying...')
            }
        } finally {
            setLoading(false)
            setIsPolling(false)
        }
    }

    const fetchData = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoading(true)
            else setIsPolling(true)

            const params = { page, search, limit: 10 }

            let res;
            if (view === 'users') res = await adminAPI.getUsers(params)
            else if (view === 'students') {
                if (yearFilter) params.year = yearFilter
                res = await adminAPI.getStudents(params)
            }
            else if (view === 'placed') res = await adminAPI.getPlacedStudents(params)
            else if (view === 'problems') {
                if (diffFilter) params.difficulty = diffFilter
                res = await adminAPI.getProblems(params)
            }
            else if (view === 'meetings') {
                const mRes = await adminAPI.getMeetings()
                setMeetings(mRes.data)
                if (!silent) setLoading(false)
                setIsPolling(false)
                return
            }
            else if (view === 'logs') {
                const params = { page, limit: 50, level: logLevelFilter }
                const lRes = await adminAPI.getLogs(params)
                setSystemLogs(lRes.data.logs || [])
                setPagination(lRes.data.pagination)
                if (!silent) setLoading(false)
                setIsPolling(false)
                return
            }

            if (res) {
                setListData(res.data.students || res.data.problems || [])
                setPagination(res.data.pagination)
            }
            setError(null)
        } catch (err) {
            console.error('Data fetch error:', err.response || err)
            if (err.response?.status === 403) {
                setError('Access denied. Please log out and log back in to refresh your session.')
            } else if (err.response?.status === 401) {
                setError('Session expired. Please log in again.')
            } else {
                setError(`Failed to synchronize ${view} data.`)
            }
        } finally {
            setLoading(false)
            setIsPolling(false)
        }
    }, [view, page, search, yearFilter, diffFilter])

    // Real-time Polling Setup
    useEffect(() => {
        if (view === 'overview') {
            fetchStatsData()
        } else {
            fetchData()
        }

        // Polling every 15 seconds
        const pollInterval = setInterval(() => {
            if (view === 'overview') fetchStatsData(true)
            else fetchData(true)
        }, 15000)

        return () => clearInterval(pollInterval)
    }, [view, fetchData])

    const loadDetail = async (type, id) => {
        try {
            setLoading(true)
            let res;
            if (type === 'problem') res = await adminAPI.getProblemDetail(id)
            else res = await adminAPI.getStudentDetail(id)

            if (res) {
                setSelectedItem(res.data)
                setSubView(type === 'problem' ? 'problem_detail' : 'student_detail')
            }
        } catch (err) {
            setError('Could not retrieve details.')
        } finally {
            setLoading(false)
        }
    }

    const handleFinalDelete = async () => {
        if (!confirmDelete) return
        try {
            setIsDeleting(true)
            if (confirmDelete.type === 'problem') {
                await adminAPI.deleteProblem(confirmDelete.id, deleteReason)
            } else {
                await adminAPI.deleteStudent(confirmDelete.id)
            }
            setConfirmDelete(null)
            setDeleteReason('')
            if (subView) {
                setSubView(null)
                setSelectedItem(null)
            }
            fetchStatsData(true)
            fetchData(true)
        } catch (err) {
            setError('Failed to finalize removal.')
        } finally {
            setIsDeleting(false)
        }
    }

    const handleUpdateMeeting = async (id, data) => {
        try {
            await adminAPI.updateMeeting(id, data)
            setEditingMeeting(null)
            fetchData(true)
        } catch (err) {
            setError('Failed to update session.')
        }
    }

    const renderOverview = () => {
        if (loading && !stats) return <div className="p-20 text-center"><RefreshCw className="animate-spin mx-auto text-secondary" size={40} /></div>
        if (!stats) return null

        const summaryCards = [
            { id: 'users', label: 'Talent Pool', value: stats.summary.totalUsers, icon: Users, color: '#1e40af' },
            { id: 'students', label: 'Students', value: stats.summary.totalStudents, icon: GraduationCap, color: '#3b82f6' },
            { id: 'placed', label: 'Placed', value: stats.summary.totalPlacedStudents, icon: UserCheck, color: '#10b981' },
            { id: 'problems', label: 'Problems', value: stats.summary.totalProblems, icon: FileText, color: '#f59e0b' },
        ]

        return (
            <div className="space-y-8 animate-in fade-in duration-500">
                <div className="modern-stats-grid">
                    {summaryCards.map(card => (
                        <div key={card.id} className="modern-stat-card" onClick={() => setView(card.id)}>
                            <div className="stat-icon-wrapper" style={{ background: `${card.color}15`, color: card.color }}>
                                <card.icon size={28} />
                            </div>
                            <div className="stat-content">
                                <span className="label text-xs">{card.label}</span>
                                <div className="value text-3xl font-black">{card.value}</div>
                            </div>
                        </div>
                    ))}
                    <div className="modern-stat-card" onClick={() => setView('meetings')}>
                        <div className="stat-icon-wrapper" style={{ background: '#8b5cf615', color: '#8b5cf6' }}>
                            <Calendar size={28} />
                        </div>
                        <div className="stat-content">
                            <span className="label text-xs font-bold">Manage Sessions</span>
                            <div className="text-sm font-bold mt-2 text-primary flex items-center gap-1">Live Ops <ChevronRight size={14} /></div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Activity */}
                    <div className="modern-chart-box">
                        <h3><LineChartIcon size={20} className="text-secondary" /> Contribution Activity</h3>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats.charts.problemsOverTime}>
                                    <defs>
                                        <linearGradient id="colorUploads" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="_id" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                                    <Area type="monotone" dataKey="count" stroke="#f59e0b" fillOpacity={1} fill="url(#colorUploads)" strokeWidth={3} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Talent Pool Demographics */}
                    <div className="modern-chart-box">
                        <h3><GraduationCap size={20} className="text-secondary" /> Students by Passing Year</h3>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.charts.studentsByYear}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="_id" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                                    <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Placement Success by Batch */}
                    <div className="modern-chart-box">
                        <h3><UserCheck size={20} className="text-secondary" /> Students Placed by Passing Year</h3>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.charts.placedByYear}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="_id" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                                    <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    const renderMeetingsList = () => (
        <div className="modern-table-card animate-in fade-in duration-500">
            <div className="table-toolbar">
                <h3 className="text-xl font-bold flex items-center gap-2"><Calendar size={20} /> Mentoring Sessions</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="pro-table">
                    <thead>
                        <tr>
                            <th>Context</th>
                            <th>Timing</th>
                            <th>Engagement</th>
                            <th className="text-right">Admin</th>
                        </tr>
                    </thead>
                    <tbody>
                        {meetings.map((m) => (
                            <tr key={m._id}>
                                <td className="w-1/3">
                                    <div className="user-info-text text-sm">
                                        <span className="font-bold text-primary">Mentor: {m.mentorId?.email}</span>
                                        <span className="text-slate-400 font-medium">Mentee: {m.menteeId?.email}</span>
                                    </div>
                                </td>
                                <td>
                                    <span className="font-bold text-primary">{new Date(m.scheduledAt).toLocaleString()}</span>
                                </td>
                                <td>
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${m.status === 'completed' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                                        {m.type || 'Sync'} • {m.status}
                                    </span>
                                </td>
                                <td>
                                    <div className="pro-actions justify-end">
                                        <button className="pro-btn" title="Edit Session" onClick={() => setEditingMeeting(m)}>
                                            <Settings size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )

    const renderTable = () => {
        const isProblemView = view === 'problems'
        return (
            <div className="modern-table-card animate-in fade-in duration-500">
                <div className="table-toolbar">
                    <div className="smart-search">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder={`Live filter ${view}...`}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="toolbar-filters">
                        {view === 'students' && (
                            <select className="neo-select" value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}>
                                <option value="">Passing Out Year</option>
                                {[2022, 2023, 2024, 2025, 2026, 2027, 2028].map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        )}
                        {isProblemView && (
                            <select className="neo-select" value={diffFilter} onChange={(e) => setDiffFilter(e.target.value)}>
                                <option value="">Difficulty</option>
                                {['Easy', 'Medium', 'Hard'].map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        )}
                        <button className="pro-btn" onClick={() => fetchData(false)}><RefreshCw size={20} /></button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="pro-table">
                        <thead>
                            <tr>
                                <th>Resource</th>
                                <th>{isProblemView ? 'Classification' : (view === 'placed' ? 'Company' : 'Passing Year')}</th>
                                <th>Domain</th>
                                <th className="text-right">Management</th>
                            </tr>
                        </thead>
                        <tbody>
                            {listData.map((item) => (
                                <tr key={item._id}>
                                    <td>
                                        <div className="user-cell">
                                            <div className="user-avatar-mini">{(item.fullName || item.title || '?')[0]}</div>
                                            <div className="user-info-text text-sm">
                                                <span className="font-bold">{item.fullName || item.title}</span>
                                                <span className="text-slate-400 font-medium">{item.collegeEmail || item.userId?.email}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="font-bold text-primary">{isProblemView ? item.difficulty : (item.company || item.batch || item.year)}</span>
                                    </td>
                                    <td>
                                        <span className="text-slate-400 font-bold">{item.domain || item.role || item.branch}</span>
                                    </td>
                                    <td className="text-right">
                                        <div className="pro-actions justify-end">
                                            <button className="pro-btn" onClick={() => loadDetail(isProblemView ? 'problem' : 'student', item._id)}><Eye size={18} /></button>
                                            <button className="pro-btn text-red-500 hover:bg-red-50" onClick={() => setConfirmDelete({
                                                type: isProblemView ? 'problem' : 'student',
                                                id: item._id,
                                                name: item.fullName || item.title
                                            })}><Trash2 size={18} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {pagination.pages > 1 && (
                    <div className="p-8 border-t border-gray-50 flex justify-end gap-2">
                        <button className="pro-btn" disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</button>
                        <button className="pro-btn" disabled={page === pagination.pages} onClick={() => setPage(page + 1)}>Next</button>
                    </div>
                )}
            </div>
        )
    }

    const renderLogsList = () => {
        if (loading && !systemLogs.length) return <div className="p-20 text-center"><RefreshCw className="animate-spin mx-auto text-secondary" size={40} /></div>

        return (
            <div className="modern-table-card animate-in fade-in duration-500">
                <div className="table-toolbar">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center">
                            <Activity size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-primary mb-0">System Activity</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Real-time Platform Logs</p>
                        </div>
                    </div>
                    <div className="toolbar-filters">
                        <select className="neo-select" value={logLevelFilter} onChange={(e) => { setLogLevelFilter(e.target.value); setPage(1) }}>
                            <option value="All">All Severities</option>
                            <option value="info">Info</option>
                            <option value="warn">Warning</option>
                            <option value="error">Error</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="pro-table">
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>Severity</th>
                                <th>Activity / Route</th>
                                <th>User</th>
                                <th>IP Address</th>
                            </tr>
                        </thead>
                        <tbody>
                            {systemLogs.map((log) => (
                                <tr key={log._id}>
                                    <td className="text-xs font-bold text-slate-400">
                                        {new Date(log.createdAt).toLocaleString()}
                                    </td>
                                    <td>
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${log.level === 'error' ? 'bg-red-50 text-red-600 border border-red-100' :
                                            log.level === 'warn' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                                'bg-blue-50 text-blue-600 border border-blue-100'
                                            }`}>
                                            {log.level}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-primary">{log.message}</span>
                                            {log.path && <span className="text-[10px] font-bold text-slate-400">{log.method} {log.path}</span>}
                                        </div>
                                    </td>
                                    <td>
                                        <span className="text-sm font-bold text-slate-600">{log.userId?.email || 'System / Guest'}</span>
                                    </td>
                                    <td>
                                        <span className="text-xs font-mono text-slate-400">{log.ip || 'Local'}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {pagination.pages > 1 && (
                    <div className="p-8 border-t border-gray-50 flex justify-end gap-2">
                        <button className="pro-btn" disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</button>
                        <button className="pro-btn" disabled={page === pagination.pages} onClick={() => setPage(page + 1)}>Next</button>
                    </div>
                )}
            </div>
        )
    }

    // Unified Admin Navbar Logic
    const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
    const [userInitial, setUserInitial] = useState('A')
    const dropdownRef = useRef(null)

    useEffect(() => {
        const userDataStr = localStorage.getItem('user')
        if (userDataStr) {
            try {
                const userData = JSON.parse(userDataStr)
                const name = userData.fullName || userData.name || 'Admin'
                setUserInitial(name.charAt(0).toUpperCase())
            } catch (e) { setUserInitial('A') }
        }

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
        localStorage.removeItem('user')
        localStorage.removeItem('fullName')
        localStorage.removeItem('userRole')
        navigate('/login')
    }

    const NavTab = ({ id, label, icon: Icon }) => (
        <button
            onClick={() => { setView(id); setSubView(null) }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${view === id
                ? 'bg-primary text-white shadow-md'
                : 'text-slate-500 hover:bg-slate-100'
                }`}
        >
            {Icon && <Icon size={18} />}
            {label}
        </button>
    )

    return (
        <div className="min-h-screen bg-[#f8fafc] font-sans">
            {/* Real-time Indicator (Absolute) */}
            <div className="fixed top-24 right-8 z-40 flex items-center gap-2 px-3 py-1 bg-white/80 backdrop-blur shadow-sm border border-gray-100 rounded-full pointer-events-none">
                <div className={`w-2 h-2 rounded-full ${isPolling ? 'bg-secondary animate-ping' : 'bg-green-500'}`}></div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{isPolling ? 'Syncing...' : 'Live Connection'}</span>
            </div>

            {/* Single Unified Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 py-3 shadow-sm">
                <div className="max-w-[1600px] mx-auto flex items-center justify-between">
                    {/* Brand */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-lg shadow-md">
                            P
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-primary tracking-tight">PlaceHub <span className="text-secondary opacity-80">Admin</span></h1>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="hidden md:flex items-center gap-2 bg-slate-50 p-1 rounded-2xl border border-slate-100">
                        <NavTab id="overview" label="Dashboard" icon={LayoutDashboard} />
                        <NavTab id="meetings" label="Sessions" icon={Calendar} />
                        <NavTab id="logs" label="System Logs" icon={Activity} />
                    </div>

                    {/* Right Side / Profile */}
                    <div className="flex items-center gap-4">
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                                className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-full hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all"
                            >
                                <div className="text-right hidden sm:block">
                                    <p className="text-xs font-bold text-primary">Administrator</p>
                                    <p className="text-[10px] font-bold text-slate-400">Super User</p>
                                </div>
                                <div className="w-9 h-9 rounded-full bg-gradient-to-r from-primary to-secondary text-white flex items-center justify-center font-bold shadow-md">
                                    {userInitial}
                                </div>
                            </button>

                            {profileDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-2 animate-in fade-in-50 slide-in-from-top-2">
                                    <div className="px-4 py-2 border-b border-slate-50">
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Signed in as</p>
                                        <p className="text-sm font-bold text-primary truncate">Admin User</p>
                                    </div>
                                    <Link to="/home" className="flex items-center gap-3 px-4 py-2.5 text-slate-600 hover:bg-slate-50 hover:text-primary transition-all font-bold text-sm">
                                        <Users size={16} /> Student View
                                    </Link>
                                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-red-600 hover:bg-red-50 transition-all font-bold text-sm">
                                        <div className="rotate-180"><ChevronRight size={16} /></div> Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content Area */}
            <main className="pt-24 px-4 md:px-8 pb-10 max-w-[1600px] mx-auto min-h-screen">
                {/* Dynamic Title based on View */}
                <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h2 className="text-3xl font-black text-primary tracking-tight">
                        {view === 'overview' && 'Dashboard Overview'}
                        {view === 'meetings' && 'Mentorship Sessions'}
                        {view === 'logs' && 'Platform Activity Logs'}
                        {view === 'users' && 'User Management'}
                        {view === 'students' && 'Student Directory'}
                        {view === 'placed' && 'Placement Records'}
                        {view === 'problems' && 'Problem Repository'}
                    </h2>
                    <p className="text-slate-500 font-medium">
                        {view === 'overview' && 'Welcome back. Here is what is happening today.'}
                        {view === 'meetings' && 'Monitor and manage all mentorship interactions.'}
                        {view === 'logs' && 'Track system events, errors, and user activities.'}
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border-2 border-red-100 rounded-2xl text-red-600 flex items-center gap-3 animate-pulse">
                        <AlertCircle size={20} />
                        <p className="font-bold text-sm">{error}</p>
                    </div>
                )}

                {/* Render Views */}
                <div className="animate-in fade-in duration-500">
                    {!subView && (
                        view === 'overview' ? renderOverview() :
                            view === 'meetings' ? renderMeetingsList() :
                                view === 'logs' ? renderLogsList() :
                                    renderTable()
                    )}

                    {subView && (
                        <div className="space-y-6">
                            <button className="pro-btn flex items-center gap-2 mb-4 hover:bg-slate-50" onClick={() => setSubView(null)}><X size={18} /> Back to List</button>

                            {!selectedItem ? (
                                <div className="bg-white rounded-[2rem] p-20 shadow-xl border border-gray-100 flex flex-col items-center justify-center space-y-4">
                                    <RefreshCw className="animate-spin text-secondary" size={48} />
                                    <p className="font-black text-slate-400 uppercase tracking-widest text-sm">Loading Details...</p>
                                </div>
                            ) : (
                                /* Detail Card Logic Preserved */
                                <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-300">
                                    <div className="bg-gradient-to-r from-primary to-secondary p-10 text-white">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h2 className="text-4xl font-black mb-2">{selectedItem?.profile?.fullName || selectedItem?.problem?.title}</h2>
                                                <p className="opacity-80 font-bold flex items-center gap-2">
                                                    {subView === 'student_detail' ? (
                                                        <><GraduationCap size={18} /> {selectedItem?.profile?.branch} · {selectedItem?.profile?.batch} Batch</>
                                                    ) : (
                                                        <><FileText size={18} /> {selectedItem?.problem?.difficulty} Difficulty · {selectedItem?.problem?.domain}</>
                                                    )}
                                                </p>
                                            </div>
                                            <div className="px-6 py-2 bg-white/20 backdrop-blur rounded-full font-black uppercase tracking-widest text-xs">
                                                {subView === 'student_detail' ? selectedItem?.profile?.placementStatus : 'Problem Case'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-10">
                                        {/* Same Detail View Content as previous... simplified for replacement block but logic retained */}
                                        {subView === 'student_detail' ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                                <div className="space-y-8">
                                                    <div>
                                                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Contact Information</h3>
                                                        <div className="space-y-3 font-bold text-slate-700">
                                                            <p className="flex items-center gap-3"> {selectedItem?.profile?.collegeEmail}</p>
                                                            <p className="flex items-center gap-3"> {selectedItem?.profile?.whatsappNumber || 'N/A'}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="space-y-8">
                                                    <div>
                                                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Placement Details</h3>
                                                        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                                            <p className="text-xl font-black text-primary">{selectedItem?.profile?.company || 'Not Placed'}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-8">
                                                <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 text-slate-700 font-bold leading-relaxed whitespace-pre-wrap">
                                                    {selectedItem?.problem?.content}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Modals for Deletion and Editing */}
                {/* Deletion Modal */}
                {/* Deletion Modal */}
                {confirmDelete && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
                        <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-md:p-4 p-10 animate-in zoom-in-95 duration-200">
                            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                                <Trash2 size={32} />
                            </div>
                            <h3 className="text-2xl font-black text-center text-primary mb-2">Finalize Removal</h3>
                            <p className="text-slate-500 text-center mb-6 font-bold text-sm">Removal of <span className="text-red-500">"{confirmDelete.name}"</span>.</p>

                            {confirmDelete.type === 'problem' && (
                                <div className="mb-8">
                                    <label className="block text-xs font-black text-slate-400 uppercase mb-2">Notification Details</label>
                                    <textarea
                                        className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold min-h-[100px] focus:ring-2 focus:ring-red-100"
                                        placeholder="Reason for removal (emailed to user)..."
                                        value={deleteReason}
                                        onChange={(e) => setDeleteReason(e.target.value)}
                                    />
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button
                                    className="flex-3 px-8 py-4 rounded-2xl bg-red-600 text-white font-black hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                                    onClick={handleFinalDelete}
                                    disabled={isDeleting || (confirmDelete.type === 'problem' && !deleteReason.trim())}
                                >
                                    {isDeleting ? 'Working...' : (confirmDelete.type === 'problem' ? <><Send size={18} /> Confirm & Notify</> : 'Confirm')}
                                </button>
                                <button className="flex-1 px-8 py-4 rounded-2xl border-2 border-slate-100 text-slate-400 font-bold" onClick={() => setConfirmDelete(null)}>Cancel</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Meeting Edit Modal */}
                {editingMeeting && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
                        <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-10">
                            <h3 className="text-2xl font-black text-primary mb-6">Modify Session</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase mb-2">Scheduled At</label>
                                    <input
                                        type="datetime-local"
                                        className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none"
                                        defaultValue={new Date(editingMeeting.scheduledAt).toISOString().slice(0, 16)}
                                        onChange={(e) => setEditingMeeting({ ...editingMeeting, scheduledAt: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase mb-2">Live Status</label>
                                    <select
                                        className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none"
                                        defaultValue={editingMeeting.status}
                                        onChange={(e) => setEditingMeeting({ ...editingMeeting, status: e.target.value })}
                                    >
                                        <option value="scheduled">Scheduled</option>
                                        <option value="completed">Completed</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>
                            </div>
                            <div className="mt-10 flex gap-3">
                                <button className="flex-1 px-8 py-4 bg-primary text-white rounded-2xl font-black" onClick={() => handleUpdateMeeting(editingMeeting._id, editingMeeting)}>Apply Changes</button>
                                <button className="px-8 py-4 border-2 border-slate-100 text-slate-400 rounded-2xl font-black" onClick={() => setEditingMeeting(null)}>Close</button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}

export default AdminDashboardPage
