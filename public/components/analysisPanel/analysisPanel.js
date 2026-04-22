/**
 * Auto Analysis Panel Component
 * Analyzes signals for: Even/Odd classification, Periodicity, and Basic Explanation
 */

class SignalAnalysisPanel {
  constructor(containerId) {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);
  }

  /**
   * Classify signal as Even, Odd, or Neither
   * @param {Array<number>} times - time domain values
   * @param {Array<number>} values - signal values
   * @returns {string} - 'even', 'odd', or 'neither'
   */
  classifyEvenOdd(times, values) {
    // Find symmetric points: x(t) vs x(-t)
    let evenError = 0;
    let oddError = 0;
    let samples = 0;

    for (let i = 0; i < times.length; i++) {
      const t = times[i];
      const xt = values[i];

      // Find corresponding -t point
      const negTIndex = times.findIndex((time) => Math.abs(time + t) < 1e-6);

      if (negTIndex !== -1) {
        const xNegT = values[negTIndex];

        // For even: x(t) = x(-t)
        evenError += Math.abs(xt - xNegT);

        // For odd: x(t) = -x(-t)
        oddError += Math.abs(xt + xNegT);

        samples++;
      }
    }

    if (samples === 0) return 'unknown';

    const meanEvenError = evenError / samples;
    const meanOddError = oddError / samples;
    const threshold = 0.05; // tolerance threshold

    if (meanEvenError < threshold) return 'even';
    if (meanOddError < threshold) return 'odd';
    return 'neither';
  }

  /**
   * Detect if signal is periodic
   * @param {Array<number>} times - time domain values
   * @param {Array<number>} values - signal values
   * @param {number} frequency - detected or expected frequency
   * @returns {object} - {isPeriodicEstimate: boolean, estimatedPeriod: number}
   */
  detectPeriodicity(times, values, frequency) {
    // Known periodic signals
    const periodicTypes = ['sine', 'square', 'triangular', 'sawtooth'];

    // For non-periodic signals (step, ramp, impulse, exponential decay)
    const nonPeriodicTypes = ['step', 'ramp', 'impulse', 'exponential'];

    // Estimate period from frequency if it's f > 0
    if (frequency && frequency > 0) {
      return {
        isPeriodicEstimate: true,
        estimatedPeriod: 1 / frequency
      };
    }

    // If frequency is 0 or undefined, try to detect by autocorrelation-like logic
    if (values.length < 10) {
      return {
        isPeriodicEstimate: false,
        estimatedPeriod: null
      };
    }

    // Simple heuristic: check if the signal repeats itself
    // This is a simplified detector; for real apps, use proper autocorrelation
    const halfLen = Math.floor(values.length / 2);
    let repeatingError = 0;

    for (let i = 0; i < halfLen; i++) {
      repeatingError += Math.abs(values[i] - values[i + halfLen]);
    }

    const meanRepeatingError = repeatingError / halfLen;
    const isRepeating = meanRepeatingError < 0.15; // tolerance

    return {
      isPeriodicEstimate: isRepeating,
      estimatedPeriod: isRepeating ? (times[values.length - 1] - times[0]) / 2 : null
    };
  }

  /**
   * Get explanation based on signal characteristics
   * @param {string} signalType - type of signal (sine, cos, step, etc.)
   * @param {string} evenOddClass - 'even', 'odd', or 'neither'
   * @param {object} periodicity - {isPeriodicEstimate, estimatedPeriod}
   * @returns {string} - explanation text
   */
  getExplanation(signalType, evenOddClass, periodicity) {
    let explanation = '';

    // Signal type insight
    if (signalType === 'sine') {
      explanation += 'Sine wave: A fundamental periodic signal. ';
    } else if (signalType === 'cosine' || signalType === 'cos') {
      explanation += 'Cosine wave: Similar to sine but phase-shifted by 90°. ';
    } else if (signalType === 'step') {
      explanation += 'Step signal: Abruptly transitions from one level to another. ';
    } else if (signalType === 'ramp') {
      explanation += 'Ramp signal: Linearly increases or decreases over time. ';
    } else if (signalType === 'impulse') {
      explanation += 'Impulse signal (Delta): A sharp, instantaneous spike. ';
    } else if (signalType === 'square') {
      explanation += 'Square wave: Alternates between two levels periodically. ';
    } else if (signalType === 'triangular') {
      explanation += 'Triangular wave: Forms a repeating triangular pattern. ';
    } else if (signalType === 'exponential') {
      explanation += 'Exponential signal: Grows or decays exponentially. ';
    } else {
      explanation += 'Custom signal: User-defined expression. ';
    }

    // Even/Odd classification
    if (evenOddClass === 'even') {
      explanation += 'It is classified as EVEN because x(t) = x(-t). ';
      explanation += 'Symmetric about the vertical axis. ';
    } else if (evenOddClass === 'odd') {
      explanation += 'It is classified as ODD because x(t) = -x(-t). ';
      explanation += 'Antisymmetric about the origin (180° rotational symmetry). ';
    } else if (evenOddClass === 'neither') {
      explanation += 'It is classified as NEITHER even nor odd. ';
      explanation += 'Can be decomposed into even and odd components. ';
    }

    // Periodicity
    if (periodicity.isPeriodicEstimate) {
      explanation += `This is a PERIODIC signal. `;
      if (periodicity.estimatedPeriod) {
        explanation += `Estimated period: ${periodicity.estimatedPeriod.toFixed(3)} seconds.`;
      }
    } else {
      explanation += `This is a NON-PERIODIC signal. `;
      explanation += `It does not repeat over time.`;
    }

    return explanation;
  }

  /**
   * Render the analysis panel with results
   * @param {string} signalType - type of signal
   * @param {Array<number>} times - time domain values
   * @param {Array<number>} values - signal values
   * @param {number} frequency - frequency parameter (if applicable)
   */
  render(signalType, times, values, frequency) {
    if (!this.container) return;

    const evenOddClass = this.classifyEvenOdd(times, values);
    const periodicity = this.detectPeriodicity(times, values, frequency);
    const explanation = this.getExplanation(signalType, evenOddClass, periodicity);

    let eventypeDisplay = evenOddClass.charAt(0).toUpperCase() + evenOddClass.slice(1);
    let periodicTypeDisplay = periodicity.isPeriodicEstimate ? 'Periodic' : 'Non-periodic';

    const html = `
      <div class="analysis-card">
        <h2>📊 Signal Analysis</h2>
        <div class="analysis-content">
          <div class="analysis-row">
            <div class="analysis-item">
              <div class="analysis-label">Signal Type (Even/Odd)</div>
              <div class="analysis-value even-odd-${evenOddClass}">
                ${eventypeDisplay}
              </div>
            </div>
            <div class="analysis-item">
              <div class="analysis-label">Periodicity</div>
              <div class="analysis-value periodic-${periodicity.isPeriodicEstimate ? 'yes' : 'no'}">
                ${periodicTypeDisplay}
              </div>
            </div>
            ${periodicity.estimatedPeriod ? `
            <div class="analysis-item">
              <div class="analysis-label">Estimated Period</div>
              <div class="analysis-value period-value">
                ${periodicity.estimatedPeriod.toFixed(3)} s
              </div>
            </div>
            ` : ''}
          </div>
          <div class="analysis-explanation">
            <p>${explanation}</p>
          </div>
        </div>
      </div>
    `;

    this.container.innerHTML = html;
  }

  /**
   * Clear the analysis panel
   */
  clear() {
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}

// Initialize when document loads
document.addEventListener('DOMContentLoaded', () => {
  // Make SignalAnalysisPanel available globally
  window.SignalAnalysisPanel = SignalAnalysisPanel;
});
