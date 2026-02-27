'use client';

import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import MainLayout from '../components/MainLayout'
import { MessageCircle, Send, Paperclip, X, Plus, Search } from 'lucide-react'
import { messageAPI, mentorshipAPI } from '../services/api'

function MessagesPage() {
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [showNewChatModal, setShowNewChatModal] = useState(false)
  const [potentialContacts, setPotentialContacts] = useState([])
  const [contactSearch, setContactSearch] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const [notification, setNotification] = useState(null)
  const messagesEndRef = useRef(null)
  const userId = localStorage.getItem('userId')

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 5000)
  }

  const location = useLocation()

  useEffect(() => {
    fetchConversations()
  }, [])

  // handle navigation state (e.g. from MeetingsPage) to preselect a conversation
  useEffect(() => {
    if (location.state?.conversation) {
      setSelectedConversation(location.state.conversation)
      // clear state so it doesn't persist on back/refresh
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation._id)
    }
  }, [selectedConversation])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchConversations = async () => {
    try {
      setLoading(true)
      const response = await messageAPI.getConversations()
      setConversations(response.data || [])
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (conversationId) => {
    try {
      const response = await messageAPI.getMessages(conversationId)
      setMessages(response.data || [])
      await messageAPI.markAsRead(conversationId)
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedConversation) return

    const otherUser = selectedConversation.participants.find(p => p._id !== userId)

    try {
      const response = await messageAPI.sendMessage({
        receiverId: otherUser._id,
        content: newMessage,
        messageType: 'text',
      })

      setMessages([...messages, response.data])
      setNewMessage('')
      fetchConversations()
    } catch (error) {
      console.error('Error sending message:', error)
      showNotification('Failed to send message', 'error')
    }
  }

  const fetchPotentialContacts = async () => {
    try {
      setSearchLoading(true)
      // Fetch both mentors and mentees to show as potential contacts
      const [mentorsRes, menteesRes] = await Promise.all([
        mentorshipAPI.getMentors({ limit: 20 }),
        mentorshipAPI.getMentees({ limit: 20 })
      ])

      const combined = [
        ...(mentorsRes.data.mentors || []),
        ...(menteesRes.data.mentees || [])
      ].filter(p => p.userId._id !== userId)

      setPotentialContacts(combined)
    } catch (error) {
      console.error('Error fetching contacts:', error)
    } finally {
      setSearchLoading(false)
    }
  }

  const filteredContacts = potentialContacts.filter(contact =>
    contact.fullName?.toLowerCase().includes(contactSearch.toLowerCase()) ||
    contact.company?.toLowerCase().includes(contactSearch.toLowerCase()) ||
    contact.branch?.toLowerCase().includes(contactSearch.toLowerCase())
  )

  const handleStartNewChat = async (otherUserId) => {
    try {
      const response = await messageAPI.startConversation(otherUserId)
      const newConv = response.data

      // Refresh conversations list to include the new/found one
      await fetchConversations()

      // Select the conversation
      setSelectedConversation(newConv)
      setShowNewChatModal(false)
      showNotification('Conversation started!')
    } catch (error) {
      console.error('Error starting conversation:', error)
      showNotification('Failed to start conversation', 'error')
    }
  }

  const formatTime = (date) => {
    const d = new Date(date)
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (date) => {
    const d = new Date(date)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (d.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (d.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
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
              {notification.type === 'success' ? <MessageCircle size={20} /> : <X size={20} />}
              <p className="font-bold">{notification.message}</p>
            </div>
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">Messages</h1>
          <p className="text-gray-600">Chat with mentors and peers</p>
        </div>

        <div className="grid grid-cols-12 gap-6 bg-white rounded-2xl shadow-xl overflow-hidden" style={{ height: '600px' }}>
          {/* Conversations List */}
          <div className="col-span-12 md:col-span-4 border-r border-gray-200 overflow-y-auto">
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-primary to-secondary flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Conversations</h2>
              <button
                onClick={() => {
                  setShowNewChatModal(true)
                  fetchPotentialContacts()
                }}
                className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-primary hover:bg-gray-100 transition-all shadow-md"
                title="Start New Chat"
              >
                <Plus size={20} />
              </button>
            </div>

            {loading ? (
              <div className="p-4 text-center text-gray-500">Loading...</div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <MessageCircle size={48} className="mx-auto mb-2 opacity-50" />
                <p>No conversations yet</p>
              </div>
            ) : (
              <div>
                {conversations.map((conv) => {
                  const otherUser = conv.participants?.find(p => p._id !== userId)
                  const otherProfile = conv.otherUserProfile

                  return (
                    <div
                      key={conv._id}
                      onClick={() => setSelectedConversation(conv)}
                      className={`p-4 border-b border-gray-100 cursor-pointer transition-all hover:bg-background ${selectedConversation?._id === conv._id ? 'bg-accent bg-opacity-10 border-l-4 border-l-accent' : ''
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary to-secondary text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
                          {otherProfile?.fullName?.[0] || otherUser?.email?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-primary truncate">
                              {otherProfile?.fullName || otherUser?.email || 'User'}
                            </h3>
                            {otherProfile?.placementStatus === 'placed' && (
                              <span className="px-1.5 py-0.5 bg-secondary text-white text-[8px] font-bold rounded uppercase flex-shrink-0">
                                Mentor
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 truncate">{conv.lastMessage || 'No messages yet'}</p>
                          <p className="text-xs text-gray-500">{formatDate(conv.lastMessageAt)}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Messages Area */}
          <div className="col-span-12 md:col-span-8 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-primary to-secondary">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white text-primary flex items-center justify-center font-bold">
                      {selectedConversation.otherUserProfile?.fullName?.[0] || 'U'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-white">
                          {selectedConversation.otherUserProfile?.fullName || 'User'}
                        </h3>
                        {selectedConversation.otherUserProfile?.placementStatus === 'placed' && (
                          <span className="px-1.5 py-0.5 bg-white text-secondary text-[8px] font-bold rounded uppercase">
                            Mentor
                          </span>
                        )}
                      </div>
                      {selectedConversation.otherUserProfile?.company && (
                        <p className="text-sm text-white opacity-90">
                          {selectedConversation.otherUserProfile.company}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                  {messages.map((msg) => {
                    const isOwn = msg.senderId._id === userId || msg.senderId === userId
                    return (
                      <div
                        key={msg._id}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl shadow-md ${isOwn
                            ? 'bg-secondary text-white rounded-br-none'
                            : 'bg-white text-gray-800 rounded-bl-none border border-gray-200'
                            }`}
                        >
                          <p className="break-words">{msg.content}</p>
                          <p
                            className={`text-xs mt-1 ${isOwn ? 'text-white opacity-75' : 'text-gray-500'
                              }`}
                          >
                            {formatTime(msg.createdAt)}
                            {msg.isRead && isOwn && ' · Read'}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-white">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-accent focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="px-6 py-2.5 rounded-lg bg-secondary text-white font-semibold hover:bg-accent transition shadow-md hover:shadow-lg disabled:bg-gray-300 disabled:cursor-not-allowed inline-flex items-center gap-2"
                    >
                      <Send size={18} />
                      Send
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <MessageCircle size={64} className="mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Select a conversation to start chatting</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-primary">New Conversation</h2>
              <button
                onClick={() => setShowNewChatModal(false)}
                className="p-1 hover:bg-gray-100 rounded-full text-gray-500"
              >
                <X size={24} />
              </button>
            </div>

            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search people..."
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-accent focus:outline-none transition-all"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {searchLoading ? (
                <div className="text-center py-8 text-gray-500">Loading contacts...</div>
              ) : filteredContacts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No contacts found</div>
              ) : (
                filteredContacts.map((contact) => (
                  <div
                    key={contact._id}
                    onClick={() => handleStartNewChat(contact.userId._id)}
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-background cursor-pointer transition-all border border-transparent hover:border-accent hover:border-opacity-30"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-secondary text-white flex items-center justify-center font-bold">
                      {contact.fullName?.[0] || 'U'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-primary">{contact.fullName}</h4>
                        {contact.placementStatus === 'placed' && (
                          <span className="px-1.5 py-0.5 bg-secondary text-white text-[8px] font-bold rounded uppercase">
                            Mentor
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{contact.company || contact.branch || 'User'}</p>
                    </div>
                    <button className="px-3 py-1 bg-accent bg-opacity-10 text-accent text-xs font-bold rounded-full">
                      Chat
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  )
}

export default MessagesPage
