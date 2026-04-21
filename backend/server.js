const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const port = process.env.PORT || 5000;
const GEMINI_MODELS = [
  'models/gemini-2.0-flash',
  'models/gemini-2.0-flash-001',
  'models/gemini-flash-latest',
  'models/gemini-2.5-flash'
];

function hashText(value) {
  const text = String(value || '');
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function scoreIntents(input) {
  const query = String(input || '').toLowerCase();
  const scores = { graph: 0, concept: 0, reasoning: 0 };

  const weightedRules = {
    graph: [
      { regex: /explain\s+graph|describe\s+signal|what\s+is\s+happening/, weight: 4 },
      { regex: /graph|plot|waveform/, weight: 2 },
      { regex: /signal\s+shape|shape/, weight: 2 }
    ],
    concept: [
      { regex: /what\s+is|define|definition/, weight: 4 },
      { regex: /explain|meaning|purpose|concept/, weight: 2 }
    ],
    reasoning: [
      { regex: /step\s*by\s*step/, weight: 4 },
      { regex: /why|how|reason|derive|obtained/, weight: 3 }
    ]
  };

  Object.entries(weightedRules).forEach(([intent, rules]) => {
    rules.forEach((rule) => {
      if (rule.regex.test(query)) scores[intent] += rule.weight;
    });
  });

  if (query.includes('?')) {
    scores.concept += 1;
    scores.reasoning += 1;
  }

  if (scores.graph === 0 && scores.concept === 0 && scores.reasoning === 0) {
    scores.concept = 1;
  }

  return scores;
}

function pickIntentBlend(scores) {
  const ranked = Object.entries(scores)
    .map(([intent, score]) => ({ intent, score }))
    .sort((a, b) => b.score - a.score);

  const primary = ranked[0]?.intent || 'concept';
  const topScore = ranked[0]?.score || 1;
  const candidate = ranked[1];

  const secondary = candidate && candidate.score >= 2 && candidate.score >= topScore * 0.6
    ? candidate.intent
    : null;

  return { primary, secondary, ranked };
}

function detectIntent(input) {
  return pickIntentBlend(scoreIntents(input)).primary;
}

function normalizeState(context = {}) {
  const signalType = context.signalType || context.baseType || context.signal1 || context.signal || 'sine';
  const amplitude = Number(context.amplitude ?? context.scale ?? context.s1Amp ?? 1);
  const timeShift = Number(context.timeShift ?? context.shift ?? 0);
  const reversed = Boolean(context.reversed ?? context.reverse ?? false);

  return {
    page: String(context.page || ''),
    signalType: String(signalType),
    amplitude: Number.isFinite(amplitude) ? amplitude : 1,
    timeShift: Number.isFinite(timeShift) ? timeShift : 0,
    reversed,
    formula: context.formula ? String(context.formula) : '',
    chatMemory: {
      lastTopic: context?.chatMemory?.lastTopic ? String(context.chatMemory.lastTopic) : '',
      lastIntent: context?.chatMemory?.lastIntent ? String(context.chatMemory.lastIntent) : ''
    }
  };
}

function normalizeTopicKey(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function isFollowUpQuery(query) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return false;
  return /^(why|how|and|then|also|again|more|what about|can you|could you|explain more|continue)/.test(q);
}

function extractConcept(query) {
  const raw = String(query || '').toLowerCase();
  const stripped = raw
    .replace(/\b(what\s+is|define|explain|meaning|purpose|of|the|a|an)\b/g, ' ')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return stripped || 'signals and systems';
}

function detectTopic(query, preferredTopic = '') {
  const q = String(query || '').toLowerCase();

  const topics = [
    {
      key: 'fourier-series',
      regex: /(fourier\s+series|fs\b|periodic\s*spectrum|harmonics|coefficients?)/,
      definition: 'The Fourier series represents a periodic signal as a sum of harmonically related sinusoids.',
      explanation: 'It is used when the signal repeats over time, and the coefficients tell you the strength of each harmonic.',
      example: 'For a periodic square wave, the series contains odd harmonics with amplitudes that decay with harmonic number.'
    },
    {
      key: 'fourier',
      regex: /(fourier\s+transform|fft|dtft|ctft|frequency\s*domain|spectrum|transform)/,
      definition: 'The Fourier transform represents a signal as a weighted sum of complex sinusoids across frequency.',
      explanation: 'It reveals which frequencies are present and with what magnitude/phase. In discrete form, DFT/FFT gives sampled frequency bins.',
      example: 'For \(x(t)=\cos(2\pi f_0 t)\), the spectrum has impulses at \(\pm f_0\).'
    },
    {
      key: 'periodic-signal',
      regex: /(periodic\s*signal|periodicity|fundamental\s*period|repeat)/,
      definition: 'A periodic signal repeats itself after a fixed period.',
      explanation: 'Periodic signals are often analyzed using Fourier series because repetition creates harmonic structure.',
      example: 'If \(x(t+T)=x(t)\), then \(T\) is the period and the fundamental frequency is \(1/T\).'
    },
    {
      key: 'laplace',
      regex: /(laplace|s-domain|transfer\s*function|pole|zero|roc)/,
      definition: 'The Laplace transform maps time-domain signals to the complex \(s\)-domain.',
      explanation: 'It simplifies differential equations into algebra and helps analyze stability via poles and region of convergence.',
      example: 'For an LTI system, \(H(s)=Y(s)/X(s)\); poles in left-half plane imply BIBO-stable continuous-time behavior.'
    },
    {
      key: 'ztransform',
      regex: /(z-?transform|z\s*domain|difference\s*equation|discrete\s*stability)/,
      definition: 'The Z-transform is the discrete-time counterpart of Laplace transform.',
      explanation: 'It converts difference equations into algebraic forms and uses pole locations relative to the unit circle for stability.',
      example: 'If all poles of \(H(z)\) are inside \(|z|<1\), the discrete-time LTI system is BIBO-stable.'
    },
    {
      key: 'sampling',
      regex: /(sampling|nyquist|alias|reconstruct|shannon)/,
      definition: 'Sampling converts continuous-time signals into discrete-time sequences.',
      explanation: 'To avoid aliasing, sample above Nyquist rate: \(f_s > 2f_{max}\). Lower rates fold high frequencies into lower ones.',
      example: 'If \(f_{max}=1\text{kHz}\), choose \(f_s>2\text{kHz}\), typically with margin (e.g., 2.5 kHz or 4 kHz).'
    },
    {
      key: 'convolution',
      regex: /(convolution|impulse\s*response|lti\s*system|h\(t\)|h\[n\])/,
      definition: 'Convolution gives the output of an LTI system from input and impulse response.',
      explanation: 'Compute overlap of a flipped-shifted response with the input: multiply and integrate/sum.',
      example: '\(y(t)=\int x(\tau)h(t-\tau)d\tau\), and in discrete time \(y[n]=\sum_k x[k]h[n-k]\).'
    },
    {
      key: 'correlation',
      regex: /(correlation|autocorrelation|cross\s*correlation|similarity)/,
      definition: 'Correlation measures similarity between signals as one is shifted relative to the other.',
      explanation: 'It is used for delay estimation, detection, and feature matching.',
      example: 'Autocorrelation \(R_{xx}(\tau)\) peaks at \(\tau=0\) for many energy signals.'
    },
    {
      key: 'stability',
      regex: /(stability|causal|causality|bounded\s*input|bibo|unstable)/,
      definition: 'BIBO stability means every bounded input produces a bounded output.',
      explanation: 'For LTI systems, continuous-time stability requires absolutely integrable \(h(t)\); discrete-time requires absolutely summable \(h[n]\).',
      example: 'If \(\int_{-\infty}^{\infty}|h(t)|dt<\infty\), the CT system is BIBO-stable.'
    },
    {
      key: 'decomposition',
      regex: /(even|odd|decomposition|symmetry|x_e|x_o)/,
      definition: 'Any signal can be decomposed into even and odd parts.',
      explanation: 'Even part captures symmetric content; odd part captures antisymmetric content.',
      example: '\(x_e(t)=\frac{x(t)+x(-t)}{2},\;x_o(t)=\frac{x(t)-x(-t)}{2}\).'
    },
    {
      key: 'system-properties',
      regex: /(linear|linearity|time\s*invariant|lti|memoryless|causal|stable|system\s*properties)/,
      definition: 'System properties describe how a system responds to different inputs and time shifts.',
      explanation: 'Common checks include linearity, time invariance, causality, memory, and stability.',
      example: 'A system is LTI only if it is both linear and time invariant; BIBO stability is checked from the impulse response.'
    },
    {
      key: 'energy-power',
      regex: /(energy\s*signal|power\s*signal|average\s*power|finite\s*energy)/,
      definition: 'Energy signals have finite total energy; power signals have finite nonzero average power.',
      explanation: 'A signal is usually classified as one or the other (except zero signal edge case).',
      example: '\(E=\int |x(t)|^2dt\) finite implies energy signal; periodic sinusoids are typically power signals.'
    }
  ];

  const direct = topics.find((topic) => topic.regex.test(q));
  if (direct) return direct;

  const normalizedPreferred = normalizeTopicKey(preferredTopic);
  if (!normalizedPreferred) return null;
  return topics.find((topic) => normalizeTopicKey(topic.key) === normalizedPreferred) || null;
}

function describeShift(shift) {
  if (shift > 0) return `shifted right by ${shift} unit${Math.abs(shift) === 1 ? '' : 's'}`;
  if (shift < 0) return `shifted left by ${Math.abs(shift)} unit${Math.abs(shift) === 1 ? '' : 's'}`;
  return 'not shifted in time';
}

function graphResponse(state, variant) {
  const intros = [
    'Here is what your current graph is showing:',
    'Graph interpretation with your current settings:',
    'Based on your active signal state, this is the visual behavior:'
  ];

  const shapeLine = state.signalType === 'step'
    ? 'The waveform has a discontinuity at the transition and stays piecewise-constant afterward.'
    : state.signalType === 'ramp'
      ? 'The waveform increases linearly where the ramp is active, so slope dominates the shape.'
      : state.signalType === 'impulse'
        ? 'The waveform appears as a narrow spike representing impulse-like energy concentration.'
        : `The base waveform keeps the characteristic ${state.signalType} shape in time.`;

  return [
    intros[variant % intros.length],
    `- **Signal type:** ${state.signalType}`,
    `- **Shape behavior:** ${shapeLine}`,
    `- **Amplitude effect:** amplitude = ${state.amplitude} scales vertical magnitude in \\(A\\,x(t)\\).`,
    `- **Time shift:** the signal is ${describeShift(state.timeShift)} in \\(x(t-t_0)\\).`,
    state.reversed
      ? '- **Reversal:** enabled, so \\(x(-t)\\) mirrors the signal about \\(t=0\\).'
      : '- **Reversal:** disabled, so no mirror operation is applied.',
    state.formula ? `- **Current formula:** \\[${state.formula}\\]` : ''
  ].filter(Boolean).join('\n');
}

function conceptResponse(userInput, state, variant, topicHint = null) {
  const topic = topicHint || detectTopic(userInput);
  if (topic) {
    const openings = [
      `**${topic.key.toUpperCase()} — Definition:** ${topic.definition}`,
      `**Core idea (${topic.key}):** ${topic.definition}`,
      `**${topic.key} concept:** ${topic.definition}`
    ];

    return [
      openings[variant % openings.length],
      `**Explanation:** ${topic.explanation}`,
      `**Example:** ${topic.example}`,
      `**Connect to your current state:** with signal type **${state.signalType}**, amplitude **${state.amplitude}**, and shift **${state.timeShift}**, interpret the graph using both time-domain shape and corresponding transform/system behavior.`
    ].join('\n\n');
  }

  const concept = extractConcept(userInput);
  const templates = [
    `**Definition:** ${concept} describes how a signal property or operation changes \\(x(t)\\) in time or amplitude.`,
    `**Definition:** In signals and systems, ${concept} explains how we represent, transform, or interpret \\(x(t)\\).`,
    `**Definition:** ${concept} is a core idea used to predict how signal operations affect behavior in plots and formulas.`
  ];

  const example = state.timeShift !== 0
    ? `Example with your state: \\(x(t-${state.timeShift})\\) means the waveform is ${describeShift(state.timeShift)}.`
    : `Example with your state: \\(A\\,x(t)\\) with \\(A=${state.amplitude}\\) scales only the vertical axis.`;

  return [
    templates[variant % templates.length],
    `**Short explanation:** Use the graph and formula together to see whether the operation changes height, timing, or symmetry.`,
    `**Example:** ${example}`,
    state.reversed ? `With reversal on, \\(x(-t)\\) flips the timeline around \\(t=0\\).` : ''
  ].filter(Boolean).join('\n\n');
}

function reasoningResponse(state, variant) {
  const endings = [
    'Final result: the plotted output matches the sequence of operations applied to the base signal.',
    'Final result: each operation contributes independently, and the combined curve reflects all active settings.',
    'Final result: your graph is the transformed version of the original signal under the selected controls.'
  ];

  return [
    '**Step 1:** Start with the original waveform \\(x(t)\\) using signal type **' + state.signalType + '**.',
    `**Step 2:** Apply amplitude scaling with \\(A=${state.amplitude}\\), giving \\(A\\,x(t)\\).`,
    `**Step 3:** Apply the time shift: \\(x(t-t_0)\\) with \\(t_0=${state.timeShift}\\), so it is ${describeShift(state.timeShift)}.`,
    state.reversed
      ? '**Step 4:** Apply reversal \\(x(-t)\\), which mirrors the shifted signal around \\(t=0\\).'
      : '**Step 4:** Reversal is off, so the timeline orientation is preserved.',
    endings[variant % endings.length]
  ].join('\n');
}

function compactIntentResponse(intent, userInput, state, variant) {
  if (intent === 'graph') {
    return [
      `- The ${state.signalType} waveform is ${describeShift(state.timeShift)}.`,
      `- Amplitude ${state.amplitude} controls vertical scaling in \\(A\\,x(t)\\).`,
      state.reversed ? '- Reversal is active, so \\(x(-t)\\) mirrors the signal.' : '- Reversal is inactive.'
    ].join('\n');
  }

  if (intent === 'reasoning') {
    return [
      `- Start from \\(x(t)\\), apply amplitude \\(A=${state.amplitude}\\).`,
      `- Then apply shift \\(t_0=${state.timeShift}\\) and ${state.reversed ? 'reversal \\(x(-t)\\).' : 'no reversal.'}`
    ].join('\n');
  }

  return [
    `- Concept focus: ${extractConcept(userInput)} in signal transformation.`,
    `- Example: \\(A\\,x(t-t_0)\\) with \\(A=${state.amplitude}\\), \\(t_0=${state.timeShift}\\).`
  ].join('\n');
}

function generateResponse(userInput, stateInput) {
  const state = normalizeState(stateInput || {});
  const scores = scoreIntents(userInput);
  const { primary, secondary } = pickIntentBlend(scores);
  const variant = hashText(`${userInput}|${JSON.stringify(state)}`) % 3;
  const topicPreference = isFollowUpQuery(userInput) ? state.chatMemory.lastTopic : '';
  const topicHint = detectTopic(userInput, topicPreference);

  const fullByIntent = {
    graph: () => graphResponse(state, variant),
    reasoning: () => reasoningResponse(state, variant),
    concept: () => conceptResponse(userInput, state, variant, topicHint)
  };

  const main = fullByIntent[primary]();
  if (!secondary || secondary === primary) {
    return main;
  }

  const bridge = [
    '**Also relevant for your question:**',
    compactIntentResponse(secondary, userInput, state, (variant + 1) % 3)
  ].join('\n');

  return `${main}\n\n${bridge}`;
}

function buildFallbackTutorReply(message, context = {}) {
  return generateResponse(message, context);
}

if (!process.env.GEMINI_API_KEY) {
  console.error('Missing GEMINI_API_KEY in backend/.env');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Gemini backend is running successfully');
});

