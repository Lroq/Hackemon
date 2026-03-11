if (window.Corbeille && window.Corbeille.__hackos) {
  // Deja defini par HackOS: on ignore sans bruit.
} else {
  const tr = (key, fallback, vars) => {
    if (window.I18n && typeof window.I18n.t === 'function') {
      return window.I18n.t(key, vars, fallback);
    }
    return fallback;
  };

  const Builder = window.HTMLBuilder || window.HTMLbuilder;

  class Corbeille extends Window {
    constructor() {
      super(32, 46, true, tr('corbeille.window_title', 'Corbeille'));

      this.contentRoot = Builder.build('div', {
        style:
          'display:flex;flex-direction:column;gap:0.8vw;height:100%;padding:0.6vw 0.4vw 0.2vw 0.4vw;box-sizing:border-box;overflow:auto;',
      });

      this.handleRegistryChange = () => this.render();
      window.addEventListener('desktop:apps-changed', this.handleRegistryChange);
      window.addEventListener('i18n:changed', this.handleRegistryChange);

      this.append(this.contentRoot);
      this.render();
    }

    render() {
      const registry = window.DesktopAppRegistry;
      const trashItems =
        registry && typeof registry.getTrashItems === 'function'
          ? registry.getTrashItems()
          : [];

      this.contentRoot.innerHTML = '';

      const title = Builder.build('h1', {
        innerText: tr('corbeille.title', 'Corbeille'),
        style: 'font-size: 2.8vw; line-height: 1; margin: 0;',
      });

      const description = Builder.build('p', {
        innerText: tr(
          'corbeille.description',
          'Glisse une appli sur la corbeille pour la masquer du bureau.',
        ),
        style: 'font-size: 1.55vw; line-height: 1.1; margin: 0;',
      });

      const counter = Builder.build('p', {
        innerText: tr('corbeille.count', '{count} appli(s) dans la corbeille', {
          count: trashItems.length,
        }),
        style: 'font-size: 1.35vw; margin: 0;',
      });

      const list = Builder.build('div', {
        style:
          'display:flex;flex-direction:column;gap:0.55vw;min-height:10vw;max-height:14vw;overflow:auto;padding-right:0.2vw;',
      });

      if (trashItems.length === 0) {
        list.appendChild(
          Builder.build('p', {
            innerText: tr('corbeille.empty', 'La corbeille est vide.'),
            style:
              'font-size:1.5vw;line-height:1.1;margin:0.6vw 0;padding:0.8vw;border:1px dashed #888;background:rgba(255,255,255,0.35);',
          }),
        );
      } else {
        trashItems.forEach((item) => {
          const row = Builder.build('div', {
            style:
              'display:flex;justify-content:space-between;align-items:center;gap:0.8vw;padding:0.55vw 0.75vw;border:1px solid #777;background:rgba(255,255,255,0.5);',
          });

          const textGroup = Builder.build('div', {
            style: 'display:flex;flex-direction:column;gap:0.2vw;pointer-events:none;',
          });
          textGroup.append(
            Builder.build('strong', {
              innerText:
                typeof registry.getDisplayName === 'function'
                  ? registry.getDisplayName(item)
                  : item.name || item.id,
              style: 'font-size:1.4vw;font-weight:normal;',
            }),
            Builder.build('span', {
              innerText: tr('corbeille.app_id', 'ID : {id}', { id: item.id }),
              style: 'font-size:1.15vw;',
            }),
          );

          const restoreButton = Builder.build('button', {
            type: 'button',
            innerText: tr('corbeille.restore', 'Restaurer'),
            style:
              'pointer-events:all;background:#3e9587;color:white;font-size:1.2vw;min-width:8.5vw;',
          });
          restoreButton.addEventListener('click', () => {
            registry.restoreApp(item.id);
          });

          row.append(textGroup, restoreButton);
          list.appendChild(row);
        });
      }

      const emptyButton = Builder.build('button', {
        type: 'button',
        innerText: tr('corbeille.empty_bin', 'Vider la corbeille'),
        disabled: trashItems.length === 0,
        style: `pointer-events:all;font-size:1.25vw;color:white;background:${
          trashItems.length === 0 ? '#777' : '#b2533f'
        };opacity:${trashItems.length === 0 ? '0.65' : '1'};`,
      });

      emptyButton.addEventListener('click', () => {
        if (trashItems.length === 0) {
          return;
        }
        registry.emptyTrash();
      });

      this.contentRoot.append(title, description, counter, list, emptyButton);
    }

    delete() {
      window.removeEventListener(
        'desktop:apps-changed',
        this.handleRegistryChange,
      );
      window.removeEventListener('i18n:changed', this.handleRegistryChange);
      super.delete();
    }
  }

  Corbeille.__hackos = true;
  window.Corbeille = Corbeille;
}
