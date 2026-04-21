/**
 * Experiments Viewer - Interactive one-click demo system
 * Loads predefined signal examples with live graphs and explanations
 */

class ExperimentsViewer {
  constructor() {
    this.currentExperiment = null;
    this.animationId = null;
    
    this.experiments = {
      'sine': {
        title: 'sin(t) - Sine Wave Decomposition',
        category: 'decomposition',
        description: 'Explore the even and odd components of a sine function. A sine wave is an odd function, meaning it\'s symmetric about the origin with f(-t) = -f(t).',
        formula: '$x(t) = \\sin(t)$',
        explanation: `
          <h4>What You're Looking At:</h4>
          <ul>
            <li><strong>Original Signal (Blue):</strong> Pure sine wave</li>
            <li><strong>Even Component (Green):</strong> Should be ~0 for sine</li>
            <li><strong>Odd Component (Red):</strong> Should match the original</li>
          </ul>
          <h4>Key Insight:</h4>
          <p>Any signal can be decomposed into even and odd parts using:</p>
          <ul>
            <li>Even: $E[x(t)] = \\frac{1}{2}[x(t) + x(-t)]$</li>
            <li>Odd: $O[x(t)] = \\frac{1}{2}[x(t) - x(-t)]$</li>
          </ul>
        `,
        preset: {
          baseType: 'sine',
          amplitude: '1',
          frequency: '1',
          timeRange: '6'
        },
        page: 'decomposition.html'
      },
      'step': {
        title: 'Step Signal - System Response',
        category: 'convolution',
        description: 'See what happens when a step signal (sudden input) is convolved with an impulse response. This models how systems react to sudden changes.',
        formula: '$y(t) = u(t) * h(t)$',
        explanation: `
          <h4>What You're Looking At:</h4>
          <ul>
            <li><strong>First Signal (Blue):</strong> Step function - represents a sudden input</li>
            <li><strong>Second Signal (Green):</strong> Impulse response - system's instantaneous reaction</li>
            <li><strong>Convolution Output (Red):</strong> System response over time</li>
          </ul>
          <h4>Physical Meaning:</h4>
          <p>Convolution combines the input signal with the system's impulse response to show the total system output. This is fundamental to LTI (Linear Time-Invariant) system analysis.</p>
          <p>Formula: $y(t) = \\int_{-\\infty}^{\\infty} x(\\tau) h(t-\\tau) d\\tau$</p>
        `,
        preset: {
          s1Type: 'step',
          s1Amp: '1',
          s2Type: 'impulse',
          s2Amp: '1',
          timeRange: '4'
        },
        page: 'convolution.html'
      },
      'shift-scale': {
        title: 'Time Shift & Amplitude Scaling',
        category: 'operations',
        description: 'Observe how time shifting (delay) and amplitude scaling (gain) affect a sine signal. Essential for understanding signal transformations.',
        formula: '$y(t) = A \\cdot x(t - t_0)$',
        explanation: `
          <h4>Transformations Applied:</h4>
          <ul>
            <li><strong>Original Signal (Blue):</strong> Baseline sine wave</li>
            <li><strong>Scaled Signal (Green):</strong> Amplitude multiplied by A (gain)</li>
            <li><strong>Shifted Signal (Red):</strong> Time-delayed version</li>
            <li><strong>Combined (Orange):</strong> Both scaling and shifting applied</li>
          </ul>
          <h4>Key Operations:</h4>
          <ul>
            <li><strong>Amplitude Scaling:</strong> Multiplying signal by constant A (changes signal strength)</li>
            <li><strong>Time Shifting:</strong> Replacing t with (t - t₀) delays signal by t₀ seconds</li>
            <li><strong>Time Reversal:</strong> Replacing t with -t flips signal about origin</li>
          </ul>
        `,
        preset: {
          baseType: 'sine',
          amplitude: '1.5',
          frequency: '1',
          scale: '1.8',
          shift: '1.2',
          reverse: false
        },
        page: 'operations.html'
      }
    };
  }

  init() {
    this.attachEventListeners();
  }

  attachEventListeners() {
    document.querySelectorAll('[data-experiment]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const expId = btn.dataset.experiment;
        this.loadExperiment(expId);
      });
    });

    // Link to full tool
    const runFullToolBtn = document.getElementById('run-full-tool-btn');
    if (runFullToolBtn) {
      runFullToolBtn.addEventListener('click', () => {
        if (this.currentExperiment) {
          const page = this.experiments[this.currentExperiment].page;
          const expId = this.currentExperiment;
          window.location.href = `${page}?exp=${expId}`;
        }
      });
    }
  }

  loadExperiment(expId) {
    if (!this.experiments[expId]) {
      console.error(`Experiment ${expId} not found`);
      return;
    }

    this.currentExperiment = expId;
    const exp = this.experiments[expId];

    // Update results section
    this.renderResults(exp);
    
    // Scroll to results
    const resultsSection = document.getElementById('experiment-results');
    if (resultsSection) {
      resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  renderResults(exp) {
    const resultsSection = document.getElementById('experiment-results');
    if (!resultsSection) return;

    // Render math in the explanation
    const explanationHTML = `
      <div class="exp-result-content">
        <div class="exp-result-header">
          <h2>${exp.title}</h2>
          <p class="exp-result-description">${exp.description}</p>
          <div class="exp-formula">${exp.formula}</div>
        </div>
        
        <div class="exp-result-body">
          <div class="exp-explanation">
            ${exp.explanation}
          </div>
          
          <div class="exp-action">
            <button id="run-full-tool-btn" class="btn btn-primary">
              ➜ Open Full Tool for More Controls
            </button>
          </div>
        </div>
      </div>
    `;

    resultsSection.innerHTML = explanationHTML;
    resultsSection.classList.add('active');

    if (typeof renderMath === 'function') {
      renderMath(resultsSection);
    }

    // Re-attach button listener
    this.attachEventListeners();
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const viewer = new ExperimentsViewer();
  viewer.init();
  
  // Set tutor context
  if (typeof setTutorContext === 'function') {
    setTutorContext({ 
      page: 'experiments', 
      note: 'User is exploring predefined signal processing experiments with one-click examples.' 
    });
  }
});
