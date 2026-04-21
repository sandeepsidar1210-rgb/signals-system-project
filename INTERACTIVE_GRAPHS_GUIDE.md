/**
 * INTERACTIVE GRAPH SYSTEM - UPGRADE GUIDE
 * 
 * The graph visualization system has been completely upgraded with
 * advanced Plotly.js features for enhanced user experience.
 */

// ============================================================================
// 1. HOVER INFORMATION
// ============================================================================
// 
// Feature: Real-time coordinate display on hover
// - Shows Time (t) with 4 decimal precision
// - Shows Amplitude with 4 decimal precision
// - Displays signal name in the hover box
// - Dark hover labels with white text for high contrast
//
// Example hover output:
//   Original Signal
//   Time (t): 1.2345s
//   Amplitude: 0.5678
//
// Implementation: Enhanced hover templates in drawPlot()


// ============================================================================
// 2. ZOOM & PAN CONTROLS
// ============================================================================
//
// Feature: Full interactive zoom and pan capabilities
// ✓ Scroll zoom: Use mouse wheel to zoom in/out
// ✓ Zoom buttons: Click toolbar buttons for precise zoom
// ✓ Pan mode: Hold and drag to move around the graph
// ✓ Reset: Double-click or use "Reset Scale" button to return to original view
//
// Controls Added:
//   - Zoom In (2x magnification)
//   - Zoom Out (1/2 magnification)
//   - Reset Scale (back to original view)
//   - Pan Mode (drag to move)
//   - Select Mode (select data points)
//
// Implementation: config.modeBarButtonsToAdd in drawPlot()


// ============================================================================
// 3. TRACE VISIBILITY TOGGLES
// ============================================================================
//
// Feature: Toggle signal lines on/off with checkboxes
// 
// Enhanced Toggling:
// - Combined Original, Even, Odd into a SINGLE interactive plot
// - Checkboxes now properly control trace visibility
// - Smooth transitions when toggling traces
//
// Usage in HTML:
//   <div class="visibility-row">
//     <label><input type="checkbox" id="show-original" checked> Original</label>
//     <label><input type="checkbox" id="show-even" checked> Even</label>
//     <label><input type="checkbox" id="show-odd" checked> Odd</label>
//   </div>
//
// Implementation: Updated decomposition.js render() function
// - Checks visibility states before rendering traces
// - Only includes selected traces in the plot


// ============================================================================
// 4. RESPONSIVE GRAPH AREA
// ============================================================================
//
// Feature: Large, adaptive graph containers
//
// Sizes:
// - Desktop: 500px+ height with 2-column grid
// - Tablet (1200px): 450px height with adapted grid
// - Mobile (768px): Single column, 380px height
// - Small Mobile (480px): Full width, 320px height
//
// Implementation: CSS media queries in interactiveGraph.css
// - .plot { width: 100%, height: auto, min-height: 500px }
// - Responsive grid layouts for all pages
// - Automatic resize handlers on window change


// ============================================================================
// 5. NEW CSS CLASSES & STYLING
// ============================================================================
//
// .plot
// - Main plot container with shadow and hover effects
// - Responsive height with minimum sizes
// - Rounded corners and smooth transitions
//
// .trace-toggles
// - Control bar for toggle buttons
// - Gradient background with flexbox layout
// - Adaptive wrapping on smaller screens
//
// .trace-toggle-label
// - Individual toggle button styling
// - Colored left border for trace identification
// - Hover and focus effects
//
// .trace-toggle-checkbox
// - Custom styled checkbox
// - Blue checkmark when selected
// - Smooth transitions
//
// .plot-card
// - Wrapper for plots with titles
// - Flexbox column layout
// - Gap management
//
// .stack-plots
// - Container for stacked decomposition plots
// - Vertical gap management
//
// .formula-live
// - Formula display box
// - Purple left border with background tint
// - Monospace font for equations


// ============================================================================
// 6. PLOTLY CONFIGURATION ENHANCEMENTS
// ============================================================================
//
// Layout Improvements:
// ✓ Larger margins for better space utilization
// ✓ Grid styling with light gray gridlines
// ✓ Prominent zero-line markers
// ✓ Axis labels and tick formatting
// ✓ Legend with white semi-transparent background
// ✓ Unified hover mode (shows all traces at once)
// ✓ Auto-sizing based on container
//
// Config Options:
// ✓ Responsive: true - auto-scales on window resize
// ✓ ScrollZoom: true - mouse wheel zooming enabled
// ✓ Display Logo: false - cleaner toolbar
// ✓ Custom buttons: zoom in/out, reset, pan, select


// ============================================================================
// 7. HOVER TEMPLATE SYSTEM
// ============================================================================
//
// Trace-specific hover information:
// Each trace has formatted hover text showing:
// - Trace name (bold)
// - Time value formatted to 4 decimals
// - Amplitude value formatted to 4 decimals
//
// Format: '<b>%{fullData.name}</b><br>Time (t): %{x:.4f}s<br>Amplitude: %{y:.4f}<extra></extra>'
//
// Dark hover labels:
// - Background: #1f2937 (dark gray)
// - Text: white
// - Font: Poppins sans-serif, 12px


