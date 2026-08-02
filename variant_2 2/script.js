
(function () {
  const qs = (s, r = document) => r.querySelector(s);
  const qsa = (s, r = document) => Array.from(r.querySelectorAll(s));

  function initHeader() {
    const burger = qs('#burgerBtn');
    const panel = qs('#mobileMenu');
    if (burger && panel) {
      burger.addEventListener('click', () => {
        const open = !panel.classList.contains('is-open');
        panel.classList.toggle('is-open', open);
        burger.classList.toggle('is-open', open);
        burger.setAttribute('aria-expanded', String(open));
        panel.setAttribute('aria-hidden', String(!open));
      });
      qsa('a', panel).forEach((a) => a.addEventListener('click', () => {
        panel.classList.remove('is-open');
        burger.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
        panel.setAttribute('aria-hidden', 'true');
      }));
    }

    qsa('[data-submenu-trigger]').forEach((link) => {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        const li = link.closest('.has-children');
        if (!li) return;
        const open = !li.classList.contains('is-open');
        qsa('.has-children.is-open').forEach((item) => {
          if (item !== li) item.classList.remove('is-open');
        });
        li.classList.toggle('is-open', open);
        link.setAttribute('aria-expanded', String(open));
      });
    });

    document.addEventListener('click', (event) => {
      if (event.target.closest('.has-children')) return;
      qsa('.has-children.is-open').forEach((item) => item.classList.remove('is-open'));
    });
  }

  function initModal() {
    const modal = qs('[data-contact-modal]');
    if (!modal) return;
    const open = () => {
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.documentElement.style.overflow = 'hidden';
      const field = qs('input, textarea, button', modal);
      if (field) field.focus();
    };
    const close = () => {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.documentElement.style.overflow = '';
    };

    qsa('[data-open-contact-modal]').forEach((a) => a.addEventListener('click', (event) => {
      event.preventDefault();
      open();
    }));
    qsa('[data-close-modal]', modal).forEach((el) => el.addEventListener('click', close));
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') close();
    });
  }

  function initFaq() {
    qsa('[data-faq]').forEach((item) => {
      const button = qs('button', item);
      if (!button) return;
      button.addEventListener('click', () => {
        const list = item.closest('.faq-list');
        if (list) qsa('[data-faq]', list).forEach((other) => {
          if (other !== item) other.classList.remove('is-open');
        });
        item.classList.toggle('is-open');
      });
    });
  }

  function initCaseTabs() {
    qsa('[data-case-tabs]').forEach((root) => {
      const title = qs('[data-case-title]', root);
      const text = qs('[data-case-text]', root);
      const result = qs('[data-case-result]', root);
      const kicker = qs('[data-case-kicker]', root);
      qsa('.case-tab', root).forEach((button) => {
        button.addEventListener('click', () => {
          qsa('.case-tab', root).forEach((b) => b.classList.toggle('is-active', b === button));
          if (title) title.textContent = button.dataset.title || '';
          if (text) text.textContent = button.dataset.text || '';
          if (result) result.textContent = button.dataset.result || '';
          if (kicker) kicker.textContent = button.dataset.kicker || '';
        });
      });
    });
  }

  function initForms() {
    qsa('[data-case-form]').forEach((form) => {
      form.addEventListener('submit', (event) => {
        const name = qs('[name="name"]', form);
        const phone = qs('[name="phone"]', form);
        const msg = qs('[name="message"]', form);
        const status = qs('[data-form-status]', form);

        const okName = !name || name.value.trim().length >= 2;
        const okPhone = !phone || phone.value.replace(/\D/g, '').length >= 10;
        const okMsg = !msg || msg.value.trim().length >= 6;

        if (!okName || !okPhone || !okMsg) {
          event.preventDefault();
          if (status) status.textContent = 'Проверьте имя, телефон и краткое описание.';
          return;
        }

        if (status) status.textContent = 'Отправляем заявку…';
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initHeader();
    initModal();
    initFaq();
    initCaseTabs();
    initForms();
  });
})();
