// Récupère le profil de l'utilisateur connecté et met à jour l'UI
(async function () {
  function getVisitorLabel() {
    if (window.I18n && typeof window.I18n.t === 'function') {
      return window.I18n.t('profile.visitor', null, 'Visiteur');
    }
    return 'Visiteur';
  }

  function setDefaultProfile() {
    const avatar = document.getElementById('userAvatar');
    const pseudo = document.getElementById('userPseudo');
    if (avatar) avatar.src = '/public/assets/game_px.png';
    if (pseudo) {
      pseudo.setAttribute('data-i18n', 'profile.visitor');
      pseudo.textContent = getVisitorLabel();
    }
  }

  async function fetchProfile() {
    try {
      // Vérifier si un token JWT existe avant d'appeler le serveur
      if (!window.ApiService || !window.ApiService.isAuthenticated())
        return null;
      const data = await window.ApiService.getProfile();
      return data && (data.user || data);
    } catch (err) {
      console.error('Erreur récupération profil:', err);
      return null;
    }
  }

  // Exposer une API minimale globale pour mettre à jour le profil dans l'UI
  window.UserProfile = {
    async refresh() {
      const user = await fetchProfile();
      if (user) {
        this.set(user);
        window.globalMenuInstance.render();
        return user;
      }
      setDefaultProfile();
      return null;
    },
    set(user) {
      const avatar = document.getElementById('userAvatar');
      const pseudo = document.getElementById('userPseudo');
      if (pseudo) {
        if (user.username) {
          pseudo.removeAttribute('data-i18n');
          pseudo.textContent = user.username;
        } else {
          pseudo.setAttribute('data-i18n', 'profile.visitor');
          pseudo.textContent = getVisitorLabel();
        }
      }
      if (avatar) {
        // Si user.avatar existe, on l'utilise, sinon image par défaut
        //avatar.src = user.avatar || '/public/assets/game_px.png';
        if (user.avatar) {
          avatar.src = user.avatar;
        } else if (user.role === 'admin') {
          avatar.src = '/public/assets/admin_icon.png';
        } else {
          avatar.src = '/public/assets/game_px.png';
        }
      }
    },
  };

  // Fonction d'initialisation
  function init() {
    window.UserProfile.refresh();
    window.addEventListener('i18n:changed', () => {
      if (!window.ApiService || !window.ApiService.isAuthenticated()) {
        setDefaultProfile();
      }
    });
  }

  // Attendre que le DOM soit prêt puis initialiser
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
