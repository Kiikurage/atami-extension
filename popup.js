
/**********************************************************************
 * Common
 */

/**
 * Constants
 */
var ENTRY_POINT='http://atami.kikurage.xyz';

/**
 * Initialize
 */
window.addEventListener('load', function() {
  document.querySelector('#button').addEventListener('click', function() {
    var text = document.querySelector("#search").value;
    getImages({"q": text});
  });
}, false);

/**********************************************************************
 * API
 */

/**
 * GET /image/search With query
 */
function getImages(query) {
  core('image/search', query, "GET")
    .then(function(json) {
      var parent = document.querySelector('#parent');
      removeAllChildren(parent);
      appendCards(parent, json);
    }).catch(function(err) {
      console.error(err);
    });
}

/**
 * Core of API
 */
function core(path, query, method) {
  var url = generateUrl(path, query);
  return fetch(url)
    .then(function(response) {
      return response.json();
    })
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

    child.src = children[i];
    child.classList.add('stampImage');

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
