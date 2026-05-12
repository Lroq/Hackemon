const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { loginUser, setUsersStorage } = require('../js/login');
const { registerUser, getUserIdCounter } = require('../js/register');
const { refreshAccessToken } = require('../js/tokenManager');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'hackemon_jwt_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

// Stockage en mémoire des utilisateurs (partagé avec les modules login et register)
const users = new Map();
let userIdCounter = 1;

const AUTH_COOKIE_NAME = 'auth_token';
const REFRESH_COOKIE_NAME = 'refresh_token';

const applyAuthCookies = (res, token, refreshToken) => {
  if (token) {
    res.cookie(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 1000,
    });
  }

  if (refreshToken) {
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }
};

// Synchroniser le stockage avec le module de login
if (typeof setUsersStorage === 'function') setUsersStorage(users);

class AuthController {
  // Connexion
  static async login(req, res) {
    try {
      const credentials = req.body || {};
      const result =
        typeof loginUser === 'function' ? await loginUser(credentials) : null;

      if (result && result.success) {
        const tokenField =
          result.token ||
          (result.tokens &&
            (result.tokens.accessToken || result.tokens.token)) ||
          null;
        const refreshToken =
          result.refreshToken ||
          (result.tokens && result.tokens.refreshToken) ||
          null;
        try {
          console.log(
            'AuthController.login: result keys:',
            Object.keys(result)
          );
          console.log(
            'AuthController.login: tokenField present?',
            !!tokenField
          );
          if (tokenField)
            console.log(
              'AuthController.login: decoded token',
              jwt.decode(tokenField)
            );
        } catch (e) {
          console.warn('Erreur lors du log du token:', e && e.message);
        }
        applyAuthCookies(res, tokenField, refreshToken);
        return res.json({
          success: true,
          message: result.message,
          user: result.user,
          tokens: result.tokens || tokenField,
          token: tokenField,
        });
      }

      const code = result && result.code;
      const statusCode =
        code === 'MISSING_FIELDS'
          ? 400
          : code === 'INVALID_CREDENTIALS'
          ? 401
          : 400;
      return res.status(statusCode).json({
        error: result && result.error ? result.error : 'Invalid credentials',
        code: code || 'INVALID_CREDENTIALS',
      });
    } catch (error) {
      console.error('Erreur dans AuthController.login:', error);
      return res.status(500).json({
        error: 'Erreur serveur lors de la connexion.',
        code: 'SERVER_ERROR',
      });
    }
  }

