import { $, EMAIL, copyEmail } from './utils.js';
import { isConfigured, sendMessage } from '../lib/backend.js';

const FORMSPREE_ID = (import.meta.env.VITE_FORMSPREE_ID || '').trim();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const rules = {
  name: (v) => (v.trim().length < 2 ? 'Please enter your name (at least 2 characters).' : ''),
  email: (v) => (!v.trim() ? 'Email is required.' : !EMAIL_RE.test(v.trim()) ? 'Please enter a valid email address.' : ''),
  message: (v) => (v.trim().length < 10 ? 'Message should be at least 10 characters.' : '')
};

export function initContact() {
  $('.copy-email')?.addEventListener('click', copyEmail);

  const form = $('#contact-form');
  if (!form) return;
  const status = $('.form-status', form);
  const btn = $('.submit-btn', form);
  const label = $('.btn-label', btn);
  const msg = form.elements.message;
  const counter = $('.char-count', form);
  const touched = new Set();

  const validate = (name, show = true) => {
    const input = form.elements[name];
    const error = rules[name](input.value);
    const field = input.closest('.field');
    if (show) {
      field.classList.toggle('invalid', !!error);
      field.classList.toggle('valid', !error);
      input.setAttribute('aria-invalid', String(!!error));
      input.setAttribute('aria-describedby', `cf-${name}-err`);
      $(`#cf-${name}-err`).textContent = error;
    }
    return !error;
  };

  Object.keys(rules).forEach((name) => {
    const input = form.elements[name];
    input.addEventListener('blur', () => { touched.add(name); validate(name); });
    input.addEventListener('input', () => { if (touched.has(name)) validate(name); });
  });
  msg.addEventListener('input', () => { counter.textContent = `${msg.value.length} / ${msg.maxLength}`; });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    status.className = 'form-status';
    const names = Object.keys(rules);
    names.forEach((n) => touched.add(n));
    const ok = names.map((n) => validate(n)).every(Boolean);
    if (!ok) {
      form.elements[names.find((n) => !validate(n, false))].focus();
      status.textContent = 'Please fix the highlighted fields.';
      status.classList.add('error');
      return;
    }
    if (form.elements._gotcha.value) return; // bot

    const data = { name: form.elements.name.value.trim(), email: form.elements.email.value.trim(), message: msg.value.trim() };

    const done = () => {
      form.reset();
      counter.textContent = `0 / ${msg.maxLength}`;
      form.querySelectorAll('.field').forEach((f) => f.classList.remove('valid', 'invalid'));
      touched.clear();
      status.textContent = "Thanks! Your message was sent — I'll get back to you soon.";
      status.classList.add('ok');
    };

    if (isConfigured) {
      btn.disabled = true;
      label.textContent = 'Sending…';
      try {
        await sendMessage(data);
        done();
        return;
      } catch {
        // fall through to Formspree / email
      } finally {
        btn.disabled = false;
        label.textContent = 'Send message';
      }
    } else {
      sendMessage(data).catch(() => {}); // keeps a local copy for the demo admin inbox
    }

    if (!FORMSPREE_ID) {
      // No form backend configured: hand off to the visitor's email client.
      const subject = encodeURIComponent(`Portfolio contact from ${data.name}`);
      const body = encodeURIComponent(`${data.message}\n\n— ${data.name} (${data.email})`);
      location.href = `mailto:${EMAIL}?subject=${subject}&body=${body}`;
      status.textContent = 'Opening your email client…';
      status.classList.add('ok');
      return;
    }

    btn.disabled = true;
    label.textContent = 'Sending…';
    try {
      const res = await fetch(`https://formspree.io/f/${encodeURIComponent(FORMSPREE_ID)}`, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, _subject: `Portfolio contact from ${data.name}` })
      });
      if (!res.ok) throw new Error(String(res.status));
      done();
    } catch {
      status.innerHTML = `Something went wrong. Please email me directly at <a href="mailto:${EMAIL}">${EMAIL}</a>.`;
      status.classList.add('error');
    } finally {
      btn.disabled = false;
      label.textContent = 'Send message';
    }
  });
}
