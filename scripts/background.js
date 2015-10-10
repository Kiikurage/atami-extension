/* global chrome */

(function(global) {
	'use strict';

	var ENTRY_POINT = 'http://atami.kikurage.xyz';

	//--------------------------------------------------------------------------
	// general setup

	function BackgroundPage() {
		this._messageListeners = null;
		this._worker = null;
		this.setupListener();
	}

	BackgroundPage.prototype.setupListener = function() {
		this._messageListeners = {};
		this._worker = new Worker('/scripts/worker.js');
		chrome.runtime.onMessage.addListener(this.onMessage.bind(this));
		this.addMessageListener('/image/search', this.onImageSearchMessage.bind(this));
		this.addMessageListener('/image/cache', this.onImageCacheMessage.bind(this));
		this._worker.addEventListener('message', this.onMessageFromWoker.bind(this));
	};

	//--------------------------------------------------------------------------
	// Handle messages from/to content scripts

	BackgroundPage.prototype.onMessage = function(req, sender, res) {
		var type = req.type,
			data = req.data,
			listener = this._messageListeners[type];

		console.log('message from content script: "%s"', type);
		if (!listener) return res(null);

		listener(sender.tab.id, data, res);
	};

	BackgroundPage.prototype.onMessageFromWoker = function(ev) {
		var result = ev.data.result,
			data = ev.data.data,
			tabId = ev.data.tabId;

		console.log('message from worker.js');
		console.log(data);
		chrome.tabs.sendMessage(tabId, {
			type: '/image/cache',
			result: result,
			data: data
		});
	};

	BackgroundPage.prototype.addMessageListener = function(type, listener) {
		this._messageListeners[type] = listener;
	};

	//--------------------------------------------------------------------------
	// Pipe

	BackgroundPage.prototype.pipeSuccessMessage = function(type, tabId) {
		return function(data) {
			chrome.tabs.sendMessage(tabId, {
				type: type,
				result: true,
				data: data
			});
		};
	};

	BackgroundPage.prototype.pipeErrorMessage = function(type, tabId) {
		return function(err) {
			chrome.tabs.sendMessage(tabId, {
				type: type,
				result: false,
				data: err
			});
		};
	};

	//--------------------------------------------------------------------------
	// Request cache of image

	BackgroundPage.prototype.onImageCacheMessage = function(tabId, url) {
		this._worker.postMessage({
			url: url,
			tabId: tabId
		});
	};

	//--------------------------------------------------------------------------
	// GET /image/search

	BackgroundPage.prototype.onImageSearchMessage = function(tabId, keywords) {
		this.pSearchImageWithKeywords(keywords)
			.then(this.pipeSuccessMessage('/image/search', tabId))
			.catch(this.pipeErrorMessage('/image/search', tabId));
	};

	BackgroundPage.prototype.pSearchImageWithKeywords = function(keywords) {
		return fetch(ENTRY_POINT + '/image/search?' + encodeURLParameter({
				q: keywords
			}))
			.then(function(res) {
				return res.json();
			});
	};

	function encodeURLParameter(params) {
		return Object.keys(params).map(function(key) {
			return key + '=' + encodeURIComponent(params[key]);
		}).join('&');
	}

	global.BackgroundPage = new BackgroundPage();
})(self);
