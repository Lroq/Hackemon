if (!window.DesktopAppRegistry || !window.DesktopAppRegistry.__hackos) {
  class DesktopAppRegistry {
    constructor() {
      this.apps = new Map();
      this.appsContainer = null;
      this.binId = 'bin';
      this.protectedDeletedIds = new Set(['terminalbtn']);
      this.isInitialized = false;
    }

    initialize() {
      if (this.isInitialized) {
        return;
      }

      this.appsContainer = document.querySelector('.apps');
      if (!this.appsContainer) {
        return;
      }

      const apps = this.appsContainer.querySelectorAll('.app');
      apps.forEach((appElement, index) => {
        this.registerApp(appElement, index);
      });

      this.isInitialized = true;
      this.notifyChange();
    }

    registerApp(appElement, index = this.apps.size) {
      if (!appElement) {
        return null;
      }

      const id = appElement.id || `desktop-app-${index + 1}`;
      appElement.id = id;

      let record = this.apps.get(id);
      if (!record) {
        record = {
          id,
          state: id === this.binId ? 'system' : 'desktop',
          name: '',
          translationKey: '',
          element: null,
          linkElement: null,
          iconElement: null,
          labelElement: null,
          desktopStyle: {},
          template: null,
          trashedAt: null,
          deletedAt: null,
        };
        this.apps.set(id, record);
      }

      this.hydrateRecordElements(record, appElement);
      this.bindAppInteractions(record);
      return record;
    }

    hydrateRecordElements(record, appElement) {
      record.element = appElement;
      record.linkElement = appElement.closest('a');
      record.iconElement = appElement.querySelector('img');
      record.labelElement = appElement.querySelector('label');
      record.name = record.labelElement
        ? record.labelElement.textContent.trim()
        : record.id;
      record.translationKey =
        record.labelElement?.getAttribute('data-i18n') || '';
      record.desktopStyle = this.captureDesktopStyle(appElement);
      record.template = this.captureTemplate(record);
      return record;
    }

    captureDesktopStyle(appElement) {
      return {
        position: appElement.style.position || '',
        left: appElement.style.left || '',
        top: appElement.style.top || '',
        zIndex: appElement.style.zIndex || '',
      };
    }

    captureTemplate(record) {
      return {
        linkAttributes: {
          href: record.linkElement?.getAttribute('href') || '#',
          target: record.linkElement?.getAttribute('target') || '',
          rel: record.linkElement?.getAttribute('rel') || '',
          style: record.linkElement?.getAttribute('style') || '',
        },
        appClassName: record.element?.className || 'app',
        dataset: record.element ? { ...record.element.dataset } : {},
        iconSrc: record.iconElement?.getAttribute('src') || '',
        labelText: record.name,
        translationKey: record.translationKey,
        desktopStyle: { ...record.desktopStyle },
      };
    }

    getRecord(appOrId) {
      if (!appOrId) {
        return null;
      }

      if (typeof appOrId === 'string') {
        return this.apps.get(appOrId) || null;
      }

      if (appOrId.id && this.apps.has(appOrId.id)) {
        return this.apps.get(appOrId.id) || null;
      }

      if (appOrId instanceof HTMLElement) {
        return this.apps.get(appOrId.id) || null;
      }

      return null;
    }

    getDisplayName(appOrId) {
      const record = this.getRecord(appOrId) || appOrId;
      if (!record) {
        return '';
      }

      if (
        record.translationKey &&
        window.I18n &&
        typeof window.I18n.t === 'function'
      ) {
        return window.I18n.t(record.translationKey, null, record.name);
      }

      return record.name || record.id;
    }

    getTrashItems() {
      return Array.from(this.apps.values()).filter(
        (record) => record.state === 'trash',
      );
    }

    getDeletedItems() {
      return Array.from(this.apps.values()).filter(
        (record) => record.state === 'deleted',
      );
    }

    getSerializableState() {
      return Array.from(this.apps.values()).map((record) => ({
        id: record.id,
        name: this.getDisplayName(record),
        translationKey: record.translationKey,
        state: record.state,
        href: record.template?.linkAttributes?.href || '#',
        target: record.template?.linkAttributes?.target || '',
        iconSrc: record.template?.iconSrc || '',
        trashedAt: record.trashedAt,
        deletedAt: record.deletedAt,
        canTrash: record.id !== this.binId,
      }));
    }

    canBeTrashed(record) {
      return Boolean(
        record && record.id !== this.binId && record.state === 'desktop',
      );
    }

    canBeDeletedPermanently(record) {
      return Boolean(
        record &&
          record.state === 'trash' &&
          !this.protectedDeletedIds.has(record.id),
      );
    }

    updateBinIcon() {
      const binRecord = this.apps.get(this.binId);
      if (!binRecord || !binRecord.iconElement) {
        return;
      }

      const nextIcon =
        this.getTrashItems().length > 0
          ? '/public/assets/full-bin.png'
          : '/public/assets/empty-bin.png';

      if (binRecord.iconElement.getAttribute('src') !== nextIcon) {
        binRecord.iconElement.setAttribute('src', nextIcon);
      }
    }

    setBinDropTarget(isActive) {
      const binRecord = this.apps.get(this.binId);
      if (!binRecord || !binRecord.element) {
        return;
      }

      binRecord.element.classList.toggle('bin-drop-target', Boolean(isActive));
    }

    isPointerOverBin(clientX, clientY, draggedRecord) {
      const binRecord = this.apps.get(this.binId);
      if (
        !binRecord ||
        !binRecord.element ||
        !draggedRecord ||
        draggedRecord.id === this.binId
      ) {
        return false;
      }

      const rect = binRecord.element.getBoundingClientRect();

      return (
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom
      );
    }

    trashApp(appOrId) {
      const record = this.getRecord(appOrId);
      if (!this.canBeTrashed(record) || !record.element) {
        return false;
      }

      record.desktopStyle = this.captureDesktopStyle(record.element);
      record.template = this.captureTemplate(record);
      record.state = 'trash';
      record.trashedAt = new Date().toISOString();

      if (record.linkElement) {
        record.linkElement.style.display = 'none';
      }
      record.element.style.display = 'none';

      this.notifyChange();
      return true;
    }

    restoreApp(appOrId) {
      const record = this.getRecord(appOrId);
      if (!record || record.state !== 'trash' || !record.element) {
        return false;
      }

      record.state = 'desktop';
      record.trashedAt = null;

      if (record.linkElement) {
        record.linkElement.style.display = '';
      }

      record.element.style.display = '';
      this.placeAppInDesktopGrid(record);

      this.notifyChange();
      return true;
    }

    emptyTrash() {
      const trashItems = this.getTrashItems();
      const deletableItems = trashItems.filter((record) =>
        this.canBeDeletedPermanently(record),
      );

      deletableItems.forEach((record) => {
        this.closeAssociatedWindows(record);

        if (!record.template) {
          record.template = this.captureTemplate(record);
        }

        record.state = 'deleted';
        record.deletedAt = new Date().toISOString();

        const linkElement = record.linkElement || record.element?.closest('a');
        if (linkElement) {
          linkElement.remove();
        } else if (record.element) {
          record.element.remove();
        }

        record.element = null;
        record.linkElement = null;
        record.iconElement = null;
        record.labelElement = null;
      });

      this.notifyChange();
      return deletableItems.length;
    }

    closeAssociatedWindows(record) {
      const titles = getAssociatedWindowTitles(record?.id);
      if (titles.length === 0) {
        return;
      }

      const openWindows = document.querySelectorAll('main > .windows .window');

      openWindows.forEach((windowElement) => {
        const label = windowElement.querySelector('.topbar .app-name');
        const title = label?.textContent?.trim();

        if (!title || !titles.includes(title)) {
          return;
        }

        const closeButton = windowElement.querySelector('.app-close');
        if (closeButton) {
          closeButton.click();
          return;
        }

        if (window.Window?.States) {
          window.Window.States[title] = false;
        }
        windowElement.remove();
      });

      if (record.id === 'menubtn' && 'globalMenuInstance' in window) {
        window.globalMenuInstance = null;
      }
    }

    reinstallApp(appOrId) {
      const record = this.getRecord(appOrId);
      if (!record || record.state !== 'deleted' || !this.appsContainer) {
        return null;
      }

      const linkElement = document.createElement('a');
      const linkAttributes = record.template?.linkAttributes || {};

      linkElement.setAttribute('href', linkAttributes.href || '#');

      if (linkAttributes.target) {
        linkElement.setAttribute('target', linkAttributes.target);
      }
      if (linkAttributes.rel) {
        linkElement.setAttribute('rel', linkAttributes.rel);
      }
      if (linkAttributes.style) {
        linkElement.setAttribute('style', linkAttributes.style);
      }

      const appElement = document.createElement('div');
      appElement.className = record.template?.appClassName || 'app';
      appElement.id = record.id;

      const dataset = record.template?.dataset || {};
      Object.entries(dataset).forEach(([key, value]) => {
        appElement.dataset[key] = value;
      });

      const iconElement = document.createElement('img');
      iconElement.setAttribute('src', record.template?.iconSrc || '');

      const labelElement = document.createElement('label');
      if (record.translationKey) {
        labelElement.setAttribute('data-i18n', record.translationKey);
      }
      labelElement.textContent = record.template?.labelText || record.name;

      appElement.append(iconElement, labelElement);
      linkElement.appendChild(appElement);
      this.appsContainer.appendChild(linkElement);

      record.state = record.id === this.binId ? 'system' : 'desktop';
      record.deletedAt = null;
      record.trashedAt = null;

      this.hydrateRecordElements(record, appElement);
      this.placeAppInDesktopGrid(record);
      this.bindAppInteractions(record);

      if (window.I18n && typeof window.I18n.translateElement === 'function') {
        window.I18n.translateElement(linkElement);
      }

      this.notifyChange();
      return record;
    }

    applyDesktopStyle(appElement, style = {}) {
      appElement.style.position = style.position || '';
      appElement.style.left = style.left || '';
      appElement.style.top = style.top || '';
      appElement.style.zIndex = style.zIndex || '';
    }

    placeAppInDesktopGrid(record) {
      if (!record?.element || !record.linkElement || !this.appsContainer) {
        return;
      }

      this.appsContainer.appendChild(record.linkElement);
      this.applyDesktopStyle(record.element, {});
      record.desktopStyle = this.captureDesktopStyle(record.element);
    }

    notifyChange() {
      this.updateBinIcon();
      window.dispatchEvent(
        new CustomEvent('desktop:apps-changed', {
          detail: {
            items: this.getSerializableState(),
          },
        }),
      );
    }

    bindAppInteractions(record) {
      if (!record.element || record.element.dataset.desktopBound === 'true') {
        return;
      }

      record.element.dataset.desktopBound = 'true';
      record.element.draggable = false;

      this.bindOpenAction(record);
      this.bindManualDrag(record);
    }

    bindOpenAction(record) {
      const handler = desktopAppActions[record.id];
      if (!handler || !record.element) {
        return;
      }

      record.element.addEventListener('dblclick', (event) => {
        if (record.state === 'trash' || record.state === 'deleted') {
          return;
        }

        handler(event, record);
      });
    }

    bindManualDrag(record) {
      const appElement = record.element;
      if (!appElement) {
        return;
      }

      let offsetX = 0;
      let offsetY = 0;
      let isDragging = false;
      let hasMoved = false;
      let startX = 0;
      let startY = 0;
      let suppressClick = false;

      const onMouseMove = (event) => {
        const distance =
          Math.abs(event.clientX - startX) + Math.abs(event.clientY - startY);

        if (distance <= 5) {
          return;
        }

        hasMoved = true;

        if (!isDragging) {
          isDragging = true;
          appElement.style.position = 'absolute';
          if (!appElement.style.zIndex) {
            appElement.style.zIndex = '0';
          }
        }

        appElement.style.left = `${event.clientX - offsetX}px`;
        appElement.style.top = `${event.clientY - offsetY}px`;
        this.setBinDropTarget(
          this.isPointerOverBin(event.clientX, event.clientY, record),
        );
      };

      const onMouseUp = (event) => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);

        if (hasMoved) {
          const droppedInTrash = this.isPointerOverBin(
            event.clientX,
            event.clientY,
            record,
          );

          if (droppedInTrash) {
            this.trashApp(record.id);
          }

          suppressClick = true;
          window.setTimeout(() => {
            isDragging = false;
            suppressClick = false;
          }, 10);
        } else {
          isDragging = false;
        }

        hasMoved = false;
        this.setBinDropTarget(false);
      };

      appElement.addEventListener('mousedown', (event) => {
        if (record.state === 'trash' || record.state === 'deleted') {
          return;
        }

        if (event.button !== 0) {
          return;
        }

        event.preventDefault();

        const rect = appElement.getBoundingClientRect();
        offsetX = event.clientX - rect.left;
        offsetY = event.clientY - rect.top;
        startX = event.clientX;
        startY = event.clientY;
        hasMoved = false;

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
      });

      const clickBlocker = (event) => {
        if (!isDragging && !suppressClick) {
          return undefined;
        }

        event.preventDefault();
        event.stopPropagation();
        return false;
      };

      appElement.parentElement?.addEventListener('click', clickBlocker);
      appElement.addEventListener('click', clickBlocker);
    }
  }

  window.DesktopAppRegistry = new DesktopAppRegistry();
  window.DesktopAppRegistry.__hackos = true;
}

