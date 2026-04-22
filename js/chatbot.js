const CHAT_STORAGE_KEY = 'savl-chat-history-v2';
const CHAT_TOPIC_MEMORY_KEY = 'savl-chat-topic-memory-v1';
const BASE_URL = window.BASE_URL || ((window.location.protocol === 'file:' || window.location.origin === 'null')
  ? 'http://localhost:5000'
  : window.location.origin);
const CHAT_ENDPOINT = `${BASE_URL}/chat`;
const MARKED_CDN_URL = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';

let markdownParserReady = null;

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function ensureMarkdownParser() {
  if (window.marked && typeof window.marked.parse === 'function') {
    return Promise.resolve();
  }

  if (markdownParserReady) {
    return markdownParserReady;
  }

  markdownParserReady = new Promise((resolve) => {
    const existing = document.querySelector('script[data-markdown-parser="marked"]');
    if (existing) {
      if (window.marked && typeof window.marked.parse === 'function') {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => resolve(), { once: true });
      setTimeout(() => resolve(), 1500);
      return;
    }

    const script = document.createElement('script');
    script.src = MARKED_CDN_URL;
    script.async = true;
    script.defer = true;
    script.dataset.markdownParser = 'marked';
    script.addEventListener('load', () => resolve(), { once: true });
    script.addEventListener('error', () => resolve(), { once: true });
    document.head.appendChild(script);
  });

  return markdownParserReady;
}

function fallbackMarkdownToHtml(markdownText) {
  const lines = String(markdownText || '').split('\n');
  let html = '';
  let inList = false;

  lines.forEach((rawLine) => {
    const line = rawLine.trim();
    const bulletMatch = line.match(/^[-*]\s+(.+)$/);

    if (bulletMatch) {
      if (!inList) {
        inList = true;
        html += '<ul>';
      }
      html += `<li>${bulletMatch[1]}</li>`;
      return;
    }

    if (inList) {
      html += '</ul>';
      inList = false;
    }

    if (!line) {
      return;
    }

    const withBold = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html += `<p>${withBold}</p>`;
  });

  if (inList) {
    html += '</ul>';
  }

  return html || '<p></p>';
}

function collectMathRanges(text) {
  const source = String(text || '');
  const ranges = [];

  const patterns = [
    /\$\$[\s\S]+?\$\$|\$[^$\n]+\$|\\\([\s\S]+?\\\)|\\\[[\s\S]+?\\\]/g,
    /(?:[A-Za-z]\s*·\s*)?(?:x|h|y|g)\s*\([^\n)]+\)/gi,
    /∫[^\n.!?;]+/g,
    /\([^\n)]*[tτ][^\n)]*\)/g,
    /\b[A-Za-z]\s*\^[\w{}+-]+/g
  ];

  patterns.forEach((pattern) => {
    let match;
    while ((match = pattern.exec(source)) !== null) {
      const raw = match[0];
      if (!raw) continue;
      ranges.push({ start: match.index, end: match.index + raw.length });
    }
  });

  if (!ranges.length) return [];

  ranges.sort((a, b) => (a.start - b.start) || (b.end - a.end));
  const merged = [ranges[0]];

  for (let i = 1; i < ranges.length; i += 1) {
    const current = ranges[i];
    const last = merged[merged.length - 1];

    if (current.start <= last.end) {
      last.end = Math.max(last.end, current.end);
    } else {
      merged.push(current);
    }
  }

  return merged;
}

function wrapMathWithTags(text) {
  const source = String(text || '');
  const ranges = collectMathRanges(source);
  if (!ranges.length) return source;

  let cursor = 0;
  let output = '';

  ranges.forEach((range) => {
    output += source.slice(cursor, range.start);
    output += `<math>${source.slice(range.start, range.end)}</math>`;
    cursor = range.end;
  });

  output += source.slice(cursor);
  return output;
}

function protectMathBlocks(text) {
  const source = String(text || '');
  const tagged = wrapMathWithTags(source);
  const formulas = [];

  const value = tagged.replace(/<math>([\s\S]*?)<\/math>/g, (_, expr) => {
    const token = `@@MATH_${formulas.length}@@`;
    formulas.push(expr);
    return token;
  });

  return { value, formulas };
}

