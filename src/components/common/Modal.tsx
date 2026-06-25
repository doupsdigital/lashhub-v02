import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';

interface ModalProps {
  children: ReactNode;
}

/**
 * Renderiza filhos diretamente no document.body via React Portal.
 * Garante que overlays de modal sempre estejam acima de qualquer
 * stacking context criado pelo Layout (sticky header, flex transitions, etc).
 */
export default function Modal({ children }: ModalProps) {
  return createPortal(children, document.body);
}
