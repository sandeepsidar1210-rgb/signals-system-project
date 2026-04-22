/**
 * Enhanced Interactive Graph Utilities
 * Provides advanced visualization with hover info, zoom, and trace toggles
 */

/**
 * Enhanced drawPlot with interactive features
 * @param {string} elementId - DOM element ID for the plot
 * @param {Array} traces - Plotly traces array
 * @param {string} title - Chart title
 * @param {Object} options - Optional configuration
 */
function drawPlot(elementId, traces, title, options = {}) {
  const element = document.getElementById(elementId);
  if (!element) return;

  // Enhance traces with hover templates
  const enhancedTraces = traces.map((trace) => ({
    ...trace,
    hovertemplate: 
      trace.hovertemplate || 
      '<b>%{fullData.name}</b><br>Time (t): %{x:.4f}s<br>Amplitude: %{y:.4f}<extra></extra>',
    hoverlabel: {
      bgcolor: '#1f2937',
      bordercolor: '#fff',
      font: { color: '#fff', size: 12, family: 'Poppins, sans-serif' }
    }
  }));

  // Create responsive layout
  const layout = {
    title: {
      text: title,
      font: { size: 18, color: '#1f2937', family: 'Poppins, sans-serif' }
    },
    paper_bgcolor: '#ffffff',
    plot_bgcolor: '#f9fafb',
    margin: { t: 60, l: 60, r: 30, b: 60 },
    xaxis: {
      title: {
        text: 'Time (t)',
        font: { size: 12, color: '#6b7280' }
      },
      showgrid: true,
      gridwidth: 1,
      gridcolor: '#e5e7eb',
      zeroline: true,
      zerolinewidth: 2,
      zerolinecolor: '#9ca3af',
      showline: true,
      linewidth: 2,
      linecolor: '#9ca3af',
      mirror: 'ticks',
      tickfont: { size: 11, color: '#6b7280' }
    },
    yaxis: {
      title: {
        text: 'Amplitude',
        font: { size: 12, color: '#6b7280' }
      },
      showgrid: true,
      gridwidth: 1,
      gridcolor: '#e5e7eb',
      zeroline: true,
      zerolinewidth: 2,
      zerolinecolor: '#9ca3af',
      showline: true,
      linewidth: 2,
      linecolor: '#9ca3af',
      mirror: 'ticks',
      tickfont: { size: 11, color: '#6b7280' }
    },
    legend: {
      orientation: 'h',
      y: 1.15,
      x: 0,
      bgcolor: 'rgba(255, 255, 255, 0.8)',
      bordercolor: '#d1d5db',
      borderwidth: 1,
      font: { size: 11, family: 'Poppins, sans-serif' }
    },
    hovermode: 'x unified',
    autosize: true,
    ...options.layout
  };

  // Enhanced config with all interactions
  const config = {
    responsive: true,
    scrollZoom: true,
    displaylogo: false,
    modeBarButtonsToAdd: [
      'zoomIn2d',
      'zoomOut2d',
      'resetScale2d',
      'pan2d',
      'select2d'
    ],
    modeBarButtonsToRemove: ['lasso2d', 'select2d'],
    toImageButtonOptions: {
      format: 'png',
      filename: `${title || elementId}`,
      height: 900,
      width: 1400,
      scale: 2
    },
    ...options.config
  };

  Plotly.react(elementId, enhancedTraces, layout, config);
  
  // Add responsive resize handler
  window.addEventListener('resize', () => {
    Plotly.Plots.resize(elementId);
  });
}

/**
 * Create interactive trace visibility toggles for a plot
 * @param {string} plotId - Plot element ID
 * @param {string} toggleContainerId - Container for toggle buttons
 * @param {Array} traceNames - Array of trace names to toggle
 */
function createTraceToggles(plotId, toggleContainerId, traceNames) {
  const container = document.getElementById(toggleContainerId);
  if (!container || !traceNames || traceNames.length === 0) return;

  // Clear existing toggles
  container.innerHTML = '';

  // Create toggle UI
  const toggleUI = document.createElement('div');
  toggleUI.className = 'trace-toggles';

  traceNames.forEach((name, index) => {
    const label = document.createElement('label');
    label.className = 'trace-toggle-label';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = true;
    checkbox.className = 'trace-toggle-checkbox';
    checkbox.dataset.traceIndex = index;
    checkbox.dataset.traceName = name;

    const labelText = document.createElement('span');
    labelText.textContent = name;
    labelText.className = 'toggle-label-text';

    checkbox.addEventListener('change', () => {
      toggleTraceVisibility(plotId, index, checkbox.checked);
    });

    label.appendChild(checkbox);
    label.appendChild(labelText);
    toggleUI.appendChild(label);
  });

  container.appendChild(toggleUI);
}

/**
 * Toggle visibility of a specific trace in the plot
 * @param {string} plotId - Plot element ID
 * @param {number} traceIndex - Index of the trace to toggle
 * @param {boolean} visible - Visibility state
 */
function toggleTraceVisibility(plotId, traceIndex, visible) {
  const element = document.getElementById(plotId);
  if (!element) return;

  Plotly.restyle(element, { visible: visible }, traceIndex);
}

/**
 * Toggle visibility of multiple traces at once
 * @param {string} plotId - Plot element ID
 * @param {Array<number>} traceIndices - Array of trace indices
 * @param {boolean} visible - Visibility state
 */
function toggleTracesVisibility(plotId, traceIndices, visible) {
  const element = document.getElementById(plotId);
  if (!element) return;

  traceIndices.forEach((index) => {
    Plotly.restyle(element, { visible: visible }, index);
  });
}

/**
 * Reset plot to initial zoom/pan state
 * @param {string} plotId - Plot element ID
 */
function resetPlotView(plotId) {
  const element = document.getElementById(plotId);
  if (!element) return;

  Plotly.relayout(element, {
    'xaxis.autorange': true,
    'yaxis.autorange': true
  });
}

/**
 * Add custom interaction handlers
 * @param {string} plotId - Plot element ID
 * @param {Object} handlers - Event handlers object
 */
function addPlotInteractions(plotId, handlers = {}) {
  const element = document.getElementById(plotId);
  if (!element) return;

  if (handlers.onHover) {
    element.on('plotly_hover', handlers.onHover);
  }

  if (handlers.onUnhover) {
    element.on('plotly_unhover', handlers.onUnhover);
  }

  if (handlers.onClick) {
    element.on('plotly_click', handlers.onClick);
  }

  if (handlers.onRelayout) {
    element.on('plotly_relayout', handlers.onRelayout);
  }
}

// Export for use
window.drawPlot = drawPlot;
window.createTraceToggles = createTraceToggles;
window.toggleTraceVisibility = toggleTraceVisibility;
window.toggleTracesVisibility = toggleTracesVisibility;
window.resetPlotView = resetPlotView;
window.addPlotInteractions = addPlotInteractions;
