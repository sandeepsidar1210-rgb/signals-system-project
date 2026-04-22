const QUIZ_DIFFICULTY_RANK = {
  easy: 1,
  medium: 2,
  hard: 3
};

function createRange(start, end, count) {
  const values = [];
  if (count <= 1) return [start];
  const step = (end - start) / (count - 1);
  for (let i = 0; i < count; i += 1) {
    values.push(start + i * step);
  }
  return values;
}

function shuffleArray(items) {
  const array = items.slice();
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function cloneGraph(graph) {
  if (!graph) return null;
  return {
    title: graph.title,
    traces: graph.traces.map((trace) => ({
      ...trace,
      x: Array.isArray(trace.x) ? trace.x.slice() : trace.x,
      y: Array.isArray(trace.y) ? trace.y.slice() : trace.y
    }))
  };
}

function shuffleQuestionOptions(question) {
  const paired = question.options.map((option, index) => ({ option, index }));
  const shuffled = shuffleArray(paired);
  const answerIndex = shuffled.findIndex((item) => item.index === question.answerIndex);

  return {
    ...question,
    options: shuffled.map((item) => item.option),
    answerIndex,
    graph: cloneGraph(question.graph)
  };
}

function getDifficultyRank(difficulty) {
  return QUIZ_DIFFICULTY_RANK[String(difficulty || 'easy').toLowerCase()] || 1;
}

function buildContextQuestion(context, difficulty) {
  const signalType = String(context?.signalType || '').toLowerCase();
  const shift = Number(context?.timeShift ?? context?.shift ?? 0);
  const reversed = Boolean(context?.reversed ?? context?.reverse ?? false);
  const amplitude = Number(context?.amplitude ?? context?.scale ?? 1);
  const baseDifficulty = String(difficulty || 'medium').toLowerCase();

  if (!signalType && !shift && !reversed && amplitude === 1) return null;

  const options = [
    'It scales the waveform vertically',
    'It shifts the waveform right',
    'It mirrors the waveform about t = 0',
    'It removes all frequency content'
  ];

  let answerIndex = 0;
  let prompt = 'Which effect matches the current signal settings?';
  let explanation = 'The current settings change how the signal appears in time or amplitude.';

  if (reversed) {
    prompt = 'If reversal is enabled, what does x(-t) do to the signal?';
    answerIndex = 2;
    explanation = 'Time reversal mirrors the signal about t = 0.';
  } else if (shift !== 0) {
    prompt = `If the signal is shifted by ${shift > 0 ? '+' : ''}${shift}, what happens?`;
    answerIndex = 1;
    options[1] = shift > 0 ? `It shifts right by ${Math.abs(shift)} unit${Math.abs(shift) === 1 ? '' : 's'}` : `It shifts left by ${Math.abs(shift)} unit${Math.abs(shift) === 1 ? '' : 's'}`;
    explanation = shift > 0
      ? `A positive shift moves the signal right by ${Math.abs(shift)} unit${Math.abs(shift) === 1 ? '' : 's'}.`
      : `A negative shift moves the signal left by ${Math.abs(shift)} unit${Math.abs(shift) === 1 ? '' : 's'}.`;
  } else if (amplitude !== 1) {
    prompt = `If the amplitude is ${amplitude}, what changes most directly?`;
    answerIndex = 0;
    options[0] = `It scales the waveform by a factor of ${amplitude}`;
    explanation = 'Amplitude scaling changes only the vertical magnitude of the signal.';
  } else if (signalType) {
    prompt = `The current signal type is ${signalType}. Which description is most appropriate?`;
    answerIndex = 0;
    options[0] = `The active signal type is ${signalType}`;
    explanation = `The current tutor context is using a ${signalType} signal.`;
  }

  return {
    id: `context-${baseDifficulty}-${signalType || 'generic'}-${shift}-${reversed ? 'r1' : 'r0'}`,
    topic: 'Current Signal State',
    difficulty: baseDifficulty,
    type: 'mcq',
    prompt,
    options,
    answerIndex,
    explanation
  };
}

function buildQuestionBank() {
  const sineGraph = {
    title: 'Waveform Identification',
    traces: [
      {
        x: createRange(-Math.PI, Math.PI, 400),
        y: createRange(-Math.PI, Math.PI, 400).map((t) => Math.sin(t)),
        name: 'x(t)',
        mode: 'lines',
        line: { color: '#4F46E5', width: 3, shape: 'spline' }
      }
    ]
  };

  const stepGraph = {
    title: 'Step Signal',
    traces: [
      {
        x: [-4, 0, 0, 4],
        y: [0, 0, 1, 1],
        name: 'u(t)',
        mode: 'lines',
        line: { color: '#EF4444', width: 3, shape: 'hv' }
      }
    ]
  };

  const rampGraph = {
    title: 'Ramp Signal',
    traces: [
      {
        x: createRange(-3, 4, 200),
        y: createRange(-3, 4, 200).map((t) => (t >= 0 ? t : 0)),
        name: 'r(t)',
        mode: 'lines',
        line: { color: '#8B5CF6', width: 3, shape: 'linear' }
      }
    ]
  };

  const impulseGraph = {
    title: 'Impulse Approximation',
    traces: [
      {
        x: [-3, -0.05, -0.05, 0, 0, 0.05, 0.05, 3],
        y: [0, 0, 0, 0, 6, 0, 0, 0],
        name: 'δ(t)',
        mode: 'lines',
        line: { color: '#10B981', width: 3, shape: 'hv' }
      }
    ]
  };

  return {
    signalGeneration: [
      { id: 'gen-e1', topic: 'Signal Generation', difficulty: 'easy', type: 'mcq', prompt: 'Which statement correctly defines a sine wave?', options: ['A smooth periodic waveform', 'A constant signal', 'A spike at t = 0', 'A line that only rises'], answerIndex: 0, explanation: 'A sine wave is smooth and periodic.', graph: sineGraph },
      { id: 'gen-e2', topic: 'Signal Generation', difficulty: 'easy', type: 'mcq', prompt: 'What is the shape of a unit step signal?', options: ['It jumps from 0 to 1 at t = 0', 'It oscillates like cosine', 'It stays at 0', 'It forms a triangle'], answerIndex: 0, explanation: 'A unit step turns on at t = 0 and stays on.', graph: stepGraph },
      { id: 'gen-m1', topic: 'Signal Generation', difficulty: 'medium', type: 'mcq', prompt: 'What does increasing frequency in x(t) = sin(2πft) change?', options: ['The signal oscillates faster', 'The amplitude becomes zero', 'The signal becomes a step', 'The signal shifts in time'], answerIndex: 0, explanation: 'Frequency controls how many cycles occur per second.', graph: sineGraph },
      { id: 'gen-m2', topic: 'Signal Generation', difficulty: 'medium', type: 'graph', prompt: 'Which waveform is shown in the graph below?', options: ['Sine wave', 'Step signal', 'Impulse', 'Ramp signal'], answerIndex: 0, explanation: 'The plotted waveform is a smooth periodic sine wave.', graph: sineGraph },
      { id: 'gen-h1', topic: 'Signal Generation', difficulty: 'hard', type: 'mcq', prompt: 'A signal x(t) = A sin(2πft) is doubled in amplitude. What changes?', options: ['Only vertical magnitude changes', 'Only time axis changes', 'It becomes even', 'Its frequency halves'], answerIndex: 0, explanation: 'Amplitude scaling changes the vertical size, not the frequency or timing.' },
      { id: 'gen-h2', topic: 'Signal Generation', difficulty: 'hard', type: 'graph', prompt: 'Which signal type is represented by the narrow spike below?', options: ['Impulse', 'Ramp signal', 'Square wave', 'Cosine wave'], answerIndex: 0, explanation: 'A narrow spike is the standard visual approximation of an impulse.', graph: impulseGraph },
      { id: 'gen-h3', topic: 'Signal Generation', difficulty: 'hard', type: 'mcq', prompt: 'What is the fundamental period of x(t) = cos(4πt)?', options: ['1/2', '1', '2', '4'], answerIndex: 0, explanation: 'For cos(2πft), the period is 1/f; here f = 2, so T = 1/2.' }
    ],
    signalOperations: [
      { id: 'op-e1', topic: 'Signal Operations', difficulty: 'easy', type: 'mcq', prompt: 'Which operation changes only the amplitude of a signal?', options: ['Amplitude scaling', 'Time shifting', 'Time reversal', 'Sampling'], answerIndex: 0, explanation: 'Multiplying by a constant changes amplitude or gain.' },
      { id: 'op-e2', topic: 'Signal Operations', difficulty: 'easy', type: 'mcq', prompt: 'What does x(t - t0) do when t0 > 0?', options: ['Delays the signal', 'Advances the signal', 'Reverses the signal', 'Squares the signal'], answerIndex: 0, explanation: 'Replacing t with t - t0 shifts the signal to the right.' },
      { id: 'op-m1', topic: 'Signal Operations', difficulty: 'medium', type: 'mcq', prompt: 'What does x(-t) represent?', options: ['Time reversal', 'Amplitude scaling', 'Convolution', 'Sampling'], answerIndex: 0, explanation: 'Time reversal mirrors the signal about t = 0.' },
      { id: 'op-m2', topic: 'Signal Operations', difficulty: 'medium', type: 'mcq', prompt: 'If x(t) is multiplied by 3, what is the new amplitude factor?', options: ['3', '1/3', '0', 't + 3'], answerIndex: 0, explanation: 'The signal is scaled vertically by a factor of 3.' },
      { id: 'op-h1', topic: 'Signal Operations', difficulty: 'hard', type: 'mcq', prompt: 'Which combined operation is described by 2x(-(t - 1))?', options: ['Scale, shift, then reverse', 'Only shift', 'Only reverse', 'Only scale'], answerIndex: 0, explanation: 'This expression applies scaling and both time shift and reversal.' },
      { id: 'op-h2', topic: 'Signal Operations', difficulty: 'hard', type: 'graph', prompt: 'What symmetry does this graph illustrate?', options: ['Even symmetry', 'Odd symmetry', 'No symmetry', 'Random behavior'], answerIndex: 0, explanation: 'A cosine-like waveform is mirrored across the y-axis, so it is even.', graph: { title: 'Even Symmetry', traces: [{ x: createRange(-Math.PI, Math.PI, 400), y: createRange(-Math.PI, Math.PI, 400).map((t) => Math.cos(t)), name: 'x(t)', mode: 'lines', line: { color: '#F59E0B', width: 3, shape: 'spline' } }] } }
    ],
    evenOddDecomposition: [
      { id: 'eo-e1', topic: 'Even/Odd Decomposition', difficulty: 'easy', type: 'mcq', prompt: 'Which statement correctly defines an even signal?', options: ['x(t) = x(-t)', 'x(t) = -x(-t)', 'x(t) = x(t + 1)', 'x(t) = 0 for all t'], answerIndex: 0, explanation: 'An even signal is symmetric about the y-axis.' },
      { id: 'eo-e2', topic: 'Even/Odd Decomposition', difficulty: 'easy', type: 'mcq', prompt: 'Which choice best describes the odd part of sin(t)?', options: ['It is the original sine wave', 'It is zero', 'It becomes a step signal', 'It becomes an impulse'], answerIndex: 0, explanation: 'Since sin(t) is already odd, its odd component is itself.' },
      { id: 'eo-m1', topic: 'Even/Odd Decomposition', difficulty: 'medium', type: 'mcq', prompt: 'What is the even part of any signal x(t)?', options: ['(x(t) + x(-t)) / 2', '(x(t) - x(-t)) / 2', 'x(t) / 2', 'x(-t) / x(t)'], answerIndex: 0, explanation: 'The even part averages the signal with its time-reversed version.' },
      { id: 'eo-m2', topic: 'Even/Odd Decomposition', difficulty: 'medium', type: 'graph', prompt: 'What symmetry does this graph illustrate?', options: ['Even symmetry', 'Odd symmetry', 'No symmetry', 'Random behavior'], answerIndex: 0, explanation: 'The cosine-like waveform is symmetric about the y-axis, so it is even.', graph: { title: 'Even Symmetry', traces: [{ x: createRange(-Math.PI, Math.PI, 400), y: createRange(-Math.PI, Math.PI, 400).map((t) => Math.cos(t)), name: 'x(t)', mode: 'lines', line: { color: '#F59E0B', width: 3, shape: 'spline' } }] } },
      { id: 'eo-h1', topic: 'Even/Odd Decomposition', difficulty: 'hard', type: 'mcq', prompt: 'What is the odd part of any signal x(t)?', options: ['(x(t) - x(-t)) / 2', '(x(t) + x(-t)) / 2', 'x(t) + x(-t)', 'x(t - 1)'], answerIndex: 0, explanation: 'The odd part is the antisymmetric component.' },
      { id: 'eo-h2', topic: 'Even/Odd Decomposition', difficulty: 'hard', type: 'mcq', prompt: 'If a signal is purely odd, what is its even part?', options: ['Zero', 'The same signal', 'A ramp', 'A shifted copy'], answerIndex: 0, explanation: 'A purely odd signal has no even component.' }
    ],
    convolution: [
      { id: 'cv-e1', topic: 'Convolution', difficulty: 'easy', type: 'mcq', prompt: 'What is the output of convolving any signal with an impulse?', options: ['The same signal', 'A zero signal', 'A step signal', 'A ramp signal'], answerIndex: 0, explanation: 'The impulse acts like the identity element for convolution.' },
      { id: 'cv-e2', topic: 'Convolution', difficulty: 'easy', type: 'mcq', prompt: 'In convolution, what is the first step conceptually?', options: ['Flip one signal', 'Integrate immediately', 'Sample the signal', 'Remove amplitude'], answerIndex: 0, explanation: 'The standard interpretation is flip, shift, multiply, and integrate.' },
      { id: 'cv-m1', topic: 'Convolution', difficulty: 'medium', type: 'mcq', prompt: 'Which formula represents continuous-time convolution?', options: ['y(t)=∫x(τ)h(t-τ)dτ', 'y(t)=x(t)+h(t)', 'y(t)=x(t)h(t)', 'y(t)=d/dt x(t)'], answerIndex: 0, explanation: 'Continuous-time convolution is the integral of the product of shifted signals.' },
      { id: 'cv-m2', topic: 'Convolution', difficulty: 'medium', type: 'mcq', prompt: 'What does the overlap between x(t) and h(t-τ) indicate?', options: ['Contribution to the output at that shift', 'Only the amplitude of x(t)', 'The frequency response alone', 'The signal’s period'], answerIndex: 0, explanation: 'Convolution measures overlap for each shift value.' },
      { id: 'cv-h1', topic: 'Convolution', difficulty: 'hard', type: 'mcq', prompt: 'Which discrete-time expression is correct?', options: ['y[n] = Σ x[k]h[n-k]', 'y[n] = x[n] / h[n]', 'y[n] = x[n] + h[n]', 'y[n] = x[n]h[n]'], answerIndex: 0, explanation: 'Discrete-time convolution is a summation over shifted products.' },
      { id: 'cv-h2', topic: 'Convolution', difficulty: 'hard', type: 'mcq', prompt: 'For an LTI system, what does h(t) represent?', options: ['Impulse response', 'Odd part', 'Frequency axis', 'Sampling rate'], answerIndex: 0, explanation: 'The impulse response fully characterizes an LTI system.' }
    ]
  };
}

function cloneQuestion(question) {
  return shuffleQuestionOptions(question);
}

function getDifficultyCount(difficulty) {
  const counts = {
    easy: 5,
    medium: 7,
    hard: 10
  };

  return counts[String(difficulty || 'medium').toLowerCase()] || 7;
}

function flattenQuestionBank(questionBank, difficulty) {
  const rank = getDifficultyRank(difficulty);
  return Object.values(questionBank)
    .flat()
    .filter((question) => getDifficultyRank(question.difficulty) <= rank)
    .map((question) => ({ ...question, graph: cloneGraph(question.graph) }));
}

function readRecentQuizSignature() {
  try {
    return sessionStorage.getItem('quiz-last-signature') || '';
  } catch (error) {
    return '';
  }
}

function writeRecentQuizSignature(signature) {
  try {
    sessionStorage.setItem('quiz-last-signature', signature);
  } catch (error) {
    // no-op
  }
}

function buildQuizSet(questionBank, difficulty, context = {}) {
  const count = getDifficultyCount(difficulty);
  const allQuestions = flattenQuestionBank(questionBank, difficulty);
  const recentSignature = readRecentQuizSignature();

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const topicBuckets = Object.entries(questionBank).map(([topic, questions]) => ({
      topic,
      questions: shuffleArray(
        questions.filter((question) => getDifficultyRank(question.difficulty) <= getDifficultyRank(difficulty))
      )
    }));

    const selected = [];
    const usedIds = new Set();

    shuffleArray(topicBuckets).forEach((bucket) => {
      const next = bucket.questions.find((question) => !usedIds.has(question.id));
      if (next && selected.length < count) {
        selected.push(next);
        usedIds.add(next.id);
      }
    });

    const remainingPool = shuffleArray(allQuestions).filter((question) => !usedIds.has(question.id));
    while (selected.length < count && remainingPool.length) {
      const next = remainingPool.shift();
      if (!usedIds.has(next.id)) {
        selected.push(next);
        usedIds.add(next.id);
      }
    }

    const contextQuestion = buildContextQuestion(context, difficulty);
    if (contextQuestion) {
      const alreadySelected = selected.some((question) => question.id === contextQuestion.id);
      if (!alreadySelected) {
        if (selected.length < count) {
          selected.push(contextQuestion);
        } else {
          selected[selected.length - 1] = contextQuestion;
        }
      }
    }

    const finalQuestions = shuffleArray(selected.slice(0, count).map(cloneQuestion));
    const signature = finalQuestions.map((question) => question.id).join('|');

    if (signature !== recentSignature) {
      writeRecentQuizSignature(signature);
      return finalQuestions;
    }
  }

  const fallback = shuffleArray(allQuestions).slice(0, count).map(cloneQuestion);
  writeRecentQuizSignature(fallback.map((question) => question.id).join('|'));
  return fallback;
}

