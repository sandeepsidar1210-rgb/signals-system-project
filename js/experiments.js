/**
 * Experiments Page Controller
 * Handles math rendering and context setup for the experiments page
 */

document.addEventListener('DOMContentLoaded', () => {
  if (typeof renderMath === 'function') {
    renderMath();
  }

  // Set tutor context for AI assistant
  if (typeof setTutorContext === 'function') {
    setTutorContext({ 
      page: 'experiments', 
      note: 'User is exploring predefined signal processing experiments with one-click interactive examples. Available experiments: sin(t) decomposition, step signal convolution, and time shift/amplitude scaling operations.' 
    });
  }
});
