import { useState } from 'react'

// Basic form for editing an opportunity. Expects `opportunity` prop and
// an `onSave(updates)` callback that returns a promise.
export default function OpportunityEditor({ opportunity = {}, onSave }) {
  const [form, setForm] = useState({
    title: opportunity.title || '',
    companyName: opportunity.companyName || '',
    category: opportunity.category || '',
    opportunityType: opportunity.opportunityType || '',
    experienceLevel: opportunity.experienceLevel || '',
    location: opportunity.location || '',
    locationType: opportunity.locationType || '',
    applicationUrl: opportunity.applicationUrl || '',
    deadline: opportunity.deadline ? new Date(opportunity.deadline).toISOString().slice(0,10) : '',
    skills: (opportunity.skills || []).join(', '),
  })
  const [saving, setSaving] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    const payload = {
      ...form,
      skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
      deadline: form.deadline ? new Date(form.deadline) : undefined,
    }
    try {
      await onSave(payload)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Role title</label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            className="w-full mt-1 rounded-2xl border border-[#d6e6ed] focus:ring-2 focus:ring-[#088395] px-4 py-3"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Company</label>
          <input
            name="companyName"
            value={form.companyName}
            onChange={handleChange}
            required
            className="w-full mt-1 rounded-2xl border border-[#d6e6ed] focus:ring-2 focus:ring-[#088395] px-4 py-3"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Category</label>
          <input
            name="category"
            value={form.category}
            onChange={handleChange}
            className="w-full mt-1 rounded-2xl border border-[#d6e6ed] focus:ring-2 focus:ring-[#088395] px-4 py-3"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Type</label>
          <input
            name="opportunityType"
            value={form.opportunityType}
            onChange={handleChange}
            className="w-full mt-1 rounded-2xl border border-[#d6e6ed] focus:ring-2 focus:ring-[#088395] px-4 py-3"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Experience</label>
          <input
            name="experienceLevel"
            value={form.experienceLevel}
            onChange={handleChange}
            className="w-full mt-1 rounded-2xl border border-[#d6e6ed] focus:ring-2 focus:ring-[#088395] px-4 py-3"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Location</label>
          <input
            name="location"
            value={form.location}
            onChange={handleChange}
            className="w-full mt-1 rounded-2xl border border-[#d6e6ed] focus:ring-2 focus:ring-[#088395] px-4 py-3"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Work mode</label>
          <input
            name="locationType"
            value={form.locationType}
            onChange={handleChange}
            className="w-full mt-1 rounded-2xl border border-[#d6e6ed] focus:ring-2 focus:ring-[#088395] px-4 py-3"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Deadline</label>
          <input
            type="date"
            name="deadline"
            value={form.deadline}
            onChange={handleChange}
            className="w-full mt-1 rounded-2xl border border-[#d6e6ed] focus:ring-2 focus:ring-[#088395] px-4 py-3"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Application link</label>
          <input
            name="applicationUrl"
            value={form.applicationUrl}
            onChange={handleChange}
            className="w-full mt-1 rounded-2xl border border-[#d6e6ed] focus:ring-2 focus:ring-[#088395] px-4 py-3"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Skills (comma separated)</label>
        <input
          name="skills"
          value={form.skills}
          onChange={handleChange}
          className="w-full mt-1 rounded-2xl border border-[#d6e6ed] focus:ring-2 focus:ring-[#088395] px-4 py-3"
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
      >
        {saving ? 'Saving…' : 'Save'}
      </button>
    </form>
  )
}
