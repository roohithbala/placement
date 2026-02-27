'use client';

import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import MainLayout from '../components/MainLayout'
import { Calendar, Clock, Video, Phone, MessageCircle, X, CheckCircle, XCircle } from 'lucide-react'
import { meetingAPI, profileAPI } from '../services/api'

function MeetingsPage() {
  const navigate = useNavigate()
  const [meetings, setMeetings] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('upcoming')
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [selectedMeeting, setSelectedMeeting] = useState(null)
  const [cancelReason, setCancelReason] = useState('')
  const [notification, setNotification] = useState(null)
  const currentUserId = localStorage.getItem('userId')
  const [userProfile, setUserProfile] = useState(null)

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 5000)
  }

  useEffect(() => {
    fetchUserProfile()
    fetchMeetings()
  }, [activeTab])

  const fetchUserProfile = async () => {
    try {
      const res = await profileAPI.get()
      setUserProfile(res.data?.profile)
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const fetchMeetings = async () => {
    try {
      setLoading(true)
      const response = await meetingAPI.getMeetings({ type: activeTab })
      setMeetings(response.data || [])
    } catch (error) {
      console.error('Error fetching meetings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelMeeting = async () => {
    if (!selectedMeeting || !cancelReason) return

    try {
      await meetingAPI.cancel(selectedMeeting._id, cancelReason)
      setShowCancelModal(false)
      setCancelReason('')
      setSelectedMeeting(null)
      fetchMeetings()
      showNotification('Meeting cancelled successfully')
    } catch (error) {
      console.error('Error cancelling meeting:', error)
      showNotification('Failed to cancel meeting', 'error')
    }
  }

  const handleCompleteMeeting = async (meetingId) => {
    try {
      await meetingAPI.complete(meetingId, '')
      fetchMeetings()
      showNotification('Meeting marked as completed')
    } catch (error) {
      console.error('Error completing meeting:', error)
      showNotification('Failed to complete meeting', 'error')
    }
  }

  const getMeetingTypeIcon = (type) => {
    switch (type) {
      case 'video':
        return <Video size={20} className="text-purple-600" />
      case 'voice':
        return <Phone size={20} className="text-blue-600" />
      default:
        return <MessageCircle size={20} className="text-green-600" />
    }
  }

  const getMeetingTypeBadge = (type) => {
    const configs = {
      video: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', label: 'Video Call' },
      voice: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: 'Voice Call' },
      chat: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', label: 'Chat' },
    }
    const config = configs[type] || configs.chat
    return (
      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text} border ${config.border}`}>
        {config.label}
      </span>
    )
  }

  const getStatusBadge = (status) => {
    const configs = {
      scheduled: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: 'Scheduled' },
      completed: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', label: 'Completed' },
      cancelled: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', label: 'Cancelled' },
      rescheduled: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', label: 'Rescheduled' },
    }
    const config = configs[status] || configs.scheduled
    return (
      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text} border ${config.border}`}>
        {config.label}
      </span>
    )
  }

  const formatDateTime = (date) => {
    const d = new Date(date)
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 py-12 bg-background relative">
        {/* Notification Banner */}
        {notification && (
          <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[100] min-w-[320px] p-4 rounded-2xl shadow-2xl animate-in slide-in-from-top duration-300 ${notification.type === 'success'
            ? 'bg-green-50 border-2 border-green-200 text-green-800'
            : 'bg-red-50 border-2 border-red-200 text-red-800'
            }`}>
            <div className="flex items-center gap-3">
              {notification.type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
              <p className="font-bold">{notification.message}</p>
            </div>
          </div>
        )}
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">My Meetings</h1>
          <p className="text-gray-600">Manage your scheduled mentorship sessions</p>
        </div>

        {/* Tabs */}
        <div className="mb-8 border-b-2 border-accent">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-6 py-3 font-semibold transition-all ${activeTab === 'upcoming'
                ? 'bg-primary text-white rounded-t-lg'
                : 'text-gray-700 hover:bg-background hover:text-secondary'
                }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setActiveTab('past')}
              className={`px-6 py-3 font-semibold transition-all ${activeTab === 'past'
                ? 'bg-primary text-white rounded-t-lg'
                : 'text-gray-700 hover:bg-background hover:text-secondary'
                }`}
            >
              Past
            </button>
          </div>
        </div>

        {/* Meetings List */}
        {loading ? (
          <div className="text-center py-12 text-primary">Loading...</div>
        ) : meetings.length === 0 ? (
          <div className="text-center py-12">
            <Calendar size={64} className="mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500 text-lg">No {activeTab} meetings</p>
            {userProfile?.placementStatus === 'placed' ? (
              <Link
                to="/mentorship"
                className="inline-block mt-4 px-6 py-3 rounded-lg bg-secondary text-white font-semibold hover:bg-accent transition shadow-md hover:shadow-lg"
              >
                View Mentorship Requests
              </Link>
            ) : (
              <Link
                to="/mentorship"
                className="inline-block mt-4 px-6 py-3 rounded-lg bg-secondary text-white font-semibold hover:bg-accent transition shadow-md hover:shadow-lg"
              >
                Find Mentors
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {meetings.map((meeting) => (
              <div
                key={meeting._id}
                className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:border-accent transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getMeetingTypeIcon(meeting.meetingType)}
                      <h3 className="text-xl font-bold text-primary">{meeting.title}</h3>
                    </div>
                    {meeting.description && (
                      <p className="text-gray-600 mb-3">{meeting.description}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    {getMeetingTypeBadge(meeting.meetingType)}
                    {getStatusBadge(meeting.status)}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Calendar size={18} className="text-secondary" />
                    <span>{formatDateTime(meeting.scheduledAt)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Clock size={18} className="text-secondary" />
                    <span>{meeting.duration} minutes</span>
                  </div>
                </div>

                {meeting.meetingLink && (
                  <div className="flex items-center gap-2 mb-4 p-3 bg-purple-50 rounded-lg border border-purple-100">
                    <Video size={18} className="text-purple-600" />
                    <span className="text-purple-800 font-medium text-sm">Meeting Link:</span>
                    <a
                      href={meeting.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:text-purple-700 underline text-sm truncate flex-1"
                    >
                      {meeting.meetingLink}
                    </a>
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                  {(() => {
                    // Determine who is the "other" person in the meeting
                    const isMentor = meeting.mentorId?._id === currentUserId || meeting.mentorId === currentUserId
                    const otherProfile = isMentor ? meeting.menteeProfile : meeting.mentorProfile
                    const roleLabel = isMentor ? 'Mentee' : 'Mentor'
                    const isOtherMentor = otherProfile?.placementStatus === 'placed'
                    return (
                      <>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-secondary text-white flex items-center justify-center font-bold">
                          {otherProfile?.fullName?.[0] || 'U'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-primary">
                              {otherProfile?.fullName || 'User'}
                            </p>
                            <span className={`px-1.5 py-0.5 text-white text-[8px] font-bold rounded uppercase ${isOtherMentor ? 'bg-secondary' : 'bg-accent'}`}>
                              {roleLabel}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            {otherProfile?.company || otherProfile?.branch || ''}
                          </p>
                        </div>
                      </>
                    )
                  })()}
                </div>

                {meeting.status === 'scheduled' && activeTab === 'upcoming' && (
                  <div className="flex gap-2 pt-4 border-t border-gray-100 flex-wrap">
                        {(meeting.meetingType === 'video' || meeting.meetingType === 'voice') && (
                      <button
                        onClick={() => navigate(`/meeting/${meeting._id}`)}
                        className="flex-1 px-4 py-2 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 transition shadow-md hover:shadow-lg inline-flex items-center justify-center gap-2"
                      >
                        <Video size={16} />
                        Join Meeting
                      </button>
                    )}
                    {meeting.meetingType === 'chat' && (
                      <button
                        onClick={async () => {
                          try {
                            const otherId =
                              meeting.mentorId?._id === currentUserId || meeting.mentorId === currentUserId
                                ? meeting.menteeId?._id || meeting.menteeId
                                : meeting.mentorId?._id || meeting.mentorId;
                            const resp = await messageAPI.startConversation(otherId);
                            // navigate to messages and preselect the new conv
                            navigate('/messages', { state: { conversation: resp.data } });
                          } catch (err) {
                            console.error('Failed to open chat from meeting', err);
                            showNotification('Unable to open chat', 'error');
                          }
                        }}
                        className="flex-1 px-4 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition shadow-md hover:shadow-lg inline-flex items-center justify-center gap-2"
                      >
                        <MessageCircle size={16} />
                        Open Chat
                      </button>
                    )}
                    <button
                      onClick={() => handleCompleteMeeting(meeting._id)}
                      className="flex-1 px-4 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition shadow-md hover:shadow-lg inline-flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={16} />
                      Mark Complete
                    </button>
                    <button
                      onClick={() => {
                        setSelectedMeeting(meeting)
                        setShowCancelModal(true)
                      }}
                      className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition shadow-md hover:shadow-lg inline-flex items-center justify-center gap-2"
                    >
                      <XCircle size={16} />
                      Cancel
                    </button>
                  </div>
                )}

                {meeting.status === 'cancelled' && meeting.cancelReason && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">
                      <span className="font-semibold">Cancellation reason:</span> {meeting.cancelReason}
                    </p>
                  </div>
                )}

                {meeting.notes && (
                  <div className="mt-4 p-3 bg-background rounded-lg">
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold text-primary">Notes:</span> {meeting.notes}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Cancel Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
              <h2 className="text-2xl font-bold text-primary mb-4">Cancel Meeting</h2>
              <p className="text-gray-600 mb-6">
                Are you sure you want to cancel this meeting? Please provide a reason.
              </p>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-primary mb-2">Reason *</label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-accent focus:outline-none"
                  rows="4"
                  placeholder="Please explain why you're cancelling..."
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleCancelMeeting}
                  disabled={!cancelReason}
                  className="flex-1 px-6 py-3 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 transition shadow-md hover:shadow-lg disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Cancel Meeting
                </button>
                <button
                  onClick={() => {
                    setShowCancelModal(false)
                    setCancelReason('')
                    setSelectedMeeting(null)
                  }}
                  className="flex-1 px-6 py-3 rounded-lg border-2 border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition"
                >
                  Keep Meeting
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}

export default MeetingsPage
