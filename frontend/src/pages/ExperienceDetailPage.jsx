import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import MainLayout from '../components/MainLayout'
import { experienceAPI, BACKEND_BASE_URL } from '../services/api'
import {
    Briefcase, Calendar, CheckCircle, XCircle, Clock, Star,
    ArrowLeft, FileText, Download, User, Share2, Eye,
    MapPin, Building, GraduationCap, DollarSign, Layers,
    BookOpen, ExternalLink, Menu, Hash
} from 'lucide-react'

function ExperienceDetailPage() {
    const { id } = useParams()
    const [experience, setExperience] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [activeSection, setActiveSection] = useState('metadata')

    useEffect(() => {
        const fetchExperience = async () => {
            try {
                setLoading(true)
                const res = await experienceAPI.getById(id)
                if (res.data.success) {
                    setExperience(res.data.experience)
                } else {
                    setError(res.data.message)
                }
            } catch (err) {
                setError('Failed to load experience details')
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        fetchExperience()
    }, [id])

    // Scroll spy or simple jump to section
    const scrollToSection = (sectionId) => {
        setActiveSection(sectionId)
        const element = document.getElementById(sectionId)
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
    }

    // Helper to download/view material
    const downloadMaterial = (material) => {
        if (material.filePath) {
            const url = material.filePath.startsWith('http') ? material.filePath : BACKEND_BASE_URL + material.filePath
            window.open(url, '_blank', 'noopener');
            return;
        }
        if (material.url) {
            const url = material.url.startsWith('http') ? material.url : BACKEND_BASE_URL + material.url
            window.open(url, '_blank', 'noopener');
            return;
        }

        if (material.fileContent) {
            const link = document.createElement("a");
            link.href = material.fileContent;
            link.download = material.fileName || "download";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    if (loading) {
        return (
            <MainLayout>
                <div className="min-h-screen bg-background flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            </MainLayout>
        )
    }

    if (error || !experience) {
        return (
            <MainLayout>
                <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Oops! Filter Error</h2>
                    <p className="text-gray-600 mb-6">{error || "The experience you're looking for doesn't exist."}</p>
                    <Link to="/experiences" className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90">
                        Back to Experiences
                    </Link>
                </div>
            </MainLayout>
        )
    }

    const {
        companyName, roleAppliedFor, batch, outcome, difficultyRating,
        overallExperienceRating, preparationTime, interviewMonth, interviewYear,
        rounds, materials, userId, views, package: pkg, placementSeason
    } = experience

    return (
        <MainLayout>
            <div className="bg-background min-h-screen pb-12">
                {/* Top Navigation */}
                <div className="bg-white border-b border-gray-200 sticky top-16 z-30">
                    <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex justify-between items-center">
                        <Link to="/experiences" className="inline-flex items-center text-gray-500 hover:text-primary transition-colors font-medium text-sm">
                            <ArrowLeft size={16} className="mr-1" /> All Experiences
                        </Link>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1"><User size={14} /> {userId?.fullName || 'Anonymous User'}</span>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                        {/* Sidebar */}
                        <aside className="lg:col-span-3">
                            <div className="sticky top-32 space-y-4">
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                    <div className="w-16 h-16 rounded-xl bg-gray-50 flex items-center justify-center mb-4 text-3xl font-bold text-primary border border-gray-100">
                                        {companyName.charAt(0)}
                                    </div>
                                    <h1 className="text-xl font-bold text-gray-900 mb-1">{companyName}</h1>
                                    <p className="text-gray-500 text-sm mb-4">{roleAppliedFor}</p>

                                    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold ${outcome === 'selected' ? 'bg-green-100 text-green-700' :
                                        outcome === 'not-selected' ? 'bg-red-50 text-red-700' :
                                            'bg-yellow-50 text-yellow-700'
                                        }`}>
                                        {outcome === 'selected' ? <CheckCircle size={14} /> : outcome === 'not-selected' ? <XCircle size={14} /> : <div className="w-2 h-2 rounded-full bg-yellow-500"></div>}
                                        {outcome === 'selected' ? 'Selected' : outcome === 'not-selected' ? 'Not Selected' : 'In Process'}
                                    </div>
                                </div>

                                <nav className="bg-white rounded-xl shadow-sm border border-gray-100 p-2">
                                    {['metadata', 'rounds', 'materials'].map((section) => (
                                        <button
                                            key={section}
                                            onClick={() => scrollToSection(section)}
                                            className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors flex items-center gap-3 ${activeSection === section ? 'bg-primary/5 text-primary' : 'text-gray-600 hover:bg-gray-50'
                                                }`}
                                        >
                                            {section === 'metadata' && <Briefcase size={18} />}
                                            {section === 'rounds' && <Layers size={18} />}
                                            {section === 'materials' && <BookOpen size={18} />}
                                            <span className="capitalize">{section}</span>
                                        </button>
                                    ))}
                                </nav>
                            </div>
                        </aside>

                        {/* Content */}
                        <div className="lg:col-span-9 space-y-8">

                            {/* Metadata Section */}
                            <section id="metadata" className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 scroll-mt-32">
                                <h2 className="text-2xl font-bold text-primary mb-6 flex items-center gap-2">
                                    <Briefcase className="text-secondary" /> Opportunity Details
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Role</p>
                                        <p className="font-semibold text-gray-900">{roleAppliedFor}</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Batch</p>
                                        <p className="font-semibold text-gray-900 flex items-center gap-2">
                                            <GraduationCap size={16} className="text-secondary" /> {batch}
                                        </p>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Package</p>
                                        <p className="font-semibold text-gray-900 flex items-center gap-2">
                                            <DollarSign size={16} className="text-secondary" /> {pkg ? `${pkg}` : 'N/A'}
                                        </p>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Type</p>
                                        <p className="font-semibold text-gray-900 flex items-center gap-2">
                                            <Building size={16} className="text-secondary" /> {placementSeason === 'on-campus' ? 'On-Campus' : 'Off-Campus'}
                                        </p>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Interview Date</p>
                                        <p className="font-semibold text-gray-900 flex items-center gap-2">
                                            <Calendar size={16} className="text-secondary" /> {interviewMonth} {interviewYear}
                                        </p>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Prep Time</p>
                                        <p className="font-semibold text-gray-900 flex items-center gap-2">
                                            <Clock size={16} className="text-secondary" /> {preparationTime || 'N/A'} weeks
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-2 gap-6">
                                    <div>
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Difficulty</p>
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4, 5].map((s) => (
                                                <div key={s} className={`h-2 w-full rounded-full ${s <= difficultyRating ? 'bg-red-400' : 'bg-gray-200'}`}></div>
                                            ))}
                                        </div>
                                        <p className="text-xs text-right mt-1 font-medium text-gray-500">{difficultyRating}/5</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Overall Exp.</p>
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4, 5].map((s) => (
                                                <div key={s} className={`h-2 w-full rounded-full ${s <= overallExperienceRating ? 'bg-secondary' : 'bg-gray-200'}`}></div>
                                            ))}
                                        </div>
                                        <p className="text-xs text-right mt-1 font-medium text-gray-500">{overallExperienceRating}/5</p>
                                    </div>
                                </div>
                            </section>

                            {/* Rounds Section */}
                            <section id="rounds" className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 scroll-mt-32">
                                <h2 className="text-2xl font-bold text-primary mb-8 flex items-center gap-2">
                                    <Layers className="text-secondary" /> Interview Rounds
                                </h2>

                                <div className="space-y-12">
                                    {rounds.map((round, index) => {
                                        const details = round.details || {}
                                        let questionsList = []
                                        if (details.questions) {
                                            if (Array.isArray(details.questions)) questionsList = details.questions
                                            else if (typeof details.questions === 'string') questionsList = details.questions.split('\n').filter(q => q.trim())
                                        }

                                        return (
                                            <div key={index} className="relative pl-8 border-l-2 border-primary/20 last:border-0 pb-8 last:pb-0">
                                                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-primary border-4 border-white shadow-sm"></div>

                                                <div className="mb-4">
                                                    <h3 className="text-xl font-bold text-gray-800">{round.title}</h3>
                                                    <p className="text-sm text-secondary font-medium capitalize">{round.type.replace('-', ' ')}</p>
                                                </div>

                                                <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 space-y-4">
                                                    {/* Quick Stats Grid */}
                                                    <div className="flex flex-wrap gap-3 text-sm">
                                                        {details.platform && <span className="bg-white px-3 py-1 rounded border border-gray-200 text-gray-600 font-medium">💻 {details.platform}</span>}
                                                        {details.duration && <span className="bg-white px-3 py-1 rounded border border-gray-200 text-gray-600 font-medium">⏱️ {details.duration} mins</span>}
                                                        {details.difficulty && <span className="bg-white px-3 py-1 rounded border border-gray-200 text-gray-600 font-medium">📊 {details.difficulty}</span>}
                                                    </div>

                                                    {/* Content Areas */}
                                                    {details.topics && (
                                                        <div>
                                                            <h4 className="text-sm font-bold text-gray-700 uppercase mb-1">Topics</h4>
                                                            <p className="text-gray-600">{details.topics}</p>
                                                        </div>
                                                    )}

                                                    {questionsList.length > 0 && (
                                                        <div>
                                                            <h4 className="text-sm font-bold text-gray-700 uppercase mb-2">Questions</h4>
                                                            <ul className="list-disc pl-5 space-y-1 text-gray-600">
                                                                {questionsList.map((q, i) => <li key={i}>{q}</li>)}
                                                            </ul>
                                                        </div>
                                                    )}

                                                    {(details.notes || details.description) && (
                                                        <div>
                                                            <h4 className="text-sm font-bold text-gray-700 uppercase mb-1">Notes</h4>
                                                            <p className="text-gray-600 whitespace-pre-line">{details.notes || details.description}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </section>

                            {/* Materials Section */}
                            <section id="materials" className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 scroll-mt-32">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
                                        <BookOpen className="text-secondary" /> Study Materials
                                    </h2>
                                    <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-bold">
                                        {materials.length} Items
                                    </span>
                                </div>

                                {materials.length === 0 ? (
                                    <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                                        <p className="text-gray-500">No materials shared for this experience.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {materials.sort((a, b) => (a.type || '').localeCompare(b.type || '')).map((mat, idx) => (
                                            <div key={idx} className="bg-white p-5 rounded-xl border border-gray-200 hover:border-accent hover:shadow-md transition-all group">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="px-2 py-1 rounded text-xs font-bold uppercase tracking-wide bg-gray-100 text-gray-600">
                                                        {mat.type}
                                                    </span>
                                                    {mat.type === 'link' ? (
                                                        <ExternalLink size={16} className="text-gray-400 group-hover:text-secondary" />
                                                    ) : (
                                                        <Download size={16} className="text-gray-400 group-hover:text-secondary" />
                                                    )}
                                                </div>
                                                <h3 className="font-bold text-gray-800 mb-2 truncate" title={mat.title}>{mat.title || 'Untitled Material'}</h3>
                                                <p className="text-sm text-gray-500 mb-4 line-clamp-2">{mat.description || 'No description provided.'}</p>

                                                <button
                                                    onClick={() => downloadMaterial(mat)}
                                                    className="w-full py-2.5 rounded-lg bg-secondary text-white font-semibold hover:bg-opacity-90 hover:shadow-lg transition-all shadow-md text-sm flex items-center justify-center gap-2"
                                                >
                                                    {mat.type === 'link' ? <ExternalLink size={16} /> : <Download size={16} />}
                                                    {mat.type === 'link' ? 'Open Link' : 'Download Material'}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    )
}

export default ExperienceDetailPage
