import './style.css'
import './ui.js'

function createOrGetInvisibleInput() {
  let input = document.getElementById('invisible-word-input');
  if (!input) {
    input = document.createElement('input');
    input.type = 'text';
    input.id = 'invisible-word-input';
    input.style.position = 'absolute';
    input.style.opacity = '0';
    input.style.pointerEvents = 'none';
    input.style.zIndex = '100';
    input.autocomplete = 'off';
    document.body.appendChild(input);
  }
  return input;
}

window.focusInvisibleInput = function() {
  const input = createOrGetInvisibleInput();
  input.value = '';
  input.focus();
};

window.blurInvisibleInput = function() {
  const input = document.getElementById('invisible-word-input');
  if (input) input.blur();
};