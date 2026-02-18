document.addEventListener('DOMContentLoaded', (e) => {
  const apps = document.querySelectorAll('.app');

  const hackEngineApp = document.getElementById('gamehkenginebtn');
  if (hackEngineApp) {
    hackEngineApp.addEventListener('dblclick', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Vérifier le rôle de l'utilisateur
      const accessToken =
        localStorage.getItem('accessToken') ||
        sessionStorage.getItem('auth_token');

      console.log('Token récupéré:', accessToken ? 'OUI' : 'NON');

      if (!accessToken) {
        // Si non connecté, redirection vers coming soon
        console.log('Pas de token trouvé');
        window.location.href = '/coming-soon';
        return;
      }

      try {
        // Décoder le token pour récupérer le rôle
        const tokenPayload = JSON.parse(atob(accessToken.split('.')[1]));
        console.log('Token décodé:', tokenPayload);
        console.log('Rôle détecté:', tokenPayload.role);

        if (tokenPayload.role === 'admin') {
          // Admin : redirection vers 3001
          console.log('Admin détecté - Redirection vers 3001');
          window.location.href = 'http://localhost:3001';
        } else {
          // User : Coming soon
          console.log('User détecté - Redirection vers coming-soon');
          window.location.href = '/coming-soon';
        }
      } catch (error) {
        console.error(' Erreur lors de la vérification du rôle:', error);
        console.error('Token problématique:', accessToken);
        window.location.href = '/coming-soon';
      }
    });
  }

  const settingsApp = document.getElementById('settingsbtn');
  if (settingsApp) {
    settingsApp.addEventListener('dblclick', (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (window.Settings) {
        new window.Settings();
      } else if (window.Window) {
        const settingsTitle =
          window.I18n && typeof window.I18n.t === 'function'
            ? window.I18n.t('settings.window_title', null, 'Settings')
            : 'Settings';
        new window.Window(28, 42, true, settingsTitle);
      }
    });
  }

  const binApp = document.getElementById('bin');
  if (binApp) {
    binApp.addEventListener('dblclick', (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (window.Corbeille) {
        new window.Corbeille();
      } else if (window.Window) {
        const corbeilleTitle =
          window.I18n && typeof window.I18n.t === 'function'
            ? window.I18n.t('corbeille.window_title', null, 'Corbeille')
            : 'Corbeille';
        new window.Window(28, 42, true, corbeilleTitle);
      }
    });
  }

  for (const app of apps) {
    let offsetX = 0;
    let offsetY = 0;
    let isDragging = false;
    let hasMoved = false;
    let startX = 0;
    let startY = 0;

    function onMouseMove(e) {
      const distance =
        Math.abs(e.clientX - startX) + Math.abs(e.clientY - startY);

      if (distance > 5) {
        hasMoved = true;

        if (!isDragging) {
          isDragging = true;
          app.style.position = 'absolute';
          app.style.zIndex = 0;

          app.style.left = e.clientX - offsetX + 'px';
          app.style.top = e.clientY - offsetY + 'px';
        } else {
          app.style.left = e.clientX - offsetX + 'px';
          app.style.top = e.clientY - offsetY + 'px';
        }
      }
    }

    function onMouseUp(e) {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);

      if (hasMoved) {
        setTimeout(() => {
          isDragging = false;
        }, 10);
      } else {
        isDragging = false;
      }

      hasMoved = false;
    }

    app.addEventListener('mousedown', (e) => {
      e.preventDefault();

      const rect = app.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;

      startX = e.clientX;
      startY = e.clientY;
      hasMoved = false;

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });

    app.parentElement.addEventListener('click', (e) => {
      if (isDragging) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    });

    app.addEventListener('click', (e) => {
      if (isDragging) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    });
  }
});
