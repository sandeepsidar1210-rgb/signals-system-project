(function signalInputModule() {
  function inPagesFolder() {
    return window.location.pathname.includes('/pages/');
  }

  function templatePath() {
    return inPagesFolder() ? '../components/signalInput.html' : 'components/signalInput.html';
  }

  const fallbackTemplate = `
  <section class="signal-input-card">
    <div class="signal-input-head">
      <h3 class="signal-input-title">Custom Signal Input</h3>
      <label class="signal-toggle" aria-label="Enable custom signal">
        <input type="checkbox" class="signal-toggle-input">
        <span class="signal-toggle-track"></span>
        <span class="signal-toggle-text">Enable Custom Signal</span>
      </label>
    </div>
    <div class="signal-input-body" hidden>
      <div class="signal-input-group">
        <label class="signal-label">Enter Signal x(t)</label>
        <div class="signal-input-wrapper">
          <input type="text" class="signal-expression" placeholder="e.g. sin(t), t^2, exp(-t), sqrt(t)" value="sin(t)">
          <span class="signal-status-icon">⚠️</span>
        </div>
        <p class="signal-validation">Custom signal is disabled.</p>
      </div>
      
      <div class="signal-help-section">
        <p class="signal-helper"><strong>Syntax:</strong> Use 't' as variable. Supported functions: sin, cos, tan, abs, exp, sqrt, log, ^, +, −, *, /</p>
      </div>
      
      <div class="signal-examples-section">
        <p class="signal-examples-label">Quick Examples:</p>
        <div class="signal-examples">
          <button type="button" class="signal-example" data-example="sin(t)" title="Basic sine function">sin(t)</button>
          <button type="button" class="signal-example" data-example="cos(t)" title="Cosine function">cos(t)</button>
          <button type="button" class="signal-example" data-example="t^2" title="Quadratic">t²</button>
          <button type="button" class="signal-example" data-example="exp(-t)" title="Exponential decay">e^(-t)</button>
          <button type="button" class="signal-example" data-example="sqrt(abs(t))" title="Square root">√|t|</button>
          <button type="button" class="signal-example" data-example="sin(2*t)+cos(t)" title="Combined waves">sin(2t)+cos(t)</button>
          <button type="button" class="signal-example" data-example="1/(1+t^2)" title="Rational function">1/(1+t²)</button>
          <button type="button" class="signal-example" data-example="sin(t)*exp(-0.5*t)" title="Damped oscillation">sin(t)·e^(-0.5t)</button>
        </div>
      </div>
      
      <div class="signal-actions-row">
        <button type="button" class="btn btn-outline signal-clear">Clear Input</button>
      </div>
    </div>
  </section>`;

  function parseExpression(expression) {
    const trimmed = expression.trim();
    const compiled = math.parse(trimmed).compile();
    const sample = compiled.evaluate({ t: 0.25 });
    if (typeof sample !== 'number' || Number.isNaN(sample) || !Number.isFinite(sample)) {
      throw new Error('Expression must evaluate to real numbers.');
    }
    return (t) => {
      const value = compiled.evaluate({ t });
      if (typeof value !== 'number' || Number.isNaN(value) || !Number.isFinite(value)) return 0;
      return value;
    };
  }

  async function loadTemplate() {
    try {
      const response = await fetch(templatePath());
      if (!response.ok) throw new Error('template fetch failed');
      return await response.text();
    } catch (error) {
      return fallbackTemplate;
    }
  }

  class SignalInputComponent {
    constructor(root, options = {}) {
      this.root = root;
      this.options = options;
      this.onChange = options.onChange || (() => {});
      this.storageKey = `savl-signal-expression-${options.containerId || 'default'}`;
      this.enabledStorageKey = `${this.storageKey}-enabled`;
      this.linkedControlIds = Array.isArray(options.linkedControlIds) ? options.linkedControlIds : [];
    }

    setValidation(message, state) {
      if (this.validation) {
        this.validation.textContent = message;
        this.validation.classList.remove('ok', 'error', 'disabled');
      }

      if (this.statusIcon) {
        this.statusIcon.classList.remove('valid', 'invalid', 'disabled');
      }
      
      if (state === 'ok') {
        if (this.validation) this.validation.classList.add('ok');
        if (this.statusIcon) {
          this.statusIcon.classList.add('valid');
          this.statusIcon.textContent = '✅';
        }
        this.expression.classList.add('input-valid');
        this.expression.classList.remove('input-error');
      } else if (state === 'error') {
        if (this.validation) this.validation.classList.add('error');
        if (this.statusIcon) {
          this.statusIcon.classList.add('invalid');
          this.statusIcon.textContent = '❌';
        }
        this.expression.classList.add('input-error');
        this.expression.classList.remove('input-valid');
      } else if (state === 'disabled') {
        if (this.validation) this.validation.classList.add('disabled');
        if (this.statusIcon) {
          this.statusIcon.classList.add('disabled');
          this.statusIcon.textContent = '⊘';
        }
        this.expression.classList.remove('input-valid', 'input-error');
      } else {
        if (this.statusIcon) {
          this.statusIcon.classList.add('disabled');
          this.statusIcon.textContent = '⚠️';
        }
        this.expression.classList.remove('input-valid', 'input-error');
      }
    }

    isEnabled() {
      return Boolean(this.toggle && this.toggle.checked);
    }

    getExpression() {
      return this.expression.value.trim();
    }

    validate() {
      if (!this.isEnabled()) {
        this.setValidation('Custom signal is disabled. Toggle to enable.', 'disabled');
        return false;
      }

      const expression = this.getExpression();
      if (!expression.trim()) {
        this.setValidation('Please enter a signal expression.', 'error');
        return false;
      }

      try {
        this.customFunction = parseExpression(expression);
        this.setValidation('Custom mode ON | Ready to use', 'ok');
        return true;
      } catch (error) {
        this.customFunction = null;
        let suggestion = '';
        const raw = expression.toLowerCase();
        
        if (raw.includes('ln(')) {
          suggestion = ' Tip: Use log(...) instead of ln(...)';;
        } else if (raw.includes('e^(')) {
          suggestion = ' Tip: Use exp(...) for exponentials like e^(-t).';;
        } else if (raw.match(/\*\*/)) {
          suggestion = ' Tip: Use ^ for powers (e.g., t^2 instead of t**).';;
        } else if (!raw.includes('t')) {
          suggestion = ' Tip: Don\'t forget the variable "t" in your expression.';;
        } else if (raw.match(/[\(\)]/) && !expression.match(/[\(\)]/)) {
          suggestion = ' Tip: Check parentheses matching.';;
        } else {
          suggestion = ' Try: sin(t), t^2, exp(-t), 1/(1+t^2), or sqrt(abs(t))';;
        }
        this.setValidation(`❌ Invalid syntax.${suggestion}`, 'error');
        return false;
      }
    }

    getSignalData(times, fallbackSignalFn) {
      if (!this.isEnabled()) return times.map((t) => fallbackSignalFn(t));

      console.log('Using custom:', this.isEnabled());
      console.log('Expression:', this.getExpression());

      if (!this.validate() || !this.customFunction) return times.map(() => 0);
      return times.map((t) => this.customFunction(t));
    }

    getValueAt(t, fallbackSignalFn) {
      if (!this.isEnabled()) return fallbackSignalFn(t);
      if (!this.validate() || !this.customFunction) return 0;
      return this.customFunction(t);
    }

    setEnabled(isEnabled, notify = false) {
      if (!this.toggle || !this.body) return;
      this.toggle.checked = isEnabled;
      this.body.hidden = !isEnabled;
      this.root.classList.toggle('custom-mode-on', isEnabled);
      this.syncLinkedControls(isEnabled);

      localStorage.setItem(this.enabledStorageKey, isEnabled ? 'true' : 'false');

      if (notify) {
        this.onChange();
      }
    }

    setExpression(expression) {
      this.expression.value = expression;
      localStorage.setItem(this.storageKey, expression);
    }

    clear() {
      this.expression.value = '';
      this.validate();
      this.onChange();
    }

    syncLinkedControls(isEnabled) {
      this.linkedControlIds.forEach((controlId) => {
        const control = document.getElementById(controlId);
        if (!control) return;
        control.disabled = isEnabled;
        control.setAttribute('aria-disabled', String(isEnabled));
        control.classList.toggle('custom-disabled', isEnabled);
      });
    }

    bind() {
      this.toggle = this.root.querySelector('.signal-toggle-input');
      this.body = this.root.querySelector('.signal-input-body');
      this.expression = this.root.querySelector('.signal-expression');
      this.validation = this.root.querySelector('.signal-validation');
      this.statusIcon = this.root.querySelector('.signal-status-icon');
      this.clearButton = this.root.querySelector('.signal-clear');
      this.examples = Array.from(this.root.querySelectorAll('.signal-example'));

      if (!this.toggle || !this.body || !this.expression) {
        console.error('Custom signal input template is missing required fields.');
        return;
      }

      if (!this.validation) {
        this.validation = document.createElement('p');
        this.validation.className = 'signal-validation';
        this.validation.textContent = 'Custom signal is disabled.';
        this.body.appendChild(this.validation);
      }

      if (!this.statusIcon) {
        const wrapper = this.root.querySelector('.signal-input-wrapper');
        if (wrapper) {
          this.statusIcon = document.createElement('span');
          this.statusIcon.className = 'signal-status-icon';
          this.statusIcon.textContent = '⚠️';
          wrapper.appendChild(this.statusIcon);
        }
      }

      if (this.options.title) {
        const titleEl = this.root.querySelector('.signal-input-title');
        if (titleEl) titleEl.textContent = this.options.title;
      }

      if (this.options.placeholder) {
        this.expression.placeholder = this.options.placeholder;
      }

      if (this.options.initialExpression) {
        this.expression.value = this.options.initialExpression;
      }

      const savedExpression = localStorage.getItem(this.storageKey);
      if (savedExpression) {
        this.expression.value = savedExpression;
      }

      const savedEnabled = localStorage.getItem(this.enabledStorageKey);
      const shouldEnable = savedEnabled !== null ? savedEnabled === 'true' : Boolean(this.options.enabledByDefault);
      this.setEnabled(shouldEnable);
      this.validate();

      this.toggle.addEventListener('change', () => {
        this.setEnabled(this.toggle.checked, true);
        this.validate();
      });

      this.expression.addEventListener('input', () => {
        localStorage.setItem(this.storageKey, this.expression.value);
        if (!this.isEnabled()) {
          this.setEnabled(true);
        }
        this.validate();
        this.onChange();
      });

      if (this.clearButton) {
        this.clearButton.addEventListener('click', () => {
          this.clear();
        });
      }

      this.examples.forEach((button) => {
        button.addEventListener('click', () => {
          this.expression.value = button.dataset.example || '';
          localStorage.setItem(this.storageKey, this.expression.value);
          if (!this.isEnabled()) {
            this.setEnabled(true);
          }
          this.validate();
          this.onChange();
        });
      });
    }
  }

  async function createSignalInput(options) {
    const container = document.getElementById(options.containerId);
    if (!container) return null;

    container.innerHTML = await loadTemplate();
    const componentRoot = container.firstElementChild;
    const component = new SignalInputComponent(componentRoot, options);
    component.bind();
    return component;
  }

  function getSignalData(component, times, fallbackSignalFn) {
    if (!component) return times.map((t) => fallbackSignalFn(t));
    return component.getSignalData(times, fallbackSignalFn);
  }

  window.createSignalInput = createSignalInput;
  window.getSignalData = getSignalData;
})();
