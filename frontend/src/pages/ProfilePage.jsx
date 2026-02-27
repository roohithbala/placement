import React, { useState, useEffect } from "react";
import { FileText, Briefcase, BookOpen, Users, MapPin, Calendar, Mail, Phone, Loader, Edit } from 'lucide-react'
import MainLayout from '../components/MainLayout'
import { useNavigate } from 'react-router-dom'
import '../index.css'
const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all ${className}`}>
    {children}
  </div>
);

// Avatar component with first letter
const Avatar = ({ name, imageUrl, size = 'large' }) => {
  const sizeClasses = {
    large: 'w-24 h-24 text-3xl',
    medium: 'w-16 h-16 text-xl',
    small: 'w-12 h-12 text-lg',
  };

  const firstLetter = name?.charAt(0).toUpperCase() || '?';
  const avatarColors = [
    '#071952', // --color-avatar-1
    '#088395', // --color-avatar-2
    '#37B7C3', // --color-avatar-3
    '#0F5C7F', // --color-avatar-4
    '#2A8FA3', // --color-avatar-5
    '#5CB3CC', // --color-avatar-6
  ];
  
  // Use first letter to determine color consistently
  const colorIndex = firstLetter.charCodeAt(0) % avatarColors.length;
  const bgColor = avatarColors[colorIndex];

  if (imageUrl) {
    return (
      <img 
        src={imageUrl} 
        alt="avatar" 
        className={`${sizeClasses[size]} rounded-full border-4 shadow-lg object-cover`}
        style={{ borderColor: '#088395' }}
      />
    );
  }

  return (
    <div 
      className={`${sizeClasses[size]} rounded-full border-4 border-white shadow-lg flex items-center justify-center text-white font-bold`}
      style={{ backgroundColor: bgColor }}
    >
      {firstLetter}
    </div>
  );
};

function ProfilePage() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingMentor, setUpdatingMentor] = useState(false);

  // determine if the profile belongs to the logged-in user
  const currentUserId = localStorage.getItem('userId');
  const isOwnProfile = profile && (
    profile.userId === currentUserId || profile.userId?._id === currentUserId
  );

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        setError('No authentication token found');
        return;
      }

      const response = await fetch('http://localhost:5000/api/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch profile: ${response.statusText}`);
      }

      const data = await response.json();
      const prof = data.profile || data;
      setProfile(prof);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Profile fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 py-12 flex items-center justify-center h-96">
          <div className="flex flex-col items-center gap-4">
            <Loader className="animate-spin text-secondary" size={40} />
            <p className="text-gray-600 font-medium">Loading profile...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 py-12">
          <Card className="bg-red-50 border-red-200">
            <p className="text-red-700 font-semibold">Error: {error}</p>
            <button 
              onClick={fetchProfile}
              className="mt-4 px-6 py-2.5 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition"
            >
              Retry
            </button>
          </Card>
        </div>
      </MainLayout>
    );
  }

  if (!profile) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 py-12">
          <Card className="bg-yellow-50 border-yellow-200">
            <p className="text-yellow-700 font-semibold">No profile data found</p>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 py-12 bg-background">
        
        {/* Profile Header Card */}
        <Card className="mb-8 md:col-span-2 relative overflow-hidden group">
          {/* Decorative Elements */}
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-accent opacity-10 group-hover:opacity-20 transition-opacity"></div>
          <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-primary opacity-10 group-hover:opacity-20 transition-opacity"></div>
          
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-6">
              <div className="relative">
                <Avatar name={profile.fullName} imageUrl={profile.profilePicture} size="large" />
                <div className="absolute bottom-2 right-2 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2">{profile.fullName || 'N/A'}</h1>
                <p className="text-gray-700 mb-4 leading-relaxed">
                  {profile.year && profile.branch ? `${profile.year} Year - ${profile.branch}` : 'Profile Information'}
                </p>
                <button 
                  onClick={() => navigate('/edit-profile')}
                  className="px-6 py-2.5 rounded-lg bg-secondary text-white font-semibold hover:bg-accent transition shadow-md hover:shadow-lg flex items-center gap-2"
                >
                  <Edit size={18} />
                  Edit Profile
                </button>
              </div>
            </div>

            <hr className="my-6 border-gray-200" />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-background rounded-lg hover:bg-gray-50 transition">
                <p className="text-gray-600 text-sm font-medium mb-1">Roll Number</p>
                <p className="text-lg font-bold text-primary">{profile.rollNumber || 'N/A'}</p>
              </div>
              <div className="p-4 bg-background rounded-lg hover:bg-gray-50 transition">
                <p className="text-gray-600 text-sm font-medium mb-1 flex items-center gap-1">
                  <Mail size={14} /> Email
                </p>
                <p className="text-sm font-bold text-primary truncate">{profile.collegeEmail || 'N/A'}</p>
              </div>
              <div className="p-4 bg-background rounded-lg hover:bg-gray-50 transition">
                <p className="text-gray-600 text-sm font-medium mb-1 flex items-center gap-1">
                  <Phone size={14} /> Phone
                </p>
                <p className="text-sm font-bold text-primary">{profile.whatsappNumber || 'N/A'}</p>
              </div>
              <div className="p-4 bg-background rounded-lg hover:bg-gray-50 transition">
                <p className="text-gray-600 text-sm font-medium mb-1">Placement Status</p>
                <p className="inline-block px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full capitalize">
                  {profile.placementStatus || 'Not-placed'}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          
          {/* Currently Working Card */}
          <Card>
            <h3 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
              <Briefcase size={24} className="text-secondary" />
              Current Status
            </h3>
            
            {/* Show individual fields only if they have data */}
            {profile.role && (
              <div className="mb-4">
                <p className="text-gray-600 text-sm font-medium mb-1">Role</p>
                <p className="text-lg font-bold text-primary">{profile.role}</p>
              </div>
            )}
            
            {profile.company && (
              <div className="mb-4">
                <p className="text-gray-600 text-sm font-medium mb-1">Company</p>
                <p className="text-gray-800 font-semibold">{profile.company}</p>
              </div>
            )}
            
            {profile.internshipType && (
              <div className="mb-4">
                <p className="text-gray-600 text-sm font-medium mb-1">Type</p>
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full capitalize">
                  {profile.internshipType}
                </span>
              </div>
            )}
            
            {profile.batch && (
              <div className="mb-4">
                <p className="text-gray-600 text-sm font-medium mb-1">Batch</p>
                <p className="text-gray-800 font-semibold">{profile.batch}</p>
              </div>
            )}
            
            {/* Show "Add Work Status" only when both role and company are missing */}
            {!profile.role && !profile.company && (
              <button className="w-full mt-4 px-4 py-2.5 rounded-lg bg-accent text-white font-semibold hover:bg-primary transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2">
                <Briefcase size={18} />
                Add Work Status
              </button>
            )}
          </Card>

          {/* Academic Details Card */}
          <Card>
            <h3 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
              <BookOpen size={24} className="text-secondary" />
              Academic Details
            </h3>
            <div className="bg-background rounded-lg p-4 border border-gray-200 space-y-3">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Branch</p>
                <p className="text-lg font-bold text-primary">{profile.branch || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Year</p>
                <p className="text-gray-800 font-semibold">{profile.year || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Batch</p>
                <p className="text-gray-800 font-semibold">{profile.batch || 'N/A'}</p>
              </div>
            </div>
          </Card>

          {/* Socials Card */}
          <Card>
            <h3 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
              <Users size={24} className="text-secondary" />
              Social Links
            </h3>
            <ul className="space-y-3">
              {profile.linkedinUrl && (
                <li>
                  <a 
                    href={profile.linkedinUrl} 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-secondary font-semibold hover:text-accent transition flex items-center gap-2 p-2 rounded-lg hover:bg-background"
                  >
                    <span className="text-xl">🔗</span>
                    LinkedIn Profile
                  </a>
                </li>
              )}
              {profile.githubUrl && (
                <li>
                  <a 
                    href={profile.githubUrl} 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-secondary font-semibold hover:text-accent transition flex items-center gap-2 p-2 rounded-lg hover:bg-background"
                  >
                    <span className="text-xl">💻</span>
                    GitHub Profile
                  </a>
                </li>
              )}
              {!profile.linkedinUrl && !profile.githubUrl && (
                <p className="text-gray-500 text-sm italic">No social links added</p>
              )}
            </ul>
          </Card>
        </div>

        {/* Skills Section */}
        {profile.skills && profile.skills.length > 0 && (
          <Card className="mb-8">
            <h3 className="text-2xl font-bold text-primary mb-6 flex items-center gap-2">
              <FileText size={28} className="text-secondary" />
              Skills & Expertise
            </h3>
            <div className="flex flex-wrap gap-3">
              {profile.skills.map(skill => (
                <span 
                  key={skill} 
                  className="px-4 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-full text-sm font-semibold hover:shadow-lg transition shadow-md"
                >
                  {skill}
                </span>
              ))}
            </div>
          </Card>
        )}

        {/* Mentor Status (visible only if placed) */}
        {profile.placementStatus === 'placed' && (
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-primary mb-1">Willing to Mentor</h3>
                <p className="text-gray-600">Help junior students with guidance</p>
              </div>
              {isOwnProfile ? (
                <label className={`relative inline-flex items-center cursor-pointer ${updatingMentor ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <input
                    type="checkbox"
                    checked={profile.willingToMentor}
                    onChange={async () => {
                      try {
                        setUpdatingMentor(true);
                        const token = localStorage.getItem('authToken');
                        const res = await fetch('http://localhost:5000/api/profile', {
                          method: 'PUT',
                          headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({ willingToMentor: !profile.willingToMentor }),
                        });
                        if (!res.ok) throw new Error('Update failed');
                        const resp = await res.json();
                        setProfile(resp.profile || resp);
                      } catch (err) {
                        console.error('Failed to update mentor status', err);
                      } finally {
                        setUpdatingMentor(false);
                      }
                    }}
                    disabled={updatingMentor}
                    className="sr-only peer"
                  />
                  <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-secondary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-secondary"></div>
                </label>
              ) : (
                <div className={`px-4 py-2 rounded-full font-bold text-white ${profile.willingToMentor ? 'bg-green-500' : 'bg-gray-400'}`}>
                  {profile.willingToMentor ? 'Yes' : 'No'}
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}

export default ProfilePage;