function restoreMathBlocks(text, formulas) {
  return String(text || '').replace(/@@MATH_(\d+)@@/g, (full, indexValue) => {
    const expr = formulas[Number(indexValue)];
    if (typeof expr !== 'string') return full;

    const raw = expr;
    const trimmed = raw.trim();
    if (!trimmed) return '';

    if (/^\$\$[\s\S]+\$\$$/.test(trimmed) || /^\\\[[\s\S]+\\\]$/.test(trimmed)) {
      return trimmed;
    }

    if (/^\$[^$\n]+\$$/.test(trimmed) || /^\\\([\s\S]+\\\)$/.test(trimmed)) {
      return trimmed;
    }

    const isBlock = /∫|\n/.test(raw) || trimmed.length > 34;
    return isBlock ? `\\[${raw}\\]` : `\\(${raw}\\)`;
  });
}

function autoFormatNarrativeText(text) {
  let value = String(text || '').trim();
  if (!value) return value;

  value = value.replace(/\r\n?/g, '\n');
  value = value.replace(/^\s*•\s+/gm, '- ');
  value = value.replace(/\s{2,}/g, ' ');

  // Convert semicolon-heavy technical statements into bullets for readability.
  if (!/^\s*[-*]\s+/m.test(value) && !/^\s*\d+\.\s+/m.test(value) && !value.includes('\n')) {
    const semicolonParts = value.split(/;\s+/).map((part) => part.trim()).filter(Boolean);
    if (semicolonParts.length >= 2 && semicolonParts.every((part) => part.length > 5)) {
      value = semicolonParts.map((part) => `- ${part.replace(/[.;]$/, '')}`).join('\n');
    }
  }

  // Improve scanability by splitting long prose into short blocks.
  value = value
    .replace(/([.!?])\s+(?=[A-Z0-9])/g, '$1\n\n')
    .replace(/;\s+(?=[A-Z0-9])/g, ';\n')
    .replace(/:\s+(?=[A-Z0-9])/g, ':\n');

  return value;
}

function normalizeMathArtifacts(text) {
  return String(text || '')
    .replace(/\bint\b/g, '\\int')
    .replace(/\bsum_?k\b/g, '\\sum_k')
    .replace(/\bau\b/g, '\\tau')
    .replace(/\bpm\b/g, '\\pm')
    .replace(/\bpi\b/g, '\\pi');
}

function formatAiResponseHtml(text) {
  const source = normalizeMathArtifacts(String(text || ''));
  const { value: protectedText, formulas } = protectMathBlocks(source);
  const formattedText = autoFormatNarrativeText(protectedText);
  const BACKSLASH_TOKEN = '@@BACKSLASH_TOKEN@@';
  const escapedMarkdown = escapeHtml(formattedText).replace(/\\/g, BACKSLASH_TOKEN);

  if (window.marked && typeof window.marked.parse === 'function') {
    const parsed = window.marked.parse(escapedMarkdown, {
      gfm: true,
      breaks: true
    });

    return restoreMathBlocks(parsed.replace(new RegExp(BACKSLASH_TOKEN, 'g'), '\\'), formulas);
  }

  return restoreMathBlocks(
    fallbackMarkdownToHtml(escapedMarkdown).replace(new RegExp(BACKSLASH_TOKEN, 'g'), '\\'),
    formulas
  );
}

function renderChatMath(scope = document.body) {
  if (typeof window.renderMath === 'function') {
    return window.renderMath(scope);
  }

  return Promise.resolve();
}

function createMessageElement(text, role, extraClass = '') {
  const el = document.createElement('div');
  el.className = `chat-msg ${role} ${extraClass}`.trim();

  if (role === 'ai' && extraClass !== 'typing') {
    el.innerHTML = formatAiResponseHtml(text);
  } else {
    const renderedText = String(text || '');
    el.innerHTML = escapeHtml(renderedText).replace(/\n/g, '<br>');
  }

  return el;
}

function scrollChatToBottom(messagesEl) {
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function persistChat(messagesEl) {
  const payload = Array.from(messagesEl.querySelectorAll('.chat-msg')).map((node) => ({
    role: node.classList.contains('user') ? 'user' : 'ai',
    text: node.textContent || ''
  }));
  localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(payload.slice(-30)));
}

