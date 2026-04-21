/**
 * Guided Learning Mode
 * Provides step-by-step educational guidance with formulas, examples, and interactive questions
 */

class GuidedLearningMode {
  constructor(containerId, pageContext = 'decomposition') {
    this.container = document.getElementById(containerId);
    this.pageContext = pageContext;
    this.isActive = false;
    this.currentStep = 0;
    this.userAnswers = {};
    this.isAnswerCorrect = false;
    this.lessons = this.initializeLessons();
    this.currentLesson = null;
  }

  /**
   * Initialize lessons for different pages
   */
  initializeLessons() {
    return {
      decomposition: {
        title: 'Even/Odd Signal Decomposition',
        description: 'Learn how to break down any signal into even and odd components',
        steps: [
          {
            stepNumber: 1,
            title: 'Understanding the Formula',
            type: 'formula',
            content: {
              formula: '$$x_e(t) = \\frac{x(t) + x(-t)}{2}, \\quad x_o(t) = \\frac{x(t) - x(-t)}{2}$$',
              explanation: 'Any signal can be decomposed into two parts: even and odd. The even part <b>x<sub>e</sub>(t)</b> represents the symmetric portion, while the odd part <b>x<sub>o</sub>(t)</b> represents the antisymmetric portion.',
              keyPoints: [
                '✓ Even signals satisfy: x(-t) = x(t)',
                '✓ Odd signals satisfy: x(-t) = -x(t)',
                '✓ Sum of even and odd = original signal'
              ]
            },
            question: null
          },
          {
            stepNumber: 2,
            title: 'Applying to an Example',
            type: 'example',
            content: {
              formula: '$$x(t) = \\sin(t)$$',
              explanation: 'Consider the sine function. Let\'s decompose it into its even and odd components.',
              example: {
                signal: 'sin(t)',
                values: {
                  tValue: 'π/4',
                  xt: '≈ 0.707',
                  x_negative_t: '≈ -0.707',
                  even: '(0.707 + (-0.707))/2 = 0',
                  odd: '(0.707 - (-0.707))/2 = 0.707'
                }
              }
            },
            question: {
              prompt: 'For x(t) = sin(t), what is the even component?',
              options: [
                { text: 'sin(t)', correct: false, feedback: 'Not quite. sin(t) is an odd function itself.' },
                { text: '0 (zero)', correct: true, feedback: 'Correct! sin(t) is purely odd, so its even component is 0.' },
                { text: 'cos(t)', correct: false, feedback: 'cos(t) is a different function. The even part of sin(t) is simply 0.' }
              ],
              userAnswer: null
            }
          },
          {
            stepNumber: 3,
            title: 'Interpreting the Result',
            type: 'result',
            content: {
              formula: '$$x(t) = x_e(t) + x_o(t)$$',
              explanation: 'After decomposition, the original signal is perfectly reconstructed by adding the even and odd parts.',
              result: {
                original: 'The graph shows the original signal',
                even: 'The green trace shows the even component',
                odd: 'The orange trace shows the odd component',
                reconstruction: 'Even + Odd = Original (always)',
                insight: 'This decomposition is useful in signal processing because even and odd functions often have different properties in frequency domain.'
              }
            },
            question: {
              prompt: 'If you add x_e(t) and x_o(t), what do you get?',
              options: [
                { text: 'x(-t)', correct: false, feedback: 'Not quite. x(-t) is the time-reversed signal.' },
                { text: 'x(t)', correct: true, feedback: 'Exactly! The even and odd components always sum to give the original signal.' },
                { text: '0 (zero)', correct: false, feedback: 'Not in general. The sum reconstructs the original signal.' }
              ],
              userAnswer: null
            }
          }
        ]
      },
      convolution: {
        title: 'Signal Convolution',
        description: 'Learn how to combine two signals using convolution',
        steps: [
          {
            stepNumber: 1,
            title: 'Understanding Convolution',
            type: 'formula',
            content: {
              formula: '$$y(t) = \\int_{-\\infty}^{\\infty} x(\\tau) h(t - \\tau) d\\tau$$',
              explanation: 'Convolution combines two signals by flipping one in time, sliding it across the other, and computing the integral of the product at each position.',
              keyPoints: [
                '✓ Flip one signal in time',
                '✓ Slide it across the other signal',
                '✓ Multiply and integrate at each position'
              ]
            },
            question: null
          },
          {
            stepNumber: 2,
            title: 'Example with Simple Signals',
            type: 'example',
            content: {
              formula: '$$x(t) = \\text{step function}, \\quad h(t) = \\text{exponential decay}$$',
              explanation: 'When convolving a step function with an exponential decay, we get a response that shows how the exponential decay accumulates over time.',
              example: {
                signal1: 'Step function u(t)',
                signal2: 'Exponential decay e^(-t)u(t)',
                result: 'Convolution shows cumulative effect'
              }
            },
            question: {
              prompt: 'What happens when you convolve a signal with an impulse δ(t)?',
              options: [
                { text: 'You get zero', correct: false, feedback: 'Not quite. Impulse convolution has a special property.' },
                { text: 'You get the original signal back', correct: true, feedback: 'Correct! Impulse is the identity for convolution.' },
                { text: 'You get a delayed version', correct: false, feedback: 'Close, but not quite the right answer.' }
              ],
              userAnswer: null
            }
          },
          {
            stepNumber: 3,
            title: 'Physical Interpretation',
            type: 'result',
            content: {
              formula: '$$y(t) = x(t) * h(t)$$',
              explanation: 'The convolution output represents the response of a linear system (h) to an input signal (x).',
              result: {
                meaning: 'Convolution represents system filtering',
                application: 'Used in signal processing for smoothing, frequency shaping, and system response analysis',
                interpretation: 'The result shows how the system transforms the input signal'
              }
            },
            question: {
              prompt: 'What is the dimension of a convolution output when both input signals are 1D?',
              options: [
                { text: '2D (matrix)', correct: false, feedback: 'Convolution of 1D signals produces 1D output.' },
                { text: '1D (signal)', correct: true, feedback: 'Correct! Convolving two 1D signals gives a 1D output.' },
                { text: '3D (volume)', correct: false, feedback: 'Not for 1D signals.' }
              ],
              userAnswer: null
            }
          }
        ]
      },
      operations: {
        title: 'Signal Operations',
        description: 'Understand basic signal manipulations',
        steps: [
          {
            stepNumber: 1,
            title: 'Signal Transformations',
            type: 'formula',
            content: {
              formula: '$$x(at), \\quad x(t + b), \\quad cx(t)$$',
              explanation: 'Signals can be scaled in amplitude, shifted in time, or compressed/expanded.',
              keyPoints: [
                '✓ Amplitude scaling: c·x(t) - multiply by constant',
                '✓ Time shift: x(t-b) - positive b shifts right',
                '✓ Time scaling: x(at) - a>1 compresses, a<1 expands'
              ]
            },
            question: null
          },
          {
            stepNumber: 2,
            title: 'Applying Transformations',
            type: 'example',
            content: {
              formula: '$$x(t) = \\sin(t) \\rightarrow 2\\sin(2(t-1))$$',
              explanation: 'Starting with sin(t), we can: double the amplitude, compress in time (frequency shift), and shift right by 1 second.',
              example: {
                original: 'sin(t) - amplitude 1',
                scaled: '2·sin(2(t-1)) - amplitude 2, twice the frequency, shifted right'
              }
            },
            question: {
              prompt: 'If x(t) = cos(t), what does x(2t) represent?',
              options: [
                { text: 'Time expansion', correct: false, feedback: 'When the time variable is multiplied by a factor >1, it compresses time.' },
                { text: 'Time compression and frequency doubling', correct: true, feedback: 'Perfect! x(2t) compresses the signal and doubles its frequency.' },
                { text: 'Amplitude doubling', correct: false, feedback: 'The coefficient in front of the signal affects amplitude, not the time argument.' }
              ],
              userAnswer: null
            }
          },
          {
            stepNumber: 3,
            title: 'Combining Operations',
            type: 'result',
            content: {
              formula: '$$y(t) = Ax(B(t + C)) + D$$',
              explanation: 'General signal transformation combining amplitude scaling (A), time scaling (B), time shift (C), and vertical shift (D).',
              result: {
                order: 'Apply transformations in specific order for correct result',
                composition: 'Multiple operations can be composed',
                visualization: 'Each operation transforms the signal in a specific way'
              }
            },
            question: {
              prompt: 'What is the order of applying transformations?',
              options: [
                { text: 'Amplitude → time shift → time scale', correct: false, feedback: 'Order matters! Time operations apply before amplitude.' },
                { text: 'Time scale → time shift → amplitude', correct: true, feedback: 'Correct! Apply time transformations first (inside-out), then amplitude.' },
                { text: 'Any order gives the same result', correct: false, feedback: 'Order matters significantly in transformations.' }
              ],
              userAnswer: null
            }
          }
        ]
      }
    };
  }

