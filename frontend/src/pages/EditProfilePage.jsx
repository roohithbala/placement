import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Save, Loader, X, Camera, Trash2 } from "lucide-react";
import MainLayout from "../components/MainLayout";
import '../index.css';

const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-xl shadow-lg p-6 border border-gray-100 ${className}`}>
    {children}
  </div>
);

function EditProfile() {
  const navigate = useNavigate();
  const location = useLocation();
  const workStatusRef = useRef(null);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    fullName: "",
    rollNumber: "",
    collegeEmail: "",
    whatsappNumber: "",
    year: "",
    branch: "",
    batch: "",
    role: "",
    company: "",
    internshipType: "",
    linkedinUrl: "",
    githubUrl: "",
    skills: [],
    placementStatus: "not-placed", // added so user can update later
    willingToMentor: false,
    profilePicture: "", // optional - url or future file upload
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Common options
  const years = ["1st", "2nd", "3rd", "4th"];
  const branches = ["CSE", "IT", "ECE", "EEE", "ME", "CE", "AI&DS", "AI&ML", "Other"];
  const internshipTypes = ["Full-time", "Internship", "Freelance", "Not working"];

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (!loading && location.state?.scrollTo === 'work-status' && workStatusRef.current) {
      workStatusRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Clear state so it doesn't scroll again on refresh
      window.history.replaceState({}, document.title);
    }
  }, [loading, location.state]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("authToken");
      if (!token) {
        setError("No authentication token found. Please login again.");
        return;
      }

      const res = await fetch("http://localhost:5000/api/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error("Failed to load profile");

      const data = await res.json();
      const profile = data.profile || data;

      setFormData({
        fullName: profile.fullName || "",
        rollNumber: profile.rollNumber || "",
        collegeEmail: profile.collegeEmail || "",
        whatsappNumber: profile.whatsappNumber || "",
        year: profile.year || "",
        branch: profile.branch || "",
        batch: profile.batch || "",
        role: profile.role || "",
        company: profile.company || "",
        internshipType: profile.internshipType || "",
        linkedinUrl: profile.linkedinUrl || "",
        githubUrl: profile.githubUrl || "",
        skills: profile.skills || [],
        placementStatus: profile.placementStatus || "not-placed",
        willingToMentor: profile.willingToMentor || false,
        profilePicture: profile.profilePicture || "",
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSkillChange = (e) => {
    if (e.key === "Enter" && e.target.value.trim()) {
      e.preventDefault();
      const newSkill = e.target.value.trim();
      if (!formData.skills.includes(newSkill)) {
        setFormData((prev) => ({
          ...prev,
          skills: [...prev.skills, newSkill],
        }));
      }
      e.target.value = "";
    }
  };

  const removeSkill = (skillToRemove) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skillToRemove),
    }));
  };

  // Profile Picture Handlers
  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      setError('Image size must be less than 5MB');
      return;
    }

    setUploadingImage(true);
    setError(null);

    try {
      // Convert image to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          profilePicture: reader.result,
        }));
        setUploadingImage(false);
      };
      reader.onerror = () => {
        setError('Failed to read image file');
        setUploadingImage(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('Failed to upload image');
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({
      ...prev,
      profilePicture: "",
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const token = localStorage.getItem("authToken");

      if (!token) {
        throw new Error("Authentication token not found. Please login again.");
      }

      // Send to backend with PUT method
      const res = await fetch("http://localhost:5000/api/profile", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errData = await res.json();

        // Handle validation errors from backend
        if (errData.errors) {
          const errorMessages = Object.entries(errData.errors)
            .map(([field, message]) => `${field}: ${message}`)
            .join("\n");
          throw new Error(errorMessages || errData.message || "Validation failed");
        }

        throw new Error(errData.message || "Failed to update profile");
      }

      const data = await res.json();

      // Update localStorage with new profile data
      localStorage.setItem('user', JSON.stringify({
        ...JSON.parse(localStorage.getItem('user') || '{}'),
        fullName: formData.fullName,
        role: formData.role,
        company: formData.company,
        profilePicture: formData.profilePicture
      }));

      setSuccess(true);
      setTimeout(() => navigate("/profile"), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto px-4 py-12 flex justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader className="animate-spin text-secondary" size={48} />
            <p className="text-lg font-medium text-gray-600">Loading profile data...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 py-10">
        <button
          onClick={() => navigate("/profile")}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-primary transition"
        >
          <ArrowLeft size={20} />
          Back to Profile
        </button>

        <Card>
          <h1 className="text-3xl font-bold text-primary mb-8">Edit Profile</h1>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
              Profile updated successfully! Redirecting...
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Profile Picture Section */}
            <section className="bg-gradient-to-br from-background to-white rounded-xl p-6 border-2 border-accent">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Profile Picture</h2>
              
              <div className="flex flex-col md:flex-row items-center gap-6">
                {/* Profile Picture Preview */}
                <div className="relative">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    {uploadingImage ? (
                      <Loader className="animate-spin text-white" size={32} />
                    ) : formData.profilePicture ? (
                      <img
                        src={formData.profilePicture}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-white text-4xl font-bold">
                        {formData.fullName ? formData.fullName.charAt(0).toUpperCase() : '?'}
                      </div>
                    )}
                  </div>
                  
                  {/* Edit/Remove Overlay */}
                  {formData.profilePicture && !uploadingImage && (
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition shadow-md"
                      title="Remove picture"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                {/* Upload Instructions */}
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    {formData.profilePicture ? 'Update Your Photo' : 'Add Your Photo'}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Upload a professional photo. Accepted formats: JPEG, PNG, GIF, WebP (Max 5MB)
                  </p>
                  
                  <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                    <button
                      type="button"
                      onClick={handleImageClick}
                      disabled={uploadingImage}
                      className="px-6 py-2.5 bg-secondary text-white font-semibold rounded-lg shadow-md hover:bg-accent transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Camera size={18} />
                      {formData.profilePicture ? 'Change Photo' : 'Upload Photo'}
                    </button>
                    
                    {formData.profilePicture && (
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        disabled={uploadingImage}
                        className="px-6 py-2.5 border-2 border-red-500 text-red-500 font-semibold rounded-lg hover:bg-red-50 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Trash2 size={18} />
                        Remove Photo
                      </button>
                    )}
                  </div>
                  
                  {/* Hidden File Input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>
              </div>
            </section>

            {/* Personal Info */}
            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Roll Number
                  </label>
                  <input
                    type="text"
                    name="rollNumber"
                    value={formData.rollNumber}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    College Email
                  </label>
                  <input
                    type="email"
                    name="collegeEmail"
                    value={formData.collegeEmail}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This address appears on your profile and can be updated freely.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    WhatsApp / Phone
                  </label>
                  <input
                    type="tel"
                    name="whatsappNumber"
                    value={formData.whatsappNumber}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary"
                  />
                </div>
              </div>
            </section>

            {/* Academic Info */}
            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Academic Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                  <select
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary"
                  >
                    <option value="">Select Year</option>
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Branch
                  </label>
                  <select
                    name="branch"
                    value={formData.branch}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary"
                  >
                    <option value="">Select Branch</option>
                    {branches.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Batch
                  </label>
                  <input
                    type="text"
                    name="batch"
                    value={formData.batch}
                    onChange={handleChange}
                    placeholder="e.g. 2022-2026"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary"
                  />
                </div>
              </div>
            </section>

            {/* Current Status */}
            <section ref={workStatusRef}>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Current Status</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <input
                    type="text"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    placeholder="e.g. Software Development Intern"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company / Organization
                  </label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    placeholder="e.g. Google, Microsoft, Freelance"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    name="internshipType"
                    value={formData.internshipType}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary"
                  >
                    <option value="">Select Type</option>
                    {internshipTypes.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            {/* Social Links */}
            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Social Links</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    LinkedIn URL
                  </label>
                  <input
                    type="url"
                    name="linkedinUrl"
                    value={formData.linkedinUrl}
                    onChange={handleChange}
                    placeholder="https://linkedin.com/in/yourname"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    GitHub URL
                  </label>
                  <input
                    type="url"
                    name="githubUrl"
                    value={formData.githubUrl}
                    onChange={handleChange}
                    placeholder="https://github.com/yourusername"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary"
                  />
                </div>
              </div>
            </section>

            {/* Skills */}
            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Skills</h2>
              <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 min-h-[120px]">
                <input
                  type="text"
                  placeholder="Type skill and press Enter (e.g. React, Python, DSA)"
                  onKeyDown={handleSkillChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded mb-3 focus:outline-none focus:ring-2 focus:ring-secondary"
                />

                <div className="flex flex-wrap gap-2">
                  {formData.skills.map((skill) => (
                    <div
                      key={skill}
                      className="bg-secondary text-white px-4 py-1.5 rounded-full text-sm flex items-center gap-2 shadow-sm"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="text-white hover:text-red-200"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  {formData.skills.length === 0 && (
                    <p className="text-gray-500 text-sm italic">
                      No skills added yet
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Placement Status Section */}
            <section className="bg-gray-50 p-6 rounded-xl border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Placement Status
              </h3>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="placementStatus"
                    value="not-placed"
                    checked={formData.placementStatus === 'not-placed'}
                    onChange={handleChange}
                    className="w-4 h-4 text-secondary"
                  />
                  <span className="ml-2 text-gray-700">Not Placed Yet</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="placementStatus"
                    value="placed"
                    checked={formData.placementStatus === 'placed'}
                    onChange={handleChange}
                    className="w-4 h-4 text-secondary"
                  />
                  <span className="ml-2 text-gray-700">Already Placed</span>
                </label>
              </div>
            </section>

            {/* Mentor Toggle - only show if user is marked placed */}
            {formData.placementStatus === 'placed' ? (
              <section className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      Willing to Mentor
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Help guide junior students with projects, placements, or career advice
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="willingToMentor"
                      checked={formData.willingToMentor}
                      onChange={handleChange}
                      className="sr-only peer"
                    />
                    <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-secondary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-secondary"></div>
                  </label>
                </div>
              </section>
            ) : (
              <section className="bg-gray-50 p-6 rounded-xl border border-gray-200 text-gray-600 italic">
                You can opt into mentoring after you update your status to <strong>placed</strong>.
              </section>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate("/profile")}
                className="px-6 py-2.5 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className={`px-8 py-2.5 bg-secondary text-white font-semibold rounded-lg shadow-md hover:bg-accent transition flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                {saving ? (
                  <>
                    <Loader className="animate-spin" size={18} />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </Card>
      </div>
    </MainLayout>
  );
}

export default EditProfile;