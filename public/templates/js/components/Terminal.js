if (window.Terminal && window.Terminal.__hackos) {
  // Deja defini par HackOS: on ignore sans bruit.
} else {
  const tr = (key, fallback, vars) => {
    if (window.I18n && typeof window.I18n.t === 'function') {
      return window.I18n.t(key, vars, fallback);
    }
    return fallback;
  };

  class Terminal {
    static STYLE_ID = 'hackos-terminal-styles';
    static fallbackZIndex = 20;

    constructor() {
      this.dragState = {
        active: false,
        offsetX: 0,
        offsetY: 0,
      };
      this.commandValue = '';
      this.historyEntries = [];

      this.handleMouseMove = this.handleMouseMove.bind(this);
      this.handleMouseUp = this.handleMouseUp.bind(this);
      this.handleLanguageChange = this.handleLanguageChange.bind(this);

      this.ensureStyles();
      this.element = this.createWindow();
      this.appendToDesktop();
      this.bindEvents();
      this.positionWindow();
      this.renderCopy();
      this.focus();

      window.addEventListener('i18n:changed', this.handleLanguageChange);
      window.__hackosTerminalInstance = this;
    }

    ensureStyles() {
      if (document.getElementById(Terminal.STYLE_ID)) {
        return;
      }

      const style = HTMLBuilder.build('style', {
        id: Terminal.STYLE_ID,
        textContent: `
          .terminal-window,
          .terminal-window * {
            pointer-events: all;
            image-rendering: pixelated;
          }

          .terminal-window span,
          .terminal-window div,
          .terminal-window h2,
          .terminal-window button {
            color: inherit;
          }

          .terminal-window {
            position: absolute;
            display: flex;
            flex-direction: column;
            width: 44vw;
            height: 30vw;
            min-width: 540px;
            min-height: 380px;
            overflow: hidden;
            border: 0.28vw solid #173646;
            outline: 0.28vw solid #72b9d9;
            background: #04111a;
            box-shadow:
              0.5vw 0.5vw 0 #517487,
              0.9vw 0.9vw 0 rgba(16, 42, 54, 0.32);
            color: #eef9ff;
            pointer-events: all;
            user-select: none;
            clip-path: polygon(
              0 12px,
              12px 12px,
              12px 0,
              calc(100% - 12px) 0,
              calc(100% - 12px) 12px,
              100% 12px,
              100% calc(100% - 12px),
              calc(100% - 12px) calc(100% - 12px),
              calc(100% - 12px) 100%,
              12px 100%,
              12px calc(100% - 12px),
              0 calc(100% - 12px)
            );
          }

          .terminal-window::before {
            content: "";
            position: absolute;
            inset: 0.28vw;
            pointer-events: none;
            background:
              linear-gradient(90deg, rgba(114, 185, 217, 0.14), transparent 8%, transparent 92%, rgba(114, 185, 217, 0.14)),
              linear-gradient(180deg, rgba(255, 205, 114, 0.06), transparent 18%);
            border: 0.16vw solid #0b202b;
            opacity: 0.9;
          }

          .terminal-window.dragging {
            cursor: grabbing;
          }

          .terminal-frame__bar {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1vw;
            padding: 0.8vw 1vw 0.7vw;
            background: #184559;
            border-bottom: 0.25vw solid #0b2431;
            cursor: grab;
          }

          .terminal-frame__bar::before {
            content: "";
            position: absolute;
            inset: 0.2vw 0.2vw auto 0.2vw;
            height: 0.18vw;
            background: #8ddfff;
            opacity: 0.45;
          }

          .terminal-frame__bar::after {
            content: "";
            position: absolute;
            left: 1vw;
            right: 1vw;
            bottom: 0.25vw;
            height: 0.14vw;
            background: #0f2f3f;
          }

          .terminal-frame__identity {
            display: flex;
            flex-direction: column;
            gap: 0.18vw;
            min-width: 0;
          }

          .terminal-frame__kicker {
            color: #8ee6ff;
            font-family: 'VT323', monospace;
            font-size: 0.95vw;
            letter-spacing: 0.24em;
            text-transform: uppercase;
            opacity: 0.9;
          }

          .terminal-frame__title {
            color: #f4fbff;
            font-family: 'VT323', monospace;
            font-size: 2.1vw;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            text-shadow: 0.08vw 0.08vw 0 #0d2430;
          }

          .terminal-frame__controls {
            display: flex;
            align-items: center;
            gap: 0.55vw;
            flex: 0 0 auto;
          }

          .terminal-frame__dot {
            width: 0.72vw;
            height: 0.72vw;
            min-width: 8px;
            min-height: 8px;
            border-radius: 0;
            border: 0.14vw solid #0f2c3a;
            background: #6ea3b7;
            box-shadow: 0.14vw 0.14vw 0 #081620;
          }

          .terminal-frame__dot.is-warm {
            background: #f3c36c;
          }

          .terminal-frame__close {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 2.1vw;
            height: 2.1vw;
            min-width: 28px;
            min-height: 28px;
            border: 0.16vw solid #5e1427;
            background: #8a2146;
            color: #ffdce6;
            font-family: 'VT323', monospace;
            font-size: 1.5vw;
            cursor: pointer;
            box-shadow:
              0.14vw 0.14vw 0 #330916,
              inset 0.12vw 0.12vw 0 rgba(255, 174, 199, 0.22);
          }

          .terminal-frame__close:hover {
            background: #a12a54;
            color: #fff0f5;
          }

          .terminal-frame__body {
            position: relative;
            display: flex;
            flex: 1;
            flex-direction: column;
            gap: 1vw;
            padding: 1.15vw 1.2vw 1vw;
            overflow: hidden;
            background:
              linear-gradient(90deg, rgba(113, 184, 214, 0.08), transparent 12%, transparent 72%, rgba(113, 184, 214, 0.14)),
              #021019;
          }

          .terminal-frame__body::before {
            content: "";
            position: absolute;
            inset: 0;
            pointer-events: none;
            opacity: 0.18;
            background:
              repeating-linear-gradient(
                180deg,
                rgba(153, 235, 255, 0.16) 0,
                rgba(153, 235, 255, 0.16) 1px,
                transparent 1px,
                transparent 8px
              );
          }

          .terminal-frame__body::after {
            content: "";
            position: absolute;
            inset: 0;
            pointer-events: none;
            opacity: 0.45;
            background:
              linear-gradient(90deg, transparent 0, transparent 74%, rgba(115, 194, 223, 0.14) 74%, rgba(115, 194, 223, 0.06) 92%, transparent 92%);
          }

          .terminal-panel,
          .terminal-log,
          .terminal-prompt {
            position: relative;
            z-index: 1;
          }

          .terminal-panel {
            display: flex;
            justify-content: flex-start;
            align-items: flex-start;
            gap: 1vw;
            padding-bottom: 0.95vw;
            border-bottom: 0.16vw solid rgba(116, 226, 255, 0.18);
          }

          .terminal-panel__heading {
            margin: 0;
            color: #f8fbfd;
            font-family: 'VT323', monospace;
            font-size: 2.15vw;
            line-height: 1.2;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            text-shadow: 0.08vw 0.08vw 0 #091c25;
          }

          .terminal-log {
            display: flex;
            flex: 1;
            flex-direction: column;
            gap: 0.9vw;
            min-height: 0;
            overflow-y: auto;
            padding-right: 0.2vw;
          }

          .terminal-log::-webkit-scrollbar {
            width: 0.45vw;
          }

          .terminal-log::-webkit-scrollbar-thumb {
            background: #1b5065;
          }

          .terminal-line {
            display: flex;
            gap: 0.8vw;
            align-items: baseline;
            font-family: 'VT323', monospace;
            font-size: 1.35vw;
            line-height: 1.5;
            color: #f7fbff;
            text-shadow: 0.08vw 0.08vw 0 rgba(0, 0, 0, 0.4);
          }

          .terminal-line.is-dim {
            color: #86a7b2;
          }

          .terminal-line.is-accent {
            color: #f7fbff;
          }

          .terminal-line.is-warn {
            color: #ffc56c;
          }

          .terminal-line.is-error {
            color: #ff9ab6;
          }

          .terminal-prefix {
            flex: 0 0 auto;
            color: #8ee6ff;
            min-width: 4.4vw;
          }

          .terminal-prompt {
            display: flex;
            align-items: center;
            gap: 0.6vw;
            flex-wrap: wrap;
            padding-top: 0.95vw;
            border-top: 0.16vw solid rgba(116, 226, 255, 0.18);
            font-family: 'VT323', monospace;
            font-size: 1.35vw;
          }

          .terminal-user {
            color: #8ee6ff;
          }

          .terminal-path {
            color: #f7fbff;
          }

          .terminal-command {
            color: #f2d08b;
          }

          .terminal-command-input {
            flex: 1 1 10vw;
            min-width: 8vw;
            border: none;
            outline: none;
            background: transparent;
            color: #f7fbff;
            caret-color: #8ee6ff;
            font-family: 'VT323', monospace;
            font-size: 1.35vw;
            line-height: 1;
            padding: 0;
            margin: 0;
            box-shadow: none;
            filter: none;
            user-select: text;
          }

          .terminal-command-input::placeholder {
            color: rgba(242, 208, 139, 0.52);
          }

          .terminal-command-input:focus {
            text-shadow: 0.08vw 0.08vw 0 rgba(0, 0, 0, 0.4);
          }

          .terminal-cursor {
            width: 0.82vw;
            height: 1.12vw;
            min-width: 8px;
            min-height: 12px;
            background: #8ee6ff;
            box-shadow: 0.12vw 0.12vw 0 #21596b;
            animation: hackos-terminal-cursor 1s steps(1, end) infinite;
          }

          @keyframes hackos-terminal-cursor {
            0%, 50% {
              opacity: 1;
            }

            50.01%, 100% {
              opacity: 0;
            }
          }
        `,
      });

      document.head.appendChild(style);
    }

    createWindow() {
      const element = HTMLBuilder.build('section', {
        className: 'terminal-window closeable',
      });

      this.topbar = HTMLBuilder.build('div', {
        className: 'terminal-frame__bar',
      });

      const identity = HTMLBuilder.build('div', {
        className: 'terminal-frame__identity',
      });

      this.kickerNode = HTMLBuilder.build('span', {
        className: 'terminal-frame__kicker',
      });

      this.titleNode = HTMLBuilder.build('div', {
        className: 'terminal-frame__title',
      });

      identity.append(this.kickerNode, this.titleNode);

      const controls = HTMLBuilder.build('div', {
        className: 'terminal-frame__controls',
      });

      controls.append(
        HTMLBuilder.build('span', { className: 'terminal-frame__dot' }),
        HTMLBuilder.build('span', {
          className: 'terminal-frame__dot is-warm',
        }),
      );

      this.closeButton = HTMLBuilder.build('button', {
        className: 'terminal-frame__close',
        type: 'button',
        innerText: 'X',
      });

      controls.appendChild(this.closeButton);
      this.topbar.append(identity, controls);

      this.body = HTMLBuilder.build('div', {
        className: 'terminal-frame__body',
      });

      this.panel = HTMLBuilder.build('div', {
        className: 'terminal-panel',
      });

      this.panelTitle = HTMLBuilder.build('h2', {
        className: 'terminal-panel__heading',
      });
      this.panel.appendChild(this.panelTitle);

      this.log = HTMLBuilder.build('div', {
        className: 'terminal-log',
      });

      this.prompt = HTMLBuilder.build('div', {
        className: 'terminal-prompt',
      });

      this.body.append(this.panel, this.log, this.prompt);
      element.append(this.topbar, this.body);

      return element;
    }

    appendToDesktop() {
      const desktop = document.querySelector('main > .windows');
      if (desktop) {
        desktop.appendChild(this.element);
      }
    }

    bindEvents() {
      this.topbar.addEventListener('mousedown', (event) => {
        if (event.target.closest('.terminal-frame__close')) {
          return;
        }

        this.focus();
        this.dragState.active = true;

        const rect = this.element.getBoundingClientRect();
        this.dragState.offsetX = event.clientX - rect.left;
        this.dragState.offsetY = event.clientY - rect.top;

        this.element.classList.add('dragging');
        document.addEventListener('mousemove', this.handleMouseMove);
        document.addEventListener('mouseup', this.handleMouseUp);
      });

      this.element.addEventListener('mousedown', () => {
        this.focus();
      });

      this.body.addEventListener('mousedown', (event) => {
        if (event.target.closest('.terminal-frame__close')) {
          return;
        }

        this.focusInput();
      });

      this.closeButton.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.delete();
      });
    }

    handleMouseMove(event) {
      if (!this.dragState.active) {
        return;
      }

      this.element.style.left = `${event.clientX - this.dragState.offsetX}px`;
      this.element.style.top = `${event.clientY - this.dragState.offsetY}px`;
    }

    handleMouseUp() {
      this.dragState.active = false;
      this.element.classList.remove('dragging');
      document.removeEventListener('mousemove', this.handleMouseMove);
      document.removeEventListener('mouseup', this.handleMouseUp);
    }

    renderCopy() {
      if (this.commandInput) {
        this.commandValue = this.commandInput.value;
      }

      this.kickerNode.innerText = tr('terminal.kicker', 'HackOS signal');
      this.titleNode.innerText = tr('terminal.window_title', 'Terminal');
      this.panelTitle.innerText = tr(
        'terminal.meta_title',
        'Hackemon shell // local session',
      );

      this.renderLogLines();

      this.commandInput = HTMLBuilder.build('input', {
        className: 'terminal-command-input',
        type: 'text',
        value: this.commandValue,
        placeholder: tr('terminal.prompt_command', 'help --coming-soon'),
        autocomplete: 'off',
        autocapitalize: 'off',
        spellcheck: false,
      });

      this.commandInput.addEventListener('input', () => {
        this.commandValue = this.commandInput.value;
      });

      this.commandInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          event.stopPropagation();
          this.executeCommand(this.commandInput.value);
          return;
        }

        event.stopPropagation();
      });

      this.prompt.replaceChildren(
        HTMLBuilder.build('span', {
          className: 'terminal-user',
          innerText: tr('terminal.prompt_user', 'visitor@hackemon'),
        }),
        HTMLBuilder.build('span', {
          innerText: ':',
        }),
        HTMLBuilder.build('span', {
          className: 'terminal-path',
          innerText: tr('terminal.prompt_path', '~/desktop'),
        }),
        HTMLBuilder.build('span', {
          innerText: '$',
        }),
        this.commandInput,
        HTMLBuilder.build('span', {
          className: 'terminal-cursor',
        }),
      );

      requestAnimationFrame(() => {
        this.focusInput();
      });
    }

    handleLanguageChange() {
      this.renderCopy();
    }

    getBaseEntries() {
      return [
        {
          prefix: '[boot]',
          className: 'is-accent',
          text: tr(
            'terminal.line_boot',
            'Terminal overlay mounted on Hackemon OS.',
          ),
        },
        {
          prefix: '[tip ]',
          className: 'is-dim',
          text: tr(
            'terminal.line_tip',
            'Double-click the icon to reopen this window.',
          ),
        },
        {
          prefix: '[next]',
          className: 'is-warn',
          text: tr(
            'terminal.line_next',
            'Commands, history and prompt input can be wired next.',
          ),
        },
      ];
    }

    buildLogLine({ prefix = '', className = '', text }) {
      const line = HTMLBuilder.build('div', {
        className: `terminal-line ${className}`.trim(),
      });

      if (prefix) {
        line.appendChild(
          HTMLBuilder.build('span', {
            className: 'terminal-prefix',
            innerText: prefix,
          }),
        );
      }

      line.appendChild(
        HTMLBuilder.build('span', {
          innerText: text,
        }),
      );

      return line;
    }

    renderLogLines() {
      this.log.replaceChildren();

      [...this.getBaseEntries(), ...this.historyEntries].forEach((entry) => {
        this.log.appendChild(this.buildLogLine(entry));
      });

      requestAnimationFrame(() => {
        this.log.scrollTop = this.log.scrollHeight;
      });
    }

    executeCommand(rawValue) {
      const command = rawValue.trim();
      if (!command) {
        this.commandValue = '';
        if (this.commandInput) {
          this.commandInput.value = '';
        }
        return;
      }

      this.historyEntries.push({
        className: 'is-accent',
        text: `> ${command}`,
      });

      const [name, ...args] = command.split(/\s+/);
      const normalizedCommand = name.toLowerCase();

      if (normalizedCommand === 'clear') {
        this.historyEntries = [];
      } else if (normalizedCommand === 'help') {
        this.historyEntries.push({
          className: 'is-dim',
          text: tr(
            'terminal.help_output',
            'Commandes disponibles : help, clear, whoami, lang',
          ),
        });
      } else if (normalizedCommand === 'whoami') {
        this.historyEntries.push({
          className: 'is-dim',
          text: tr(
            'terminal.whoami_output',
            'Session visiteur active.',
          ),
        });
      } else if (normalizedCommand === 'lang') {
        const language =
          window.I18n && typeof window.I18n.getLanguage === 'function'
            ? window.I18n.getLanguage()
            : 'fr';

        this.historyEntries.push({
          className: 'is-dim',
          text: tr(
            'terminal.lang_output',
            'Langue active : {language}',
            { language },
          ),
        });
      } else {
        this.historyEntries.push({
          className: 'is-error',
          text: tr(
            'terminal.command_not_found',
            "Cette commande n'existe pas.",
          ),
        });
      }

      this.commandValue = '';

      if (this.commandInput) {
        this.commandInput.value = '';
      }

      this.renderLogLines();
      this.focusInput();
    }

    positionWindow() {
      this.element.style.left = '14vw';
      this.element.style.top = '14vh';
    }

    focus() {
      this.element.style.zIndex = String(this.nextZIndex());
      this.focusInput();
    }

    focusInput() {
      if (!this.commandInput) {
        return;
      }

      this.commandInput.focus({ preventScroll: true });
      const valueLength = this.commandInput.value.length;
      this.commandInput.setSelectionRange(valueLength, valueLength);
    }

    nextZIndex() {
      if (window.Window && typeof Window.currentZIndex === 'number') {
        Window.currentZIndex += 1;
        return Window.currentZIndex;
      }

      Terminal.fallbackZIndex += 1;
      return Terminal.fallbackZIndex;
    }

    getElement() {
      return this.element;
    }

    delete() {
      this.handleMouseUp();
      window.removeEventListener('i18n:changed', this.handleLanguageChange);

      if (window.__hackosTerminalInstance === this) {
        window.__hackosTerminalInstance = null;
      }

      if (this.element && this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
    }
  }

  Terminal.__hackos = true;
  window.Terminal = Terminal;
}
