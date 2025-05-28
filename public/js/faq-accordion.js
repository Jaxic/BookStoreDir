document.addEventListener('DOMContentLoaded', function() {
  const faqQuestions = document.querySelectorAll('.faq-question');
  faqQuestions.forEach(btn => {
    btn.addEventListener('click', function() {
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      // Close all panels
      faqQuestions.forEach(otherBtn => {
        otherBtn.setAttribute('aria-expanded', 'false');
        const panelId = otherBtn.getAttribute('aria-controls');
        const panel = document.getElementById(panelId);
        if (panel) panel.classList.add('hidden');
      });
      // Open this panel if it was not already open
      if (!expanded) {
        btn.setAttribute('aria-expanded', 'true');
        const panelId = btn.getAttribute('aria-controls');
        const panel = document.getElementById(panelId);
        if (panel) panel.classList.remove('hidden');
      }
    });
  });
}); 