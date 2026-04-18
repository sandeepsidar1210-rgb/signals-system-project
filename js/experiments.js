document.addEventListener('DOMContentLoaded', () => {
  if (typeof renderMath === 'function') {
    renderMath();
  } else if (typeof renderMathInElement === 'function') {
    renderMathInElement(document.body, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false }
      ],
      throwOnError: false
    });
  }

  setTutorContext({ page: 'experiments', note: 'User is viewing predefined experiment options.' });
});