function readChatTopicMemory() {
  const raw = localStorage.getItem(CHAT_TOPIC_MEMORY_KEY);
  if (!raw) {
    return { lastTopic: '', lastIntent: '', lastQuestion: '' };
  }

  try {
    const parsed = JSON.parse(raw);
    return {
      lastTopic: parsed?.lastTopic ? String(parsed.lastTopic) : '',
      lastIntent: parsed?.lastIntent ? String(parsed.lastIntent) : '',
      lastQuestion: parsed?.lastQuestion ? String(parsed.lastQuestion) : ''
    };
  } catch (error) {
    return { lastTopic: '', lastIntent: '', lastQuestion: '' };
  }
}

function writeChatTopicMemory(memory) {
  localStorage.setItem(CHAT_TOPIC_MEMORY_KEY, JSON.stringify({
    lastTopic: memory?.lastTopic || '',
    lastIntent: memory?.lastIntent || '',
    lastQuestion: memory?.lastQuestion || '',
    updatedAt: Date.now()
  }));
}

function isFollowUpTutorQuestion(query) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return false;
  return /^(why|how|and|then|also|again|more|what about|can you|could you|explain more|continue)/.test(q);
}

function isStaleServiceMessage(text) {
  const value = String(text || '');
  return (
    value.includes('Start backend at http://192.168.0.124:5000') ||
    value.includes('AI tutor is temporarily unavailable') ||
    value.includes('I am running in fallback tutor mode right now') ||
    value.includes('Ask about signal generation, operations, even/odd decomposition, or convolution')
  );
}

function restoreChat(messagesEl) {
  const raw = localStorage.getItem(CHAT_STORAGE_KEY);
  if (!raw) return false;

  try {
    const messages = JSON.parse(raw).filter((msg) => !isStaleServiceMessage(msg?.text));
    messages.forEach((msg) => {
      messagesEl.appendChild(createMessageElement(msg.text, msg.role));
    });
    scrollChatToBottom(messagesEl);
    renderChatMath(messagesEl);
    return messages.length > 0;
  } catch (error) {
    return false;
  }
}

function scoreTutorIntents(query) {
  const value = String(query || '').toLowerCase();
  const scores = { graph: 0, concept: 0, reasoning: 0 };

  if (/(explain\s+graph|describe\s+signal|what\s+is\s+happening)/i.test(value)) scores.graph += 4;
  if (/(graph|plot|waveform|shape)/i.test(value)) scores.graph += 2;

  if (/(what\s+is|define|definition)/i.test(value)) scores.concept += 4;
  if (/(explain|meaning|purpose|concept)/i.test(value)) scores.concept += 2;

  if (/(step\s*by\s*step)/i.test(value)) scores.reasoning += 4;
  if (/(why|how|reason|derive|obtained)/i.test(value)) scores.reasoning += 3;

  if (value.includes('?')) {
    scores.concept += 1;
    scores.reasoning += 1;
  }

  if (!scores.graph && !scores.concept && !scores.reasoning) {
    scores.concept = 1;
  }

  return scores;
}

function pickTutorIntentBlend(scores) {
  const ranked = Object.entries(scores)
    .map(([intent, score]) => ({ intent, score }))
    .sort((a, b) => b.score - a.score);

  const primary = ranked[0]?.intent || 'concept';
  const topScore = ranked[0]?.score || 1;
  const second = ranked[1];
  const secondary = second && second.score >= 2 && second.score >= topScore * 0.6
    ? second.intent
    : null;

  return { primary, secondary };
}

function parseTutorState(context = {}) {
  return {
    signalType: String(context.signalType || context.baseType || context.signal1 || 'sine'),
    amplitude: Number(context.amplitude ?? context.scale ?? context.s1Amp ?? 1),
    shift: Number(context.timeShift ?? context.shift ?? 0),
    reversed: Boolean(context.reversed ?? context.reverse ?? false)
  };
}

