import { useEffect } from 'react';

/**
 * Motor de Navegação Espacial D-Pad para Smart TV & Android TV.
 * Calcula geometricamente o elemento focável mais próximo na direção da seta pressionada.
 */
export function useDPadNavigation(onBackPress?: () => void) {
  useEffect(() => {
    // 1. Manter elemento focado sempre visível na TV
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target && typeof target.scrollIntoView === 'function') {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'nearest',
        });
      }
    };

    // 2. Algoritmo de Navegação Espacial
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;

      // Teclas de voltar
      if (
        key === 'Escape' ||
        key === 'Back' ||
        key === 'GoBack' ||
        e.keyCode === 27 ||
        e.keyCode === 4 ||
        e.keyCode === 10009
      ) {
        if (onBackPress) {
          e.preventDefault();
          onBackPress();
        }
        return;
      }

      const isDirectional = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key);
      if (!isDirectional) return;

      const current = document.activeElement as HTMLElement;
      if (!current || current === document.body) {
        // Se nada estiver focado, focar no primeiro elemento navegável
        const first = getFocusableElements()[0];
        if (first) {
          first.focus();
          e.preventDefault();
        }
        return;
      }

      // Se estiver em um campo de texto ou input, permitir comportamento padrão das setas
      if (current.tagName === 'INPUT' || current.tagName === 'TEXTAREA') {
        if (key === 'ArrowUp' || key === 'ArrowDown') {
          // Permite sair do input verticalmente
        } else {
          return;
        }
      }

      const nextElement = findNearestElement(current, key);
      if (nextElement) {
        e.preventDefault();
        nextElement.focus();
      }
    };

    window.addEventListener('focusin', handleFocusIn);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('focusin', handleFocusIn);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onBackPress]);
}

/**
 * Retorna todos os elementos visíveis e focáveis no DOM
 */
function getFocusableElements(): HTMLElement[] {
  const selector =
    'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [role="button"]';
  const elements = Array.from(document.querySelectorAll<HTMLElement>(selector));

  return elements.filter((el) => {
    const rect = el.getBoundingClientRect();
    const isVisible = rect.width > 0 && rect.height > 0 && getComputedStyle(el).visibility !== 'hidden';
    return isVisible;
  });
}

/**
 * Encontra o elemento mais próximo na direção especificada usando distância Euclidiana
 */
function findNearestElement(current: HTMLElement, direction: string): HTMLElement | null {
  const currentRect = current.getBoundingClientRect();
  const currentCenter = {
    x: currentRect.left + currentRect.width / 2,
    y: currentRect.top + currentRect.height / 2,
  };

  const candidates = getFocusableElements().filter((el) => el !== current);
  let bestCandidate: HTMLElement | null = null;
  let minDistance = Infinity;

  for (const candidate of candidates) {
    const rect = candidate.getBoundingClientRect();
    const center = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };

    const dx = center.x - currentCenter.x;
    const dy = center.y - currentCenter.y;

    let isMatch = false;

    switch (direction) {
      case 'ArrowUp':
        isMatch = dy < -5 && Math.abs(dx) < Math.abs(dy) * 2.5;
        break;
      case 'ArrowDown':
        isMatch = dy > 5 && Math.abs(dx) < Math.abs(dy) * 2.5;
        break;
      case 'ArrowLeft':
        isMatch = dx < -5 && Math.abs(dy) < Math.abs(dx) * 2.5;
        break;
      case 'ArrowRight':
        isMatch = dx > 5 && Math.abs(dy) < Math.abs(dx) * 2.5;
        break;
    }

    if (isMatch) {
      // Distância ponderada priorizando alinhamento direto
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < minDistance) {
        minDistance = distance;
        bestCandidate = candidate;
      }
    }
  }

  return bestCandidate;
}
