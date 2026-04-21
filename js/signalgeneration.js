document.addEventListener('DOMContentLoaded', () => {
  const controls = {
    type: document.getElementById('signal-type'),
    amplitude: document.getElementById('amplitude'),
    frequency: document.getElementById('frequency'),
    timeRange: document.getElementById('time-range'),
    downloadPng: document.getElementById('download-png'),
    exportPdf: document.getElementById('export-pdf'),
    reset: document.getElementById('reset-btn')
  };
  let customSignalInput = null;
  let analysisPanel = null;
  let guidedLearning = null; // Guided learning mode instance

  function fallbackLinspace(start, end, count) {
    const values = [];
    if (count <= 1) return [start];
    const step = (end - start) / (count - 1);
    for (let i = 0; i < count; i += 1) values.push(start + i * step);
    return values;
  }

  function fallbackBaseSignal(type, amplitude, frequency) {
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

  function getSignalFormula() {
    if (customSignalInput && customSignalInput.isEnabled()) {
      return `x(t) = ${customSignalInput.getExpression() || '0'}`;
    }

    const A = Number(controls.amplitude.value).toFixed(2);
    const f = Number(controls.frequency.value).toFixed(2);
    if (controls.type.value === 'step') return `x(t) = ${A} u(t)`;
    if (controls.type.value === 'ramp') return `x(t) = ${A} t u(t)`;
    if (controls.type.value === 'impulse') return `x(t) = ${A} delta(t)`;
    if (controls.type.value === 'square') return `x(t) = ${A} sign(sin(2 pi ${f} t))`;
    if (controls.type.value === 'triangular') return `x(t) = (2 ${A} / pi) asin(sin(2 pi ${f} t))`;
    if (controls.type.value === 'exponential') return `x(t) = ${A} exp(-${f} |t|)`;
    return `x(t) = ${A} sin(2 pi ${f} t)`;
  }

  function toggleFrequencyControl() {
    const freqRow = document.getElementById('freq-row');
    if (!freqRow) return;
    const customEnabled = customSignalInput && customSignalInput.isEnabled();
    const freqRelevant = ['sine', 'square', 'triangular', 'exponential'];
    freqRow.style.display = !customEnabled && freqRelevant.includes(controls.type.value) ? 'grid' : 'none';
  }

  function renderExplanation(formulaText) {
    renderExplanationPanel('generation-explanation', 'Step-by-Step Explanation', [
      {
        title: 'Choose Signal Model',
        description: 'The selected signal type or custom expression defines x(t).',
        formula: `$$${formulaText}$$`
      },
      {
        title: 'Set Parameters',
        description: 'Amplitude, frequency, and time range are used to sample the signal across the graph domain.'
      },
      {
        title: 'Plot Final Result',
        description: 'The sampled values are rendered with Plotly to allow zoom, pan, and hover inspection.'
      }
    ]);
  }

  function applyExperimentPreset() {
    const params = new URLSearchParams(window.location.search);
    const exp = params.get('exp');
    if (!exp) return;

    if (exp === 'square-demo') {
      controls.type.value = 'square';
      controls.amplitude.value = '1.5';
      controls.frequency.value = '2';
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
    const linspaceFn = typeof linspace === 'function' ? linspace : fallbackLinspace;
    const makeSignalFn = typeof makeBaseSignal === 'function' ? makeBaseSignal : fallbackBaseSignal;
    const getDataFn = typeof getSignalData === 'function'
      ? getSignalData
      : (component, t, fallbackSignalFn) => t.map((x) => fallbackSignalFn(x));

    const times = linspaceFn(-range, range, 700);
    const signal = makeSignalFn(controls.type.value, amplitude, frequency);
    const useCustom = Boolean(customSignalInput && customSignalInput.isEnabled());
    console.log('Using custom:', useCustom);

    let values;
    if (useCustom) {
      const expr = customSignalInput.getExpression();
      console.log('Expression:', expr);
      if (!expr || !customSignalInput.validate()) {
        const formulaBox = document.getElementById('signal-formula-live');
        if (formulaBox) formulaBox.textContent = 'Please enter a valid custom expression';
        return;
      }
      values = customSignalInput.getSignalData(times, signal);
    } else {
      values = getDataFn(customSignalInput, times, signal);
    }
    const formulaText = getSignalFormula();

    const formulaBox = document.getElementById('signal-formula-live');
    if (formulaBox) formulaBox.textContent = formulaText;

    drawPlot('generation-plot', [
      {
        x: times,
        y: values,
        name: `${controls.type.value} signal`,
        mode: 'lines',
        line: { color: '#4F46E5', width: 3, shape: 'spline', smoothing: 1 }
      }
    ], 'Generated Signal');

    renderExplanation(formulaText);
    
    // Render auto analysis panel
    if (analysisPanel) {
      analysisPanel.render(controls.type.value, times, values, frequency);
    }
    
    setTutorContext({
      page: 'Signal Generation',
      signalType: controls.type.value,
      formula: formulaText,
      amplitude,
      frequency,
      range,
      customEnabled: Boolean(customSignalInput && customSignalInput.isEnabled())
    });
  }

  function renderSafe() {
    try {
      render();
    } catch (error) {
      console.error('Initial signal render failed:', error);
    }
  }

  function reset() {
    controls.type.value = 'sine';
    controls.amplitude.value = '1';
    controls.frequency.value = '1';
    controls.timeRange.value = '5';
    if (customSignalInput) {
      customSignalInput.setEnabled(false);
      customSignalInput.setExpression('sin(t)');
      customSignalInput.validate();
    }
    render();
  }

  Object.values(controls).forEach((control) => {
    if (control && control !== controls.reset) {
      control.addEventListener('input', renderSafe);
      control.addEventListener('change', renderSafe);
    }
  });

  controls.reset.addEventListener('click', reset);

  if (controls.downloadPng) {
    controls.downloadPng.addEventListener('click', () => {
      downloadGraphPng('generation-plot', 'signal-generation');
    });
  }

  if (controls.exportPdf) {
    controls.exportPdf.addEventListener('click', () => {
      exportGraphPdf('generation-plot', 'Signal Generation', getSignalFormula());
    });
  }

  (async () => {
    // Initialize analysis panel
    analysisPanel = new SignalAnalysisPanel('auto-analysis-panel');
    
    // Initialize guided learning mode
    guidedLearning = new GuidedLearningMode('guided-learning-container', 'signalgeneration');
    
    // Set up guided learning button
    const guidedLearningBtn = document.getElementById('guided-learning-btn');
    if (guidedLearningBtn) {
      guidedLearningBtn.addEventListener('click', () => {
        if (guidedLearning && !guidedLearning.isActive) {
          guidedLearning.start('signalgeneration');
        }
      });
    }
    
    customSignalInput = await createSignalInput({
      containerId: 'custom-signal-slot',
      title: 'Custom Signal Input',
      enabledByDefault: false,
      initialExpression: 'sin(t)',
      linkedControlIds: ['signal-type'],
      onChange: renderSafe
    });
    applyExperimentPreset();
    renderSafe();

    // Ensure the default selected signal is visible after full layout settles.
    requestAnimationFrame(renderSafe);
    setTimeout(renderSafe, 120);
  })();

  document.addEventListener('layout:loaded', renderSafe);
  window.addEventListener('load', renderSafe);
});
