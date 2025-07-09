// ======= Module imports ======= //

const cors = require("cors");
require("dotenv").config();

///////////////////////////////////////////////////////////////////////
// ================= CORS CONFIGURATION ================= /////////////
///////////////////////////////////////////////////////////////////////

// ========================= MIDDLEWARE SETUP ======================== //

const allowedOrigin = process.env.FRONTEND_URL || "http://localhost:5173"; // Default to localhost for development

const corsOptions = {

  origin: allowedOrigin, // Allow requests from this origin

  methods: "GET,HEAD,PUT,PATCH,POST,DELETE", // Allowed HTTP methods

  credentials: true, // Allow credentials (cookies, authorization headers, etc.)

  
  optionsSuccessStatus: 200, // Some legacy browsers (IE11, various SmartTVs) choke on 204
};

// ============================ MIDDLEWARE FUNCTION ===================== //
const setupMiddleware = (app) => {

  app.use(cors(corsOptions)); // Use CORS middleware with the specified options

  console.log(`CORS middleware configured. Allowing origin: ${allowedOrigin}`); // Log the allowed origin (Testing purpose)
};

module.exports = { setupMiddleware };
