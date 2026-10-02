import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import './ViewportModal.css';

let openModals = 0;
let previousOverflow;

// Escape transformed/animated page containers so dialogs use the viewport.
export default function ViewportModal({ children, className = '', onClose, onClick, ...props }) {
  const overlay = useRef(null);
  useEffect(() => {
    const previousFocus = document.activeElement;
    if (openModals++ === 0) {
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    overlay.current?.focus({ preventScroll: true });
    return () => {
      if (--openModals === 0) document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, []);
  return createPortal(
    <div role="dialog" aria-modal="true" tabIndex={-1} {...props} ref={overlay} onClick={event => {
      if (event.target !== event.currentTarget) return;
      event.stopPropagation();
      if (onClose) onClose();
      else onClick?.(event);
    }} className={`viewport-modal ${className}`}>
      {children}
    </div>,
    document.body
  );
}
