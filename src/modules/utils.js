export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
export const finePointer = () => matchMedia('(hover: hover) and (pointer: fine)').matches;

export const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let toastTimer;
export function toast(msg) {
  const el = $('.toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}

export const EMAIL = 'abrhamassefa759@gmail.com';

export async function copyEmail() {
  try {
    await navigator.clipboard.writeText(EMAIL);
    toast('Email copied to clipboard ✓');
  } catch {
    toast(EMAIL);
  }
}

export function scrollToId(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
}

// open a <dialog> with a fade-in class; returns a close function
export function openDialog(dlg, { onClose } = {}) {
  if (dlg.open) return;
  const lastFocus = document.activeElement;
  dlg.showModal();
  document.documentElement.style.overflow = 'hidden';
  requestAnimationFrame(() => dlg.classList.add('visible'));
  const close = () => {
    dlg.classList.remove('visible');
    setTimeout(() => {
      if (dlg.open) dlg.close();
    }, reducedMotion() ? 0 : 220);
  };
  const handleClose = () => {
    document.documentElement.style.overflow = '';
    dlg.classList.remove('visible');
    dlg.removeEventListener('close', handleClose);
    dlg.removeEventListener('cancel', handleCancel);
    dlg.removeEventListener('click', handleBackdrop);
    onClose?.();
    lastFocus?.focus?.({ preventScroll: true });
  };
  const handleCancel = (e) => {
    e.preventDefault();
    close();
  };
  const handleBackdrop = (e) => {
    if (e.target === dlg) close();
  };
  dlg.addEventListener('close', handleClose);
  dlg.addEventListener('cancel', handleCancel);
  dlg.addEventListener('click', handleBackdrop);
  dlg._close = close;
  return close;
}
