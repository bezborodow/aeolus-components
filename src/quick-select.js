export default class QuickSelectElement extends HTMLElement {
  #input;
  #hiddenInput;
  #menu;
  #selectionMade; // Tracks if a selection has been made while input is focused.
  #retainedValue; // Restore this value if no selection is made.
  #idKey;
  #codeKey;
  #initialised = false;
  constructor() {
    super();
  }
  connectedCallback() {
    if (this.#initialised)
      return;
    this.#initialised = true;

    this.#idKey = this.getAttribute('id-key') || 'id';
    this.#codeKey = this.getAttribute('code-key') || 'code';

    // Input.
    const input = document.createElement('input');
    this.#input = input;
    if (this.getAttribute('input-id'))
      input.id = this.getAttribute('input-id');
    if (this.getAttribute('input-name'))
      input.setAttribute('name', this.getAttribute('input-name'));
    input.setAttribute('type', 'search');
    input.setAttribute('autocomplete', 'off');
    this.appendChild(input);

    // Menu.
    const menu = document.createElement('menu');
    this.#menu = menu;
    this.appendChild(menu);

    // Hidden input.
    const hiddenInput = document.createElement('input');
    this.#hiddenInput = hiddenInput;
    hiddenInput.setAttribute('type', 'hidden');
    hiddenInput.setAttribute('name', this.getAttribute('name'));
    this.appendChild(hiddenInput);
    this.search('');

    // Default option.
    initialise('option', option => {
      this.#hiddenInput.value = option.value;
      this.#input.value = option.textContent;
      option.remove();
    }, null, this);

    // Events.
    input.addEventListener('input', async e => {
      this.search(e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, ''));
    });
    this.addEventListener('mouseover', e => {
      if (e.target.nodeName == 'LI') {
        for (let li of menu.querySelectorAll('li')) {
          li.classList.remove('hover');
        }
        e.target.classList.add('hover');
      }
    });
    input.addEventListener('focus', async e => {
      menu.hidden = false;
      this.#retainedValue = input.value;
      this.#selectionMade = false;
    });
    input.addEventListener('blur', async e => {
      if (!this.#selectionMade) {
        if (input.value.trim()) {
          input.value = this.#retainedValue; // Junk input, restore retained value.
        } else {
          this.#input.value = '';
          this.#hiddenInput.value = ''; // Empty input; clear values.
          this.dispatchEvent(new CustomEvent('quickselectclear', {
            bubbles: true,
          }));
        }
      }
    });
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();

        const li = menu.querySelector('li.hover') ||
          menu.querySelector('li:first-child');

        if (li) {
          this.select(li);
        }
      }
      if (e.key == 'ArrowUp') {
        e.stopPropagation();
        e.preventDefault();
        let li = menu.querySelector('li.hover');
        if (li) {
          const previous = li.previousElementSibling;
          if (previous) {
            previous.classList.add('hover');
            li.classList.remove('hover');
          }
        } else {
          li = menu.querySelector('li:nth-child(1)');
          if (li) li.classList.add('hover');
        }
      }
      if (e.key == 'ArrowDown') {
        e.stopPropagation();
        e.preventDefault();
        let li = menu.querySelector('li.hover');
        if (li) {
          const next = li.nextElementSibling;
          if (next) {
            next.classList.add('hover');
            li.classList.remove('hover');
          }
        } else {
          li = menu.querySelector('li:nth-child(1)');
          if (li) li.classList.add('hover');
        }
      }
    });
    this.addEventListener('mouseup', e => {
      if (e.target.nodeName == 'LI') {
        this.select(e.target);
      }
    });
  }
  select(li) {
    this.#input.value = li.textContent.trim();
    this.#hiddenInput.value = li.dataset[this.#idKey];
    this.#menu.hidden = true;
    this.#selectionMade = true;
    this.dispatchEvent(new CustomEvent('quickselected', {
      bubbles: true,
      detail: {
        input: this.#input,
        hiddenInput: this.#hiddenInput,
        option: li.dataset
      }
    }));
    this.#hiddenInput.dispatchEvent(new Event('change', {
      bubbles: true,
    }));
    this.#input.dispatchEvent(new Event('change', {
      bubbles: true,
    }));
    this.#input.blur();
    if (this.getAttribute('on-select') == 'submit') {
      this.#input.form.submit();
    }
  }
  async search(value) {
    const url = new URL(this.dataset.searchUrl, window.location.origin);
    url.searchParams.append('search', value);
    const response = await fetch(url);
    const json = await response.json();
    const children = []
    for (const option of json.options) {
      const li = document.createElement('li');
      li.textContent = option[this.#codeKey];
      for (let [key, value] of Object.entries(option)) {
        li.dataset[key] = value;
      }
      children.push(li);
    }
    this.#menu.replaceChildren(...children);
    this.#menu.hidden = false;
  }
}
