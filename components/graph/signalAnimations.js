/**
 * Signal Transformation Animation System
 * Visualizes x(t) → x(-t), x(t) → Ax(t), x(t) → x(t-t0) with smooth animations
 */

class SignalTransformationAnimator {
  constructor(plotId, options = {}) {
    this.plotId = plotId;
    this.element = document.getElementById(plotId);
    this.isAnimating = false;
    this.animationId = null;
    this.options = {
      duration: 2000, // milliseconds
      frameRate: 60,
      easing: 'easeInOutQuad',
      ...options
    };
  }

  /**
   * Easing functions for smooth animations
   */
  static easingFunctions = {
    linear: (t) => t,
    easeInQuad: (t) => t * t,
    easeOutQuad: (t) => t * (2 - t),
    easeInOutQuad: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    easeInCubic: (t) => t * t * t,
    easeOutCubic: (t) => (--t) * t * t + 1,
    easeInOutCubic: (t) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * (t - 2)) * (2 * (t - 2)) + 1,
    easeInQuart: (t) => t * t * t * t,
    easeOutQuart: (t) => 1 - (--t) * t * t * t,
    easeInOutQuart: (t) => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,
    easeOutBounce: (t) => {
      if (t < 0.36363) return 7.5625 * t * t;
      if (t < 0.72727) return 7.5625 * (t -= 0.54545) * t + 0.75;
      if (t < 0.90909) return 7.5625 * (t -= 0.81818) * t + 0.9375;
      return 7.5625 * (t -= 0.95454) * t + 0.984375;
    }
  };

  /**
   * Get easing function
   */
  getEasing(name) {
    return SignalTransformationAnimator.easingFunctions[name] || SignalTransformationAnimator.easingFunctions.easeInOutQuad;
  }

  /**
   * Animate time reversal: x(t) → x(-t)
   * Shows the signal flipping across the y-axis
   */
  animateTimeReversal(times, originalValues) {
    return new Promise((resolve) => {
      if (this.isAnimating) {
        resolve();
        return;
      }
      this.isAnimating = true;

      const startTime = Date.now();
      const easing = this.getEasing(this.options.easing);
      const mirroredValues = originalValues.map((_, i) => {
        const mirrorIndex = originalValues.length - 1 - i;
        return originalValues[mirrorIndex];
      });

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / this.options.duration, 1);
        const easedProgress = easing(progress);

        // Interpolate between original and mirrored
        const currentValues = originalValues.map((originalVal, i) => {
          const mirroredVal = mirroredValues[i];
          return originalVal + (mirroredVal - originalVal) * easedProgress;
        });

        // Apply horizontal flip transformation
        const transformedTimes = times.map((t) => {
          // Gradually flip t to -t
          return t * (1 - easedProgress) + (-t) * easedProgress;
        });

        // Update plot with smooth transition
        Plotly.restyle(this.element, {
          x: [transformedTimes],
          y: [currentValues]
        }, 0);

        if (progress < 1) {
          this.animationId = requestAnimationFrame(animate);
        } else {
          this.isAnimating = false;
          // Final update to ensure exact state
          Plotly.restyle(this.element, {
            x: [times.map(t => -t)],
            y: [mirroredValues]
          }, 0);
          resolve();
        }
      };

      animate();
    });
  }

  /**
   * Animate amplitude scaling: x(t) → Ax(t)
   * Shows the signal growing or shrinking vertically
   */
  animateAmplitudeScaling(times, originalValues, targetScale) {
    return new Promise((resolve) => {
      if (this.isAnimating) {
        resolve();
        return;
      }
      this.isAnimating = true;

      const startTime = Date.now();
      const easing = this.getEasing(this.options.easing);
      const scaledValues = originalValues.map(v => v * targetScale);

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / this.options.duration, 1);
        const easedProgress = easing(progress);

        // Interpolate between original scale and target scale
        const currentScale = 1 + (targetScale - 1) * easedProgress;
        const currentValues = originalValues.map(v => v * currentScale);

        Plotly.restyle(this.element, {
          y: [currentValues]
        }, 0);

        if (progress < 1) {
          this.animationId = requestAnimationFrame(animate);
        } else {
          this.isAnimating = false;
          Plotly.restyle(this.element, {
            y: [scaledValues]
          }, 0);
          resolve();
        }
      };

      animate();
    });
  }

  /**
   * Animate time shift: x(t) → x(t - t0)
   * Shows the signal moving horizontally
   */
  animateTimeShift(times, originalValues, shiftAmount) {
    return new Promise((resolve) => {
      if (this.isAnimating) {
        resolve();
        return;
      }
      this.isAnimating = true;

      const startTime = Date.now();
      const easing = this.getEasing(this.options.easing);
      const shiftedTimes = times.map(t => t + shiftAmount);

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / this.options.duration, 1);
        const easedProgress = easing(progress);

        // Interpolate between original and shifted times
        const currentShift = shiftAmount * easedProgress;
        const currentTimes = times.map(t => t + currentShift);

        Plotly.restyle(this.element, {
          x: [currentTimes]
        }, 0);

        if (progress < 1) {
          this.animationId = requestAnimationFrame(animate);
        } else {
          this.isAnimating = false;
          Plotly.restyle(this.element, {
            x: [shiftedTimes]
          }, 0);
          resolve();
        }
      };

      animate();
    });
  }

  /**
   * Animate time reversal with axis reflection visualization
   * Shows x(t) flipping across the y-axis
   */
  animateTimeReversalWithMirror(times, originalValues) {
    return new Promise((resolve) => {
      if (this.isAnimating) {
        resolve();
        return;
      }
      this.isAnimating = true;

      const startTime = Date.now();
      const easing = this.getEasing(this.options.easing);
      const reversedTimes = times.map(t => -t);
      const reversedValues = [...originalValues].reverse();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / this.options.duration, 1);
        const easedProgress = easing(progress);

        // Interpolate times: gradually flip from t to -t
        const currentTimes = times.map((t) => {
          return t * Math.cos(easedProgress * Math.PI);
        });

        // For values, use the reversed array interpolated
        const currentValues = originalValues.map((_, i) => {
          const originalVal = originalValues[i];
          const reversedVal = reversedValues[i];
          return originalVal + (reversedVal - originalVal) * easedProgress;
        });

        Plotly.restyle(this.element, {
          x: [currentTimes],
          y: [currentValues]
        }, 0);

        if (progress < 1) {
          this.animationId = requestAnimationFrame(animate);
        } else {
          this.isAnimating = false;
          Plotly.restyle(this.element, {
            x: [reversedTimes],
            y: [reversedValues]
          }, 0);
          resolve();
        }
      };

      animate();
    });
  }

  /**
   * Combined animation: Show original → even + odd components
   * Visualizes decomposition process
   */
  animateDecomposition(times, originalValues, evenValues, oddValues) {
    return new Promise((resolve) => {
      if (this.isAnimating) {
        resolve();
        return;
      }
      this.isAnimating = true;

      const startTime = Date.now();
      const easing = this.getEasing(this.options.easing);

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / this.options.duration, 1);
        const easedProgress = easing(progress);

        // Phase 1: Show original and reversed
        if (easedProgress < 0.33) {
          const phaseProgress = easedProgress / 0.33;
          // Show mirrored version appearing
          const reversedValues = [...originalValues].reverse();
          const transparentReversed = reversedValues.map(v => v * phaseProgress);

          Plotly.restyle(this.element, {
            'line.color': ['#4F46E5', 'rgba(79, 70, 229, ' + phaseProgress + ')'],
            y: [originalValues, transparentReversed]
          });
        }
        // Phase 2: Show decomposition
        else if (easedProgress < 0.66) {
          const phaseProgress = (easedProgress - 0.33) / 0.33;
          
          Plotly.restyle(this.element, {
            'line.color': ['rgba(79, 70, 229, ' + (1 - phaseProgress * 0.7) + ')', '#10B981', '#F59E0B'],
            y: [
              originalValues,
              evenValues.map(v => v + (0 - v) * phaseProgress),
              oddValues.map(v => v + (0 - v) * phaseProgress)
            ]
          });
        }
        // Phase 3: Full decomposition
        else {
          const phaseProgress = (easedProgress - 0.66) / 0.34;
          
          Plotly.restyle(this.element, {
            'line.color': ['rgba(79, 70, 229, 0.3)', '#10B981', '#F59E0B'],
            y: [
              originalValues,
              evenValues,
              oddValues
            ]
          });
        }

        if (progress < 1) {
          this.animationId = requestAnimationFrame(animate);
        } else {
          this.isAnimating = false;
          resolve();
        }
      };

      animate();
    });
  }

  /**
   * Stop animation
   */
  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.isAnimating = false;
  }

  /**
   * Check if animation is running
   */
  getIsAnimating() {
    return this.isAnimating;
  }
}

// Export globally
window.SignalTransformationAnimator = SignalTransformationAnimator;