class TestYourselfQuiz {
  constructor() {
    this.questionBank = buildQuestionBank();
    this.state = {
      index: 0,
      score: 0,
      selectedIndex: null,
      answered: false,
      answerLog: [],
      started: false,
      difficulty: 'medium'
    };

    this.questions = [];
    this.elements = {};
    this.currentContext = {};
  }

  init() {
    this.cacheElements();
    this.bindEvents();

    const sharedContext = typeof getCurrentTutorContext === 'function' ? getCurrentTutorContext() : {};
    this.currentContext = sharedContext || {};

    if (typeof setTutorContext === 'function') {
      setTutorContext({
        ...sharedContext,
        page: 'test-yourself',
        note: 'User is taking a randomized self-test with mixed Signals and Systems questions.'
      });
    }

    this.generateNewTest();

    if (typeof renderMath === 'function') {
      renderMath(document.body);
    }
  }

  cacheElements() {
    this.elements.difficulty = document.getElementById('quiz-difficulty');
    this.elements.newSetBtn = document.getElementById('quiz-new-set-btn');
    this.elements.progressText = document.getElementById('quiz-progress-text');
    this.elements.title = document.getElementById('quiz-title');
    this.elements.scorePill = document.getElementById('quiz-score-pill');
    this.elements.progressFill = document.getElementById('quiz-progress-fill');
    this.elements.typeTag = document.getElementById('quiz-type-tag');
    this.elements.prompt = document.getElementById('quiz-prompt');
    this.elements.graphSlot = document.getElementById('quiz-graph-slot');
    this.elements.options = document.getElementById('quiz-options');
    this.elements.feedback = document.getElementById('quiz-feedback');
    this.elements.revealBtn = document.getElementById('quiz-reveal-btn');
    this.elements.nextBtn = document.getElementById('quiz-next-btn');
    this.elements.screen = document.getElementById('quiz-screen');
    this.elements.result = document.getElementById('quiz-result');
    this.elements.finalScore = document.getElementById('quiz-final-score');
    this.elements.summary = document.getElementById('quiz-summary');
    this.elements.review = document.getElementById('quiz-review');
    this.elements.restartBtn = document.getElementById('quiz-restart-btn');
  }

