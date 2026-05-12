const express = require("express");
const path = require("path");
const axios = require("axios");

const AuthController = require("./controllers/AuthController");

const {
  requireAuth,
  optionalAuth,
  logAuthAttempt,
  requireAdmin,
} = require("./middleware/auth");

const {
  validateRegisterData,
  validateLoginData,
  sanitizeInput,
} = require("./middleware/validation");

const router = express.Router();

// Middleware auth
router.use(["/login", "/register"], sanitizeInput);
router.use(["/login", "/register"], logAuthAttempt);

// Auth routes
router.post("/login", validateLoginData, AuthController.login);
router.post("/register", validateRegisterData, AuthController.register);
router.post("/logout", AuthController.logout);
router.post("/refresh-token", AuthController.refreshToken);

// Protected routes
router.get("/profile", requireAuth, AuthController.getProfile);
router.get("/session", optionalAuth, AuthController.checkSession);

// Main page
router.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/templates/index.html"));
});

// Health
router.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Coming soon
router.get("/coming-soon", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/templates/coming-soon.html"));
});

// BUILD SECURISÉ
router.use(
  "/build",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    console.log("BUILD PROXY HIT", req.originalUrl);
    try {
      // Remplace /build par / pour le jeu
      const gamePath = req.originalUrl.replace(/^\/build/, '') || '/';
      const targetUrl = `http://hackemon-jeu:9000${gamePath}`;
      
      const response = await axios({
        method: req.method,
        url: targetUrl,
        headers: {
          ...req.headers,
          host: "hackemon-jeu",
        },
        responseType: "stream",
      });

      res.status(response.status);
      Object.entries(response.headers).forEach(([k, v]) => {
        if (!["content-encoding", "transfer-encoding"].includes(k.toLowerCase())) {
          res.setHeader(k, v);
        }
      });
      response.data.pipe(res);
    } catch (err) {
      console.error("BUILD ERROR:", err.message);
      res.status(502).json({ error: "Build unreachable" });
    }
  }
);

module.exports = router;