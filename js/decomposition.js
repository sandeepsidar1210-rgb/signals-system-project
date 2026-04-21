document.addEventListener('DOMContentLoaded', () => {
  const controls = {
    baseType: document.getElementById('base-type'),
    amplitude: document.getElementById('amplitude'),
    frequency: document.getElementById('frequency'),
    timeRange: document.getElementById('time-range'),
    showOriginal: document.getElementById('show-original'),
    showEven: document.getElementById('show-even'),
    showOdd: document.getElementById('show-odd'),
    downloadPng: document.getElementById('download-png'),
    exportPdf: document.getElementById('export-pdf'),
    reset: document.getElementById('reset-btn')
  };
  let customSignalInput = null;
  let analysisPanel = null;
  let animator = null; // Signal transformation animator instance
  let guidedLearning = null; // Guided learning mode instance

  function toggleFrequencyControl() {
    const freqRow = document.getElementById('freq-row');
    if (!freqRow) return;
    const customEnabled = customSignalInput && customSignalInput.isEnabled();
    const freqRelevant = ['sine', 'square', 'triangular', 'exponential'];
    freqRow.style.display = !customEnabled && freqRelevant.includes(controls.baseType.value) ? 'grid' : 'none';
  }

  function classifySignal(original, mirror) {
    let evenErr = 0;
    let oddErr = 0;
    for (let i = 0; i < original.length; i += 1) {
      evenErr += Math.abs(original[i] - mirror[i]);
      oddErr += Math.abs(original[i] + mirror[i]);
    }
    const meanEvenErr = evenErr / original.length;
    const meanOddErr = oddErr / original.length;

    if (meanEvenErr < 0.03) return 'approximately even';
    if (meanOddErr < 0.03) return 'approximately odd';
    return 'neither purely even nor purely odd';
  }

  function renderExplanation(classification, baseFormula) {
    renderExplanationPanel('decomposition-explanation', 'Step-by-Step Explanation', [
      {
        title: 'Formula Setup',
        description: 'Start from the decomposition identities and selected signal model.',
        formula: `$$x(t)=${baseFormula}$$`
      },
      {
        title: 'Substitute into Components',
        description: 'Compute the mirrored version x(-t), then evaluate even and odd parts pointwise.',
        formula: '$$x_e(t)=\\frac{x(t)+x(-t)}{2},\\;x_o(t)=\\frac{x(t)-x(-t)}{2}$$'
      },
      {
        title: 'Interpret Result',
        description: `Based on current settings, the signal is ${classification}.`
      }
    ]);
  }

  function currentFormula() {
    if (customSignalInput && customSignalInput.isEnabled()) {
      return customSignalInput.getExpression() || '0';
    }

    const A = Number(controls.amplitude.value).toFixed(2);
    const f = Number(controls.frequency.value).toFixed(2);
    if (controls.baseType.value === 'step') return `${A}u(t)`;
    if (controls.baseType.value === 'ramp') return `${A}t u(t)`;
    if (controls.baseType.value === 'impulse') return `${A}\\delta(t)`;
    if (controls.baseType.value === 'square') return `${A}\\operatorname{sgn}(\\sin(2\\pi ${f}t))`;
    if (controls.baseType.value === 'triangular') return `(2${A}/\\pi)\\arcsin(\\sin(2\\pi ${f}t))`;
    if (controls.baseType.value === 'exponential') return `${A}e^{-${f}|t|}`;
    return `${A}\\sin(2\\pi ${f}t)`;
  }

  function applyExperimentPreset() {
    const params = new URLSearchParams(window.location.search);
    const exp = params.get('exp');
    if (exp === 'odd-sine') {
      controls.baseType.value = 'sine';
      controls.amplitude.value = '1';
      controls.frequency.value = '1';
      controls.timeRange.value = '6';
    }
  }

  function render() {
    updateValueText('amplitude', 'amp-value');
    updateValueText('frequency', 'freq-value');
    updateValueText('time-range', 'time-value');
    toggleFrequencyControl();

    const amplitude = Number(controls.amplitude.value);
    const frequency = Number(controls.frequency.value);
    const range = Number(controls.timeRange.value);
    const times = linspace(-range, range, 700);
    const signal = makeBaseSignal(controls.baseType.value, amplitude, frequency);

    const original = getSignalData(customSignalInput, times, signal);
    const mirror = getSignalData(customSignalInput, times.map((t) => -t), signal);
    const even = original.map((x, i) => 0.5 * (x + mirror[i]));
    const odd = original.map((x, i) => 0.5 * (x - mirror[i]));

    const showOriginal = !controls.showOriginal || controls.showOriginal.checked;
    const showEven = !controls.showEven || controls.showEven.checked;
    const showOdd = !controls.showOdd || controls.showOdd.checked;

    // Build traces with all data (visibility controlled by Plotly)
    const traces = [];
    
    if (showOriginal) {
      traces.push({
        x: times,
        y: original,
        name: 'Original',
        mode: 'lines',
        line: { color: '#4F46E5', width: 3, shape: 'spline', smoothing: 1 },
        hovertemplate: '<b>Original Signal</b><br>Time (t): %{x:.4f}s<br>Amplitude: %{y:.4f}<extra></extra>'
      });
    }

    if (showEven) {
      traces.push({
        x: times,
        y: even,
        name: 'Even',
        mode: 'lines',
        line: { color: '#10B981', width: 3, shape: 'spline', smoothing: 1 },
        hovertemplate: '<b>Even Component</b><br>Time (t): %{x:.4f}s<br>Amplitude: %{y:.4f}<extra></extra>'
      });
    }

    if (showOdd) {
      traces.push({
        x: times,
        y: odd,
        name: 'Odd',
        mode: 'lines',
        line: { color: '#F59E0B', width: 3, shape: 'spline', smoothing: 1 },
        hovertemplate: '<b>Odd Component</b><br>Time (t): %{x:.4f}s<br>Amplitude: %{y:.4f}<extra></extra>'
      });
    }

    // Draw single combined plot
    drawPlot('original-plot', traces, 'Even/Odd Decomposition');

    // Initialize animator if not already done, and set up animation controls
    if (!animator) {
      animator = new SignalTransformationAnimator('original-plot', { duration: 2000 });
      
      // Set up animation button event listeners
      const animateReversalBtn = document.getElementById('animate-reversal');
      const animateDecomposeBtn = document.getElementById('animate-decompose');
      
      if (animateReversalBtn) {
        animateReversalBtn.addEventListener('click', async () => {
          if (animator && !animator.getIsAnimating()) {
            animateReversalBtn.classList.add('active');
            animateReversalBtn.disabled = true;
            await animator.animateTimeReversal(times, original);
            animateReversalBtn.classList.remove('active');
            animateReversalBtn.disabled = false;
          }
        });
      }
      
      if (animateDecomposeBtn) {
        animateDecomposeBtn.addEventListener('click', async () => {
          if (animator && !animator.getIsAnimating()) {
            animateDecomposeBtn.classList.add('active');
            animateDecomposeBtn.disabled = true;
            await animator.animateDecomposition(times, original, even, odd);
            animateDecomposeBtn.classList.remove('active');
            animateDecomposeBtn.disabled = false;
          }
        });
      }
    } else {
      // Animator already exists, just update with latest animation data
      // (Data is captured in closure for button handlers)
    }

    const classification = classifySignal(original, mirror);
    const formula = currentFormula();
    const formulaBox = document.getElementById('decomposition-formula-live');
    if (formulaBox) {
      if (classification === 'approximately odd') {
        formulaBox.textContent = `x(t)=${formula}, xe(t)≈0, xo(t)≈x(t)`;
      } else if (classification === 'approximately even') {
        formulaBox.textContent = `x(t)=${formula}, xe(t)≈x(t), xo(t)≈0`;
      } else {
        formulaBox.textContent = `x(t)=${formula}, xe(t)=(x(t)+x(-t))/2, xo(t)=(x(t)-x(-t))/2`;
      }
    }

    renderExplanation(classification, formula);
    
    // Render auto analysis panel
    if (analysisPanel) {
      analysisPanel.render(controls.baseType.value, times, original, frequency);
    }
    
    setTutorContext({
      page: 'Decomposition',
      baseType: controls.baseType.value,
      formula,
      classification,
      customEnabled: Boolean(customSignalInput && customSignalInput.isEnabled()),
      showOriginal,
      showEven,
      showOdd
    });
  }

  function reset() {
    controls.baseType.value = 'sine';
    controls.amplitude.value = '1';
    controls.frequency.value = '1';
    controls.timeRange.value = '5';
    if (controls.showOriginal) controls.showOriginal.checked = true;
    if (controls.showEven) controls.showEven.checked = true;
    if (controls.showOdd) controls.showOdd.checked = true;
    if (customSignalInput) {
      customSignalInput.setEnabled(false);
      customSignalInput.setExpression('sin(t)');
      customSignalInput.validate();
    }
    render();
  }

  Object.values(controls).forEach((control) => {
    if (control && control !== controls.reset) {
      control.addEventListener('input', render);
      control.addEventListener('change', render);
    }
  });

  controls.reset.addEventListener('click', reset);
  if (controls.downloadPng) controls.downloadPng.addEventListener('click', () => downloadGraphPng('even-plot', 'decomposition-even-odd'));
  if (controls.exportPdf) controls.exportPdf.addEventListener('click', () => exportGraphPdf('even-plot', 'Even Odd Decomposition', currentFormula()));

  (async () => {
    // Initialize analysis panel
    analysisPanel = new SignalAnalysisPanel('auto-analysis-panel');
    
    // Initialize guided learning mode
    guidedLearning = new GuidedLearningMode('guided-learning-container', 'decomposition');
    
    // Set up guided learning button
    const guidedLearningBtn = document.getElementById('guided-learning-btn');
    if (guidedLearningBtn) {
      guidedLearningBtn.addEventListener('click', () => {
        if (guidedLearning && !guidedLearning.isActive) {
          guidedLearning.start('decomposition');
        }
      });
    }
    
    customSignalInput = await createSignalInput({
      containerId: 'custom-signal-slot',
      title: 'Custom Signal Input',
      enabledByDefault: false,
      initialExpression: 'sin(t)',
      linkedControlIds: ['base-type'],
      onChange: render
    });
    applyExperimentPreset();
    render();
  })();
});