  bindEvents() {
    if (this.elements.difficulty) {
      this.elements.difficulty.addEventListener('change', () => {
        this.generateNewTest();
      });
    }

    if (this.elements.newSetBtn) {
      this.elements.newSetBtn.addEventListener('click', () => {
        this.generateNewTest();
      });
    }

    this.elements.options.addEventListener('click', (event) => {
      const button = event.target.closest('[data-option-index]');
      if (!button || this.state.answered) return;
      this.state.selectedIndex = Number(button.dataset.optionIndex);
      this.renderOptions();
      this.elements.feedback.textContent = 'Answer selected. Click Check Answer to see your result.';
    });

    this.elements.revealBtn.addEventListener('click', () => {
      this.checkAnswer();
    });

    this.elements.nextBtn.addEventListener('click', () => {
      this.goToNextQuestion();
    });

    this.elements.restartBtn.addEventListener('click', () => {
      this.restart();
    });
  }

  currentQuestion() {
    return this.questions[this.state.index];
  }

  generateNewTest() {
    const selectedDifficulty = this.elements.difficulty ? this.elements.difficulty.value : 'medium';
    this.state.difficulty = selectedDifficulty;
    this.questions = buildQuizSet(this.questionBank, selectedDifficulty, this.currentContext).map((question) => cloneQuestion(question));
    this.state.index = 0;
    this.state.score = 0;
    this.state.selectedIndex = null;
    this.state.answered = false;
    this.state.answerLog = [];
    this.state.started = true;
    this.renderCurrentQuestion();
  }

