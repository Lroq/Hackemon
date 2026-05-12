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

// 🔐 BUILD SECURISÉ
router.use(
  "/build",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const targetUrl = `http://localhost:9000${req.originalUrl}`;

      console.log("PROXY BUILD →", targetUrl);

      const response = await axios({
        method: req.method,
        url: targetUrl,
        headers: {
          ...req.headers,
          host: "localhost:9000",
        },
        responseType: "stream",
        validateStatus: () => true,
      });

      res.status(response.status);

      Object.entries(response.headers).forEach(([key, value]) => {
        if (
          !["content-encoding", "transfer-encoding"].includes(
            key.toLowerCase()
          )
        ) {
          res.setHeader(key, value);
        }
      });

      response.data.pipe(res);

    } catch (error) {
      console.error("Erreur proxy build:", error.message);

      res.status(503).json({
        error: "Service indisponible",
      });
    }
  }
);

module.exports = router;