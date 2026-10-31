/* PODER — transições leves entre telas e interações.
   Não altera regras, salvamentos nem dados da carreira. */
(() => {
  "use strict";

  if (window.__PODER_TRANSITIONS_INSTALLED__) return;
  window.__PODER_TRANSITIONS_INSTALLED__ = true;

  const main = document.querySelector(".main-content");
  if (!main) return;

  const descriptor = Object.getOwnPropertyDescriptor(Element.prototype, "innerHTML");
  if (!descriptor || typeof descriptor.set !== "function") return;

  const nativeSet = descriptor.set;
  let transitionPending = false;
  let fallbackTimer = null;

  function fallbackScreenAnimation(element) {
    element.dataset.poderTransitionFallback = "true";
    if (fallbackTimer) window.clearTimeout(fallbackTimer);
    fallbackTimer = window.setTimeout(() => {
      delete element.dataset.poderTransitionFallback;
      fallbackTimer = null;
    }, 520);
  }

  // O jogo troca de tela usando main.innerHTML. Envolvemos apenas esse ponto
  // para animar navegações sem interferir nos outros componentes da página.
  Object.defineProperty(Element.prototype, "innerHTML", {
    configurable: descriptor.configurable,
    enumerable: descriptor.enumerable,
    get: descriptor.get,
    set(value) {
      const isGameScreen = this instanceof HTMLElement && this.classList?.contains("main-content");
      if (!isGameScreen) {
        nativeSet.call(this, value);
        return;
      }

      const startTransition = document.startViewTransition;
      if (typeof startTransition !== "function" || transitionPending) {
        nativeSet.call(this, value);
        fallbackScreenAnimation(this);
        return;
      }

      try {
        transitionPending = true;
        const transition = startTransition.call(document, () => nativeSet.call(this, value));
        Promise.resolve(transition.finished)
          .catch(() => {})
          .finally(() => { transitionPending = false; });
      } catch (error) {
        transitionPending = false;
        nativeSet.call(this, value);
        fallbackScreenAnimation(this);
        console.debug("PODER: usando transição alternativa.", error);
      }
    }
  });

  // Também anima a tela que já estiver visível quando o módulo for carregado.
  if (!document.startViewTransition) fallbackScreenAnimation(main);
})();