function detectTutorTopic(query, preferredTopic = '') {
  const q = String(query || '').toLowerCase();
  const catalog = [
    {
      key: 'Fourier Series',
      regex: /(fourier\s+series|fs\b|harmonics|periodic\s*spectrum|coefficients?)/,
      definition: 'Represents a periodic signal as a sum of harmonically related sinusoids.',
      explanation: 'Use it when the signal repeats with a fixed period; the coefficients tell you the harmonic content.',
      example: 'A square wave is built from odd harmonics whose amplitudes decrease with harmonic number.'
    },
    {
      key: 'Fourier Transform',
      regex: /(fourier\s+transform|fft|dtft|ctft|spectrum|frequency\s*domain)/,
      definition: 'Represents a signal using sinusoidal frequency components.',
      explanation: 'Use it to analyze magnitude/phase content and bandwidth.',
      example: 'For \(x(t)=\cos(2\pi f_0 t)\), spectral lines appear at \(\pm f_0\).'
    },
    {
      key: 'Periodic Signal',
      regex: /(periodic\s*signal|periodicity|fundamental\s*period|repeat)/,
      definition: 'A periodic signal repeats after a fixed interval.',
      explanation: 'Periodic signals are naturally described by a fundamental frequency and harmonics.',
      example: 'If \(x(t+T)=x(t)\), then the signal is periodic with period \(T\).'
    },
    {
      key: 'Laplace Transform',
      regex: /(laplace|s-domain|pole|zero|roc|transfer\s*function)/,
      definition: 'Maps time-domain signals/systems to the complex \(s\)-domain.',
      explanation: 'Useful for differential equations and stability via poles/ROC.',
      example: 'For LTI systems, \(H(s)=Y(s)/X(s)\).'
    },
    {
      key: 'Z-Transform',
      regex: /(z-?transform|z\s*domain|difference\s*equation|unit\s*circle)/,
      definition: 'Discrete-time transform for sequences and systems.',
      explanation: 'Converts difference equations to algebraic form.',
      example: 'Discrete stability requires poles inside \(|z|<1\).'
    },
    {
      key: 'Sampling and Aliasing',
      regex: /(sampling|nyquist|alias|shannon|reconstruction)/,
      definition: 'Sampling converts continuous signals into discrete samples.',
      explanation: 'Avoid aliasing with \(f_s > 2f_{max}\).',
      example: 'If \(f_{max}=2\,kHz\), pick \(f_s>4\,kHz\).'
    },
    {
      key: 'Convolution',
      regex: /(convolution|impulse\s*response|h\(t\)|h\[n\])/,
      definition: 'Gives LTI output from input and impulse response.',
      explanation: 'Flip, shift, multiply overlap, then integrate/sum.',
      example: '\(y(t)=\int x(\tau)h(t-\tau)d\tau\).'
    },
    {
      key: 'Even/Odd Decomposition',
      regex: /(even|odd|decomposition|x_e|x_o|symmetry)/,
      definition: 'Any signal can be split into even and odd parts.',
      explanation: 'Even captures symmetry; odd captures antisymmetry.',
      example: '\(x_e(t)=\\frac{x(t)+x(-t)}{2},\;x_o(t)=\\frac{x(t)-x(-t)}{2}\).'
    },
    {
      key: 'System Properties',
      regex: /(linear|linearity|time\s*invariant|lti|memoryless|causal|stable|system\s*properties)/,
      definition: 'System properties describe how a system responds to inputs and time shifts.',
      explanation: 'Use them to test linearity, time invariance, memory, causality, and stability.',
      example: 'An LTI system is both linear and time invariant; BIBO stability depends on the impulse response.'
    },
    {
      key: 'Stability and Causality',
      regex: /(stability|causal|causality|bibo|bounded\s*input)/,
      definition: 'BIBO stability means bounded input gives bounded output.',
      explanation: 'For LTI systems, it depends on impulse response integrability/summability.',
      example: 'If \(\int |h(t)|dt<\infty\), CT LTI system is BIBO-stable.'
    }
  ];

  const direct = catalog.find((item) => item.regex.test(q));
  if (direct) return direct;

  const preferred = String(preferredTopic || '').toLowerCase().trim();
  if (!preferred) return null;
  return catalog.find((item) => item.key.toLowerCase() === preferred) || null;
}

