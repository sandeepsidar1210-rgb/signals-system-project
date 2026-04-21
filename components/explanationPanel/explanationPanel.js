function renderExplanationPanel(panelId, title, steps) {
  const panel = document.getElementById(panelId);
  if (!panel) return;

  const items = steps
    .map(
      (step, index) => `
      <article class="exp-step-card">
        <h4>Step ${index + 1}: ${step.title}</h4>
        <p>${step.description || ''}</p>
        ${step.formula ? `<div class="exp-formula">${step.formula}</div>` : ''}
      </article>`
    )
    .join('');

  panel.innerHTML = `
    <div class="exp-panel-head">
      <h3>${title}</h3>
    </div>
    <div class="exp-panel-grid">${items}</div>
  `;

  if (typeof renderMath === 'function') {
    renderMath(panel);
  }
}
