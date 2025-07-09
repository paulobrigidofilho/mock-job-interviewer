// ==== Module imports ======= //
const express = require('express');
const session = require('express-session'); // For session management
require('dotenv').config();
const { setupMiddleware } = require('./middleware/cors'); 

// ========================= APP INITIALIZATION ==================== //
const app = express();
const port = process.env.PORT || 4000;

// ========================= SESSION CONFIGURATION =============== //
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',  // Use an environment variable for the secret in production
  resave: false,
  saveUninitialized: true, // Don't save uninitialized sessions
  cookie: { 
      secure: process.env.NODE_ENV === 'production', // Set secure to true in production
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Adjust sameSite as needed
      maxAge: 24 * 60 * 60 * 1000 // 24 hours (adjust as needed)
  }
}));

// ========================= MIDDLEWARE ============================ //
setupMiddleware(app); 
app.use(express.json()); 

///////////////////////////////////////////////////////////////////////
// ========================= ROUTES ================================ //
///////////////////////////////////////////////////////////////////////

// ===================== Routes Imports ============================ //

const chatRoutes = require('./routes/chatRoutes'); 

// ====================== Routes Setup ============================= //

app.use('/api/chat', chatRoutes);

///////////////////////////////////////////////////////////////////////
// ========================= SERVER START ========================== //
///////////////////////////////////////////////////////////////////////

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`Allowing requests from: ${process.env.FRONTEND_URL || 'http://localhost:5173 (default)'}`);
  if (!process.env.GOOGLE_API_KEY) {
      console.warn("Warning: GOOGLE_API_KEY environment variable not set. Gemini API calls will fail.");
  }
});