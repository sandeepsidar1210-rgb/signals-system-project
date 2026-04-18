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
      <label class="signal-label">Enter Signal x(t)</label>
      <input type="text" class="signal-expression" placeholder="e.g. sin(t), t^2, exp(-t), sin(2*t)+cos(t)" value="sin(t)">
      <p class="signal-helper">Use 't' as variable. Supported: sin, cos, exp, ^, +, - , *</p>
      <div class="signal-actions-row">
        <button type="button" class="btn btn-outline signal-clear">Clear</button>
        <div class="signal-examples">
          <button type="button" class="signal-example" data-example="sin(t)">sin(t)</button>
          <button type="button" class="signal-example" data-example="t^2">t^2</button>
          <button type="button" class="signal-example" data-example="exp(-t)">exp(-t)</button>
          <button type="button" class="signal-example" data-example="sin(2*t)+cos(t)">sin(2*t)+cos(t)</button>
        </div>
      </div>
      <p class="signal-validation">Custom signal is disabled.</p>
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
    }

    setValidation(message, state) {
      this.validation.textContent = message;
      this.validation.classList.remove('ok', 'error');
      if (state) this.validation.classList.add(state);
    }

    isEnabled() {
      return this.toggle.checked;
    }

    getExpression() {
      return this.expression.value.trim();
    }

    validate() {
      if (!this.isEnabled()) {
        this.setValidation('Custom signal is disabled.', '');
        return false;
      }

      try {
        this.customFunction = parseExpression(this.getExpression());
        this.setValidation('Valid expression ✅', 'ok');
        return true;
      } catch (error) {
        this.customFunction = null;
        let suggestion = '';
        const raw = this.getExpression();
        if (raw.includes('^') && raw.includes('**')) suggestion = ' Use ^ for powers.';
        else if (raw.includes('ln(')) suggestion = ' Try log(...) instead of ln(...).';
        else if (raw.includes('e^')) suggestion = ' Try exp(...) for exponentials.';
        else suggestion = ' Example: sin(t), t^2, exp(-t), sin(2*t)+cos(t).';
        this.setValidation(`Invalid expression ❌${suggestion}`, 'error');
        return false;
      }
    }

    getSignalData(times, fallbackSignalFn) {
      if (!this.isEnabled()) return times.map((t) => fallbackSignalFn(t));
      if (!this.validate() || !this.customFunction) return times.map(() => 0);
      return times.map((t) => this.customFunction(t));
    }

    getValueAt(t, fallbackSignalFn) {
      if (!this.isEnabled()) return fallbackSignalFn(t);
      if (!this.validate() || !this.customFunction) return 0;
      return this.customFunction(t);
    }

    setEnabled(isEnabled) {
      this.toggle.checked = isEnabled;
      this.body.hidden = !isEnabled;
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

    bind() {
      this.toggle = this.root.querySelector('.signal-toggle-input');
      this.body = this.root.querySelector('.signal-input-body');
      this.expression = this.root.querySelector('.signal-expression');
      this.validation = this.root.querySelector('.signal-validation');
      this.clearButton = this.root.querySelector('.signal-clear');
      this.examples = Array.from(this.root.querySelectorAll('.signal-example'));

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

      this.setEnabled(Boolean(this.options.enabledByDefault));
      this.validate();

      this.toggle.addEventListener('change', () => {
        this.setEnabled(this.toggle.checked);
        this.validate();
        this.onChange();
      });

      this.expression.addEventListener('input', () => {
        localStorage.setItem(this.storageKey, this.expression.value);
        this.validate();
        this.onChange();
      });

      this.clearButton.addEventListener('click', () => {
        this.clear();
      });

      this.examples.forEach((button) => {
        button.addEventListener('click', () => {
          this.expression.value = button.dataset.example || '';
          localStorage.setItem(this.storageKey, this.expression.value);
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
