document.addEventListener('DOMContentLoaded', () => {
  const controls = {
    baseType: document.getElementById('base-type'),
    amplitude: document.getElementById('amplitude'),
    frequency: document.getElementById('frequency'),
    scale: document.getElementById('scale'),
    shift: document.getElementById('shift'),
    reverse: document.getElementById('reverse'),
    compare: document.getElementById('compare'),
    animateShift: document.getElementById('animate-shift'),
    animateScale: document.getElementById('animate-scale'),
    downloadPng: document.getElementById('download-png'),
    exportPdf: document.getElementById('export-pdf'),
    reset: document.getElementById('reset-btn')
  };
  let customSignalInput = null;
  let analysisPanel = null;
  let guidedLearning = null; // Guided learning mode instance
  let shiftAnimationId = null;
  let scaleAnimationId = null;

  function toggleFrequencyControl() {
    const freqRow = document.getElementById('freq-row');
    if (!freqRow) return;
    const customEnabled = customSignalInput && customSignalInput.isEnabled();
    const freqRelevant = ['sine', 'square', 'triangular', 'exponential'];
    freqRow.style.display = !customEnabled && freqRelevant.includes(controls.baseType.value) ? 'grid' : 'none';
  }

  function liveFormula() {
    const A = Number(controls.scale.value).toFixed(2);
    const t0 = Number(controls.shift.value).toFixed(2);
    const reversed = controls.reverse.checked ? ' and time reversal' : '';
    return `y(t) = ${A} x(t - (${t0}))${reversed}`;
  }

  function renderExplanation() {
    renderExplanationPanel('operations-explanation', 'Step-by-Step Explanation', [
      {
        title: 'Operation Formula',
        description: 'Transform the base signal with scaling, shifting, and optional reversal.',
        formula: `$$${liveFormula()}$$`
      },
      {
        title: 'Substitute Parameters',
        description: `Current settings: scale=${Number(controls.scale.value).toFixed(2)}, shift=${Number(controls.shift.value).toFixed(2)}, reverse=${controls.reverse.checked}`
      },
      {
        title: 'Interpret Result',
        description: 'Compare original and modified traces to see amplitude change, horizontal movement, and symmetry reversal.'
      }
    ]);
  }

  function applyExperimentPreset() {
    const params = new URLSearchParams(window.location.search);
    const exp = params.get('exp');
    if (exp === 'shift-scale') {
      controls.baseType.value = 'sine';
      controls.amplitude.value = '1.5';
      controls.frequency.value = '1';
      controls.scale.value = '1.8';
      controls.shift.value = '1.2';
      controls.reverse.checked = false;
    }
  }

  function animateShift() {
    if (shiftAnimationId) {
      cancelAnimationFrame(shiftAnimationId);
      shiftAnimationId = null;
      return;
    }

    let phase = 0;
    const tick = () => {
      phase += 0.035;
      const value = 2.4 * Math.sin(phase);
      controls.shift.value = value.toFixed(2);
      render();
      shiftAnimationId = requestAnimationFrame(tick);
    };
    tick();
  }

  function animateScale() {
    if (scaleAnimationId) {
      cancelAnimationFrame(scaleAnimationId);
      scaleAnimationId = null;
      return;
    }

    let phase = 0;
    const tick = () => {
      phase += 0.03;
      const value = 1.5 + 1.4 * Math.sin(phase);
      controls.scale.value = value.toFixed(2);
      render();
      scaleAnimationId = requestAnimationFrame(tick);
    };
    tick();
  }

  function render() {
    updateValueText('amplitude', 'amp-value');
    updateValueText('frequency', 'freq-value');
    updateValueText('scale', 'scale-value');
    updateValueText('shift', 'shift-value');
    toggleFrequencyControl();

    const times = linspace(-5, 5, 700);
    const amplitude = Number(controls.amplitude.value);
    const frequency = Number(controls.frequency.value);
    const scale = Number(controls.scale.value);
    const shift = Number(controls.shift.value);
    const reverse = controls.reverse.checked;
    const compare = controls.compare.checked;

    const fallbackSignal = makeBaseSignal(controls.baseType.value, amplitude, frequency);
    const original = getSignalData(customSignalInput, times, fallbackSignal);
    const transformedInputs = times.map((t) => {
      const shifted = t - shift;
      return reverse ? -shifted : shifted;
    });
    const transformedBase = getSignalData(customSignalInput, transformedInputs, fallbackSignal);
    const transformed = transformedBase.map((value) => scale * value);

    const traces = [
      {
        x: times,
        y: transformed,
        name: 'Modified signal',
        mode: 'lines',
        line: { color: '#06B6D4', width: 3, shape: 'spline', smoothing: 1 }
      }
    ];

    if (compare) {
      traces.unshift({
        x: times,
        y: original,
        name: 'Original signal',
        mode: 'lines',
        line: { color: '#4F46E5', width: 3, shape: 'spline', smoothing: 1 }
      });
    }

    drawPlot('operations-plot', traces, 'Signal Operations');
    const formulaBox = document.getElementById('operation-formula-live');
    if (formulaBox) formulaBox.textContent = liveFormula();
    renderExplanation();

    // Render auto analysis panel for the modified signal
    if (analysisPanel) {
      analysisPanel.render(controls.baseType.value, times, transformed, frequency);
    }

    setTutorContext({
      page: 'Operations',
      baseType: controls.baseType.value,
      scale,
      shift,
      reverse,
      compare,
      formula: liveFormula(),
      customEnabled: Boolean(customSignalInput && customSignalInput.isEnabled())
    });
  }

  function reset() {
    controls.baseType.value = 'sine';
    controls.amplitude.value = '1';
    controls.frequency.value = '1';
    controls.scale.value = '1';
    controls.shift.value = '0';
    controls.reverse.checked = false;
    controls.compare.checked = true;
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
  if (controls.animateShift) controls.animateShift.addEventListener('click', animateShift);
  if (controls.animateScale) controls.animateScale.addEventListener('click', animateScale);
  if (controls.downloadPng) controls.downloadPng.addEventListener('click', () => downloadGraphPng('operations-plot', 'operations'));
  if (controls.exportPdf) controls.exportPdf.addEventListener('click', () => exportGraphPdf('operations-plot', 'Signal Operations', liveFormula()));

  (async () => {
    // Initialize analysis panel
    analysisPanel = new SignalAnalysisPanel('auto-analysis-panel');
    
    // Initialize guided learning mode
    guidedLearning = new GuidedLearningMode('guided-learning-container', 'operations');
    
    // Set up guided learning button
    const guidedLearningBtn = document.getElementById('guided-learning-btn');
    if (guidedLearningBtn) {
      guidedLearningBtn.addEventListener('click', () => {
        if (guidedLearning && !guidedLearning.isActive) {
          guidedLearning.start('operations');
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
