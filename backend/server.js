import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import dotenv from 'dotenv'
import http from 'http'

// Load environment variables FIRST
dotenv.config()

import authRoutes from './routes/authRoutes.js'
import profileRoutes from './routes/profileRoutes.js'
import experienceRoutes from './routes/experienceRoutes.js'
import messageRoutes from './routes/messageRoutes.js'
import mentorshipRoutes from './routes/mentorshipRoutes.js'
import meetingRoutes from './routes/meetingRoutes.js'
import questionRoutes from './routes/questionRoutes.js'
import notificationRoutes from './routes/notificationRoutes.js'
import adminRoutes from './routes/adminRoutes.js'
import setupWebSocket from './websocket/socket.js';
import anonQuestionRoutes from './routes/question.routes.js';
import answerRoutes from './routes/answer.routes.js';
import sessionRoutes from './routes/session.routes.js';
import { startArchiveScheduler } from './utils/archiveScheduler.js';
import opportunityRoutes from './routes/opportunityRoutes.js'
import passwordResetRoutes from './routes/passwordResetRoutes.js'
import { requestLogger } from './middlewares/loggerMiddleware.js'

const app = express()

// Middleware
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    
    const isAllowed = allowedOrigins.includes(origin) || 
                      origin.endsWith('.vercel.app') ||
                      origin.includes('localhost');
                      
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}))
app.use(express.json({ limit: '200mb' }))
app.use(express.urlencoded({ limit: '200mb', extended: true }))

// static directory for uploaded files
import path from 'path'
import fs from 'fs'
const uploadsDir = process.env.VERCEL 
  ? '/tmp' 
  : path.join(process.cwd(), 'uploads')

if (!process.env.VERCEL && !fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true })
}
app.use('/uploads', express.static(uploadsDir))

// Apply logger after basic parsing but before routes
app.use(requestLogger)

// Database connection (mongoose queues requests until connected)
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/placehub';
mongoose.connect(mongoUri)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes registered synchronously at root level
app.use('/api/auth', authRoutes)
app.use('/api/profile', profileRoutes)
app.use('/api/experience', experienceRoutes)
app.use('/api/messages', messageRoutes)
app.use('/api/mentorship', mentorshipRoutes)
app.use('/api/meetings', meetingRoutes)
app.use('/api/questions', questionRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/opportunities', opportunityRoutes)
app.use('/api/password-reset', passwordResetRoutes)

// Anon-Chat Routes
app.use('/api/anon-questions', anonQuestionRoutes);
app.use('/api/answers', answerRoutes);
app.use('/api/sessions', sessionRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' })
})