  renderCurrentQuestion() {
    const question = this.currentQuestion();
    this.state.selectedIndex = null;
    this.state.answered = false;

    this.elements.result.hidden = true;
    this.elements.screen.hidden = false;

    this.elements.progressText.textContent = `Question ${this.state.index + 1} of ${this.questions.length}`;
    this.elements.title.textContent = question.topic || (question.type === 'graph' ? 'Graph Question' : 'Multiple Choice Question');
    this.elements.scorePill.textContent = `Score: ${this.state.score} / ${this.questions.length}`;
    this.elements.progressFill.style.width = `${((this.state.index + 1) / this.questions.length) * 100}%`;
    this.elements.typeTag.textContent = question.type === 'graph' ? 'Graph-based' : 'MCQ';
    this.elements.prompt.innerHTML = question.prompt;

    this.renderGraph(question);
    this.renderOptions();
    this.elements.feedback.innerHTML = 'Select an answer, then click <strong>Check Answer</strong>.';
    this.elements.nextBtn.disabled = true;
    this.elements.revealBtn.disabled = false;
    this.elements.revealBtn.textContent = 'Check Answer';
    this.elements.nextBtn.textContent = this.state.index === this.questions.length - 1 ? 'Submit Test' : 'Next';

    if (typeof renderMath === 'function') {
      renderMath(this.elements.screen);
    }
  }

