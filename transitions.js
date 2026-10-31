/* PODER — transições seguras entre telas.
   Não altera Element.prototype nem adia a atualização do DOM.
   Assim, o jogo pode continuar encontrando os botões logo após main.innerHTML. */
(() => {
  "use strict";

  if (window.__PODER_SAFE_TRANSITIONS__) return;
  window.__PODER_SAFE_TRANSITIONS__ = true;

  const main = document.querySelector(".main-content");
  if (!main || typeof MutationObserver === "undefined") return;

  const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) return;

  let animationFrame = 0;

  const animateScreen = () => {
    cancelAnimationFrame(animationFrame);
    animationFrame = requestAnimationFrame(() => {
      main.classList.remove("poder-screen-enter");
      // Força a reinicialização da animação sem atrasar ou substituir a troca do DOM.
      void main.offsetWidth;
      main.classList.add("poder-screen-enter");
    });
  };

  const observer = new MutationObserver(records => {
    // Somente mudanças na raiz da tela inteira; atualizações de balões ou campos
    // internos não devem reiniciar a animação da página.
    const screenChanged = records.some(record => record.target === main &&
      (record.addedNodes.length > 0 || record.removedNodes.length > 0));
    if (screenChanged) animateScreen();
  });

  observer.observe(main, { childList: true });
})();
