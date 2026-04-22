document.addEventListener('DOMContentLoaded', () => {
  const controls = {
    s1Type: document.getElementById('signal1-type'),
    s1Amp: document.getElementById('signal1-amp'),
    s1Freq: document.getElementById('signal1-freq'),
    s2Type: document.getElementById('signal2-type'),
    s2Amp: document.getElementById('signal2-amp'),
    s2Freq: document.getElementById('signal2-freq'),
    timeRange: document.getElementById('time-range'),
    animateConvolution: document.getElementById('animate-convolution'),
    downloadPng: document.getElementById('download-png'),
    exportPdf: document.getElementById('export-pdf'),
    reset: document.getElementById('reset-btn')
  };
  let customSignal1 = null;
  let customSignal2 = null;
  let guidedLearning = null; // Guided learning mode instance
  let convolutionAnimationId = null;

  function signalWithImpulse(type, amplitude, frequency) {
    if (type !== 'impulse') return makeBaseSignal(type, amplitude, frequency);

    return (t) => {
      const width = 0.06;
      return Math.abs(t) < width ? amplitude / (2 * width) : 0;
    };
  }

  function discreteConvolution(x, h, dt) {
    const result = new Array(x.length + h.length - 1).fill(0);
    for (let i = 0; i < x.length; i += 1) {
      for (let j = 0; j < h.length; j += 1) {
        result[i + j] += x[i] * h[j] * dt;
      }
    }
    return result;
  }

  function currentFormula() {
    return 'y(t) = integral x(tau) h(t - tau) dtau';
  }

  function renderExplanation() {
    renderExplanationPanel('convolution-explanation', 'Step-by-Step Explanation', [
      {
        title: 'Formula',
        description: 'Convolution computes output by integrating overlap between shifted signals.',
        formula: '$$y(t)=\\int x(\\tau)h(t-\\tau)d\\tau$$'
      },
      {
        title: 'Substitute Current Signals',
        description: `Signal 1: ${controls.s1Type.value}, Signal 2: ${controls.s2Type.value}, sampled over current time range.`
      },
      {
        title: 'Numerical Result',
        description: 'The app approximates the integral with a discrete sum and plots the final convolution waveform.'
      }
    ]);
  }

  function applyExperimentPreset() {
    const params = new URLSearchParams(window.location.search);
    const exp = params.get('exp');
    if (exp === 'step-impulse') {
      controls.s1Type.value = 'step';
      controls.s1Amp.value = '1';
      controls.s2Type.value = 'impulse';
      controls.s2Amp.value = '1';
      controls.timeRange.value = '4';
    }
  }

  function animateConvolutionPreview(y, convTimes) {
    if (convolutionAnimationId) {
      cancelAnimationFrame(convolutionAnimationId);
      convolutionAnimationId = null;
      return;
    }

    let idx = 2;
    const step = () => {
      const partialY = y.map((value, i) => (i <= idx ? value : null));
      drawPlot('conv-plot', [
        {
          x: convTimes,
          y: partialY,
          name: 'Convolution output',
          mode: 'lines',
          line: { color: '#EF4444', width: 3, shape: 'spline', smoothing: 0.8 }
        }
      ], 'Convolution Output y(t)');

      idx += 5;
      if (idx < y.length) {
        convolutionAnimationId = requestAnimationFrame(step);
      } else {
        convolutionAnimationId = null;
      }
    };
    step();
  }

  let lastConvolutionValues = [];
  let lastConvolutionTimes = [];

  function render() {
    updateValueText('signal1-amp', 's1-amp-value');
    updateValueText('signal1-freq', 's1-freq-value');
    updateValueText('signal2-amp', 's2-amp-value');
    updateValueText('signal2-freq', 's2-freq-value');
    updateValueText('time-range', 'time-value');

    const range = Number(controls.timeRange.value);
    const times = linspace(-range, range, 340);
    const dt = times[1] - times[0];

    const s1Fallback = signalWithImpulse(
      controls.s1Type.value,
      Number(controls.s1Amp.value),
      Number(controls.s1Freq.value)
    );

    const s2Fallback = signalWithImpulse(
      controls.s2Type.value,
      Number(controls.s2Amp.value),
      Number(controls.s2Freq.value)
    );

    const x = getSignalData(customSignal1, times, s1Fallback);
    const h = getSignalData(customSignal2, times, s2Fallback);
    const y = discreteConvolution(x, h, dt);

    const convStart = times[0] + times[0];
    const convEnd = times[times.length - 1] + times[times.length - 1];
    const convTimes = linspace(convStart, convEnd, y.length);
    lastConvolutionValues = y;
    lastConvolutionTimes = convTimes;

    drawPlot('signal1-plot', [
      {
        x: times,
        y: x,
        name: 'Signal 1',
        mode: 'lines',
        line: { color: '#4F46E5', width: 3, shape: 'spline', smoothing: 0.8 }
      }
    ], 'Signal 1');

    drawPlot('signal2-plot', [
      {
        x: times,
        y: h,
        name: 'Signal 2',
        mode: 'lines',
        line: { color: '#06B6D4', width: 3, shape: 'spline', smoothing: 0.8 }
      }
    ], 'Signal 2');

    drawPlot('conv-plot', [
      {
        x: convTimes,
        y: y,
        name: 'Convolution output',
        mode: 'lines',
        line: { color: '#EF4444', width: 3, shape: 'spline', smoothing: 0.8 }
      }
    ], 'Convolution Output y(t)');

    const formulaBox = document.getElementById('convolution-formula-live');
    if (formulaBox) formulaBox.textContent = currentFormula();
    renderExplanation();

    setTutorContext({
      page: 'Convolution',
      signal1: controls.s1Type.value,
      signal2: controls.s2Type.value,
      range,
      formula: currentFormula(),
      custom1: Boolean(customSignal1 && customSignal1.isEnabled()),
      custom2: Boolean(customSignal2 && customSignal2.isEnabled())
    });
  }

  function reset() {
    controls.s1Type.value = 'sine';
    controls.s1Amp.value = '1';
    controls.s1Freq.value = '1';
    controls.s2Type.value = 'step';
    controls.s2Amp.value = '1';
    controls.s2Freq.value = '1';
    controls.timeRange.value = '4';
    if (customSignal1) {
      customSignal1.setEnabled(false);
      customSignal1.setExpression('sin(t)');
      customSignal1.validate();
    }
    if (customSignal2) {
      customSignal2.setEnabled(false);
      customSignal2.setExpression('exp(-t)');
      customSignal2.validate();
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
  if (controls.animateConvolution) {
    controls.animateConvolution.addEventListener('click', () => {
      animateConvolutionPreview(lastConvolutionValues, lastConvolutionTimes);
    });
  }
  if (controls.downloadPng) controls.downloadPng.addEventListener('click', () => downloadGraphPng('conv-plot', 'convolution-output'));
  if (controls.exportPdf) controls.exportPdf.addEventListener('click', () => exportGraphPdf('conv-plot', 'Convolution Result', currentFormula()));

  (async () => {
    // Initialize guided learning mode
    guidedLearning = new GuidedLearningMode('guided-learning-container', 'convolution');
    
    // Set up guided learning button
    const guidedLearningBtn = document.getElementById('guided-learning-btn');
    if (guidedLearningBtn) {
      guidedLearningBtn.addEventListener('click', () => {
        if (guidedLearning && !guidedLearning.isActive) {
          guidedLearning.start('convolution');
        }
      });
    }
    
    customSignal1 = await createSignalInput({
      containerId: 'custom-signal1-slot',
      title: 'Custom Signal 1 x(t)',
      enabledByDefault: false,
      initialExpression: 'sin(t)',
      linkedControlIds: ['signal1-type'],
      onChange: render
    });

    customSignal2 = await createSignalInput({
      containerId: 'custom-signal2-slot',
      title: 'Custom Signal 2 h(t)',
      enabledByDefault: false,
      initialExpression: 'exp(-t)',
      linkedControlIds: ['signal2-type'],
      onChange: render
    });

    applyExperimentPreset();
    render();
  })();
});
