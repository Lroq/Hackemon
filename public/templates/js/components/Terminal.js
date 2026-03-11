if (window.Terminal && window.Terminal.__hackos) {
  // Deja defini par HackOS: on ignore sans bruit.
} else {
  const tr = (key, fallback, vars) => {
    if (window.I18n && typeof window.I18n.t === "function") {
      return window.I18n.t(key, vars, fallback);
    }
    return fallback;
  };

  class Terminal {
    static STYLE_ID = "hackos-terminal-styles";
    static fallbackZIndex = 20;

    constructor() {
      this.dragState = {
        active: false,
        offsetX: 0,
        offsetY: 0,
      };
      this.commandValue = "";
      this.historyEntries = [];
      this.commandHistory = [];
      this.commandHistoryIndex = -1;
      this.commandHistoryDraft = "";
      this.isSyncingCommandInput = false;
      this.isRmRfSequenceRunning = false;
      this.rmRfTimeoutId = null;
      this.rmRfLogIntervalId = null;
      this.partyTimeoutId = null;
      this.partyElements = [];
      this.drunkTimeoutId = null;
      this.drunkAnimationFrameId = null;
      this.isDrunkModeActive = false;
      this.drunkPointerState = {
        x: window.innerWidth * 0.5,
        y: window.innerHeight * 0.5,
        targetX: window.innerWidth * 0.5,
        targetY: window.innerHeight * 0.5,
      };
      this.topPanelTimeoutId = null;
      this.navbarKillTimeoutId = null;
      this.navbarElement = null;

      this.handleMouseMove = this.handleMouseMove.bind(this);
      this.handleMouseUp = this.handleMouseUp.bind(this);
      this.handleLanguageChange = this.handleLanguageChange.bind(this);
      this.handleUserProfileChange = this.handleUserProfileChange.bind(this);
      this.handleDrunkPointerMove = this.handleDrunkPointerMove.bind(this);
      this.animateDrunkCursor = this.animateDrunkCursor.bind(this);

      this.ensureStyles();
      this.element = this.createWindow();
      this.appendToDesktop();
      this.bindEvents();
      this.positionWindow();
      this.renderCopy();
      this.focus();

      window.addEventListener("i18n:changed", this.handleLanguageChange);
      window.addEventListener(
        "hackos:user-profile-changed",
        this.handleUserProfileChange,
      );
      window.__hackosTerminalInstance = this;
    }

    ensureStyles() {
      if (document.getElementById(Terminal.STYLE_ID)) {
        return;
      }

      const style = HTMLBuilder.build("style", {
        id: Terminal.STYLE_ID,
        textContent: `
          .terminal-window,
          .terminal-window * {
            pointer-events: all;
            image-rendering: pixelated;
          }

          body > main {
            position: relative;
            width: 100vw;
            min-height: 100vh;
            overflow: hidden;
            --hackos-main-rotate: 0deg;
            transform-origin: center center;
            transform: translate3d(0, 0, 0) rotate(var(--hackos-main-rotate));
            transition: transform 0.22s steps(2, end);
            will-change: transform;
          }

          html.hackos-invert-page body > main {
            --hackos-main-rotate: 180deg;
          }

          html.hackos-drunk-mode body,
          html.hackos-drunk-mode body * {
            cursor: none !important;
          }

          .hackos-drunk-cursor {
            position: fixed;
            left: 0;
            top: 0;
            width: 18px;
            height: 18px;
            opacity: 0;
            pointer-events: none;
            z-index: 20000;
            transform: translate3d(-120px, -120px, 0);
            transition: opacity 0.18s ease;
          }

          .hackos-drunk-cursor::before {
            content: "";
            position: absolute;
            inset: 0;
            border: 2px solid #d8f6ff;
            background: rgba(164, 229, 255, 0.12);
            box-shadow:
              0 0 0 2px rgba(31, 88, 112, 0.58),
              0 0 18px rgba(144, 224, 255, 0.28);
            clip-path: polygon(
              0 4px,
              4px 4px,
              4px 0,
              calc(100% - 4px) 0,
              calc(100% - 4px) 4px,
              100% 4px,
              100% calc(100% - 4px),
              calc(100% - 4px) calc(100% - 4px),
              calc(100% - 4px) 100%,
              4px 100%,
              4px calc(100% - 4px),
              0 calc(100% - 4px)
            );
          }

          .hackos-drunk-cursor::after {
            content: "";
            position: absolute;
            inset: 5px;
            border-left: 2px solid #ffe9a8;
            border-top: 2px solid #ffe9a8;
            opacity: 0.84;
          }

          html.hackos-drunk-mode .hackos-drunk-cursor {
            opacity: 0.92;
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

          .terminal-rickroll-overlay {
            position: fixed;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 4vw;
            background: rgba(2, 12, 18, 0.82);
            backdrop-filter: blur(2px);
          }

          .terminal-rickroll-overlay::before {
            content: "";
            position: absolute;
            inset: 0;
            pointer-events: none;
            opacity: 0.2;
            background:
              repeating-linear-gradient(
                180deg,
                rgba(143, 228, 255, 0.2) 0,
                rgba(143, 228, 255, 0.2) 2px,
                transparent 2px,
                transparent 12px
              );
          }

          .terminal-rickroll-card {
            position: relative;
            display: flex;
            flex-direction: column;
            gap: 1vw;
            width: min(74vw, 860px);
            padding: 1vw;
            border: 0.28vw solid #173646;
            outline: 0.28vw solid #72b9d9;
            background: #06141d;
            box-shadow:
              0.6vw 0.6vw 0 rgba(17, 48, 62, 0.56),
              1vw 1vw 0 rgba(8, 24, 32, 0.36);
            clip-path: polygon(
              0 14px,
              14px 14px,
              14px 0,
              calc(100% - 14px) 0,
              calc(100% - 14px) 14px,
              100% 14px,
              100% calc(100% - 14px),
              calc(100% - 14px) calc(100% - 14px),
              calc(100% - 14px) 100%,
              14px 100%,
              14px calc(100% - 14px),
              0 calc(100% - 14px)
            );
          }

          .terminal-rickroll-card > * {
            position: relative;
            z-index: 1;
          }

          .terminal-rickroll-head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1vw;
          }

          .terminal-rickroll-title {
            color: #f3fbff;
            font-family: 'VT323', monospace;
            font-size: 2.2vw;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            text-shadow: 0.08vw 0.08vw 0 #071821;
          }

          .terminal-rickroll-close {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-width: 7.2vw;
            min-height: 2.4vw;
            padding: 0.2vw 0.8vw;
            border: 0.16vw solid #5e1427;
            background: #8a2146;
            color: #ffe8ef;
            font-family: 'VT323', monospace;
            font-size: 1.4vw;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            cursor: pointer;
            box-shadow:
              0.14vw 0.14vw 0 #330916,
              inset 0.12vw 0.12vw 0 rgba(255, 174, 199, 0.2);
          }

          .terminal-rickroll-close:hover {
            background: #a12a54;
          }

          .terminal-rickroll-frame {
            overflow: hidden;
            border: 0.18vw solid rgba(116, 226, 255, 0.25);
            background: #000;
          }

          .terminal-rickroll-gif {
            display: block;
            width: 100%;
            height: auto;
          }

          .terminal-rm-overlay {
            position: fixed;
            inset: 0;
            z-index: 9999;
            display: none;
            flex-direction: column;
            justify-content: center;
            gap: 1vw;
            padding: 3vw;
            pointer-events: all;
            background:
              radial-gradient(circle at center, rgba(170, 255, 188, 0.08), transparent 42%),
              linear-gradient(180deg, rgba(6, 24, 14, 0.98), rgba(2, 12, 8, 0.98));
          }

          .terminal-rm-overlay.is-active {
            display: flex;
          }

          .terminal-rm-overlay::before {
            content: "";
            position: absolute;
            inset: 0;
            pointer-events: none;
            opacity: 0.22;
            background:
              repeating-linear-gradient(
                180deg,
                rgba(111, 255, 152, 0.18) 0,
                rgba(111, 255, 152, 0.18) 2px,
                transparent 2px,
                transparent 12px
              );
          }

          .terminal-rm-overlay::after {
            content: "";
            position: absolute;
            left: 0;
            right: 0;
            top: -18%;
            height: 18%;
            background: linear-gradient(180deg, rgba(122, 255, 169, 0.28), transparent);
            animation: hackos-terminal-scan 1.4s linear infinite;
          }

          .terminal-rm-overlay > * {
            position: relative;
            z-index: 1;
          }

          .terminal-rm-title {
            color: #d8ffe2;
            font-family: 'VT323', monospace;
            font-size: 3vw;
            letter-spacing: 0.14em;
            text-transform: uppercase;
            text-shadow: 0.08vw 0.08vw 0 #06120a;
          }

          .terminal-rm-status,
          .terminal-rm-hint {
            color: #92ffad;
            font-family: 'VT323', monospace;
            font-size: 1.55vw;
            line-height: 1.1;
            letter-spacing: 0.06em;
            text-transform: uppercase;
          }

          .terminal-rm-hint {
            color: rgba(210, 255, 219, 0.78);
          }

          .terminal-rm-progress {
            position: relative;
            overflow: hidden;
            height: 1.2vw;
            border: 0.14vw solid rgba(122, 255, 169, 0.4);
            background: rgba(3, 14, 8, 0.92);
            box-shadow: inset 0 0 0 0.12vw rgba(122, 255, 169, 0.12);
          }

          .terminal-rm-log {
            display: flex;
            flex-direction: column;
            gap: 0.28vw;
            min-height: 12vw;
            max-height: 16vw;
            overflow-y: auto;
            padding: 0.85vw 1vw;
            border: 0.14vw solid rgba(122, 255, 169, 0.25);
            background: rgba(3, 14, 8, 0.7);
            box-shadow: inset 0 0 0 0.12vw rgba(122, 255, 169, 0.08);
          }

          .terminal-rm-log-line {
            color: #cffff1;
            font-family: 'VT323', monospace;
            font-size: 1.25vw;
            line-height: 1;
            letter-spacing: 0.04em;
            white-space: pre-wrap;
            word-break: break-word;
          }

          .terminal-top-overlay {
            position: fixed;
            inset: 0;
            display: flex;
            justify-content: flex-end;
            align-items: flex-start;
            padding: 7vh 4vw 0;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.16s steps(2, end);
          }

          .terminal-top-overlay.is-active {
            opacity: 1;
          }

          .terminal-top-card {
            width: min(28vw, 480px);
            min-width: 320px;
            padding: 1vw;
            border: 0.24vw solid #163849;
            outline: 0.24vw solid #78c7e8;
            background:
              linear-gradient(180deg, rgba(130, 226, 255, 0.12), transparent 40%),
              #05121a;
            box-shadow:
              0.65vw 0.65vw 0 rgba(17, 43, 56, 0.45),
              inset 0 0 0 0.14vw rgba(120, 199, 232, 0.22);
            clip-path: polygon(
              0 10px,
              10px 10px,
              10px 0,
              calc(100% - 10px) 0,
              calc(100% - 10px) 10px,
              100% 10px,
              100% calc(100% - 10px),
              calc(100% - 10px) calc(100% - 10px),
              calc(100% - 10px) 100%,
              10px 100%,
              10px calc(100% - 10px),
              0 calc(100% - 10px)
            );
            transform: translate3d(0, -1vw, 0) scale(0.96);
            transition: transform 0.18s steps(3, end);
          }

          .terminal-top-overlay.is-active .terminal-top-card {
            transform: translate3d(0, 0, 0) scale(1);
          }

          .terminal-top-card::before {
            content: "";
            position: absolute;
            inset: 0.28vw;
            pointer-events: none;
            background:
              repeating-linear-gradient(
                180deg,
                rgba(130, 226, 255, 0.08) 0,
                rgba(130, 226, 255, 0.08) 2px,
                transparent 2px,
                transparent 8px
              );
            opacity: 0.4;
          }

          .terminal-top-card,
          .terminal-top-card * {
            position: relative;
            color: #ebfbff;
          }

          .terminal-top-title {
            margin-bottom: 0.8vw;
            color: #8fe5ff;
            font-family: 'VT323', monospace;
            font-size: 1.6vw;
            letter-spacing: 0.14em;
            text-transform: uppercase;
            text-shadow: 0.08vw 0.08vw 0 #0b2634;
          }

          .terminal-top-grid {
            display: grid;
            gap: 0.44vw;
          }

          .terminal-top-row {
            display: grid;
            grid-template-columns: 1fr auto;
            align-items: center;
            gap: 1vw;
            padding: 0.38vw 0.52vw;
            border: 0.12vw solid rgba(130, 226, 255, 0.2);
            background: rgba(5, 24, 33, 0.82);
          }

          .terminal-top-label {
            color: #9edff4;
            font-family: 'VT323', monospace;
            font-size: 1.28vw;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }

          .terminal-top-value {
            color: #ffe39b;
            font-family: 'VT323', monospace;
            font-size: 1.28vw;
            letter-spacing: 0.05em;
            text-transform: uppercase;
          }

          .terminal-top-value.is-danger {
            color: #ff8a8a;
          }

          main > nav.hackos-navbar-ejecting {
            pointer-events: none;
            animation: hackos-navbar-eject 1.1s steps(4, end) forwards;
            transform-origin: center bottom;
          }

          main > nav.hackos-navbar-ejecting::before {
            content: attr(data-scream);
            position: absolute;
            right: 1.2vw;
            bottom: calc(100% + 0.4vw);
            color: #ffb3c5;
            font-family: 'VT323', monospace;
            font-size: 2vw;
            letter-spacing: 0.16em;
            text-shadow:
              0.12vw 0.12vw 0 #6c102b,
              0 0 1vw rgba(255, 84, 136, 0.32);
            animation: hackos-navbar-scream 1.1s steps(4, end) both;
            pointer-events: none;
          }

          main > nav.hackos-navbar-ejecting::after {
            content: "";
            position: absolute;
            inset: 0;
            background:
              repeating-linear-gradient(
                90deg,
                rgba(255, 96, 137, 0.18) 0,
                rgba(255, 96, 137, 0.18) 10px,
                transparent 10px,
                transparent 18px
              );
            animation: hackos-navbar-glitch 0.16s steps(2, end) infinite;
            pointer-events: none;
          }

          .hackos-party-window {
            animation:
              hackos-party-jitter 0.12s steps(2, end) infinite alternate,
              hackos-party-spectrum 0.36s steps(2, end) infinite;
            transform-origin: center;
          }

          .hackos-party-window .topbar,
          .hackos-party-window .terminal-frame__bar {
            animation: hackos-party-bar 0.28s steps(2, end) infinite;
          }

          .terminal-rm-progress::before {
            content: "";
            position: absolute;
            inset: 0;
            width: 36%;
            background:
              repeating-linear-gradient(
                90deg,
                #8dffab 0,
                #8dffab 12px,
                #4fb46b 12px,
                #4fb46b 20px
              );
            box-shadow: 0 0 1vw rgba(141, 255, 171, 0.35);
            animation: hackos-terminal-progress 1.1s steps(10, end) infinite;
          }

          @keyframes hackos-terminal-progress {
            from {
              transform: translateX(-105%);
            }

            to {
              transform: translateX(285%);
            }
          }

          @keyframes hackos-terminal-scan {
            from {
              transform: translateY(0);
            }

            to {
              transform: translateY(680%);
            }
          }

          @keyframes hackos-party-jitter {
            from {
              transform: translate3d(-2vw, 2vw, 0) rotate(-1deg);
            }

            to {
              transform: translate3d(2vw, -2vw, 0) rotate(1deg);
            }
          }

          @keyframes hackos-party-spectrum {
            0% {
              filter: hue-rotate(0deg) saturate(1.2) brightness(1);
            }

            50% {
              filter: hue-rotate(90deg) saturate(1.45) brightness(1.08);
            }

            100% {
              filter: hue-rotate(180deg) saturate(1.25) brightness(0.96);
            }
          }

          @keyframes hackos-party-bar {
            0% {
              filter: hue-rotate(0deg) brightness(1);
            }

            50% {
              filter: hue-rotate(120deg) brightness(1.14);
            }

            100% {
              filter: hue-rotate(240deg) brightness(0.98);
            }
          }

          @keyframes hackos-navbar-eject {
            0% {
              transform: translate3d(0, 0, 0) rotate(0deg);
              opacity: 1;
            }

            18% {
              transform: translate3d(-0.7vw, -0.35vw, 0) rotate(-0.8deg);
            }

            34% {
              transform: translate3d(0.8vw, 0.3vw, 0) rotate(0.7deg);
            }

            100% {
              transform: translate3d(0, 180%, 0) rotate(-3deg);
              opacity: 0;
            }
          }

          @keyframes hackos-navbar-scream {
            0% {
              transform: translate3d(0, 0.8vw, 0) scale(0.6) rotate(-4deg);
              opacity: 0;
            }

            25% {
              opacity: 1;
            }

            100% {
              transform: translate3d(1.4vw, -2.2vw, 0) scale(1.18) rotate(4deg);
              opacity: 0;
            }
          }

          @keyframes hackos-navbar-glitch {
            from {
              transform: translateX(-0.2vw);
              opacity: 0.42;
            }

            to {
              transform: translateX(0.2vw);
              opacity: 0.14;
            }
          }

          @media (max-width: 960px) {
            .hackos-drunk-cursor {
              width: 14px;
              height: 14px;
            }

            .terminal-top-overlay {
              padding: 5vw 4vw 0;
            }

            .terminal-top-card {
              width: min(90vw, 520px);
              min-width: 0;
              padding: 3vw;
            }

            .terminal-top-title {
              font-size: 6.8vw;
              margin-bottom: 2vw;
            }

            .terminal-top-grid {
              gap: 1.6vw;
            }

            .terminal-top-row {
              padding: 1.6vw 2vw;
            }

            .terminal-top-label,
            .terminal-top-value {
              font-size: 5.4vw;
            }

            main > nav.hackos-navbar-ejecting::before {
              right: 3vw;
              bottom: calc(100% + 1vw);
              font-size: 6vw;
            }

            .terminal-rickroll-overlay {
              padding: 6vw 4vw;
            }

            .terminal-rickroll-card {
              width: min(92vw, 860px);
              padding: 3vw;
            }

            .terminal-rickroll-title {
              font-size: 8vw;
            }

            .terminal-rickroll-close {
              min-width: 24vw;
              min-height: 10vw;
              font-size: 5vw;
            }

            .terminal-rm-title {
              font-size: 8vw;
            }

            .terminal-rm-status,
            .terminal-rm-hint {
              font-size: 4.8vw;
            }

            .terminal-rm-progress {
              height: 4vw;
            }

            .terminal-rm-log {
              min-height: 38vw;
              max-height: 44vw;
              padding: 3vw;
            }

            .terminal-rm-log-line {
              font-size: 4vw;
              line-height: 1.05;
            }
          }

        `,
      });

      document.head.appendChild(style);
    }

    createWindow() {
      const element = HTMLBuilder.build("section", {
        className: "terminal-window closeable",
      });

      this.topbar = HTMLBuilder.build("div", {
        className: "terminal-frame__bar",
      });

      const identity = HTMLBuilder.build("div", {
        className: "terminal-frame__identity",
      });

      this.kickerNode = HTMLBuilder.build("span", {
        className: "terminal-frame__kicker",
      });

      this.titleNode = HTMLBuilder.build("div", {
        className: "terminal-frame__title",
      });

      identity.append(this.kickerNode, this.titleNode);

      const controls = HTMLBuilder.build("div", {
        className: "terminal-frame__controls",
      });

      controls.append(
        HTMLBuilder.build("span", { className: "terminal-frame__dot" }),
        HTMLBuilder.build("span", {
          className: "terminal-frame__dot is-warm",
        }),
      );

      this.closeButton = HTMLBuilder.build("button", {
        className: "terminal-frame__close",
        type: "button",
        innerText: "X",
      });

      controls.appendChild(this.closeButton);
      this.topbar.append(identity, controls);

      this.body = HTMLBuilder.build("div", {
        className: "terminal-frame__body",
      });

      this.panel = HTMLBuilder.build("div", {
        className: "terminal-panel",
      });

      this.panelTitle = HTMLBuilder.build("h2", {
        className: "terminal-panel__heading",
      });
      this.panel.appendChild(this.panelTitle);

      this.log = HTMLBuilder.build("div", {
        className: "terminal-log",
      });

      this.prompt = HTMLBuilder.build("div", {
        className: "terminal-prompt",
      });

      this.body.append(this.panel, this.log, this.prompt);
      element.append(this.topbar, this.body);

      return element;
    }

    appendToDesktop() {
      const desktop = document.querySelector("main > .windows");
      if (desktop) {
        desktop.appendChild(this.element);
      }
    }

    bindEvents() {
      this.topbar.addEventListener("mousedown", (event) => {
        if (event.target.closest(".terminal-frame__close")) {
          return;
        }

        this.focus();
        this.dragState.active = true;

        const rect = this.element.getBoundingClientRect();
        this.dragState.offsetX = event.clientX - rect.left;
        this.dragState.offsetY = event.clientY - rect.top;

        this.element.classList.add("dragging");
        document.addEventListener("mousemove", this.handleMouseMove);
        document.addEventListener("mouseup", this.handleMouseUp);
      });

      this.element.addEventListener("mousedown", () => {
        this.focus();
      });

      this.body.addEventListener("mousedown", (event) => {
        if (event.target.closest(".terminal-frame__close")) {
          return;
        }

        this.focusInput();
      });

      this.closeButton.addEventListener("click", (event) => {
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
      this.element.classList.remove("dragging");
      document.removeEventListener("mousemove", this.handleMouseMove);
      document.removeEventListener("mouseup", this.handleMouseUp);
    }

    renderCopy() {
      if (this.commandInput) {
        this.commandValue = this.commandInput.value;
      }

      this.kickerNode.innerText = tr("terminal.kicker", "HackOS signal");
      this.titleNode.innerText = tr("terminal.window_title", "Terminal");
      this.panelTitle.innerText = tr(
        "terminal.meta_title",
        "Hackemon shell // local session",
      );

      this.renderLogLines();

      this.commandInput = HTMLBuilder.build("input", {
        className: "terminal-command-input",
        type: "text",
        value: this.commandValue,
        placeholder: tr("terminal.prompt_command", "help"),
        autocomplete: "off",
        autocapitalize: "off",
        spellcheck: false,
      });

      if (this.isRmRfSequenceRunning) {
        this.commandInput.disabled = true;
      }

      this.commandInput.addEventListener("input", () => {
        if (this.isSyncingCommandInput) {
          return;
        }

        this.commandValue = this.commandInput.value;

        if (this.commandHistoryIndex !== -1) {
          this.commandHistoryIndex = -1;
          this.commandHistoryDraft = this.commandValue;
        }
      });

      this.commandInput.addEventListener("keydown", (event) => {
        if (event.key === "Tab") {
          event.preventDefault();
          event.stopPropagation();
          this.autocompleteCommand();
          return;
        }

        if (event.key === "ArrowUp") {
          event.preventDefault();
          event.stopPropagation();
          this.navigateCommandHistory(-1);
          return;
        }

        if (event.key === "ArrowDown") {
          event.preventDefault();
          event.stopPropagation();
          this.navigateCommandHistory(1);
          return;
        }

        if (event.key === "Enter") {
          event.preventDefault();
          event.stopPropagation();
          this.executeCommand(this.commandInput.value);
          return;
        }

        event.stopPropagation();
      });

      this.prompt.replaceChildren(
        HTMLBuilder.build("span", {
          className: "terminal-user",
          innerText: this.getPromptUser(),
        }),
        HTMLBuilder.build("span", {
          innerText: ":",
        }),
        HTMLBuilder.build("span", {
          className: "terminal-path",
          innerText: tr("terminal.prompt_path", "~/desktop"),
        }),
        HTMLBuilder.build("span", {
          innerText: "$",
        }),
        this.commandInput,
        HTMLBuilder.build("span", {
          className: "terminal-cursor",
        }),
      );

      requestAnimationFrame(() => {
        this.focusInput();
      });
    }

    handleLanguageChange() {
      this.renderCopy();
      this.renderRmRfCopy();
      this.renderTopPanelCopy();

      const navbar = this.navbarElement || document.querySelector("main > nav");
      if (navbar?.classList.contains("hackos-navbar-ejecting")) {
        navbar.dataset.scream = tr("terminal.kill_navbar_scream", "AAAAA");
      }
    }

    handleUserProfileChange() {
      this.renderCopy();
    }

    getSessionUser() {
      const appManagerUser =
        window.AppManager &&
        typeof window.AppManager.getCurrentUser === "function"
          ? window.AppManager.getCurrentUser()
          : null;

      if (appManagerUser?.user) {
        return appManagerUser.user;
      }

      if (appManagerUser) {
        return appManagerUser;
      }

      return null;
    }

    getPromptUser() {
      const sessionUser = this.getSessionUser();
      const loginName =
        sessionUser?.username ||
        sessionUser?.name ||
        sessionUser?.email?.split("@")[0] ||
        "";

      if (loginName) {
        return `${loginName}@hackemon`;
      }

      const pseudoElement = document.getElementById("userPseudo");
      if (pseudoElement && !pseudoElement.hasAttribute("data-i18n")) {
        const pseudo = pseudoElement.textContent?.trim();
        if (pseudo) {
          return `${pseudo}@hackemon`;
        }
      }

      return tr("terminal.prompt_user", "visitor@hackemon");
    }

    getWhoAmIValue() {
      return this.getPromptUser().replace(/@hackemon$/i, "");
    }

    getPrimaryCommands() {
      return [
        "help",
        "clear",
        "invert",
        "drunk",
        "whoami",
        "lang",
        "ls secrets",
        "gps",
        "party",
        "top",
        "kill navbar",
        "cat",
        "restaure",
        "rickroll",
        "rm -rf",
      ];
    }

    getLongestCommonPrefix(values) {
      if (!values.length) {
        return "";
      }

      let prefix = values[0];

      for (let index = 1; index < values.length; index += 1) {
        while (values[index] && !values[index].startsWith(prefix)) {
          prefix = prefix.slice(0, -1);
        }

        if (!prefix) {
          return "";
        }
      }

      return prefix;
    }

    autocompleteCommand() {
      const rawValue = this.commandInput?.value || "";
      const trimmedValue = rawValue.trimStart();

      if (!trimmedValue || /\s/.test(trimmedValue)) {
        return;
      }

      const normalizedValue = trimmedValue.toLowerCase();
      const matches = this.getPrimaryCommands().filter((commandName) =>
        commandName.toLowerCase().startsWith(normalizedValue),
      );

      if (!matches.length) {
        return;
      }

      const completion =
        matches.length === 1
          ? matches[0]
          : this.getLongestCommonPrefix(matches);

      if (!completion || completion === normalizedValue) {
        return;
      }

      const leadingWhitespace = rawValue.match(/^\s*/)?.[0] || "";
      const completionLower = completion.toLowerCase();
      const suffix =
        completionLower === "restaure" ||
        completionLower === "cat" ||
        completionLower === "rm -rf" ||
        completionLower === "ls secrets"
          ? " "
          : "";
      this.setCommandInputValue(`${leadingWhitespace}${completion}${suffix}`);
      this.commandHistoryIndex = -1;
      this.commandHistoryDraft = this.commandValue;
    }

    getSecretInventory() {
      return [
        "/vault/secrets/README.md",
        "/vault/secrets/root-access.kdbx",
        "/vault/secrets/board-members-private.pem",
        "/vault/secrets/incident-response-runbook.pdf",
        "/vault/secrets/payroll-2026.xlsx",
        "/vault/secrets/prod-db-master-password.txt",
        "/vault/secrets/zero-day-notes.md",
      ];
    }

    getReadableFiles() {
      return [
        {
          url: "/public/vault/secrets/README.md",
          aliases: [
            "README.md",
            "readme.md",
            "/vault/secrets/README.md",
            "vault/secrets/README.md",
            "/public/vault/secrets/README.md",
          ],
        },
      ];
    }

    findReadableFile(rawTarget) {
      const normalizedTarget = this.normalizeLookupValue(rawTarget);
      if (!normalizedTarget) {
        return null;
      }

      return (
        this.getReadableFiles().find((file) =>
          file.aliases.some(
            (alias) =>
              this.normalizeLookupValue(alias) === normalizedTarget,
          ),
        ) || null
      );
    }

    showLsSecrets() {
      this.historyEntries.push({
        className: "is-warn",
        text: tr("terminal.ls_secrets_intro", "Inventaire de /vault/secrets :"),
      });

      this.getSecretInventory().forEach((entry) => {
        this.historyEntries.push({
          className: "is-dim",
          text: entry,
        });
      });
    }

    handleCatCommand(rawTarget) {
      const target = rawTarget.trim();
      if (!target) {
        this.historyEntries.push({
          className: "is-error",
          text: tr("terminal.cat_usage", "Aucun fichier specifie."),
        });
        return;
      }

      const file = this.findReadableFile(target);
      if (!file) {
        this.historyEntries.push({
          className: "is-error",
          text: tr(
            "terminal.cat_not_found",
            "Fichier introuvable : {target}.",
            { target },
          ),
        });
        return;
      }

      fetch(file.url, { cache: "no-store" })
        .then((response) => {
          if (!response.ok) {
            throw new Error("read-error");
          }

          return response.text();
        })
        .then((content) => {
          String(content || "")
            .replace(/\r\n/g, "\n")
            .trim()
            .split("\n")
            .forEach((line) => {
              this.historyEntries.push({
                className: "is-dim",
                text: line || " ",
              });
            });

          this.renderLogLines();
          this.focusInput();
        })
        .catch(() => {
          this.historyEntries.push({
            className: "is-error",
            text: tr(
              "terminal.cat_read_error",
              "Lecture de {target} impossible.",
              { target },
            ),
          });
          this.renderLogLines();
          this.focusInput();
        });
    }

    generateGpsPayload() {
      const lat = (95 + Math.random() * 84).toFixed(4);
      const lon = (-181 - Math.random() * 178).toFixed(4);
      const altitude = Math.round(7000 + Math.random() * 14000);
      const zones = [
        "secteur orbital B-12",
        "parking souterrain de l'Atlantide",
        "couloir transatlantique 404",
        "plateforme lunaire de Limoges",
      ];

      return {
        lat,
        lon,
        altitude,
        zone: zones[Math.floor(Math.random() * zones.length)],
      };
    }

    showGpsResult() {
      const payload = this.generateGpsPayload();

      this.historyEntries.push({
        className: "is-warn",
        text: tr("terminal.gps_intro", "Position de l'utilisateur localisee."),
      });
      this.historyEntries.push({
        className: "is-dim",
        text: `lat ${payload.lat} / lon ${payload.lon}`,
      });
      this.historyEntries.push({
        className: "is-dim",
        text: `${payload.zone} / alt ${payload.altitude} m`,
      });
    }

    ensureTopPanel() {
      if (this.topPanelOverlay?.isConnected) {
        return this.topPanelOverlay;
      }

      const overlay = HTMLBuilder.build("div", {
        className: "terminal-top-overlay",
      });

      const card = HTMLBuilder.build("div", {
        className: "terminal-top-card",
      });

      this.topPanelTitleNode = HTMLBuilder.build("div", {
        className: "terminal-top-title",
      });

      const grid = HTMLBuilder.build("div", {
        className: "terminal-top-grid",
      });

      this.topMetricNodes = {};
      [
        ["cpu", false],
        ["ram", false],
        ["ego", false],
        ["css_debt", true],
      ].forEach(([key, isDanger]) => {
        const row = HTMLBuilder.build("div", {
          className: "terminal-top-row",
        });
        const label = HTMLBuilder.build("span", {
          className: "terminal-top-label",
        });
        const value = HTMLBuilder.build("span", {
          className: `terminal-top-value${isDanger ? " is-danger" : ""}`,
        });
        row.append(label, value);
        grid.appendChild(row);
        this.topMetricNodes[key] = { label, value };
      });

      card.append(this.topPanelTitleNode, grid);
      overlay.appendChild(card);
      document.body.appendChild(overlay);

      this.topPanelOverlay = overlay;
      this.renderTopPanelCopy();
      return overlay;
    }

    renderTopPanelCopy() {
      if (!this.topPanelTitleNode || !this.topMetricNodes) {
        return;
      }

      this.topPanelTitleNode.innerText = tr(
        "terminal.top_title",
        "top // monitorage douteux",
      );

      this.topMetricNodes.cpu.label.innerText = tr(
        "terminal.top_cpu_label",
        "CPU",
      );
      this.topMetricNodes.cpu.value.innerText = tr(
        "terminal.top_cpu_value",
        "12%",
      );

      this.topMetricNodes.ram.label.innerText = tr(
        "terminal.top_ram_label",
        "RAM",
      );
      this.topMetricNodes.ram.value.innerText = tr(
        "terminal.top_ram_value",
        "43%",
      );

      this.topMetricNodes.ego.label.innerText = tr(
        "terminal.top_ego_label",
        "Ego",
      );
      this.topMetricNodes.ego.value.innerText = tr(
        "terminal.top_ego_value",
        "98%",
      );

      this.topMetricNodes.css_debt.label.innerText = tr(
        "terminal.top_css_debt_label",
        "CSS debt",
      );
      this.topMetricNodes.css_debt.value.innerText = tr(
        "terminal.top_css_debt_value",
        "critical",
      );
    }

    showTopPanel() {
      const overlay = this.ensureTopPanel();
      this.renderTopPanelCopy();
      overlay.style.zIndex = String(this.nextZIndex() + 60);
      overlay.classList.add("is-active");

      window.clearTimeout(this.topPanelTimeoutId);
      this.topPanelTimeoutId = window.setTimeout(() => {
        this.hideTopPanel();
      }, 3400);

      this.historyEntries.push({
        className: "is-dim",
        text: tr(
          "terminal.top_output",
          "Moniteur systeme absurde ouvert.",
        ),
      });
    }

    hideTopPanel({ remove = false } = {}) {
      window.clearTimeout(this.topPanelTimeoutId);
      this.topPanelTimeoutId = null;

      if (this.topPanelOverlay) {
        this.topPanelOverlay.classList.remove("is-active");
        if (remove && this.topPanelOverlay.parentNode) {
          this.topPanelOverlay.parentNode.removeChild(this.topPanelOverlay);
          this.topPanelOverlay = null;
          this.topPanelTitleNode = null;
          this.topMetricNodes = null;
        }
      }
    }

    startNavbarKill() {
      const navbar = document.querySelector("main > nav");
      if (!navbar) {
        return;
      }

      this.stopNavbarKill();

      this.navbarElement = navbar;
      navbar.dataset.scream = tr("terminal.kill_navbar_scream", "AAAAA");
      void navbar.offsetWidth;
      navbar.classList.add("hackos-navbar-ejecting");

      window.clearTimeout(this.navbarKillTimeoutId);
      this.navbarKillTimeoutId = window.setTimeout(() => {
        this.stopNavbarKill();
      }, 4800);

      this.historyEntries.push({
        className: "is-warn",
        text: tr(
          "terminal.kill_navbar_output",
          "Navbar ejectee hors ecran.",
        ),
      });
    }

    stopNavbarKill() {
      window.clearTimeout(this.navbarKillTimeoutId);
      this.navbarKillTimeoutId = null;

      const navbar = this.navbarElement || document.querySelector("main > nav");
      if (navbar) {
        navbar.classList.remove("hackos-navbar-ejecting");
        navbar.removeAttribute("data-scream");
      }

      this.navbarElement = null;
    }

    startPartyMode() {
      this.stopPartyMode();

      const partyElements = Array.from(
        document.querySelectorAll(
          "main > .windows .window, main > .windows .terminal-window",
        ),
      );

      partyElements.forEach((element) => {
        element.classList.add("hackos-party-window");
      });

      this.partyElements = partyElements;
      this.partyTimeoutId = window.setTimeout(() => {
        this.stopPartyMode();
      }, 2600);

      this.historyEntries.push({
        className: "is-warn",
        text: tr(
          "terminal.party_output",
          "Party mode active sur {count} fenetre(s).",
          { count: partyElements.length },
        ),
      });
    }

    stopPartyMode() {
      window.clearTimeout(this.partyTimeoutId);
      this.partyTimeoutId = null;

      this.partyElements.forEach((element) => {
        element.classList.remove("hackos-party-window");
      });

      this.partyElements = [];
    }

    ensureDrunkCursor() {
      if (this.drunkCursor?.isConnected) {
        return this.drunkCursor;
      }

      this.drunkCursor = HTMLBuilder.build("div", {
        className: "hackos-drunk-cursor",
      });
      document.body.appendChild(this.drunkCursor);
      return this.drunkCursor;
    }

    handleDrunkPointerMove(event) {
      this.drunkPointerState.targetX = event.clientX;
      this.drunkPointerState.targetY = event.clientY;
    }

    animateDrunkCursor() {
      if (!this.isDrunkModeActive || !this.drunkCursor) {
        this.drunkAnimationFrameId = null;
        return;
      }

      const reducedMotion = window.matchMedia?.(
        "(prefers-reduced-motion: reduce)",
      )?.matches;
      const driftScale = reducedMotion ? 0.38 : 1;
      const blurBase = reducedMotion ? 0.18 : 0.62;
      const now = performance.now() * 0.001;
      const state = this.drunkPointerState;

      state.x += (state.targetX - state.x) * 0.16;
      state.y += (state.targetY - state.y) * 0.16;

      const driftX =
        (Math.sin(now * 1.7) * 11 + Math.cos(now * 0.72) * 6) * driftScale;
      const driftY =
        (Math.cos(now * 1.28) * 9 + Math.sin(now * 0.54) * 4) * driftScale;
      const angle = Math.sin(now * 1.18) * 8 * driftScale;
      const blur = blurBase + ((Math.sin(now * 2.4) + 1) * 0.12);

      this.drunkCursor.style.transform = `translate3d(${state.x + driftX}px, ${state.y + driftY}px, 0) translate(-50%, -50%) rotate(${angle}deg)`;
      this.drunkCursor.style.filter = `blur(${blur}px)`;

      this.drunkAnimationFrameId = window.requestAnimationFrame(
        this.animateDrunkCursor,
      );
    }

    startDrunkMode() {
      const root = document.documentElement;

      this.ensureDrunkCursor();
      root.classList.add("hackos-drunk-mode");
      this.isDrunkModeActive = true;

      document.addEventListener("mousemove", this.handleDrunkPointerMove);
      if (!this.drunkAnimationFrameId) {
        this.drunkAnimationFrameId = window.requestAnimationFrame(
          this.animateDrunkCursor,
        );
      }

      window.clearTimeout(this.drunkTimeoutId);
      this.drunkTimeoutId = window.setTimeout(() => {
        this.stopDrunkMode();
      }, 8000);

      this.historyEntries.push({
        className: "is-warn",
        text: tr(
          "terminal.drunk_output",
          "Mode ivre active. Le curseur commence a flotter.",
        ),
      });
    }

    stopDrunkMode({ silent = false, remove = false } = {}) {
      window.clearTimeout(this.drunkTimeoutId);
      this.drunkTimeoutId = null;
      document.removeEventListener("mousemove", this.handleDrunkPointerMove);

      if (this.drunkAnimationFrameId) {
        window.cancelAnimationFrame(this.drunkAnimationFrameId);
        this.drunkAnimationFrameId = null;
      }

      document.documentElement.classList.remove("hackos-drunk-mode");
      this.isDrunkModeActive = false;

      if (this.drunkCursor) {
        this.drunkCursor.style.transform = "translate3d(-120px, -120px, 0)";
        this.drunkCursor.style.filter = "blur(0px)";

        if (remove && this.drunkCursor.parentNode) {
          this.drunkCursor.parentNode.removeChild(this.drunkCursor);
          this.drunkCursor = null;
        }
      }

      if (!silent) {
        this.historyEntries.push({
          className: "is-dim",
          text: tr(
            "terminal.drunk_recovery",
            "Le sol arrete enfin de tanguer.",
          ),
        });
        this.renderLogLines();
        this.focusInput();
      }
    }

    ensureRmRfOverlay() {
      if (this.rmRfOverlay?.isConnected) {
        return this.rmRfOverlay;
      }

      const overlay = HTMLBuilder.build("div", {
        className: "terminal-rm-overlay",
      });

      this.rmRfTitleNode = HTMLBuilder.build("div", {
        className: "terminal-rm-title",
      });
      this.rmRfStatusNode = HTMLBuilder.build("div", {
        className: "terminal-rm-status",
      });
      this.rmRfHintNode = HTMLBuilder.build("div", {
        className: "terminal-rm-hint",
      });
      this.rmRfProgressNode = HTMLBuilder.build("div", {
        className: "terminal-rm-progress",
      });
      this.rmRfLogNode = HTMLBuilder.build("div", {
        className: "terminal-rm-log",
      });

      overlay.append(
        this.rmRfTitleNode,
        this.rmRfStatusNode,
        this.rmRfProgressNode,
        this.rmRfLogNode,
        this.rmRfHintNode,
      );

      document.body.appendChild(overlay);
      this.rmRfOverlay = overlay;
      this.renderRmRfCopy();
      return overlay;
    }

    renderRmRfCopy() {
      if (!this.rmRfTitleNode || !this.rmRfStatusNode || !this.rmRfHintNode) {
        return;
      }

      this.rmRfTitleNode.innerText = tr(
        "terminal.rm_rf_title",
        "Suppression en cours",
      );
      this.rmRfStatusNode.innerText = tr(
        "terminal.rm_rf_status",
        "rm -rf / -- purge totale simulee",
      );
      this.rmRfHintNode.innerText = tr(
        "terminal.rm_rf_hint",
        "Veuillez patienter...",
      );
    }

    getRmRfLogEntries() {
      return [
        "shredding /home/visitor/.ssh/id_ed25519",
        "shredding /etc/hackos/keys/admin-root.pem",
        "purging /srv/mail/archive/executive-board-2026-03.eml",
        "purging /var/lib/postgresql/data/customers.tbl",
        "erasing /opt/hackos/backups/payroll-2025-final.xlsx",
        "erasing /srv/vault/contracts/nda-master-signed.pdf",
        "wiping /home/visitor/Documents/wallet-recovery.txt",
        "wiping /var/audit/private/incidents.enc",
        "removing /srv/cameras/lobby-feed-01.mp4",
        "removing /etc/hackos/secrets/oauth-client.json",
        "destroying /home/visitor/Desktop/admin-passwords.kdbx",
        "destroying /var/lib/docker/volumes/prod-db/_data/users.sql",
        "scrubbing /srv/hr/confidential/candidates-2026.csv",
        "scrubbing /opt/hackos/tokens/session-store.dump",
        "nulling /home/visitor/Downloads/investors-pitch-v12.pptx",
        "nulling /srv/legal/archive/merger-draft-redline.docx",
      ];
    }

    resetRmRfLogLines() {
      if (!this.rmRfLogNode) {
        return;
      }

      this.rmRfLogNode.replaceChildren();
    }

    appendRmRfLogLine(text) {
      if (!this.rmRfLogNode) {
        return;
      }

      this.rmRfLogNode.appendChild(
        HTMLBuilder.build("div", {
          className: "terminal-rm-log-line",
          innerText: text,
        }),
      );
      this.rmRfLogNode.scrollTop = this.rmRfLogNode.scrollHeight;
    }

    streamRmRfLogs() {
      const logEntries = this.getRmRfLogEntries();
      let logIndex = 0;

      this.resetRmRfLogLines();
      this.appendRmRfLogLine("[rm] initiating recursive delete on /");
      this.appendRmRfLogLine("[rm] escalating privileges...");

      window.clearInterval(this.rmRfLogIntervalId);
      this.rmRfLogIntervalId = window.setInterval(() => {
        if (!this.isRmRfSequenceRunning || logIndex >= logEntries.length) {
          window.clearInterval(this.rmRfLogIntervalId);
          this.rmRfLogIntervalId = null;
          return;
        }

        this.appendRmRfLogLine(logEntries[logIndex]);
        logIndex += 1;
      }, 280);
    }

    runRmRfSequence() {
      if (this.isRmRfSequenceRunning) {
        return;
      }

      this.isRmRfSequenceRunning = true;
      const overlay = this.ensureRmRfOverlay();
      this.renderRmRfCopy();
      this.streamRmRfLogs();
      overlay.style.zIndex = String(this.nextZIndex() + 100);
      overlay.classList.add("is-active");

      if (this.commandInput) {
        this.commandInput.disabled = true;
      }

      window.clearTimeout(this.rmRfTimeoutId);
      this.rmRfTimeoutId = window.setTimeout(() => {
        this.stopRmRfSequence();
        this.renderLogLines();
        this.focusInput();
      }, 5000);
    }

    stopRmRfSequence({ silent = false } = {}) {
      this.isRmRfSequenceRunning = false;
      window.clearTimeout(this.rmRfTimeoutId);
      this.rmRfTimeoutId = null;
      window.clearInterval(this.rmRfLogIntervalId);
      this.rmRfLogIntervalId = null;

      if (this.rmRfOverlay) {
        this.rmRfOverlay.classList.remove("is-active");
      }

      if (this.commandInput) {
        this.commandInput.disabled = false;
      }

      if (!silent) {
        this.historyEntries.push({
          className: "is-warn",
          text: tr("terminal.rm_rf_output", "Non, je plaisante."),
        });
      }
    }

    shouldWipeEntirePageOnClear() {
      return Math.random() < 1 / 3;
    }

    wipeEntirePage() {
      this.stopRmRfSequence({ silent: true });
      this.hideRickroll();
      this.stopDrunkMode({ silent: true, remove: true });
      this.hideTopPanel({ remove: true });
      this.stopNavbarKill();
      window.removeEventListener("i18n:changed", this.handleLanguageChange);
      window.removeEventListener(
        "hackos:user-profile-changed",
        this.handleUserProfileChange,
      );

      if (window.__hackosTerminalInstance === this) {
        window.__hackosTerminalInstance = null;
      }

      document.documentElement.innerHTML = "";
      document.documentElement.style.background = "#000";
      document.documentElement.style.height = "100%";
      document.body.style.background = "#000";
      document.body.style.height = "100%";
      document.body.style.margin = "0";
    }

    togglePageInvert() {
      const root = document.documentElement;
      const isActive = root.classList.toggle("hackos-invert-page");

      this.historyEntries.push({
        className: "is-warn",
        text: tr(
          isActive ? "terminal.invert_on" : "terminal.invert_off",
          isActive ? "Mode inversion active." : "Mode inversion desactive.",
        ),
      });
    }

    ensureRickrollOverlay() {
      if (this.rickrollOverlay?.isConnected) {
        return this.rickrollOverlay;
      }

      const overlay = HTMLBuilder.build("div", {
        className: "terminal-rickroll-overlay",
      });

      const card = HTMLBuilder.build("div", {
        className: "terminal-rickroll-card",
      });

      const closeButton = HTMLBuilder.build("button", {
        className: "terminal-rickroll-close",
        type: "button",
        innerText: tr("terminal.rickroll_close", "Fermer"),
      });

      closeButton.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.hideRickroll();
      });

      overlay.addEventListener("click", (event) => {
        if (event.target === overlay) {
          this.hideRickroll();
        }
      });

      const head = HTMLBuilder.build("div", {
        className: "terminal-rickroll-head",
      });
      head.append(
        HTMLBuilder.build("div", {
          className: "terminal-rickroll-title",
          innerText: tr("terminal.rickroll_title", "Rickroll.exe"),
        }),
        closeButton,
      );

      const frame = HTMLBuilder.build("div", {
        className: "terminal-rickroll-frame",
      });
      frame.appendChild(
        HTMLBuilder.build("img", {
          className: "terminal-rickroll-gif",
          src: "/public/assets/rickroll.gif",
          alt: "Rickroll",
        }),
      );

      card.append(head, frame);

      overlay.appendChild(card);
      document.body.appendChild(overlay);

      this.rickrollOverlay = overlay;
      return overlay;
    }

    showRickroll() {
      const overlay = this.ensureRickrollOverlay();
      overlay.style.zIndex = String(this.nextZIndex() + 50);

      if (!this.rickrollAudio) {
        this.rickrollAudio = new Audio("/public/assets/sounds/rickroll.mp3");
        this.rickrollAudio.preload = "auto";
      }

      this.historyEntries.push({
        className: "is-warn",
        text: tr("terminal.rickroll_output", "Rickroll deploye a l ecran."),
      });

      this.rickrollAudio.pause();
      this.rickrollAudio.currentTime = 0;

      const playback = this.rickrollAudio.play();
      if (playback && typeof playback.catch === "function") {
        playback.catch(() => {
          this.historyEntries.push({
            className: "is-error",
            text: tr(
              "terminal.rickroll_audio_error",
              "Lecture audio bloquee par le navigateur.",
            ),
          });
          this.renderLogLines();
        });
      }
    }

    hideRickroll() {
      if (this.rickrollAudio) {
        this.rickrollAudio.pause();
        this.rickrollAudio.currentTime = 0;
      }

      if (this.rickrollOverlay?.parentNode) {
        this.rickrollOverlay.parentNode.removeChild(this.rickrollOverlay);
      }

      this.rickrollOverlay = null;
      this.focus();
    }

    setCommandInputValue(value) {
      this.commandValue = value;

      if (!this.commandInput) {
        return;
      }

      this.isSyncingCommandInput = true;
      this.commandInput.value = value;
      const valueLength = value.length;
      this.commandInput.setSelectionRange(valueLength, valueLength);
      this.isSyncingCommandInput = false;
    }

    navigateCommandHistory(direction) {
      if (this.commandHistory.length === 0) {
        return;
      }

      if (direction < 0) {
        if (this.commandHistoryIndex === -1) {
          this.commandHistoryDraft = this.commandInput?.value || "";
          this.commandHistoryIndex = this.commandHistory.length - 1;
        } else if (this.commandHistoryIndex > 0) {
          this.commandHistoryIndex -= 1;
        }

        this.setCommandInputValue(
          this.commandHistory[this.commandHistoryIndex] || "",
        );
        return;
      }

      if (this.commandHistoryIndex === -1) {
        return;
      }

      if (this.commandHistoryIndex < this.commandHistory.length - 1) {
        this.commandHistoryIndex += 1;
        this.setCommandInputValue(
          this.commandHistory[this.commandHistoryIndex] || "",
        );
        return;
      }

      this.commandHistoryIndex = -1;
      this.setCommandInputValue(this.commandHistoryDraft);
    }

    getBaseEntries() {
      return [
        {
          prefix: "[boot]",
          className: "is-accent",
          text: tr(
            "terminal.line_boot",
            "Terminal overlay mounted on Hackemon OS.",
          ),
        },
        {
          prefix: "[tip ]",
          className: "is-dim",
          text: tr(
            "terminal.line_tip",
            "Double-click the icon to reopen this window.",
          ),
        },
        {
          prefix: "[next]",
          className: "is-warn",
          text: tr(
            "terminal.line_next",
            "Commands, history and prompt input can be wired next.",
          ),
        },
      ];
    }

    buildLogLine({ prefix = "", className = "", text }) {
      const line = HTMLBuilder.build("div", {
        className: `terminal-line ${className}`.trim(),
      });

      if (prefix) {
        line.appendChild(
          HTMLBuilder.build("span", {
            className: "terminal-prefix",
            innerText: prefix,
          }),
        );
      }

      line.appendChild(
        HTMLBuilder.build("span", {
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

    normalizeLookupValue(value) {
      return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "");
    }

    collectRecordAliases(record) {
      const aliases = new Set();

      const addAlias = (value) => {
        const normalized = this.normalizeLookupValue(value);
        if (normalized) {
          aliases.add(normalized);
        }
      };

      const addVariants = (value) => {
        if (!value) {
          return;
        }

        const rawValue = String(value);
        addAlias(rawValue);
        addAlias(rawValue.replace(/btn$/i, ""));
        addAlias(rawValue.replace(/\.[a-z0-9_-]+$/i, ""));
      };

      addVariants(record?.id);
      addVariants(record?.name);
      addVariants(record?.template?.labelText);

      if (
        window.DesktopAppRegistry &&
        typeof window.DesktopAppRegistry.getDisplayName === "function"
      ) {
        addVariants(window.DesktopAppRegistry.getDisplayName(record));
      }

      if (
        record?.translationKey &&
        window.I18n &&
        typeof window.I18n.t === "function"
      ) {
        addVariants(
          window.I18n.t(
            record.translationKey,
            null,
            record.template?.labelText || record.name || record.id,
          ),
        );
      }

      return aliases;
    }

    findDeletedApp(rawName) {
      const registry = window.DesktopAppRegistry;
      if (!registry || typeof registry.getDeletedItems !== "function") {
        return null;
      }

      const normalizedName = this.normalizeLookupValue(rawName);
      if (!normalizedName) {
        return null;
      }

      return (
        registry.getDeletedItems().find((record) => {
          return this.collectRecordAliases(record).has(normalizedName);
        }) || null
      );
    }

    handleRestoreCommand(rawTarget) {
      const target = rawTarget.trim();
      if (!target) {
        this.historyEntries.push({
          className: "is-error",
          text: tr(
            "terminal.restore_usage",
            "Utilisation : restaure <nom de l'appli>.",
          ),
        });
        return;
      }

      const registry = window.DesktopAppRegistry;
      if (!registry || typeof registry.reinstallApp !== "function") {
        this.historyEntries.push({
          className: "is-error",
          text: tr(
            "terminal.restore_not_found",
            'Aucune appli supprimee ne correspond a "{app}".',
            { app: target },
          ),
        });
        return;
      }

      const record = this.findDeletedApp(target);
      if (!record) {
        this.historyEntries.push({
          className: "is-error",
          text: tr(
            "terminal.restore_not_found",
            'Aucune appli supprimee ne correspond a "{app}".',
            { app: target },
          ),
        });
        return;
      }

      const restoredRecord = registry.reinstallApp(record.id);
      if (!restoredRecord) {
        this.historyEntries.push({
          className: "is-error",
          text: tr(
            "terminal.restore_not_found",
            'Aucune appli supprimee ne correspond a "{app}".',
            { app: target },
          ),
        });
        return;
      }

      this.historyEntries.push({
        className: "is-dim",
        text: tr(
          "terminal.restore_success",
          "{app} a ete restauree sur le bureau.",
          {
            app:
              (typeof registry.getDisplayName === "function" &&
                registry.getDisplayName(restoredRecord)) ||
              target,
          },
        ),
      });
    }

    executeCommand(rawValue) {
      const command = rawValue.trim();
      if (!command) {
        this.setCommandInputValue("");
        return;
      }

      this.commandHistory.push(command);
      this.commandHistoryIndex = -1;
      this.commandHistoryDraft = "";

      this.historyEntries.push({
        className: "is-accent",
        text: `> ${command}`,
      });

      const separatorIndex = command.indexOf(" ");
      const name =
        separatorIndex === -1 ? command : command.slice(0, separatorIndex);
      const argumentText =
        separatorIndex === -1 ? "" : command.slice(separatorIndex + 1).trim();
      const normalizedCommand = name.toLowerCase();

      if (normalizedCommand === "help") {
        this.historyEntries.push({
          className: "is-dim",
          text: tr(
            "terminal.help_output",
            "Commandes disponibles : help, clear, invert, drunk, whoami, lang, ls secrets, gps, party, top, kill navbar, cat, restaure <app>, rickroll, rm -rf",
          ),
        });
      } else if (normalizedCommand === "clear") {
        if (this.shouldWipeEntirePageOnClear()) {
          this.wipeEntirePage();
          return;
        }

        this.historyEntries = [];
      } else if (normalizedCommand === "invert") {
        this.togglePageInvert();
      } else if (normalizedCommand === "drunk") {
        this.startDrunkMode();
      } else if (normalizedCommand === "whoami") {
        this.historyEntries.push({
          className: "is-dim",
          text: tr("terminal.whoami_output", "Session active : {username}.", {
            username: this.getWhoAmIValue(),
          }),
        });
      } else if (normalizedCommand === "lang") {
        const language =
          window.I18n && typeof window.I18n.getLanguage === "function"
            ? window.I18n.getLanguage()
            : "fr";

        this.historyEntries.push({
          className: "is-dim",
          text: tr("terminal.lang_output", "Langue active : {language}", {
            language,
          }),
        });
      } else if (normalizedCommand === "top") {
        this.showTopPanel();
      } else if (
        normalizedCommand === "ls" &&
        argumentText.toLowerCase() === "secrets"
      ) {
        this.showLsSecrets();
      } else if (
        normalizedCommand === "kill" &&
        argumentText.toLowerCase() === "navbar"
      ) {
        this.startNavbarKill();
      } else if (normalizedCommand === "cat") {
        this.handleCatCommand(argumentText);
      } else if (normalizedCommand === "gps") {
        this.showGpsResult();
      } else if (normalizedCommand === "party") {
        this.startPartyMode();
      } else if (
        normalizedCommand === "rm" &&
        /^-rf(\s|$)/i.test(argumentText)
      ) {
        this.runRmRfSequence();
      } else if (normalizedCommand === "rickroll") {
        this.showRickroll();
      } else if (
        normalizedCommand === "restaure" ||
        normalizedCommand === "restore"
      ) {
        this.handleRestoreCommand(argumentText);
      } else {
        this.historyEntries.push({
          className: "is-error",
          text: tr(
            "terminal.command_not_found",
            "Cette commande n'existe pas.",
          ),
        });
      }

      this.setCommandInputValue("");

      this.renderLogLines();
      if (!this.isRmRfSequenceRunning) {
        this.focusInput();
      }
    }

    positionWindow() {
      this.element.style.left = "14vw";
      this.element.style.top = "14vh";
    }

    focus() {
      this.element.style.zIndex = String(this.nextZIndex());
      this.focusInput();
    }

    focusInput() {
      if (!this.commandInput || this.commandInput.disabled) {
        return;
      }

      this.commandInput.focus({ preventScroll: true });
      const valueLength = this.commandInput.value.length;
      this.commandInput.setSelectionRange(valueLength, valueLength);
    }

    nextZIndex() {
      if (window.Window && typeof Window.currentZIndex === "number") {
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
      this.stopPartyMode();
      this.stopRmRfSequence({ silent: true });
      this.hideRickroll();
      this.stopDrunkMode({ silent: true, remove: true });
      this.hideTopPanel({ remove: true });
      this.stopNavbarKill();
      this.handleMouseUp();
      window.removeEventListener("i18n:changed", this.handleLanguageChange);
      window.removeEventListener(
        "hackos:user-profile-changed",
        this.handleUserProfileChange,
      );

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