  renderGraph(question) {
    if (!question.graph) {
      this.elements.graphSlot.innerHTML = '';
      this.elements.graphSlot.style.display = 'none';
      return;
    }

    this.elements.graphSlot.style.display = 'block';
    this.elements.graphSlot.innerHTML = '<div id="quiz-graph" class="plot"></div>';

    requestAnimationFrame(() => {
      if (typeof drawPlot === 'function') {
        drawPlot('quiz-graph', question.graph.traces, question.graph.title);
      }
    });
  }

  renderOptions() {
    const question = this.currentQuestion();
    this.elements.options.innerHTML = question.options
      .map((option, index) => {
        const classes = ['quiz-option'];
        if (this.state.selectedIndex === index) classes.push('selected');
        if (this.state.answered) {
          if (index === question.answerIndex) classes.push('correct');
          else if (this.state.selectedIndex === index && index !== question.answerIndex) classes.push('incorrect');
        }

        return `
          <button type="button" class="${classes.join(' ')}" data-option-index="${index}">
            <span class="quiz-option-index">${String.fromCharCode(65 + index)}</span>
            <span class="quiz-option-text">${option}</span>
          </button>
        `;
      })
      .join('');
  }

  checkAnswer() {
    const question = this.currentQuestion();
    if (this.state.selectedIndex === null) {
      this.elements.feedback.innerHTML = 'Pick an option before checking your answer.';
      return;
    }

    if (this.state.answered) return;

    this.state.answered = true;
    const isCorrect = this.state.selectedIndex === question.answerIndex;
    if (isCorrect) {
      this.state.score += 1;
    }

    this.state.answerLog.push({
      id: question.id,
      question: question.prompt,
      selectedIndex: this.state.selectedIndex,
      answerIndex: question.answerIndex,
      isCorrect,
      explanation: question.explanation,
      options: question.options
    });

    this.renderOptions();
    this.elements.feedback.innerHTML = `<strong>${isCorrect ? 'Correct.' : 'Not quite.'}</strong> ${question.explanation}`;
    this.elements.scorePill.textContent = `Score: ${this.state.score} / ${this.questions.length}`;
    this.elements.nextBtn.disabled = false;
    this.elements.revealBtn.disabled = true;
  }

