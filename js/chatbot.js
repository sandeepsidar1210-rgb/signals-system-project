const CHAT_STORAGE_KEY = 'savl-chat-history-v1';
const BASE_URL = window.BASE_URL || 'http://192.168.0.124:5000';
const CHAT_ENDPOINT = `${BASE_URL}/chat`;

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderMath() {
  if (typeof renderMathInElement !== 'function') return;

  renderMathInElement(document.body, {
    delimiters: [
      { left: '$$', right: '$$', display: true },
      { left: '$', right: '$', display: false }
    ],
    throwOnError: false
  });
}

function createMessageElement(text, role, extraClass = '') {
  const el = document.createElement('div');
  el.className = `chat-msg ${role} ${extraClass}`.trim();
  el.innerHTML = escapeHtml(text);
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

function restoreChat(messagesEl) {
  const raw = localStorage.getItem(CHAT_STORAGE_KEY);
  if (!raw) return false;

  try {
    const messages = JSON.parse(raw);
    messages.forEach((msg) => {
      messagesEl.appendChild(createMessageElement(msg.text, msg.role));
    });
    scrollChatToBottom(messagesEl);
    renderMath();
    return messages.length > 0;
  } catch (error) {
    return false;
  }
}

async function askTutor(question) {
  const context = typeof getCurrentTutorContext === 'function' ? getCurrentTutorContext() : {};
  let response;
  try {
    response = await fetch(CHAT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: question, context })
    });
  } catch (networkError) {
    throw new Error('I could not reach the tutor service. Start backend at http://192.168.0.124:5000.');
  }

  let data = {};
  try {
    data = await response.json();
  } catch (parseError) {
    data = {};
  }

  if (!response.ok) {
    throw new Error(data.reply || `Backend error (${response.status})`);
  }

  return data.reply || 'I could not generate a response right now.';
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

  const hasHistory = restoreChat(messagesEl);
  if (!hasHistory) {
    messagesEl.appendChild(
      createMessageElement("Hi! I'm your AI Tutor. Ask me anything about signals and systems.", 'ai')
    );
  }
  renderMath();
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
    messagesEl.appendChild(
      createMessageElement("Hi! I'm your AI Tutor. Ask me anything about signals and systems.", 'ai')
    );
    renderMath();
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
      renderMath();
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