// Root gateway status page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>PlaceHub Services Gateway</title>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
      <style>
        :root {
          --bg-dark: #030712;
          --bg-card: rgba(17, 24, 39, 0.4);
          --border: rgba(255, 255, 255, 0.05);
          --accent-blue: #0ea5e9;
          --accent-purple: #8b5cf6;
          --text-main: #f3f4f6;
          --text-muted: #9ca3af;
          --success: #10b981;
          --warning: #f59e0b;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: 'Outfit', sans-serif;
          background-color: var(--bg-dark);
          color: var(--text-main);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background-image: 
            radial-gradient(circle at 10% 20%, rgba(14, 165, 233, 0.08) 0%, transparent 40%),
            radial-gradient(circle at 90% 80%, rgba(139, 92, 246, 0.08) 0%, transparent 40%);
          padding: 1.5rem;
        }
        .gateway-card {
          width: 100%;
          max-width: 720px;
          background: var(--bg-card);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid var(--border);
          border-radius: 24px;
          padding: 2.5rem;
          box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.7);
        }
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--border);
          padding-bottom: 2rem;
          margin-bottom: 2rem;
        }
        .brand {
          display: flex;
          align-items: center;
          gap: 1.25rem;
        }
        .brand-icon {
          width: 52px;
          height: 52px;
          background: linear-gradient(135deg, var(--accent-blue) 0%, var(--accent-purple) 100%);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          font-weight: 700;
          color: white;
          box-shadow: 0 8px 24px -6px rgba(14, 165, 233, 0.5);
        }
        .brand-info h1 {
          font-size: 1.5rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          background: linear-gradient(to right, #ffffff, #d1d5db);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .brand-info p {
          font-size: 0.875rem;
          color: var(--text-muted);
          margin-top: 0.15rem;
        }
        .status-badge {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          background: rgba(16, 185, 129, 0.08);
          color: var(--success);
          padding: 0.5rem 1.25rem;
          border-radius: 9999px;
          font-size: 0.875rem;
          font-weight: 600;
          border: 1px solid rgba(16, 185, 129, 0.15);
        }
        .status-dot {
          width: 8px;
          height: 8px;
          background-color: var(--success);
          border-radius: 50%;
          box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
        .metrics-grid {
          display: grid;
          grid-template-cols: repeat(3, 1fr);
          gap: 1.25rem;
          margin-bottom: 2.25rem;
        }
        .metric-card {
          background: rgba(255, 255, 255, 0.01);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 1.25rem;
          text-align: left;
          transition: border-color 0.2s ease;
        }
        .metric-card:hover {
          border-color: rgba(14, 165, 233, 0.2);
        }
        .metric-card h3 {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
          margin-bottom: 0.5rem;
        }
        .metric-card p {
          font-size: 1.15rem;
          font-weight: 600;
        }
        .endpoints-box h2 {
          font-size: 1.1rem;
          font-weight: 600;
          margin-bottom: 1rem;
          color: white;
        }
        .endpoints-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .endpoint-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.875rem 1.25rem;
          background: rgba(255, 255, 255, 0.015);
          border: 1px solid var(--border);
          border-radius: 12px;
          font-family: monospace;
          transition: background 0.2s ease;
        }
        .endpoint-item:hover {
          background: rgba(255, 255, 255, 0.03);
        }
        .endpoint-route {
          display: flex;
          align-items: center;
          gap: 0.875rem;
        }
        .badge-method {
          font-size: 0.75rem;
          font-weight: 700;
          padding: 0.25rem 0.5rem;
          border-radius: 6px;
        }
        .badge-method.get {
          background: rgba(14, 165, 233, 0.12);
          color: var(--accent-blue);
        }
        .badge-method.post {
          background: rgba(16, 185, 129, 0.12);
          color: var(--success);
        }
        .endpoint-path {
          color: var(--text-main);
          font-size: 0.875rem;
        }
        .endpoint-desc {
          font-family: 'Outfit', sans-serif;
          font-size: 0.875rem;
          color: var(--text-muted);
        }
        .footer {
          margin-top: 2.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid var(--border);
          text-align: center;
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        @media (max-width: 640px) {
          .metrics-grid {
            grid-template-cols: 1fr;
          }
          .gateway-card {
            padding: 1.5rem;
          }
          .endpoint-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }
        }
      </style>
    </head>
    <body>
      <div class="gateway-card">
        <div class="header">
          <div class="brand">
            <div class="brand-icon">P</div>
            <div class="brand-info">
              <h1>PlaceHub API Services</h1>
              <p>Core Services & Placement Engine</p>
            </div>
          </div>
          <div class="status-badge">
            <div class="status-dot"></div>
            <span>Operational</span>
          </div>
        </div>

        <div class="metrics-grid">
          <div class="metric-card">
            <h3>Database</h3>
            <p style="color: var(--success)">CONNECTED</p>
          </div>
          <div class="metric-card">
            <h3>Gateway</h3>
            <p style="color: var(--accent-blue)">ACTIVE</p>
          </div>
          <div class="metric-card">
            <h3>WS Engine</h3>
            <p style="color: var(--warning)">SERVERLESS</p>
          </div>
        </div>

        <div class="endpoints-box">
          <h2>Key Endpoints</h2>
          <div class="endpoints-list">
            <div class="endpoint-item">
              <div class="endpoint-route">
                <span class="badge-method get">GET</span>
                <span class="endpoint-path">/api/health</span>
              </div>
              <span class="endpoint-desc">Service health status</span>
            </div>
            
            <div class="endpoint-item">
              <div class="endpoint-route">
                <span class="badge-method post">POST</span>
                <span class="endpoint-path">/api/auth/login</span>
              </div>
              <span class="endpoint-desc">Acquire authentication token</span>
            </div>

            <div class="endpoint-item">
              <div class="endpoint-route">
                <span class="badge-method get">GET</span>
                <span class="endpoint-path">/api/profile</span>
              </div>
              <span class="endpoint-desc">Retrieve profile credentials</span>
            </div>

            <div class="endpoint-item">
              <div class="endpoint-route">
                <span class="badge-method get">GET</span>
                <span class="endpoint-path">/api/opportunities</span>
              </div>
              <span class="endpoint-desc">Explore active job placements</span>
            </div>
          </div>
        </div>

        <div class="footer">
          <p>&copy; 2026 PlaceHub Application Gateway. Powered by Vercel Serverless.</p>
        </div>
      </div>
    </body>
    </html>
  `)
})

const server = http.createServer(app);

// Start WebSocket, scheduler and listen ONLY if not running on Vercel Serverless
if (!process.env.VERCEL) {
  setupWebSocket(server);
  startArchiveScheduler();
  const PORT = process.env.PORT || 5000
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
}

export default app;

