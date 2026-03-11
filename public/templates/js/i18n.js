if (window.I18n && window.I18n.__hackos) {
  // Deja defini par HackOS: on ignore sans bruit.
} else {
  const STORAGE_KEY = 'hackos.language';
  const DEFAULT_LANGUAGE = 'fr';
  const SUPPORTED_LANGUAGES = ['fr', 'en'];

  const messages = {
    fr: {
      'app.loading': 'Chargement de HackOS...',
      'app.error_title': 'Erreur de chargement',
      'app.error_description':
        'Une erreur est survenue lors du chargement de HackOS :',
      'app.reload': 'Recharger la page',
      'desktop.menu': 'Menu.app',
      'desktop.game': 'Jeu.hkengine',
      'desktop.blog': 'Notes blog',
      'desktop.discord': 'Discord',
      'desktop.instagram': 'Instagram',
      'desktop.linkedin': 'LinkedIn',
      'desktop.mail': 'Courriel',
      'desktop.bin': 'Corbeille',
      'desktop.settings': 'Parametres',
      'desktop.terminal': 'Terminal',
      'profile.visitor': 'Visiteur',
      'menu.window_title': 'Menu',
      'menu.welcome_title': 'Bienvenue sur HackOS',
      'menu.welcome_description':
        'Apprenez a vous premunir contre les menaces liees a la cybersecurite!',
      'menu.login_cta': "Se connecter ou s'inscrire",
      'menu.logout_cta': 'Se deconnecter',
      'menu.login_success_title': 'Bienvenue, {username} !',
      'login.window_title': 'Se connecter',
      'login.email_placeholder': 'Mail',
      'login.password_placeholder': 'Mot de passe',
      'login.submit': 'Se connecter',
      'login.register_cta': "S'inscrire >",
      'login.loading': 'Connexion en cours...',
      'login.success_message': 'Connexion reussie !',
      'login.success_title': 'Bienvenue, {username} !',
      'login.server_unreachable': 'Impossible de contacter le serveur',
      'login.error_generic': 'Erreur de connexion',
      'login.security_msg': 'Connexion securisee',
      'login.forgot_password': 'Mot de passe oublie ?',
      'login.fields_required': 'Tous les champs sont requis',
      'login.invalid_email': "Format d'email invalide",
      'login.email_too_long': 'Email trop long',
      'login.password_min':
        'Le mot de passe doit contenir au moins {min} caracteres',
      'login.password_too_long': 'Mot de passe trop long',
      'login.invalid_chars': "Caracteres non autorises dans l'email",
      'login.lockout':
        'Trop de tentatives echouees. Reessayez dans {minutes} minute(s)',
      'login.attempts_remaining': '{count} tentative(s) restante(s)',
      'login.invalid_credentials': 'Email ou mot de passe incorrect',
      'login.forgot_password_coming_soon':
        "Fonctionnalite 'Mot de passe oublie' a venir",
      'login.profile_fallback_user': 'Utilisateur',
      'register.window_title': "S'inscrire",
      'register.email_placeholder': 'Mail',
      'register.username_placeholder': "Nom d'utilisateur",
      'register.password_placeholder': 'Mot de passe',
      'register.submit': "S'inscrire",
      'register.back': '< Retour',
      'register.success_title': 'Inscription reussie',
      'register.success_text': 'Bienvenue sur Hackemon !',
      'register.success_login_prompt': 'Vous pouvez maintenant vous connecter.',
      'register.success_alert':
        'Inscription reussie ! Vous pouvez maintenant vous connecter.',
      'register.error_generic': "Erreur d'inscription",
      'register.server_error': 'Erreur serveur',
      'register.fields_required': 'Tous les champs sont obligatoires',
      'register.password_min':
        'Le mot de passe doit contenir au moins {min} caracteres',
      'register.invalid_email': "Format d'email invalide",
      'register.server_unreachable': 'Impossible de contacter le serveur',
      'settings.window_title': 'Settings',
      'settings.title': 'Parametres',
      'settings.description': 'Choisis la langue du site.',
      'settings.language_label': 'Langue',
      'settings.option_fr': 'Francais',
      'settings.option_en': 'English',
      'terminal.window_title': 'Terminal',
      'terminal.kicker': 'Signal HackOS',
      'terminal.meta_title': 'Shell Hackemon // session locale',
      'terminal.badge_secure': 'Canal securise',
      'terminal.badge_read_only': 'Lecture seule',
      'terminal.badge_simulated_tty': 'TTY simule',
      'terminal.line_boot': 'Surcouche terminal montee sur Hackemon OS.',
      'terminal.line_system': 'Aucun shell natif connecte pour le moment.',
      'terminal.line_tip':
        "Double-clique sur l'icone pour rouvrir cette fenetre.",
      'terminal.line_next':
        'Commandes, historique et saisie pourront etre relies ensuite.',
      'terminal.prompt_user': 'visiteur@hackemon',
      'terminal.prompt_path': '~/bureau',
      'terminal.prompt_command': 'help --a-venir',
      'terminal.help_output':
        'Commandes disponibles : help, clear, whoami, lang',
      'terminal.whoami_output': 'Session visiteur active.',
      'terminal.lang_output': 'Langue active : {language}',
      'terminal.command_not_found': "Cette commande n'existe pas.",
      'corbeille.window_title': 'Corbeille',
      'corbeille.title': 'Corbeille',
      'corbeille.description':
        'Glisse une appli sur la corbeille pour la masquer du bureau.',
      'corbeille.empty': 'La corbeille est vide.',
      'corbeille.count': '{count} appli(s) dans la corbeille',
      'corbeille.restore': 'Restaurer',
      'corbeille.empty_bin': 'Vider la corbeille',
      'corbeille.app_id': 'ID : {id}',
    },
    en: {
      'app.loading': 'Loading HackOS...',
      'app.error_title': 'Loading error',
      'app.error_description': 'An error occurred while loading HackOS:',
      'app.reload': 'Reload page',
      'desktop.menu': 'Menu.app',
      'desktop.game': 'Game.hkengine',
      'desktop.blog': 'Blog notes',
      'desktop.discord': 'Discord',
      'desktop.instagram': 'Instagram',
      'desktop.linkedin': 'LinkedIn',
      'desktop.mail': 'Email',
      'desktop.bin': 'Bin',
      'desktop.settings': 'Settings',
      'desktop.terminal': 'Terminal',
      'profile.visitor': 'Visitor',
      'menu.window_title': 'Menu',
      'menu.welcome_title': 'Welcome to HackOS',
      'menu.welcome_description':
        'Learn how to protect yourself from cybersecurity threats!',
      'menu.login_cta': 'Sign in or sign up',
      'menu.logout_cta': 'Sign out',
      'menu.login_success_title': 'Welcome, {username}!',
      'login.window_title': 'Sign in',
      'login.email_placeholder': 'Email',
      'login.password_placeholder': 'Password',
      'login.submit': 'Sign in',
      'login.register_cta': 'Sign up >',
      'login.loading': 'Signing in...',
      'login.success_message': 'Sign-in successful!',
      'login.success_title': 'Welcome, {username}!',
      'login.server_unreachable': 'Unable to reach the server',
      'login.error_generic': 'Sign-in error',
      'login.security_msg': 'Secure sign-in',
      'login.forgot_password': 'Forgot password?',
      'login.fields_required': 'All fields are required',
      'login.invalid_email': 'Invalid email format',
      'login.email_too_long': 'Email is too long',
      'login.password_min': 'Password must be at least {min} characters',
      'login.password_too_long': 'Password is too long',
      'login.invalid_chars': 'Unauthorized characters in email',
      'login.lockout': 'Too many failed attempts. Retry in {minutes} minute(s)',
      'login.attempts_remaining': '{count} attempt(s) remaining',
      'login.invalid_credentials': 'Invalid email or password',
      'login.forgot_password_coming_soon':
        'Forgot-password feature is coming soon',
      'login.profile_fallback_user': 'User',
      'register.window_title': 'Sign up',
      'register.email_placeholder': 'Email',
      'register.username_placeholder': 'Username',
      'register.password_placeholder': 'Password',
      'register.submit': 'Sign up',
      'register.back': '< Back',
      'register.success_title': 'Sign-up successful',
      'register.success_text': 'Welcome to Hackemon!',
      'register.success_login_prompt': 'You can now sign in.',
      'register.success_alert': 'Sign-up successful! You can now sign in.',
      'register.error_generic': 'Sign-up error',
      'register.server_error': 'Server error',
      'register.fields_required': 'All fields are required',
      'register.password_min': 'Password must be at least {min} characters',
      'register.invalid_email': 'Invalid email format',
      'register.server_unreachable': 'Unable to reach the server',
      'settings.window_title': 'Settings',
      'settings.title': 'Settings',
      'settings.description': 'Choose the website language.',
      'settings.language_label': 'Language',
      'settings.option_fr': 'Francais',
      'settings.option_en': 'English',
      'terminal.window_title': 'Terminal',
      'terminal.kicker': 'HackOS signal',
      'terminal.meta_title': 'Hackemon shell // local session',
      'terminal.badge_secure': 'Secure channel',
      'terminal.badge_read_only': 'Read only',
      'terminal.badge_simulated_tty': 'Simulated TTY',
      'terminal.line_boot': 'Terminal overlay mounted on Hackemon OS.',
      'terminal.line_system': 'No native shell attached yet.',
      'terminal.line_tip': 'Double-click the icon to reopen this window.',
      'terminal.line_next':
        'Commands, history and prompt input can be wired next.',
      'terminal.prompt_user': 'visitor@hackemon',
      'terminal.prompt_path': '~/desktop',
      'terminal.prompt_command': 'help --coming-soon',
      'terminal.help_output': 'Available commands: help, clear, whoami, lang',
      'terminal.whoami_output': 'Visitor session is active.',
      'terminal.lang_output': 'Active language: {language}',
      'terminal.command_not_found': 'This command does not exist.',
      'corbeille.window_title': 'Recycle Bin',
      'corbeille.title': 'Recycle Bin',
      'corbeille.description':
        'Drag an app onto the bin to hide it from the desktop.',
      'corbeille.empty': 'The recycle bin is empty.',
      'corbeille.count': '{count} app(s) in the recycle bin',
      'corbeille.restore': 'Restore',
      'corbeille.empty_bin': 'Empty recycle bin',
      'corbeille.app_id': 'ID: {id}',
    },
  };

  function normalizeLanguage(lang) {
    if (!lang || typeof lang !== 'string') return DEFAULT_LANGUAGE;
    const short = lang.toLowerCase().slice(0, 2);
    return SUPPORTED_LANGUAGES.includes(short) ? short : DEFAULT_LANGUAGE;
  }

  function interpolate(template, vars) {
    if (!vars) return template;
    return template.replace(/\{(\w+)\}/g, (_, key) => {
      const value = vars[key];
      return value === undefined || value === null ? '' : String(value);
    });
  }

  let currentLanguage = normalizeLanguage(
    localStorage.getItem(STORAGE_KEY) || DEFAULT_LANGUAGE,
  );

  function t(key, vars = null, fallback = '') {
    const catalog = messages[currentLanguage] || messages[DEFAULT_LANGUAGE];
    const raw = catalog[key] || fallback || key;
    return interpolate(raw, vars);
  }

  function translateElement(root = document) {
    root.querySelectorAll('[data-i18n]').forEach((element) => {
      const key = element.getAttribute('data-i18n');
      if (!key) return;
      element.textContent = t(key);
    });

    root.querySelectorAll('[data-i18n-placeholder]').forEach((element) => {
      const key = element.getAttribute('data-i18n-placeholder');
      if (!key) return;
      element.setAttribute('placeholder', t(key));
    });

    root.querySelectorAll('[data-i18n-value]').forEach((element) => {
      const key = element.getAttribute('data-i18n-value');
      if (!key) return;
      element.value = t(key);
    });
  }

  function applyLanguage() {
    document.documentElement.lang = currentLanguage;
    translateElement(document);
  }

  function setLanguage(lang) {
    const normalized = normalizeLanguage(lang);
    if (normalized === currentLanguage) return;
    currentLanguage = normalized;
    localStorage.setItem(STORAGE_KEY, currentLanguage);
    applyLanguage();
    window.dispatchEvent(
      new CustomEvent('i18n:changed', {
        detail: { language: currentLanguage },
      }),
    );
  }

  function getLanguage() {
    return currentLanguage;
  }

  const api = {
    t,
    setLanguage,
    getLanguage,
    applyLanguage,
    translateElement,
    supportedLanguages: SUPPORTED_LANGUAGES.slice(),
  };

  api.__hackos = true;
  window.I18n = api;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      applyLanguage();
    });
  } else {
    applyLanguage();
  }
}