  /**
   * Start guided learning mode
   */
  start(pageType = this.pageContext) {
    this.isActive = true;
    this.currentStep = 0;
    this.userAnswers = {};
    this.currentLesson = this.lessons[pageType] || this.lessons.decomposition;
    this.render();
  }

  /**
   * Stop guided learning mode
   */
  stop() {
    this.isActive = false;
    this.currentStep = 0;
    if (this.container) {
      this.container.innerHTML = '';
    }
  }

  /**
   * Advance to next step
   */
  nextStep() {
    if (this.currentStep < this.currentLesson.steps.length - 1) {
      this.currentStep++;
      this.render();
    }
  }

  /**
   * Go back to previous step
   */
  previousStep() {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.render();
    }
  }

  /**
   * Submit answer to current question
   */
  submitAnswer(optionIndex) {
    const step = this.currentLesson.steps[this.currentStep];
    if (!step.question) return;

    const selectedOption = step.question.options[optionIndex];
    step.question.userAnswer = optionIndex;

    this.isAnswerCorrect = selectedOption.correct;
    this.userAnswers[this.currentStep] = {
      selected: selectedOption.text,
      correct: selectedOption.correct,
      feedback: selectedOption.feedback
    };

    this.renderFeedback(selectedOption);
  }

  /**
   * Render main guided learning UI
   */
  render() {
    if (!this.container || !this.currentLesson) return;

    const step = this.currentLesson.steps[this.currentStep];
    const progressPercent = ((this.currentStep + 1) / this.currentLesson.steps.length) * 100;

    let html = `
      <div class="guided-learning-panel">
        <!-- Header -->
        <div class="glm-header">
          <div class="glm-title-section">
            <h2 class="glm-lesson-title">${this.currentLesson.title}</h2>
            <p class="glm-lesson-desc">${this.currentLesson.description}</p>
          </div>
          <button class="glm-close-btn" aria-label="Close guided learning">✕</button>
        </div>

        <!-- Progress Bar -->
        <div class="glm-progress-section">
          <div class="glm-progress-bar">
            <div class="glm-progress-fill" style="width: ${progressPercent}%"></div>
          </div>
          <div class="glm-step-counter">Step ${step.stepNumber} of ${this.currentLesson.steps.length}</div>
        </div>

        <!-- Step Content -->
        <div class="glm-content">
          <div class="glm-step-title">${step.title}</div>
          
          <!-- Formula Display -->
          <div class="glm-formula-box">
            ${step.content.formula}
          </div>

          <!-- Step Content -->
          <div class="glm-explanation">
            <p>${step.content.explanation}</p>
            ${this.renderStepContent(step)}
          </div>

          <!-- Question Section -->
          ${step.question ? this.renderQuestion(step.question) : ''}
        </div>

        <!-- Navigation Buttons -->
        <div class="glm-navigation">
          <button class="glm-btn-secondary ${this.currentStep === 0 ? 'disabled' : ''}" 
                  ${this.currentStep === 0 ? 'disabled' : ''}>← Previous Step</button>
          <button class="glm-btn-primary ${this.currentStep === this.currentLesson.steps.length - 1 ? 'disabled' : ''}"
                  ${this.currentStep === this.currentLesson.steps.length - 1 ? 'disabled' : ''}>Next Step →</button>
        </div>
      </div>
    `;

    this.container.innerHTML = html;
    this.attachEventListeners();
    
    // Re-typeset math after each lesson render
    if (typeof renderMath === 'function') {
      renderMath(this.container);
    }
  }

  /**
   * Render step-specific content
   */
  renderStepContent(step) {
    const content = step.content;
    
    if (step.type === 'formula') {
      return `
        <div class="glm-key-points">
          ${content.keyPoints.map(point => `<div class="glm-key-point">${point}</div>`).join('')}
        </div>
      `;
    }
    
    if (step.type === 'example') {
      return `
        <div class="glm-example-box">
          ${content.example ? this.renderExampleContent(content.example) : ''}
        </div>
      `;
    }
    
    if (step.type === 'result') {
      return `
        <div class="glm-result-box">
          ${content.result ? this.renderResultContent(content.result) : ''}
        </div>
      `;
    }
    
    return '';
  }

  /**
   * Render example content
   */
  renderExampleContent(example) {
    let html = '<div class="glm-example-content">';
    
    if (example.signal) {
      html += `<div class="glm-example-item"><strong>Signal:</strong> ${example.signal}</div>`;
    }
    
    if (example.values) {
      html += '<div class="glm-example-values">';
      Object.entries(example.values).forEach(([key, value]) => {
        const label = key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim();
        html += `<div class="glm-value-row"><span class="glm-value-label">${label}:</span><span class="glm-value-result">${value}</span></div>`;
      });
      html += '</div>';
    }
    
    html += '</div>';
    return html;
  }

  /**
   * Render result interpretation content
   */
  renderResultContent(result) {
    let html = '<div class="glm-result-content">';
    
    if (result.original) {
      html += `
        <div class="glm-result-pair">
          <div class="glm-result-item">
            <span class="glm-result-icon">📊</span>
            <span>${result.original}</span>
          </div>
        </div>
      `;
    }
    
    if (result.even) {
      html += `
        <div class="glm-result-pair">
          <div class="glm-result-item">
            <span class="glm-result-icon">↔️</span>
            <span>${result.even}</span>
          </div>
        </div>
      `;
    }
    
    if (result.odd) {
      html += `
        <div class="glm-result-pair">
          <div class="glm-result-item">
            <span class="glm-result-icon">↕️</span>
            <span>${result.odd}</span>
          </div>
        </div>
      `;
    }
    
    if (result.reconstruction) {
      html += `<div class="glm-reconstruction">${result.reconstruction}</div>`;
    }
    
    if (result.insight) {
      html += `<div class="glm-insight">💡 <strong>Insight:</strong> ${result.insight}</div>`;
    }
    
    html += '</div>';
    return html;
  }

  /**
   * Render question section
   */
  renderQuestion(question) {
    const isAnswered = question.userAnswer !== null && question.userAnswer !== undefined;

    return `
      <div class="glm-question-section">
        <div class="glm-question-prompt">❓ ${question.prompt}</div>
        <div class="glm-question-options">
          ${question.options.map((option, index) => `
            <button class="glm-option-btn ${isAnswered && index === question.userAnswer ? (this.isAnswerCorrect ? 'glm-option-correct' : 'glm-option-incorrect') : ''}"
                    data-index="${index}"
                    ${isAnswered ? 'disabled' : ''}>
              <span class="glm-option-radio"></span>
              <span class="glm-option-text">${option.text}</span>
            </button>
          `).join('')}
        </div>
        ${isAnswered ? `<div class="glm-feedback ${this.isAnswerCorrect ? 'glm-feedback-correct' : 'glm-feedback-incorrect'}">
          <strong>${this.isAnswerCorrect ? '✓ Correct!' : '✗ Incorrect'}</strong>
          <p>${question.options[question.userAnswer].feedback}</p>
        </div>` : ''}
      </div>
    `;
  }

  /**
   * Render feedback for submitted answer
   */
  renderFeedback(option) {
    this.render();
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Close button
    const closeBtn = this.container.querySelector('.glm-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.stop());
    }

    // Navigation buttons
    const prevBtn = this.container.querySelector('.glm-btn-secondary');
    const nextBtn = this.container.querySelector('.glm-btn-primary');

    if (prevBtn && !prevBtn.disabled) {
      prevBtn.addEventListener('click', () => this.previousStep());
    }

    if (nextBtn && !nextBtn.disabled) {
      nextBtn.addEventListener('click', () => this.nextStep());
    }

    // Question options
    const optionBtns = this.container.querySelectorAll('.glm-option-btn');
    optionBtns.forEach((btn) => {
      if (!btn.disabled) {
        btn.addEventListener('click', (e) => {
          const index = parseInt(e.currentTarget.dataset.index);
          this.submitAnswer(index);
        });
      }
    });
  }

  /**
   * Get completion status
   */
  getCompletionStatus() {
    const totalSteps = this.currentLesson.steps.length;
    const answeredQuestions = Object.keys(this.userAnswers).length;
    const correctAnswers = Object.values(this.userAnswers).filter(a => a.correct).length;

    return {
      completed: answeredQuestions === totalSteps,
      totalSteps,
      answeredQuestions,
      correctAnswers,
      percentageCorrect: totalSteps > 0 ? Math.round((correctAnswers / totalSteps) * 100) : 0
    };
  }
}
