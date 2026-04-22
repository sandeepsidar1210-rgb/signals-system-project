(function homepageModule() {
  if (document.body?.dataset?.page !== 'home') return;

  const heroPath = document.getElementById('hero-wave-path');
  const heroLabel = document.getElementById('hero-signal-label');

  function toSvgPath(points) {
    if (!points.length) return '';
    const [first, ...rest] = points;
    return `M ${first[0].toFixed(2)} ${first[1].toFixed(2)} ${rest
      .map((point) => `L ${point[0].toFixed(2)} ${point[1].toFixed(2)}`)
      .join(' ')}`;
  }

  function buildSignalPoints(type, width, height, phase = 0) {
    const points = [];
    const count = 160;
    const mid = height / 2;
    const amp = height * 0.34;

    for (let i = 0; i <= count; i += 1) {
      const x = (i / count) * width;
      const t = (i / count) * 4 * Math.PI;
      let yValue = 0;

      if (type === 'sine') {
        yValue = Math.sin(t + phase);
      } else if (type === 'step') {
        yValue = t > 2 * Math.PI ? 0.9 : -0.2;
      } else if (type === 'square') {
        yValue = Math.sin(t + phase) >= 0 ? 0.85 : -0.85;
      } else if (type === 'ramp') {
        yValue = Math.max(-0.7, -0.8 + (i / count) * 1.6);
      } else if (type === 'decomp-even') {
        yValue = Math.cos(t + phase * 0.4) * 0.8;
      } else if (type === 'decomp-odd') {
        yValue = Math.sin(t + phase) * 0.75;
      }

      const y = mid - yValue * amp;
      points.push([x, y]);
    }

    return points;
  }

  function renderHero(phase) {
    if (!heroPath) return;

    const sinePoints = buildSignalPoints('sine', 800, 300, phase);
    const decompPoints = buildSignalPoints('decomp-even', 800, 300, phase);
    const useSine = Math.floor(phase / (Math.PI * 2)) % 2 === 0;

    heroPath.setAttribute('d', toSvgPath(useSine ? sinePoints : decompPoints));
    if (heroLabel) {
      heroLabel.textContent = useSine ? 'Sine Wave' : 'Even Component';
    }
  }

  let phase = 0;

  function animate() {
    phase += 0.032;
    renderHero(phase);
    requestAnimationFrame(animate);
  }

  const revealNodes = Array.from(document.querySelectorAll('.reveal-on-scroll'));
  if (revealNodes.length && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.12 }
    );

    revealNodes.forEach((node) => observer.observe(node));
  } else {
    revealNodes.forEach((node) => node.classList.add('is-visible'));
  }

  renderHero(phase);
  requestAnimationFrame(animate);
})();
