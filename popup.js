
/**
 * Constants
 */
var ENTRY_POINT='http://atami.kikurage.xyz';

/**
 * Initialize
 */
window.addEventListener('load', function() {
  document.querySelector('#button').onclick = function() {
    getImages({"q": "keyword"});
  };
}, false);

/**
 * GET /image/serch With query
 */
function getImages(query) {
  core('image/search', query, "GET", function(images, error) {
    var parent = document.querySelector('#parent');
    removeAllChildren(parent);

    for (var i = 0; i < images.length; i++) {
      var child = document.createElement('img');

      child.src = images[i];
      child.classList.add('stampImage');

      parent.appendChild(child);
    }
  });
}

/**
 * Core of API
 */
function core(path, query, method, callback) {
  var url = generateUrl(path, query);

  // TODO: fetchの実装

  callback(["http://e-village.main.jp/gazou/image_gazou/shun_0009.jpg", "http://e-village.main.jp/gazou/image_gazou/shun_0008.jpg"], null);
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
