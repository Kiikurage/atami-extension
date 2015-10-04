
/**********************************************************************
 * Common
 */

/**
 * Constants
 */
var $base = null;
var focusedElement = null;

function init() {
  window.addEventListener('keydown', function(e) {
    if (e.shiftKey) {
      if (e.keyCode === 68) {
        focusedElement = document.activeElement;
        $base.css({'top': $(focusedElement).offset().top+$(focusedElement).height(), 'left': $(focusedElement).offset().left});
        $base.appendTo(document.body);
        setupListener();
      }
    }
  }, false);
  loadHTML();
};

function loadHTML() {
  $.get(chrome.extension.getURL('form.html'))
    .done(function(html){
      $base = $(html);
    });
};

function setupListener() {
  new Clipboard('.stampImage');
  document.querySelector('#atami-button').addEventListener('click', function() {
    var text = document.querySelector("#atami-search").value;
    // getImages({"q": text});
    chrome.runtime.sendMessage({'q': text});
  });
};

chrome.runtime.onMessage.addListener(function(json, sender, sendResponse) {
  var parent = document.querySelector('#atami-parent');
  removeAllChildren(parent);
  appendCards(parent, json);
});

$(init);

/**********************************************************************
 * Util
 */

/**
 * Append cards to parent
 */
function appendCards(parent, children) {
  for (var i = 0; i < children.length; i++) {
    var child = document.createElement('img');

    child.classList.add('stampImage');
    child.src = children[i]["proxiedUrl"];
    child.dataset.clipboardText = children[i]["proxiedUrl"];
    child.setAttribute('tabindex', 0);
    child.addEventListener('click', function() {
      focusedElement.value = this.src;
      focusedElement.focus();
      $base.remove();
    });

    parent.appendChild(child);
  }
}

/**
 * Clear all elements of parent
 */
function removeAllChildren(parent) {
  parent.innerHTML = '';
}
