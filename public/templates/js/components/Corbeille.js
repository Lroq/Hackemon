if (window.Settings && window.Settings.__hackos) {
  // Deja defini par HackOS: on ignore sans bruit.
} else {
  const tr = (key, fallback, vars) => {
    if (window.I18n && typeof window.I18n.t === 'function') {
      return window.I18n.t(key, vars, fallback);
    }
    return fallback;
  };

  /**
   * Composant pour la fenetre Corbeille
   */
  class Corbeille extends Window {
    constructor() {
      super(28, 42, true, tr('settings.window_title', 'Settings'));
      this.initializeSettings();
    }

    /**
     * Initialise le contenu de la fenetre settings
     * @private
     */
    initializeSettings() {
      const title = HTMLBuilder.build('h1', {
        innerText: tr('corbeille.title', 'Corbeille'),
        style: 'font-size: 3vw; line-height: 1; margin: 0.4vw 0 0.1vw 0;',
      });

      const description = HTMLBuilder.build('p', {
        innerText: tr('corbeille.description', 'Contenu de la corbeille.'),

        style: 'font-size: 1.9vw; line-height: 1.15; margin: 0.2vw 0 0.9vw 0;',
      });

      const wrapper = HTMLBuilder.build('div', {
        style:
          'display:flex;align-items:center;gap:0.8vw;flex-wrap:wrap;margin-top:0.4vw;',
      });
      const languageLabel = HTMLBuilder.build('label', {
        innerText: tr('settings.language_label', 'Language'),
        style: 'font-size: 1.6vw; line-height: 1;',
      });
      const languageSelect = HTMLBuilder.build('select', {
        style:
          'pointer-events:all;cursor:pointer;padding:0.35vw 0.7vw;border:1px solid #999;border-radius:4px;background:#f4f4f4;color:#111;font-size:1.4vw;line-height:1;min-width:7.8vw;filter:drop-shadow(2px 2px 0px rgba(0, 0, 0, 0.26));',
      });
      const frOption = HTMLBuilder.build('option', {
        value: 'fr',
        innerText: tr('settings.option_fr', 'Francais'),
        style: 'font-size: 1.2vw; color: #111; background: #f4f4f4;',
      });
      const enOption = HTMLBuilder.build('option', {
        value: 'en',
        innerText: tr('settings.option_en', 'English'),
        style: 'font-size: 1.2vw; color: #111; background: #f4f4f4;',
      });

      languageSelect.append(frOption, enOption);
      if (window.I18n && typeof window.I18n.getLanguage === 'function') {
        languageSelect.value = window.I18n.getLanguage();
      }
      languageSelect.addEventListener('change', () => {
        if (window.I18n && typeof window.I18n.setLanguage === 'function') {
          window.I18n.setLanguage(languageSelect.value);
        }
      });

      window.addEventListener('i18n:changed', () => {
        title.innerText = tr('settings.title', 'Settings');
        description.innerText = tr(
          'settings.description',
          'Choose the website language.',
        );
        languageLabel.innerText = tr('settings.language_label', 'Language');
        frOption.innerText = tr('settings.option_fr', 'Francais');
        enOption.innerText = tr('settings.option_en', 'English');
        if (window.I18n && typeof window.I18n.getLanguage === 'function') {
          languageSelect.value = window.I18n.getLanguage();
        }
      });

      wrapper.append(languageLabel, languageSelect);

      this.append(title);
      this.append(description);
      this.append(wrapper);
    }
  }

  // Export pour utilisation globale
  Corbeille.__hackos = true;
  window.Corbeille = Corbeille;
}
