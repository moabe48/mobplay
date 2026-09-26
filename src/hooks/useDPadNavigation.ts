import { useEffect } from 'react';

/**
 * Motor de Navegação Espacial D-Pad Otimizado para Smart TV, Android TV e Fire TV.
 * Normaliza eventos de controle remoto e calcula o próximo elemento com projeção W3C Spatial Navigation.
 */
export function useDPadNavigation(onBackPress?: () => void) {
  useEffect(() => {
    // 1. Manter elemento focado visível instantaneamente sem animações (evita dessincronia no D-Pad)
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target && typeof target.scrollIntoView === 'function') {
        target.scrollIntoView({
          behavior: 'auto',
          block: 'nearest',
          inline: 'nearest',
        });
      }
    };

    // 2. Mapeamento Universal de Teclas de Controle Remoto e Teclado
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      const code = e.keyCode;

      // Normalizar Voltar (Escape, Android Back, Tizen Back)
      if (
        key === 'Escape' ||
        key === 'Back' ||
        key === 'GoBack' ||
        code === 27 ||
        code === 4 ||
        code === 10009
      ) {
        if (onBackPress) {
          e.preventDefault();
          onBackPress();
        }
        return;
      }

      // Normalizar Direcionais D-Pad
      let direction: 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight' | null = null;
      if (key === 'ArrowUp' || key === 'Up' || key === 'UIKeyInputUp' || code === 38 || code === 19) {
        direction = 'ArrowUp';
      } else if (key === 'ArrowDown' || key === 'Down' || key === 'UIKeyInputDown' || code === 40 || code === 20) {
        direction = 'ArrowDown';
      } else if (key === 'ArrowLeft' || key === 'Left' || key === 'UIKeyInputLeft' || code === 37 || code === 21) {
        direction = 'ArrowLeft';
      } else if (key === 'ArrowRight' || key === 'Right' || key === 'UIKeyInputRight' || code === 39 || code === 22) {
        direction = 'ArrowRight';
      }

      // Se for tecla de confirmação (OK / Enter / DPAD_CENTER) em elemento focável customizado
      if (key === 'Enter' || key === 'Select' || key === ' ' || code === 13 || code === 23 || code === 66) {
        const active = document.activeElement as HTMLElement;
        if (active && active !== document.body && active.tagName !== 'BUTTON' && active.tagName !== 'INPUT' && active.tagName !== 'A') {
          active.click();
        }
        return;
      }

      if (!direction) return;

      const current = document.activeElement as HTMLElement;

      // Se nada estiver focado ou elemento focado for body/inválido
      if (!current || current === document.body || !document.body.contains(current)) {
        const first = getFocusableElements()[0];
        if (first) {
          first.focus();
          e.preventDefault();
        }
        return;
      }

      // Se estiver digitando em um campo de texto, permitir setas esquerda/direita normalmente
      if (current.tagName === 'INPUT' || current.tagName === 'TEXTAREA') {
        if (direction === 'ArrowUp' || direction === 'ArrowDown') {
          // Permite sair do input verticalmente
        } else {
          return;
        }
      }

      const nextElement = findNearestElement(current, direction);
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
    const isVisible =
      rect.width > 0 &&
      rect.height > 0 &&
      getComputedStyle(el).visibility !== 'hidden' &&
      getComputedStyle(el).display !== 'none';
    return isVisible;
  });
}

/**
 * Encontra o container navegável mais próximo do elemento atual
 */
function getScrollContainer(el: HTMLElement): HTMLElement | null {
  let parent = el.parentElement;
  while (parent && parent !== document.body) {
    const overflowY = getComputedStyle(parent).overflowY;
    const overflowX = getComputedStyle(parent).overflowX;
    if (
      overflowY === 'auto' ||
      overflowY === 'scroll' ||
      overflowX === 'auto' ||
      overflowX === 'scroll'
    ) {
      return parent;
    }
    parent = parent.parentElement;
  }
  return null;
}

