import { useEffect } from 'react';

/**
 * Hook de suporte a Navegação D-Pad para Android TV e Controle Remoto.
 * Garante que ao pressionar as setas no controle remoto:
 * 1. O elemento em foco é suavemente rolado para o centro da tela.
 * 2. As teclas de retorno (Voltar/Esc) disparam a ação de voltar ou fechar modais/player.
 */
export function useDPadNavigation(onBackPress?: () => void) {
  useEffect(() => {
    // 1. Manter elemento focado sempre visível na TV (Auto-Scroll)
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

    // 2. Interceptar teclas especiais do controle remoto de Android TV
    const handleKeyDown = (e: KeyboardEvent) => {
      // Teclas de Voltar do controle remoto (Esc, Back, KeyCode 4/27/10009/8)
      if (
        e.key === 'Escape' ||
        e.key === 'Back' ||
        e.key === 'GoBack' ||
        e.keyCode === 27 ||
        e.keyCode === 4 ||
        e.keyCode === 10009
      ) {
        if (onBackPress) {
          e.preventDefault();
          onBackPress();
        }
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
