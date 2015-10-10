/* global chrome Clipboard */
'use strict';

/**********************************************************************
 * Common
 */

(function(global) {

	function ContentScript() {
		this.$ = {}; //original DOM
		this._messageListeners = {};

		this.createBase()
			.then(this.setupListener.bind(this));
	}

	//--------------------------------------------------------------------------
	// Event Listener management

	ContentScript.prototype.setupListener = function() {
		window.addEventListener('keydown', this.onWindowKeyDown.bind(this));
		this.$.form.addEventListener('submit', this.onFormSubmit.bind(this));
		this.$.submit.addEventListener('click', this.onFormSubmit.bind(this));

		chrome.runtime.onMessage.addListener(this.onMessage.bind(this));

		this.addMessageListener('/image/search', this.onImageSearchMessage.bind(this));
		this.addMessageListener('/image/cache', this.onImageCacheMessage.bind(this));
	};

	ContentScript.prototype.onMessage = function(message) {
		var type = message.type,
			data = message.data,
			result = message.result,
			listener = this._messageListeners[type];

		console.log('message from background page: "%s"', type);
		if (!listener) return;

		listener(result, data);
	};

	ContentScript.prototype.addMessageListener = function(type, listener) {
		this._messageListeners[type] = listener;
	};

	ContentScript.prototype.onWindowKeyDown = function(ev) {
		if (ev.shiftKey && ev.keyCode === 68) {

			ev.preventDefault();

			this.$.originalFocusedElement = document.activeElement;

			var $base = this.$.base,
				$originalFocusedElement = this.$.originalFocusedElement,
				gcr = $originalFocusedElement.getBoundingClientRect(),
				top = $originalFocusedElement.offsetTop,
				left = $originalFocusedElement.offsetLeft,
				bottom = window.innerHeight - top,
				right = window.innerWidth - left;

			if (top > bottom) {
				$base.style.top = '';
				$base.style.bottom = bottom + gcr.height + 'px';
			} else {
				$base.style.top = top + gcr.height + 'px';
				$base.style.bottom = '';
			}

			if (left > right) {
				$base.style.left = '';
				$base.style.right = right + 'px';
			} else {
				$base.style.left = left + 'px';
				$base.style.right = '';
			}
			document.body.appendChild($base);
			this.$.search.focus();
			this.$.search.selectionStart = 0;
			this.$.search.selectionEnd = this.$.search.value.length;
		} else if (ev.keyCode === 27) {
			this.closeBase();
		}
	};

	ContentScript.prototype.onFormSubmit = function(ev) {
		var keywords = (this.$.keywords.value || '').split(',');
		ev.preventDefault();

		chrome.runtime.sendMessage({
			type: '/image/search',
			data: keywords
		});
	};

	ContentScript.prototype.onImageSearchMessage = function(result, data) {
		if (result) {
			this.$.container.innerHTML = '';
			this.appendItems(this.$.container, data);
		} else {
			console.error('Error in background page');
			console.error(data);
		}
	};

	ContentScript.prototype.requestImageCache = function(url) {
		chrome.runtime.sendMessage({
			type: '/image/cache',
			data: url
		});
	};

	ContentScript.prototype.onImageCacheMessage = function(result, data) {
		if (result) {
			var $img = document.getElementById(data.proxiedUrl);
			var xhr = new XMLHttpRequest();
			xhr.open('GET', data.objectUrl);
			xhr.responseType = 'blob';
			xhr.onload = function() {
				$img.src = URL.createObjectURL(xhr.response);
			};
			xhr.send();
		} else {
			console.error('Error in background page');
			console.error(data);
		}
	};

	//--------------------------------------------------------------------------
	// UI management

	ContentScript.prototype.createBase = function() {
		var self = this;
		return this.getTemplateHTML('/htmls/form.html')
			.then(convertHTML2DOM)
			.then(function($base) {
				self.$.base = $base;
				self.$.header = $base.querySelector('.header');
				self.$.search = $base.querySelector('.search');
				self.$.form = $base.querySelector('.form');
				self.$.submit = $base.querySelector('.submit');
				self.$.keywords = $base.querySelector('.search');
				self.$.container = $base.querySelector('.container');
			})
			.catch(function(err) {
				console.error(err);
			});
	};

	ContentScript.prototype.appendItems = function($parent, children) {
		var listener = function(ev) {
			this.$.originalFocusedElement.value = ev.target.dataset.url;
			this.closeBase();
		}.bind(this);

		for (var i = 0; i < children.length; i++) {
			var $child = document.createElement('img');

			$child.classList.add('stampImage');
			$child.id = children[i].url;
			$child.dataset.url = children[i].proxiedUrl;
			$child.dataset.clipboardText = children[i].proxiedUrl;
			$child.setAttribute('tabindex', 0);
			$child.addEventListener('click', listener);
			this.requestImageCache(children[i].url);

			$parent.appendChild($child);
		}

		new Clipboard('.stampImage');
		this.$.header.textContent = '検索結果：' + children.length + '件';
		if (children.length > 0) {
			$parent.firstElementChild.focus();
		}
	};

	ContentScript.prototype.closeBase = function() {
		this.$.originalFocusedElement.focus();
		this.$.base.remove();
	};

	ContentScript.prototype.getTemplateHTML = function(url) {
		return new Promise(function(resolve, reject) {
			var xhr = new XMLHttpRequest();
			xhr.open('GET', chrome.extension.getURL(url));
			xhr.onload = function() {
				resolve(xhr.responseText);
			};
			xhr.onerror = reject;
			xhr.send();
		});
	};

	function convertHTML2DOM(html) {
		var div = document.createElement('div');
		div.innerHTML = html;
		return div.firstElementChild;
	}

	global.atami = new ContentScript();
})(self);