function updateChatTopicMemory(question, context = {}) {
  const scores = scoreTutorIntents(question);
  const blend = pickTutorIntentBlend(scores);
  const memory = readChatTopicMemory();
  const topic = detectTutorTopic(question, isFollowUpTutorQuestion(question) ? memory.lastTopic : '');

  writeChatTopicMemory({
    lastTopic: topic ? topic.key : memory.lastTopic,
    lastIntent: blend.primary || memory.lastIntent,
    lastQuestion: String(question || '').slice(0, 180),
    contextPage: context?.page ? String(context.page) : ''
  });
}

function localTutorReply(question, context = {}) {
  const scores = scoreTutorIntents(question);
  const blend = pickTutorIntentBlend(scores);
  const state = parseTutorState(context);
  const memory = readChatTopicMemory();
  const topic = detectTutorTopic(question, isFollowUpTutorQuestion(question) ? memory.lastTopic : '');
  const shiftText = state.shift > 0
    ? `right by ${state.shift}`
    : state.shift < 0
      ? `left by ${Math.abs(state.shift)}`
      : 'with no shift';

  const byIntent = {
    graph: [
      '**Graph explanation:**',
      `- Signal type: **${state.signalType}**`,
      `- Amplitude effect: \\(A=${state.amplitude}\\) scales vertical magnitude in \\(A\\,x(t)\\).`,
      `- Time shift: \\(x(t-t_0)\\) is shifted ${shiftText}.`,
      state.reversed
        ? '- Reversal is enabled, so \\(x(-t)\\) mirrors around \\(t=0\\).'
        : '- Reversal is disabled, so timeline orientation is unchanged.'
    ].join('\n'),
    reasoning: [
      '**Step 1:** Start from the original signal \\(x(t)\\).',
      `**Step 2:** Apply amplitude scaling with \\(A=${state.amplitude}\\).`,
      `**Step 3:** Apply time shift, moving the waveform ${shiftText}.`,
      state.reversed
        ? '**Step 4:** Apply reversal \\(x(-t)\\) to mirror the result about \\(t=0\\).'
        : '**Step 4:** No reversal is applied.',
      '**Final:** The plotted signal reflects these operations in sequence.'
    ].join('\n'),
    concept: topic
      ? [
          `**${topic.key} — Definition:** ${topic.definition}`,
          `**Explanation:** ${topic.explanation}`,
          `**Example:** ${topic.example}`,
          `**Using your current state:** interpret with signal **${state.signalType}**, amplitude **${state.amplitude}**, shift **${state.shift}**, reversal **${state.reversed ? 'on' : 'off'}**.`
        ].join('\n\n')
      : [
          '**Concept explanation:** A signal operation changes amplitude, time position, or symmetry of \\(x(t)\\).',
          '**Short explanation:** Scaling modifies height, shifting moves the waveform in time, and reversal flips it around the origin.',
          `**Example:** With amplitude ${state.amplitude} and shift ${state.shift}, read the graph as transformed \\(A\\,x(t-t_0)\\).`
        ].join('\n\n')
  };

  const main = byIntent[blend.primary] || byIntent.concept;
  if (!blend.secondary || blend.secondary === blend.primary) {
    return main;
  }

  const secondaryCompact = blend.secondary === 'reasoning'
    ? `- Also, step-wise: scale by \\(A=${state.amplitude}\\), shift ${shiftText}, ${state.reversed ? 'then apply \\(x(-t)\\).' : 'no reversal.'}`
    : blend.secondary === 'graph'
      ? `- Also from graph view: ${state.signalType} waveform, amplitude ${state.amplitude}, and shift ${shiftText}.`
      : `- Also conceptually: \\(A\\,x(t-t_0)\\) explains amplitude and time-position changes together.`;

  return `${main}\n\n**Also relevant for your question:**\n${secondaryCompact}`;
}

