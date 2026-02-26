'use client';

import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import MainLayout from '../components/MainLayout'
import { ChevronRight, Plus, Trash2, AlertCircle, Save, ArrowLeft, Upload, CheckCircle } from 'lucide-react'
import { experienceAPI } from '../services/api'

function ExperienceMaterialsForm() {
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [materials, setMaterials] = useState([])
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [experienceId, setExperienceId] = useState(location.state?.experienceId)
  const [summaryData, setSummaryData] = useState(null)

  // Redirect if no ID, or try to load draft
  useEffect(() => {
    const checkDraftOrRedirect = async () => {
      if (experienceId) {
        fetchExistingData()
      } else {
        // Try to fetch latest draft if no ID passed in state
        try {
          const res = await experienceAPI.getDraft();
          if (res.data.success && res.data.draft) {
            const draft = res.data.draft;
            // Reload with state
            navigate('/share-experience/materials', { state: { experienceId: draft._id }, replace: true });
          } else {
            setError('Missing experience details. Redirecting to start...')
            setTimeout(() => navigate('/share-experience/metadata'), 2000)
          }
        } catch (err) {
          setError('Missing experience details. Redirecting to start...')
          setTimeout(() => navigate('/share-experience/metadata'), 2000)
        }
      }
    }
    checkDraftOrRedirect();
  }, [experienceId])

  const fetchExistingData = async () => {
    try {
      const res = await experienceAPI.getById(experienceId)
      if (res.data.success) {
        setSummaryData(res.data.experience)
        if (res.data.experience.materials) {
          setMaterials(res.data.experience.materials)
        }
      }
    } catch (err) {
      console.error("Failed to load experience data", err)
    }
  }

  // Auto-save logic (only when there's meaningful data)
  useEffect(() => {
    if (materials.length > 0 && experienceId) {
      const hasData = materials.some(m => m.title || m.url || m.description || m.fileContent || m.fileName)
      if (hasData) {
        const timer = setTimeout(() => {
          saveMaterials(true)
        }, 3000)
        return () => clearTimeout(timer)
      }
    }
  }, [materials, experienceId])

  const saveMaterials = async (silent = false) => {
    if (!experienceId) return
    try {
      // sanitize payload: drop temporary ids and blank entries
      const payload = materials
        // keep items that have any meaningful data: title/url/description or file content/name
        .filter(m => m.title || m.url || m.description || m.fileContent || m.fileName)
        .map(({ id, ...rest }) => rest)
      const res = await experienceAPI.saveMaterials(experienceId, payload)
      if (payload.length === 0) {
        // do not wipe existing state when we deliberately sent an empty payload
      } else if (res.data && res.data.materials && res.data.materials.materials) {
        // server may have converted fileContent -> filePath; update state
        setMaterials(res.data.materials.materials)
      }
      if (!silent) {
        setSuccess('Materials saved!')
        setTimeout(() => setSuccess(''), 2000)
      }
    } catch (err) {
      if (!silent) setError('Failed to save materials')
    }
  }

  const addMaterial = () => {
    setMaterials([
      ...materials,
      {
        id: Date.now(),
        type: 'link',
        title: '',
        url: '',
        description: '',
      },
    ])
  }

  const deleteMaterial = (id) => {
    setMaterials(materials.filter((m) => m.id !== id))
  }

  const updateMaterial = (id, updates) => {
    setMaterials(
      materials.map((m) => (m.id === id ? { ...m, ...updates } : m))
    )
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    setError('')
    setSuccess('')
    setSubmitting(true)

    try {
      // Final save of materials (ensure payload cleaned)
      await saveMaterials(true)

      // Submit for approval (Change status to pending)
      const response = await experienceAPI.submit(experienceId)

      if (response.data.success) {
        setSuccess('Experience shared successfully!')
        setTimeout(() => {
          navigate('/my-experiences')
        }, 2000)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit experience')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-background py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Side - Progress Bar */}
            <div className="lg:col-span-3">
              <div className="lg:sticky lg:top-24">
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                  <h3 className="text-lg font-bold text-primary mb-6">Progress</h3>

                  {/* Step 1 - Completed */}
                  <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center font-bold shadow-md flex-shrink-0">
                        <CheckCircle size={20} />
                      </div>
                      <div>
                        <span className="font-bold text-green-600 block">Metadata</span>
                        <span className="text-xs text-green-500">Completed</span>
                      </div>
                    </div>
                    <div className="ml-5 pl-5 border-l-2 border-green-500 h-8"></div>
                  </div>

                  {/* Step 2 - Completed */}
                  <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center font-bold shadow-md flex-shrink-0">
                        <CheckCircle size={20} />
                      </div>
                      <div>
                        <span className="font-bold text-green-600 block">Rounds</span>
                        <span className="text-xs text-green-500">Completed</span>
                      </div>
                    </div>
                    <div className="ml-5 pl-5 border-l-2 border-green-500 h-8"></div>
                  </div>

                  {/* Step 3 - Active */}
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary text-white flex items-center justify-center font-bold shadow-md ring-4 ring-accent ring-opacity-20 flex-shrink-0">
                        3
                      </div>
                      <div>
                        <span className="font-bold text-primary block">Materials</span>
                        <span className="text-xs text-secondary">In Progress</span>
                      </div>
                    </div>
                  </div>

                  {/* Overall Progress Bar */}
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-gray-600 uppercase">Overall</span>
                      <span className="text-xs font-bold text-primary">100%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-primary to-secondary rounded-full w-full transition-all duration-500"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Form (75% width) */}
            <div className="lg:col-span-9">
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-4xl lg:text-5xl font-bold text-primary mb-3">Phase 3: Materials & Resources</h1>
                <p className="text-gray-600 text-lg">
                  Add helpful resources, documents, and links that will assist future candidates.
                </p>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="mb-6 p-5 bg-red-50 border-l-4 border-red-500 rounded-xl flex gap-3 shadow-md animate-in fade-in-50">
                  <AlertCircle className="text-red-600 flex-shrink-0" size={24} />
                  <p className="text-red-700 font-medium">{error}</p>
                </div>
              )}

              {/* Success Alert */}
              {success && (
                <div className="mb-6 p-5 bg-green-50 border-l-4 border-green-500 rounded-xl shadow-md animate-in fade-in-50">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="text-green-600" size={24} />
                    <p className="text-green-700 font-bold">{success}</p>
                  </div>
                </div>
              )}

              <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
                {/* Info Box */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-6 rounded-xl shadow-md">
                  <p className="text-blue-700 font-bold mb-2 text-lg">Optional Step</p>
                  <p className="text-blue-600 font-medium">
                    Adding materials and resources is optional but highly valuable. You can add useful links, documents, code snippets, or notes that helped you prepare.
                  </p>
                </div>

                {/* Materials List */}
                <div className="space-y-6">
                  {materials.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 relative">
                      {/* Decorative Elements */}
                      <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
                        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-accent opacity-5"></div>
                        <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-primary opacity-5"></div>
                      </div>

                      <div className="relative z-20 text-center py-20 px-8">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-accent to-secondary mx-auto mb-6 flex items-center justify-center">
                          <Plus size={40} className="text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-primary mb-3">No Materials Added Yet</h3>
                        <p className="text-gray-600 mb-8 text-lg max-w-md mx-auto">
                          Start by adding your first material or resource to help future candidates.
                        </p>
                        <button
                          type="button"
                          onClick={addMaterial}
                          className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-bold hover:shadow-2xl transition-all shadow-lg hover:scale-105"
                        >
                          <Plus size={24} />
                          Add First Material
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {materials.map((material, index) => (
                        <MaterialInput
                          key={material.id}
                          material={material}
                          index={index}
                          onUpdate={(updates) => updateMaterial(material.id, updates)}
                          onDelete={() => deleteMaterial(material.id)}
                        />
                      ))}
                      <button
                        type="button"
                        onClick={addMaterial}
                        className="flex items-center gap-2 px-8 py-4 rounded-xl bg-white border-2 border-accent text-accent font-bold hover:bg-accent hover:text-white transition-all shadow-md hover:shadow-lg"
                      >
                        <Plus size={24} />
                        Add Another Material
                      </button>
                    </>
                  )}
                </div>

                {/* Summary Section */}
                {summaryData && (
                  <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 relative overflow-hidden">
                    {/* Decorative Elements */}
                    <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
                      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-accent opacity-5"></div>
                      <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-primary opacity-5"></div>
                    </div>

                    <div className="relative z-20 p-8">
                      <h3 className="text-2xl font-bold text-primary mb-6">Experience Summary</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-gradient-to-br from-background to-white rounded-xl p-5 border border-gray-200 hover:border-accent transition-all shadow-sm">
                          <p className="text-xs text-gray-600 font-bold uppercase tracking-wide mb-2">Company</p>
                          <p className="font-bold text-gray-800 text-lg">{summaryData.companyName || 'N/A'}</p>
                        </div>
                        <div className="bg-gradient-to-br from-background to-white rounded-xl p-5 border border-gray-200 hover:border-accent transition-all shadow-sm">
                          <p className="text-xs text-gray-600 font-bold uppercase tracking-wide mb-2">Role</p>
                          <p className="font-bold text-gray-800 text-lg">{summaryData.roleAppliedFor || 'N/A'}</p>
                        </div>
                        <div className="bg-gradient-to-br from-background to-white rounded-xl p-5 border border-gray-200 hover:border-accent transition-all shadow-sm">
                          <p className="text-xs text-gray-600 font-bold uppercase tracking-wide mb-2">Batch</p>
                          <p className="font-bold text-gray-800 text-lg">{summaryData.batch || 'N/A'}</p>
                        </div>
                        <div className="bg-gradient-to-br from-background to-white rounded-xl p-5 border border-gray-200 hover:border-accent transition-all shadow-sm">
                          <p className="text-xs text-gray-600 font-bold uppercase tracking-wide mb-2">Outcome</p>
                          <p className={`font-bold text-lg ${summaryData.outcome === 'selected'
                            ? 'text-green-600'
                            : summaryData.outcome === 'not-selected'
                              ? 'text-red-600'
                              : 'text-yellow-600'
                            }`}>
                            {summaryData.outcome === 'selected' ? '✓ Selected' : summaryData.outcome === 'not-selected' ? '✗ Not Selected' : 'In Process'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-4 pt-6">
                  <button
                    type="button"
                    onClick={() => navigate('/share-experience/rounds', { state: { experienceId } })}
                    className="flex items-center gap-2 px-8 py-4 rounded-xl bg-white border-2 border-gray-300 text-gray-700 font-bold hover:border-gray-400 hover:bg-gray-50 transition-all shadow-md hover:shadow-lg"
                  >
                    <ArrowLeft size={20} />
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => saveMaterials(false)}
                    className="flex items-center gap-2 px-8 py-4 rounded-xl bg-white border-2 border-accent text-accent font-bold hover:bg-accent hover:text-white transition-all shadow-md hover:shadow-lg"
                  >
                    <Save size={20} />
                    Save Materials
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowReviewModal(true)}
                    className="flex-1 flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-bold hover:shadow-2xl transition-all shadow-lg hover:scale-105"
                  >
                    <CheckCircle size={20} />
                    Review & Submit
                  </button>
                </div>
              </form>

              {/* Review Modal */}
              {showReviewModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                  <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full max-h-[32rem] overflow-y-auto border-2 border-gray-100 relative animate-in fade-in-50 zoom-in-95">
                    {/* Decorative Elements */}
                    <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-accent opacity-10"></div>
                    <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-primary opacity-10"></div>

                    <div className="relative z-10">
                      <h2 className="text-3xl font-bold text-primary mb-6">Review Your Experience</h2>

                      {summaryData && (
                        <div className="space-y-6 mb-8">
                          <div className="bg-gradient-to-br from-background to-white rounded-xl p-5 border border-gray-200">
                            <p className="text-sm text-gray-600 font-bold mb-2 uppercase tracking-wide">Company</p>
                            <p className="text-xl font-bold text-gray-800">{summaryData.companyName}</p>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gradient-to-br from-background to-white rounded-xl p-5 border border-gray-200">
                              <p className="text-sm text-gray-600 font-bold mb-2 uppercase tracking-wide">Role</p>
                              <p className="text-lg font-bold text-gray-800">{summaryData.roleAppliedFor}</p>
                            </div>
                            <div className="bg-gradient-to-br from-background to-white rounded-xl p-5 border border-gray-200">
                              <p className="text-sm text-gray-600 font-bold mb-2 uppercase tracking-wide">Batch</p>
                              <p className="text-lg font-bold text-gray-800">{summaryData.batch}</p>
                            </div>
                          </div>

                          <div className="bg-gradient-to-br from-background to-white rounded-xl p-5 border border-gray-200">
                            <p className="text-sm text-gray-600 font-bold mb-2 uppercase tracking-wide">Materials Added</p>
                            <p className="text-gray-700 font-semibold">{materials.length} materials</p>
                          </div>

                          <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border-l-4 border-yellow-500 p-5 rounded-xl shadow-md">
                            <p className="text-sm text-yellow-700 font-medium">
                              Once submitted, your experience will be reviewed by our team and published after approval.
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-4">
                        <button
                          onClick={() => setShowReviewModal(false)}
                          className="flex-1 px-6 py-4 rounded-xl bg-gray-200 text-gray-800 font-bold hover:bg-gray-300 transition-all shadow-md"
                        >
                          Edit More
                        </button>
                        <button
                          onClick={() => {
                            setShowReviewModal(false)
                            handleSubmit({ preventDefault: () => { } })
                          }}
                          disabled={submitting}
                          className="flex-1 px-6 py-4 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-bold hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:scale-105"
                        >
                          {submitting ? 'Submitting...' : 'Confirm & Submit'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

function MaterialInput({ material, index, onUpdate, onDelete }) {
  const fileInputRef = useRef(null)

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (file) {
      // allow up to 50MB documents
      if (file.size > 50 * 1024 * 1024) {
        alert("File too large. Max 50MB.")
        return
      }

      if (experienceId) {
        try {
          const res = await experienceAPI.uploadMaterial(experienceId, file)
          // if server returned updated materials array, refresh state
          if (res.data?.materials?.materials) {
            setMaterials(res.data.materials.materials)
          }
        } catch (err) {
          console.error('File upload failed', err)
          alert('Upload failed')
        }
      } else {
        const reader = new FileReader()
        reader.onloadend = () => {
          onUpdate({
            fileName: file.name,
            fileType: file.type,
            fileContent: reader.result,
            url: '',
          })
        }
        reader.readAsDataURL(file)
      }
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 lg:p-10 space-y-6 border-2 border-gray-100 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-accent opacity-5"></div>
        <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-primary opacity-5"></div>
      </div>

      <div className="relative z-20">
        <div className="flex justify-between items-start mb-6">
          <h4 className="text-2xl font-bold text-primary">Material {index + 1}</h4>
          <button
            type="button"
            onClick={onDelete}
            className="p-4 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-all shadow-md hover:shadow-lg border-2 border-red-200 hover:border-red-300"
          >
            <Trash2 size={24} />
          </button>
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-background to-white rounded-xl p-5 border border-gray-200 hover:border-accent transition-all">
            <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Material Type</label>
            <select
              value={material.type}
              onChange={(e) => onUpdate({ type: e.target.value })}
              className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-secondary focus:ring-4 focus:ring-accent focus:ring-opacity-20 transition-all font-medium bg-white shadow-sm"
            >
              <option value="link">Link/Reference</option>
              <option value="document">Document/PDF</option>
              <option value="code">Code Snippet</option>
              <option value="note">Note/Tip</option>
              <option value="resource">Resource</option>
            </select>
          </div>

          <div className="bg-gradient-to-br from-background to-white rounded-xl p-5 border border-gray-200 hover:border-accent transition-all">
            <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Title</label>
            <input
              type="text"
              value={material.title}
              onChange={(e) => onUpdate({ title: e.target.value })}
              placeholder="e.g., Important DSA Concepts"
              className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-secondary focus:ring-4 focus:ring-accent focus:ring-opacity-20 transition-all font-medium placeholder-gray-400 bg-white shadow-sm"
            />
          </div>

          {(material.type === 'link' || material.type === 'document') && (
            <div className="bg-gradient-to-br from-background to-white rounded-xl p-5 border border-gray-200 hover:border-accent transition-all">
              <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                {material.type === 'link' ? 'URL' : 'File Upload'}
              </label>
              {material.type === 'link' ? (
                <input
                  type="url"
                  value={material.url}
                  onChange={(e) => onUpdate({ url: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-secondary focus:ring-4 focus:ring-accent focus:ring-opacity-20 transition-all font-medium placeholder-gray-400 bg-white shadow-sm"
                />
              ) : (
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    // accept common document/image types, pdf explicitly
                    accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*"
                    onChange={handleFileChange}
                  />

                  {material.fileName ? (
                    <div className="border-2 border-dashed border-green-500 bg-green-50 rounded-xl p-8 text-center transition-all shadow-sm relative group">
                      <CheckCircle className="mx-auto mb-3 text-green-600" size={48} />
                      <p className="text-green-800 font-bold text-lg mb-1 break-all px-4">{material.fileName}</p>
                      <p className="text-sm text-green-600 font-medium uppercase tracking-wide">{(material.fileType || 'Unknown Type').split('/')[1] || 'FILE'}</p>
                      {material.filePath && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); window.open(material.filePath, '_blank') }}
                          className="mt-2 px-4 py-2 bg-blue-50 text-blue-600 text-sm font-bold rounded-lg shadow-sm hover:bg-blue-100 border border-blue-200 hover:border-blue-300 transition-all"
                        >
                          View / Download
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdate({ fileName: '', fileContent: '', fileType: '' });
                        }}
                        className="mt-6 px-4 py-2 bg-white text-red-500 text-sm font-bold rounded-lg shadow-sm hover:bg-red-50 border border-gray-200 hover:border-red-200 transition-all"
                      >
                        Remove File
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center hover:border-secondary hover:bg-background cursor-pointer transition-all shadow-sm group"
                    >
                      <Upload className="mx-auto mb-4 text-gray-400 group-hover:text-secondary transition-colors" size={40} />
                      <p className="text-gray-700 font-bold mb-2 group-hover:text-secondary transition-colors">Click to upload or drag & drop</p>
                      <p className="text-sm text-gray-500 font-medium">PDF, DOC, Image (Max 10MB)</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="bg-gradient-to-br from-background to-white rounded-xl p-5 border border-gray-200 hover:border-accent transition-all">
            <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Description</label>
            <textarea
              value={material.description}
              onChange={(e) => onUpdate({ description: e.target.value })}
              placeholder="Explain why this resource is helpful"
              rows="4"
              className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-secondary focus:ring-4 focus:ring-accent focus:ring-opacity-20 transition-all font-medium placeholder-gray-400 bg-white shadow-sm"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default ExperienceMaterialsForm