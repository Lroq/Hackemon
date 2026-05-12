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

// Route protégée pour /build (admin uniquement)
router.use(
  "/build",
  requireAuth,
  requireAdmin,

async (req, res, next) => {
    try {
      const targetUrl = 'http://localhost:9000${req.originalUrl}' ;

      const response = await axios({
        method: req.method,
        url: targetUrl,
        headers: {
          ...req.headers,
          host: "localhost:9000",
        },
        data: req.body,
        validateStatus: () => true, // Accepte tous les codes de statut
      });

      // Copier les headers de la réponse
      Object.keys(response.headers).forEach((key) => {
        if (!["content-encoding", "transfer-encoding"].includes(key.toLowerCase())) {
          res.setHeader(key, response.headers[key]);
        }
      });

      res.status(response.status).send(response.data);
    } catch (error) {
      console.error("Erreur lors du proxy vers /build:", error.message);
      res.status(503).json({
        error: "Service indisponible",
        code: "SERVICE_UNAVAILABLE",
      });
    }
  }
);

module.exports = router;
