console.log("Hello World from background.js");

var ENTRY_POINT = 'http://atami.kikurage.xyz';

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	getImages(request.q)
		.then(function(json) {
			chrome.tabs.sendMessage(sender.tab.id, json);
		})
		.catch(function(err) {
			sendResponse({
				farewell: err
			});
			console.error(err);
		});
});

/**********************************************************************
 * API
 */

/**
 * GET /image/search With query
 */
function getImages(query) {
	return core('image/search', query, "GET")
		.then(function(json) {
			return json;
		});
}

/**
 * Core of API
 */
function core(path, query, method) {
	var url = generateUrl(path, {
		q: query
	});
	return fetch(url).then(function(res) {
		return res.json();
	})
}

/**
 * Generate full url
 */
function generateUrl(path, query) {
	return ENTRY_POINT + '/' + path + '?' + Object.keys(query).map(function(key) {
		return key + '=' + encodeURIComponent(query[key]);
	}).join('&');
}
