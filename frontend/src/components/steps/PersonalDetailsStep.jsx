'use client';

function PersonalDetailsStep({ formData, onChange }) {
  const handleChange = (e) => {
    const { name, value } = e.target
    onChange({ [name]: value })
  }

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold text-primary mb-6">Personal Details</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="John Doe"
            required
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary bg-gray-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Roll Number *</label>
          <input
            type="text"
            name="rollNumber"
            value={formData.rollNumber}
            onChange={handleChange}
            placeholder="2024001"
            required
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary bg-gray-50"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">College Email *</label>
        <input
          type="email"
          name="collegeEmail"
          value={formData.collegeEmail}
          onChange={handleChange}
          placeholder="your.email@college.edu"
          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-100 text-gray-600 cursor-not-allowed"
          disabled
          readOnly
        />
        <p className="text-xs text-gray-500 mt-1">
          This email is pulled from your login method and cannot be changed here.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp Number *</label>
        <div className="flex gap-2">
          <input
            type="text"
            value="+91"
            disabled
            className="w-16 px-3 py-2.5 rounded-lg border border-gray-300 bg-gray-100 text-gray-600 cursor-not-allowed"
          />
          <input
            type="tel"
            name="whatsappNumber"
            value={formData.whatsappNumber}
            onChange={handleChange}
            placeholder="1234567890"
            maxLength="10"
            pattern="[0-9]{10}"
            required
            className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary bg-gray-50"
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">Enter 10-digit mobile number</p>
      </div>
    </div>
  )
}

export default PersonalDetailsStep
