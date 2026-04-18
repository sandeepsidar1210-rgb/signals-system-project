function inPagesFolder() {
  return window.location.pathname.includes('/pages/');
}

function navTemplate() {
  return `
  <nav class="navbar">
    <div class="container nav-content">
      <a class="brand" href="#" data-target="index.html">
        <span class="brand-dot" aria-hidden="true"></span>
        Signal Analysis Virtual Lab
      </a>
      <button class="menu-toggle" id="menu-toggle" aria-label="Toggle menu">Menu</button>
      <div class="nav-links" id="nav-links">
        <a href="#" data-target="index.html" data-page="home">Home</a>
        <a href="#" data-target="pages/signalgeneration.html" data-page="signalgeneration">Signal Generation</a>
        <a href="#" data-target="pages/operations.html" data-page="operations">Operations</a>
        <a href="#" data-target="pages/decomposition.html" data-page="decomposition">Decomposition</a>
        <a href="#" data-target="pages/convolution.html" data-page="convolution">Convolution</a>
        <a href="#" data-target="pages/experiments.html" data-page="experiments">Experiments</a>
      </div>
      <button class="theme-toggle" id="theme-toggle" type="button" aria-label="Toggle dark mode">Dark</button>
    </div>
  </nav>`;
}

function footerTemplate() {
  return `
  <footer class="footer">
    <div class="container footer-content">
      <p>Signal Analysis Virtual Lab | Designed for Signals and Systems learning</p>
      <p class="footer-meta">Academic Toolkit <span id="footer-year"></span></p>
    </div>
  </footer>`;
}

function chatbotTemplate() {
  return `
  <button id="chat-toggle" class="chat-toggle" aria-label="Open AI Tutor">🤖</button>
  <section id="chat-window" class="chat-window" aria-live="polite" aria-label="AI Tutor Chat">
    <header class="chat-header">
      <h3>AI Tutor 🤖</h3>
      <div class="chat-header-actions">
        <button id="clear-chat" class="chat-clear" type="button">Clear</button>
        <button id="close-chat" class="chat-close" type="button" aria-label="Close chat">×</button>
      </div>
    </header>
    <div id="chat-messages" class="chat-messages"></div>
    <div class="chat-quick-actions">
      <button id="chat-explain-graph" type="button">Explain this graph</button>
      <button id="chat-why-result" type="button">Why is this result obtained?</button>
    </div>
    <form id="chat-form" class="chat-input-row">
      <input id="chat-input" type="text" placeholder="Ask about signals and systems..." autocomplete="off" maxlength="600" required>
      <button type="submit" id="chat-send">Send</button>
    </form>
  </section>`;
}

async function injectComponent(slotId, path, fallbackHtml) {
  const slot = document.getElementById(slotId);
  if (!slot) return;

  try {
    const response = await fetch(path);
    if (!response.ok) throw new Error('component fetch failed');
    slot.innerHTML = await response.text();
  } catch (error) {
    slot.innerHTML = fallbackHtml;
  }
}

function setupNavLinks() {
  const prefix = inPagesFolder() ? '../' : '';
  document.querySelectorAll('[data-target]').forEach((link) => {
    const target = link.getAttribute('data-target');
    if (target) link.setAttribute('href', `${prefix}${target}`);
  });

  const currentPage = document.body.dataset.page;
  document.querySelectorAll('.nav-links [data-page]').forEach((link) => {
    link.classList.toggle('active', link.getAttribute('data-page') === currentPage);
  });

  const toggle = document.getElementById('menu-toggle');
  const links = document.getElementById('nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      links.classList.toggle('open');
    });
  }

  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    const savedTheme = localStorage.getItem('savl-theme') || 'light';
    document.body.dataset.theme = savedTheme;
    themeToggle.textContent = savedTheme === 'dark' ? 'Light' : 'Dark';

    themeToggle.addEventListener('click', () => {
      const nextTheme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
      document.body.dataset.theme = nextTheme;
      localStorage.setItem('savl-theme', nextTheme);
      themeToggle.textContent = nextTheme === 'dark' ? 'Light' : 'Dark';
    });
  }
}

function setFooterYear() {
  const yearEl = document.getElementById('footer-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear().toString();
}

async function loadSharedLayout() {
  const base = inPagesFolder() ? '../components/' : 'components/';
  await injectComponent('navbar-slot', `${base}navbar.html`, navTemplate());
  await injectComponent('footer-slot', `${base}footer.html`, footerTemplate());
  await injectComponent('chatbot-slot', `${base}chatbot.html`, chatbotTemplate());
  setupNavLinks();
  setFooterYear();
  document.dispatchEvent(new Event('layout:loaded'));
}

function linspace(start, end, count) {
  const values = [];
  if (count <= 1) return [start];
  const step = (end - start) / (count - 1);
  for (let i = 0; i < count; i += 1) values.push(start + i * step);
  return values;
}

function makeBaseSignal(type, amplitude, frequency) {
  return function signalAt(t) {
    if (type === 'step') return t >= 0 ? amplitude : 0;
    if (type === 'ramp') return t >= 0 ? amplitude * t : 0;
    if (type === 'impulse') {
      const width = 0.05;
      return Math.abs(t) < width ? amplitude / (2 * width) : 0;
    }
    if (type === 'square') return amplitude * Math.sign(Math.sin(2 * Math.PI * frequency * t) || 1);
    if (type === 'triangular') return (2 * amplitude / Math.PI) * Math.asin(Math.sin(2 * Math.PI * frequency * t));
    if (type === 'exponential') return amplitude * Math.exp(-Math.abs(frequency) * Math.abs(t));
    return amplitude * Math.sin(2 * Math.PI * frequency * t);
  };
}

function setTutorContext(context) {
  window.currentTutorContext = context;
}

function getCurrentTutorContext() {
  return window.currentTutorContext || {};
}

function signalFromSamples(times, signalAt) {
  return times.map((t) => signalAt(t));
}

function updateValueText(inputId, valueId, suffix = '') {
  const input = document.getElementById(inputId);
  const value = document.getElementById(valueId);
  if (!input || !value) return;
  value.textContent = `${input.value}${suffix}`;
}

function drawPlot(elementId, traces, title) {
  const layout = {
    title,
    paper_bgcolor: '#ffffff',
    plot_bgcolor: '#ffffff',
    margin: { t: 44, l: 52, r: 24, b: 46 },
    xaxis: {
      title: 'Time (t)',
      showgrid: true,
      gridcolor: '#E5E7EB',
      zeroline: true,
      zerolinecolor: '#9CA3AF'
    },
    yaxis: {
      title: 'Amplitude',
      showgrid: true,
      gridcolor: '#E5E7EB',
      zeroline: true,
      zerolinecolor: '#9CA3AF'
    },
    legend: {
      orientation: 'h',
      y: 1.12,
      x: 0
    }
  };

  const config = {
    responsive: true,
    scrollZoom: true,
    displaylogo: false,
    modeBarButtonsToAdd: ['zoomIn2d', 'zoomOut2d', 'resetScale2d']
  };

  Plotly.react(elementId, traces, layout, config);
}

document.addEventListener('DOMContentLoaded', () => {
  loadSharedLayout();
});