async function askTutor(question) {
  const baseContext = typeof getCurrentTutorContext === 'function' ? getCurrentTutorContext() : {};
  const chatMemory = readChatTopicMemory();
  const context = {
    ...baseContext,
    chatMemory
  };
  let response;
  try {
    response = await fetch(CHAT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: question, context })
    });
  } catch (networkError) {
    const localReply = localTutorReply(question, context);
    updateChatTopicMemory(question, context);
    return localReply;
  }

  let data = {};
  try {
    data = await response.json();
  } catch (parseError) {
    data = {};
  }

  if (!response.ok) {
    const nonOkReply = data.reply || localTutorReply(question, context);
    updateChatTopicMemory(question, context);
    return nonOkReply;
  }

  const replyText = String(data.reply || '');
  if (replyText.toLowerCase().includes('i am running in fallback tutor mode right now')) {
    const localReply = localTutorReply(question, context);
    updateChatTopicMemory(question, context);
    return localReply;
  }

  updateChatTopicMemory(question, context);
  return data.reply || localTutorReply(question, context);
}

function initChatbot() {
  const root = document.getElementById('chatbot-slot');
  if (!root || root.dataset.ready === 'true') return;

  const toggle = document.getElementById('chat-toggle');
  const windowEl = document.getElementById('chat-window');
  const closeBtn = document.getElementById('close-chat');
  const clearBtn = document.getElementById('clear-chat');
  const form = document.getElementById('chat-form');
  const input = document.getElementById('chat-input');
  const messagesEl = document.getElementById('chat-messages');
  const explainGraphBtn = document.getElementById('chat-explain-graph');
  const whyResultBtn = document.getElementById('chat-why-result');

  if (!toggle || !windowEl || !closeBtn || !clearBtn || !form || !input || !messagesEl) return;

  ensureMarkdownParser().then(() => {
    // Re-render restored AI messages with markdown support once parser is ready.
    Array.from(messagesEl.querySelectorAll('.chat-msg.ai')).forEach((node) => {
      if (node.classList.contains('typing')) return;
      const sourceText = node.textContent || '';
      node.innerHTML = formatAiResponseHtml(sourceText);
    });
    renderChatMath(messagesEl);
  });

  const hasHistory = restoreChat(messagesEl);
  if (!hasHistory) {
    messagesEl.appendChild(
      createMessageElement("Hi! I'm your AI Tutor. Ask me anything about signals and systems.", 'ai')
    );
  }
  renderChatMath(messagesEl);
  persistChat(messagesEl);

  toggle.addEventListener('click', () => {
    windowEl.classList.toggle('open');
    if (windowEl.classList.contains('open')) input.focus();
  });

  closeBtn.addEventListener('click', () => {
    windowEl.classList.remove('open');
  });

  clearBtn.addEventListener('click', () => {
    messagesEl.innerHTML = '';
    localStorage.removeItem(CHAT_TOPIC_MEMORY_KEY);
    messagesEl.appendChild(
      createMessageElement("Hi! I'm your AI Tutor. Ask me anything about signals and systems.", 'ai')
    );
    renderChatMath(messagesEl);
    persistChat(messagesEl);
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const userText = input.value.trim();
    if (!userText) return;

    messagesEl.appendChild(createMessageElement(userText, 'user'));
    input.value = '';
    scrollChatToBottom(messagesEl);

    const typingEl = createMessageElement('AI is thinking...', 'ai', 'typing');
    messagesEl.appendChild(typingEl);
    scrollChatToBottom(messagesEl);

    try {
      const reply = await askTutor(userText);
      typingEl.remove();
      messagesEl.appendChild(createMessageElement(reply, 'ai'));
      renderChatMath(messagesEl);
    } catch (error) {
      typingEl.remove();
      messagesEl.appendChild(createMessageElement(error.message, 'ai'));
    }

    persistChat(messagesEl);
    scrollChatToBottom(messagesEl);
  });

  function triggerQuickQuestion(text) {
    input.value = text;
    form.requestSubmit();
  }

  if (explainGraphBtn) {
    explainGraphBtn.addEventListener('click', () => {
      triggerQuickQuestion('Explain this graph based on the current signal and operation.');
    });
  }

  if (whyResultBtn) {
    whyResultBtn.addEventListener('click', () => {
      triggerQuickQuestion('Why is this result obtained? Explain step-by-step using the current settings.');
    });
  }

  root.dataset.ready = 'true';
}

document.addEventListener('layout:loaded', initChatbot);
document.addEventListener('DOMContentLoaded', initChatbot);
