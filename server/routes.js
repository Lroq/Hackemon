/**
 * Routes principales de l'application
 */
const express = require("express");
const path = require("path");
const axios = require("axios");

// Controllers
const AuthController = require("./controllers/AuthController");

// Middleware
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

// Middleware global pour les routes d'authentification
router.use(["/login", "/register"], sanitizeInput);
router.use(["/login", "/register"], logAuthAttempt);

// Routes d'authentification
router.post("/login", validateLoginData, AuthController.login);
router.post("/register", validateRegisterData, AuthController.register);
router.post("/logout", AuthController.logout);
router.post("/refresh-token", AuthController.refreshToken);

// Routes protégées (nécessitent un JWT valide)
router.get("/profile", requireAuth, AuthController.getProfile);
router.get("/session", optionalAuth, AuthController.checkSession);

// Route principale
router.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/templates/index.html"));
});

// Route de santé pour vérifier le serveur
router.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Route du coming soon
router.get("/coming-soon", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/templates/coming-soon.html"));
});

router.use(
  "/build",
  requireAuth,
  requireAdmin,
  express.static(path.join(__dirname, "../build"))
);



module.exports = router;