  goToNextQuestion() {
    if (!this.state.answered) return;

    if (this.state.index >= this.questions.length - 1) {
      this.showResult();
      return;
    }

    this.state.index += 1;
    this.renderCurrentQuestion();
  }

  showResult() {
    this.elements.screen.hidden = true;
    this.elements.result.hidden = false;

    this.elements.finalScore.textContent = `Score: ${this.state.score} / ${this.questions.length}`;
    const wrongCount = this.questions.length - this.state.score;
    this.elements.summary.textContent = `Difficulty: ${this.state.difficulty}. Correct: ${this.state.score}. Wrong: ${wrongCount}. Review the breakdown below.`;

    this.elements.review.innerHTML = this.state.answerLog
      .map((entry, index) => {
        const correctAnswer = entry.options[entry.answerIndex];
        const selectedAnswer = entry.options[entry.selectedIndex];
        return `
          <article class="quiz-review-item ${entry.isCorrect ? 'correct' : 'incorrect'}">
            <div class="quiz-review-question">Q${index + 1}. ${entry.question}</div>
            <div class="quiz-review-answer">Your answer: ${selectedAnswer}</div>
            <div class="quiz-review-answer">Correct answer: ${correctAnswer}</div>
            <div class="quiz-review-answer">${entry.explanation}</div>
          </article>
        `;
      })
      .join('');
  }

  restart() {
    this.generateNewTest();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const quiz = new TestYourselfQuiz();
  quiz.init();
});
