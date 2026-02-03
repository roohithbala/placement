import nodemailer from 'nodemailer'
import dotenv from 'dotenv'

dotenv.config()

const createTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // Use STARTTLS
    auth: {
      user: process.env.EMAIL_USER?.toLowerCase().trim(),
      pass: process.env.EMAIL_APP_PASSWORD?.replace(/\s+/g, ''),
    },
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  })
}

export const sendPasswordResetEmail = async (email, resetToken) => {
  const transporter = createTransporter()
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
  const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`

  const mailOptions = {
    from: `"PlaceHub" <${process.env.EMAIL_USER?.toLowerCase().trim()}>`,
    to: email.toLowerCase().trim(),
    subject: 'Password Reset Request - PlaceHub',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>You requested to reset your password for your PlaceHub account. Click the button below to reset it:</p>
            <div style="text-align: center;">
              <a href="${resetLink}" class="button">Reset Password</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #667eea;">${resetLink}</p>
            <p><strong>This link will expire in 10 minutes.</strong></p>
            <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
            <div class="footer">
              <p>© 2026 PlaceHub. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log(`Password reset email sent successfully to: ${email}`)
    return { success: true }
  } catch (error) {
    console.error('Email sending error:', error)
    throw error
  }
}

export const sendPasswordResetSuccessEmail = async (email) => {
  const transporter = createTransporter()

  const mailOptions = {
    from: `"PlaceHub" <${process.env.EMAIL_USER?.toLowerCase().trim()}>`,
    to: email.toLowerCase().trim(),
    subject: 'Password Reset Successful - PlaceHub',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✓ Password Reset Successful</h1>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>Your password has been successfully reset.</p>
            <p>You can now log in to your PlaceHub account with your new password.</p>
            <p>If you did not make this change, please contact our support team immediately.</p>
            <div class="footer">
              <p>© 2026 PlaceHub. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log(`Password reset success email sent to: ${email}`)
    return { success: true }
  } catch (error) {
    console.error('Email sending error:', error)
    // Don't throw error for success email - it's not critical
    return { success: false, error: error.message }
  }
}