app.get('/health', (req, res) => {
  res.json({ ok: true, provider: 'gemini' });
});

app.post('/chat', async (req, res) => {
  const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
  const context = req.body?.context || {};
  console.log('Incoming /chat message:', message);

  if (!message) {
    return res.status(400).json({ reply: 'Please ask a question first.' });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.json({
      reply: buildFallbackTutorReply(message, context),
      fallback: true,
      reason: 'missing_api_key'
    });
  }

  try {
    const intentScores = scoreIntents(message);
    const intentBlend = pickIntentBlend(intentScores);
    const state = normalizeState(context);
    const prompt =
      'You are an intelligent Signals and Systems tutor. Produce a response that is specific to the user question and current UI state. Do not use generic repeated summaries. Intent category: ' +
      intentBlend.primary +
      (intentBlend.secondary ? (' with secondary intent ' + intentBlend.secondary) : '') +
      '. Intent scores: ' +
      JSON.stringify(intentScores) +
      '. Current state: ' +
      JSON.stringify(state) +
      '. Conversation memory (if provided): ' +
      JSON.stringify(state.chatMemory || {}) +
      '. Requirements: (1) If intent is graph, describe waveform shape, amplitude effect, shift direction, and reversal status. (2) If intent is concept, provide definition + short explanation + one concrete example from the current state. (3) If intent is reasoning, provide step-by-step operations from x(t) to final result. (4) If secondary intent exists, add a short secondary section instead of ignoring it. (5) Cover any common Signals and Systems doubt including Fourier/FFT, Laplace, Z-transform, sampling/Nyquist, aliasing, convolution, correlation, causality, stability, poles/zeros, ROC, energy/power, and decomposition when relevant. (6) For follow-up questions, continue from memory topic if the user does not specify a new topic. Keep concise (~90-140 words), use bullets when useful, and vary wording naturally. Preserve formulas and write math in \\(inline\\) or \\[block\\] MathJax format. User question: ' +
      message;

    let lastError = null;

    for (const modelName of GEMINI_MODELS) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        console.log('Gemini model used:', modelName);
        return res.json({ reply: text });
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError || new Error('No Gemini model available');
  } catch (error) {
    console.error('Gemini Error:', error?.message || error);
    return res.json({
      reply: buildFallbackTutorReply(message, context),
      fallback: true
    });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
  console.log(`Gemini backend running at http://localhost:${port}`);
});
