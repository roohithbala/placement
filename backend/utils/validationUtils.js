// Validation utilities for consistent server-side validation

// Email validation (college email)
export const validateCollegeEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.(edu|ac\.in|college\.com)$/i
  return emailRegex.test(email)
}

// Standard email validation
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Password validation
export const validatePassword = (password) => {
  if (!password || password.length < 8) {
    return {
      isValid: false,
      message: 'Password must be at least 8 characters long',
    }
  }
  return { isValid: true }
}

// Phone number validation
export const validatePhone = (phone) => {
  const phoneRegex = /^\d{10}$/
  return phoneRegex.test(phone)
}

// URL validation
export const validateUrl = (url) => {
  if (!url) return true // Optional field
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// Composite validation for signup
export const validateSignupData = (data) => {
  const errors = {}

  if (!data.email) {
    errors.email = 'Email is required'
  } else if (!validateCollegeEmail(data.email)) {
    errors.email = 'Please use a valid college email address'
  }

  const passwordValidation = validatePassword(data.password)
  if (!passwordValidation.isValid) {
    errors.password = passwordValidation.message
  }

  if (data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

// Composite validation for login
export const validateLoginData = (data) => {
  const errors = {}

  if (!data.email) {
    errors.email = 'Email is required'
  } else if (!validateEmail(data.email)) {
    errors.email = 'Please provide a valid email address'
  }

  if (!data.password) {
    errors.password = 'Password is required'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

// Profile data validation
export const validateProfileData = (data, requiredFields = []) => {
  const errors = {}

  // Check required fields
  requiredFields.forEach((field) => {
    if (!data[field]) {
      errors[field] = `${field} is required`
    }
  })

  // Validate email if provided
  if (data.collegeEmail && !validateCollegeEmail(data.collegeEmail)) {
    errors.collegeEmail = 'Please provide a valid college email'
  }

  if (data.personalEmail && !validateEmail(data.personalEmail)) {
    errors.personalEmail = 'Please provide a valid email'
  }

  // Validate phone if provided
  if (data.whatsappNumber && !validatePhone(data.whatsappNumber)) {
    errors.whatsappNumber = 'Please provide a valid 10-digit phone number'
  }

  // Validate URLs if provided
  if (data.linkedinUrl && !validateUrl(data.linkedinUrl)) {
    errors.linkedinUrl = 'Please provide a valid URL'
  }

  if (data.githubUrl && !validateUrl(data.githubUrl)) {
    errors.githubUrl = 'Please provide a valid URL'
  }

  if (data.portfolioUrl && !validateUrl(data.portfolioUrl)) {
    errors.portfolioUrl = 'Please provide a valid URL'
  }

  // Validate name length
  if (data.fullName && (data.fullName.length < 2 || data.fullName.length > 100)) {
    errors.fullName = 'Name must be between 2 and 100 characters'
  }

  // Validate roll number
  if (data.rollNumber && data.rollNumber.length < 3) {
    errors.rollNumber = 'Roll number must be at least 3 characters'
  }

  // Validate batch year
  if (data.batch) {
    const currentYear = new Date().getFullYear()
    const batch = parseInt(data.batch)
    if (batch < 2000 || batch > currentYear + 10) {
      errors.batch = 'Please provide a valid batch year'
    }
  }

  // Validate skills array
  if (data.skills) {
    if (!Array.isArray(data.skills)) {
      errors.skills = 'Skills must be an array'
    } else if (data.skills.length < 1 || data.skills.length > 20) {
      errors.skills = 'Please provide between 1 and 20 skills'
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}