/**
 * Encontra o elemento mais próximo na direção especificada usando Algoritmo W3C Spatial Navigation
 */
function findNearestElement(current: HTMLElement, direction: 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight'): HTMLElement | null {
  const currentRect = current.getBoundingClientRect();
  const currentCenter = {
    x: currentRect.left + currentRect.width / 2,
    y: currentRect.top + currentRect.height / 2,
  };

  const container = getScrollContainer(current);
  const allCandidates = getFocusableElements().filter((el) => el !== current && !el.contains(current));

  // 1. Priorizar candidatos dentro do mesmo container rolável
  const sameContainerCandidates = container
    ? allCandidates.filter((el) => container.contains(el))
    : [];

  const bestInContainer = evaluateCandidates(currentRect, currentCenter, sameContainerCandidates, direction);
  if (bestInContainer) {
    return bestInContainer;
  }

  // 2. Se não houver candidatos válidos dentro do mesmo container, buscar no restante da página
  return evaluateCandidates(currentRect, currentCenter, allCandidates, direction);
}

/**
 * Avalia candidatos com ponderação geométrica espacial e bônus de alinhamento
 */
function evaluateCandidates(
  currentRect: DOMRect,
  currentCenter: { x: number; y: number },
  candidates: HTMLElement[],
  direction: 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight'
): HTMLElement | null {
  let bestCandidate: HTMLElement | null = null;
  let minScore = Infinity;

  for (const candidate of candidates) {
    const candRect = candidate.getBoundingClientRect();
    const candCenter = {
      x: candRect.left + candRect.width / 2,
      y: candRect.top + candRect.height / 2,
    };

    const dx = candCenter.x - currentCenter.x;
    const dy = candCenter.y - currentCenter.y;

    let isInDirection = false;

    switch (direction) {
      case 'ArrowUp':
        isInDirection = candRect.bottom <= currentRect.top + 8 || dy < -2;
        break;
      case 'ArrowDown':
        isInDirection = candRect.top >= currentRect.bottom - 8 || dy > 2;
        break;
      case 'ArrowLeft':
        isInDirection = candRect.right <= currentRect.left + 8 || dx < -2;
        break;
      case 'ArrowRight':
        isInDirection = candRect.left >= currentRect.right - 8 || dx > 2;
        break;
    }

    if (!isInDirection) continue;

    let primaryDist = 0;
    let orthogonalDist = 0;
    let overlapBonus = 0;

    if (direction === 'ArrowUp' || direction === 'ArrowDown') {
      primaryDist = Math.abs(dy);
      orthogonalDist = Math.abs(dx);

      // Calcular sobreposição horizontal (alinhamento em coluna)
      const overlapStart = Math.max(currentRect.left, candRect.left);
      const overlapEnd = Math.min(currentRect.right, candRect.right);
      const overlap = Math.max(0, overlapEnd - overlapStart);
      if (overlap > 0) {
        overlapBonus = (overlap / Math.min(currentRect.width, candRect.width)) * 80;
      }
    } else {
      primaryDist = Math.abs(dx);
      orthogonalDist = Math.abs(dy);

      // Calcular sobreposição vertical (alinhamento em linha)
      const overlapStart = Math.max(currentRect.top, candRect.top);
      const overlapEnd = Math.min(currentRect.bottom, candRect.bottom);
      const overlap = Math.max(0, overlapEnd - overlapStart);
      if (overlap > 0) {
        overlapBonus = (overlap / Math.min(currentRect.height, candRect.height)) * 80;
      }
    }

    // Fórmula Spatial Navigation: peso 5x na distância ortogonal para evitar pulos laterais indesejados
    const score = primaryDist + orthogonalDist * 5 - overlapBonus;

    if (score < minScore) {
      minScore = score;
      bestCandidate = candidate;
    }
  }

  return bestCandidate;
}