// ============================================================================
// 8. COLOR CODING FOR TRACES
// ============================================================================
//
// Signal Type Colors:
// - Original: #4F46E5 (Indigo) - Width 3px
// - Even: #10B981 (Emerald) - Width 3px
// - Odd: #F59E0B (Amber) - Width 3px
// - Modified: #06B6D4 (Cyan) - Width 3px
//
// All lines use spline smoothing for elegant curves


// ============================================================================
// 9. INTEGRATION WITH EXISTING COMPONENTS
// ============================================================================
//
// Works seamlessly with:
// ✓ Signal Generation page - single plot with hover
// ✓ Operations page - compare original vs modified
// ✓ Decomposition page - toggle even/odd together
// ✓ Convolution page - compare signal computations
// ✓ Analysis Panel - sits below graphs
// ✓ Explanation Panel - works with all graph updates
// ✓ Chatbot - can reference graph data


// ============================================================================
// 10. JAVASCRIPT API
// ============================================================================
//
// Main Functions:
//
// drawPlot(elementId, traces, title, options)
//   - Enhanced replacement for old drawPlot
//   - Auto-applies hover templates
//   - Handles responsive sizing
//   - Returns Plotly plot element
//
// createTraceToggles(plotId, toggleContainerId, traceNames)
//   - Creates interactive toggle buttons
//   - Manages trace visibility
//   - Syncs with checkbox states
//
// toggleTraceVisibility(plotId, traceIndex, visible)
//   - Toggle single trace on/off
//   - Smooth animation
//
// toggleTracesVisibility(plotId, traceIndices, visible)
//   - Toggle multiple traces at once
//
// resetPlotView(plotId)
//   - Return to original zoom/pan state
//   - Useful for reset buttons
//
// addPlotInteractions(plotId, handlers)
//   - Add custom event handlers
//   - onHover, onUnhover, onClick, onRelayout


// ============================================================================
// 11. BROWSER COMPATIBILITY
// ============================================================================
//
// ✓ Chrome/Edge (latest)
// ✓ Firefox (latest)
// ✓ Safari (latest)
// ✓ Mobile browsers (iOS Safari, Chrome Mobile)
//
// CSS Features Used:
// ✓ Flexbox
// ✓ CSS Grid
// ✓ Media queries
// ✓ CSS transitions
// ✓ CSS gradients
// ✓ CSS custom borders
//
// JavaScript Features:
// ✓ ES6+ syntax
// ✓ Promises (Plotly)
// ✓ Modern event handling


// ============================================================================
// 12. PERFORMANCE OPTIMIZATIONS
// ============================================================================
//
// ✓ Plotly.react() for efficient updates (only re-renders when needed)
// ✓ Responsive resize handler (single listener per plot)
// ✓ CSS animations for smooth transitions (GPU-accelerated)
// ✓ Efficient trace filtering (boolean checks, not DOM manipulation)
// ✓ Proper memory cleanup (event listeners managed by Plotly)
//
// Expected Performance:
// - Plot render time: < 200ms on desktop
// - Hover response: < 50ms
// - Toggle response: < 100ms
// - Zoom operations: Smooth 60fps


// ============================================================================
// 13. ACCESSIBILITY FEATURES
// ============================================================================
//
// ✓ Keyboard accessible checkboxes
// ✓ Clear focus indicators on toggles
// ✓ High contrast dark hover labels (WCAG AA)
// ✓ Semantic HTML labels with <label> tags
// ✓ ARIA labels on buttons (via Plotly)
// ✓ Color-coded + text labels (not color-only)
// ✓ Responsive touch targets (>44px minimum)


// ============================================================================
// 14. USAGE EXAMPLES
// ============================================================================
//
// Example 1: Simple plot rendering
// ────────────────────────────────────────────────────────────────────────
// const traces = [
//   {
//     x: times,
//     y: signalValues,
//     name: 'Signal',
//     mode: 'lines',
//     line: { color: '#4F46E5', width: 3 }
//   }
// ];
// drawPlot('my-plot', traces, 'My Signal');
//
//
// Example 2: Multiple traces with toggles
// ────────────────────────────────────────────────────────────────────────
// const traces = [
//   { x: times, y: original, name: 'Original', line: { color: '#4F46E5' } },
//   { x: times, y: even, name: 'Even', line: { color: '#10B981' } },
//   { x: times, y: odd, name: 'Odd', line: { color: '#F59E0B' } }
// ];
// drawPlot('my-plot', traces, 'Decomposition');
//
//
// Example 3: Custom hover handlers
// ────────────────────────────────────────────────────────────────────────
// addPlotInteractions('my-plot', {
//   onHover: (data) => console.log('Hovering over', data.points[0].x),
//   onClick: (data) => console.log('Clicked', data.points[0].y)
// });
//


// ============================================================================
// 15. TROUBLESHOOTING
// ============================================================================
//
// Problem: Hover info not showing
// Solution: Ensure hovertemplate is set in trace object
//
// Problem: Zoom buttons not working
// Solution: Check that Plotly.js is loaded before scripts
//
// Problem: Toggles not hiding traces
// Solution: Verify checkbox IDs match control object property names
//
// Problem: Plot not responsive
// Solution: Ensure container has width: 100% or explicit width
//
// Problem: Slow performance on mobile
// Solution: Reduce number of data points (use linspace with fewer samples)