function getWindowTitle(key, fallback) {
  if (window.I18n && typeof window.I18n.t === 'function') {
    return window.I18n.t(key, null, fallback);
  }
  return fallback;
}

function isWindowAlreadyOpen(title) {
  return Boolean(window.Window && window.Window.States?.[title]);
}

function getAssociatedWindowTitles(appId) {
  const titles = new Set();

  if (appId === 'menubtn') {
    titles.add('Menu');
    titles.add(getWindowTitle('menu.window_title', 'Menu'));
  }

  if (appId === 'settingsbtn') {
    titles.add('Settings');
    titles.add(getWindowTitle('settings.window_title', 'Settings'));
  }

  if (appId === 'bin') {
    titles.add('Corbeille');
    titles.add('Recycle Bin');
    titles.add(getWindowTitle('corbeille.window_title', 'Corbeille'));
  }

  return Array.from(titles);
}

function openHackEngine(event) {
  event.preventDefault();
  event.stopPropagation();

  const accessToken =
    localStorage.getItem('accessToken') ||
    sessionStorage.getItem('auth_token');

  if (!accessToken) {
    window.location.href = '/coming-soon';
    return;
  }

  // Dépose le token en cookie avant la navigation
  document.cookie = `auth_token=${accessToken}; path=/; SameSite=Lax; Secure`;

  window.location.href = '/build';
}

function openSettings(event) {
  event.preventDefault();
  event.stopPropagation();

  const title = getWindowTitle('settings.window_title', 'Settings');
  if (isWindowAlreadyOpen(title)) {
    return;
  }

  if (window.Settings) {
    new window.Settings();
    return;
  }

  if (window.Window) {
    new window.Window(28, 42, true, title);
  }
}

function openCorbeille(event) {
  event.preventDefault();
  event.stopPropagation();

  const title = getWindowTitle('corbeille.window_title', 'Corbeille');
  if (isWindowAlreadyOpen(title)) {
    return;
  }

  if (window.Corbeille) {
    new window.Corbeille();
    return;
  }

  if (window.Window) {
    new window.Window(28, 42, true, title);
  }
}

const desktopAppActions = {
  gamehkenginebtn: openHackEngine,
  settingsbtn: openSettings,
  bin: openCorbeille,
};

document.addEventListener('DOMContentLoaded', () => {
  const registry = window.DesktopAppRegistry;
  registry.initialize();

  window.addEventListener('i18n:changed', () => {
    registry.notifyChange();
  });
});
