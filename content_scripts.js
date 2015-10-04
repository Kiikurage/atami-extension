
/**********************************************************************
 * Common
 */

/**
 * Constants
 */
var ENTRY_POINT='http://atami.kikurage.xyz';

function loadHTML() {
  $.get(chrome.extension.getURL('form.html'))
    .done(function(html){
      $(html).appendTo(document.body);
      setupListener()
    });
};

function setupListener() {
  new Clipboard('.stampImage');
  document.querySelector('#button').addEventListener('click', function() {
    var text = document.querySelector("#search").value;
    getImages({"q": text});
  });
};

$(loadHTML);

/**********************************************************************
 * API
 */

/**
 * GET /image/search With query
 */
function getImages(query) {
  core('image/search', query, "GET")
    .done(function(json) {
      var parent = document.querySelector('#parent');
      removeAllChildren(parent);
      appendCards(parent, json);
    }).fail(function(err) {
      console.error(err);
      // TODO: サーバー安定したら削除
      var parent = document.querySelector('#parent');
      removeAllChildren(parent);
      appendCards(parent, ['http://e-village.main.jp/gazou/image_gazou/shun_0009.jpg', 'http://e-village.main.jp/gazou/image_gazou/shun_0008.jpg']);
    });
}

/**
 * Core of API
 */
function core(path, query, method) {
  var url = generateUrl(path, query);
  return $.get(url)
}

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
    child.src = children[i]["url"];
    child.dataset.clipboardText = children[i]["url"];
    child.setAttribute('tabindex', 0);

    parent.appendChild(child);
  }
}

/**
 * Generate full url
 */
function generateUrl(path, query) {
  return ENTRY_POINT + '/' + path + '?' + Object.keys(query).map(function(key){
      return key + '=' + encodeURIComponent(query[key]);
    }).join('&');
}

/**
 * Clear all elements of parent
 */
function removeAllChildren(parent) {
  parent.innerHTML = '';
}