  // Inscription
  static async register(req, res) {
    console.log("➡️ REGISTER appelé");
    console.log("📥 body:", req.body);

    try {
      if (mongoose.connection.readyState !== 1) {
        console.error("❌ MongoDB non connecté");
        return res.status(503).json({
          success: false,
          error: "Base de données indisponible",
          code: "DB_UNAVAILABLE",
        });
      }

      const userData = req.body || {};

      if (typeof registerUser === 'function') {
        console.log("➡️ Avant registerUser");
        const result = await registerUser(userData);
        console.log("✅ Après registerUser", result);
        if (result && result.success) {
          if (typeof getUserIdCounter === 'function')
            userIdCounter = getUserIdCounter();
          const tokenField =
            result.token ||
            (result.tokens &&
              (result.tokens.accessToken || result.tokens.token)) ||
            null;
          const refreshToken =
            result.refreshToken ||
            (result.tokens && result.tokens.refreshToken) ||
            null;
          applyAuthCookies(res, tokenField, refreshToken);
          return res.status(201).json({
            success: true,
            message: result.message,
            user: result.user,
            tokens: result.tokens || tokenField,
            token: tokenField,
          });
        }

        const code = result && result.code;
        const statusCode =
          code === 'MISSING_FIELDS'
            ? 400
            : code === 'INVALID_PASSWORD'
            ? 400
            : code === 'USER_exists'
            ? 409
            : 400;
        return res.status(statusCode).json({
          error: result && result.error ? result.error : 'Registration failed',
          code: code || 'REGISTRATION_ERROR',
        });
      }

      // Fallback simple
      const { username, email, password } = userData;
      if (!username || !email || !password)
        return res
          .status(400)
          .json({ error: 'Champs manquants', code: 'MISSING_FIELDS' });

      // 🔹 Vérification existence utilisateurs
      console.log("➡️ Avant User.findOne / vérification mémoire");
      for (const user of users.values())
        if (user.email === email || user.username === username)
          return res
            .status(409)
            .json({ error: 'Utilisateur existe déjà', code: 'USER_EXISTS' });
      console.log("✅ Après vérification mémoire");

      // 🔹 Hash du mot de passe
      console.log("➡️ Avant bcrypt.hash");
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      console.log("✅ Après bcrypt.hash");

      // 🔹 Création utilisateur et génération du token
      console.log("➡️ Avant users.set et jwt.sign");
      const id = userIdCounter++;
      const newUser = {
        id,
        username,
        email,
        hashpassword: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      users.set(id, newUser);
      const payload = { userId: id, username, email };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
      console.log("✅ Après users.set et jwt.sign");
      applyAuthCookies(res, token);

      // 🔹 Retour JSON
      return res.status(201).json({
        success: true,
        message: 'Inscription réussie.',
        token,
        user: payload,
      });
    } catch (error) {
      console.error('Erreur dans AuthController.register:', error);
      return res.status(500).json({
        error: "Erreur serveur lors de l'inscription.",
        code: 'SERVER_ERROR',
      });
    }
  }

  // Déconnexion
  static async logout(req, res) {
    try {
      if (req.session) {
        req.session.destroy((err) => {
          if (err)
            console.error('Erreur lors de la destruction de la session:', err);
        });
      }
      res.clearCookie(AUTH_COOKIE_NAME, { path: '/' });
      res.clearCookie(REFRESH_COOKIE_NAME, { path: '/' });
      return res.json({
        success: true,
        message: 'Déconnexion réussie. Supprimez votre token côté client.',
      });
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      return res.status(500).json({
        error: 'Erreur serveur lors de la déconnexion.',
        code: 'SERVER_ERROR',
      });
    }
  }

  // Profil
  static async getProfile(req, res) {
    try {
      const userId = req.user?.userId || req.session?.userId;
      if (!userId)
        return res
          .status(401)
          .json({ error: 'Accès non autorisé.', code: 'UNAUTHORIZED' });

      // Construct a baseline profile from the token so we always return something
      const tokenProfile = req.user
        ? {
            id: req.user.userId || req.user.UUID || userId,
            username: req.user.username || null,
            email: req.user.email || null,
            level: req.user.level || null,
            role: req.user.role || 'user',
          }
        : null;

      let userData = users.get(userId) || users.get(Number(userId));
      if (!userData && User && typeof User.findOne === 'function') {
        // Support lookup by UUID or by MongoDB _id (convert string to ObjectId)
        const lookupQueries = [{ UUID: userId }];
        try {
          if (mongoose.Types.ObjectId.isValid(userId)) {
            lookupQueries.push({ _id: new mongoose.Types.ObjectId(userId) });
          }
        } catch (e) {
          console.warn('Invalid ObjectId format:', userId);
        }
        const userDoc = await User.findOne({ $or: lookupQueries }).lean();
        if (userDoc) {
          userData = {
            UUID: userDoc.UUID,
            username: userDoc.username,
            email: userDoc.email,
            level: userDoc.level,
            role: userDoc.role || 'user',
            createdAt: userDoc.createdAt,
            updatedAt: userDoc.updatedAt,
          };
          try {
            users.set(userDoc.UUID, userData);
          } catch (e) {}
        }
      }
      if (!userData) {
        console.warn(
          'Profil non trouvé en mémoire/BD pour userId:',
          userId,
          'req.user:',
          req.user
        );
        // Return token-derived profile as baseline
        if (tokenProfile)
          return res.json({ success: true, user: tokenProfile });
        return res
          .status(404)
          .json({ error: 'Utilisateur non trouvé.', code: 'USER_NOT_FOUND' });
      }
      return res.json({
        success: true,
        user: {
          id: userData.id || userData.UUID || userId,
          username: userData.username,
          email: userData.email,
          level: userData.level,
          role: userData.role || 'user',
          createdAt: userData.createdAt,
          updatedAt: userData.updatedAt,
        },
      });
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
      return res.status(500).json({
        error: 'Erreur serveur lors de la récupération du profil.',
        code: 'SERVER_ERROR',
      });
    }
  }

  // Rafraîchissement de token
  static async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body || {};
      const result =
        typeof refreshAccessToken === 'function'
          ? await refreshAccessToken({ refreshToken })
          : null;
      if (result && result.success) {
        const tokenField =
          result.token ||
          (result.tokens &&
            (result.tokens.accessToken || result.tokens.token)) ||
          null;
        return res.json({
          success: true,
          message: result.message,
          tokens: result.tokens || tokenField,
          token: tokenField,
        });
      }
      const code = result && result.code;
      const statusCode =
        code === 'MISSING_REFRESH_TOKEN'
          ? 400
          : code === 'INVALID_REFRESH_TOKEN'
          ? 401
          : code === 'USER_NOT_FOUND'
          ? 404
          : 400;
      return res.status(statusCode).json({
        error: result && result.error ? result.error : 'Refresh failed',
        code: code || 'REFRESH_ERROR',
      });
    } catch (error) {
      console.error('Erreur lors du renouvellement du token:', error);
      return res.status(500).json({
        error: 'Erreur serveur lors du renouvellement du token.',
        code: 'SERVER_ERROR',
      });
    }
  }

  // Vérifie le statut du token/session
  static checkTokenStatus(req, res) {
    const isAuthenticated = !!req.user || !!req.session?.userId;
    return res.json({ isAuthenticated, user: req.user || null });
  }

  // Compatibilité
  static checkSession(req, res) {
    return AuthController.checkTokenStatus(req, res);
  }
}

module.exports = AuthController;