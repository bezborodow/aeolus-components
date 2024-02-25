export default class QuickNavElement extends HTMLElement {
  constructor() {
    super();
  }
  connectedCallback() {
    const input = document.createElement('input');
    input.setAttribute('type', 'search');
    input.setAttribute('autocomplete', 'off');
    input.setAttribute('placeholder', this.getAttribute('placeholder'));
    input.setAttribute('accesskey', this.getAttribute('accesskey'));
    input.classList.add('uppercase');
    this.appendChild(input);
    const menu = document.createElement('menu');
    this.appendChild(menu);
    this.search('');
    this.addEventListener('input', async e => {
      this.search(e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, ''), true);
    });
    this.addEventListener('mouseover', e => {
      if (e.target.nodeName == 'A') {
        for (let a of menu.querySelectorAll('a')) {
          a.classList.remove('hover');
        }
        e.target.classList.add('hover');
      }
    });
    this.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        let a = menu.querySelector('a.hover');
        if (!a) {
          a = menu.querySelector('li:first-child a');
        }

        if (a) {
          window.location.href = a.href;
        }
      }
      if (e.key == 'ArrowUp') {
        let a = menu.querySelector('a.hover');
        if (a) {
          const previous = a.closest('li').previousElementSibling;
          if (previous) {
            previous.querySelector('a').classList.add('hover');
            a.classList.remove('hover');
          }
        } else {
          a = menu.querySelector('li:nth-child(1) a');
          if (a) a.classList.add('hover');
        }
      }
      if (e.key == 'ArrowDown') {
        let a = menu.querySelector('a.hover');
        if (a) {
          const next = a.closest('li').nextElementSibling;
          if (next) {
            next.querySelector('a').classList.add('hover');
            a.classList.remove('hover');
          }
        } else {
          a = menu.querySelector('li:nth-child(1) a');
          if (a) a.classList.add('hover');
        }
      }
    });
  }
  async search(value, go = false) {
    const url = new URL(this.dataset.searchUrl, window.location.origin);
    url.searchParams.append('search', value);
    const response = await fetch(url);
    const json = await response.json();
    const menu = this.querySelector('menu');
    const children = []
    if (go && json.items.length == 1) {
      window.location.href = json.url + '/' + json.items[0].id;
    }
    for (const item of json.items) {
      const a = document.createElement('a');
      a.setAttribute('href', json.url + '/' + item.id);
      a.textContent = item.code;
      const li = document.createElement('li');
      li.appendChild(a);
      children.push(li);
    }
    menu.replaceChildren(...children);
  }
}
