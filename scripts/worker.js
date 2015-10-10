/* global requestFileSystemSync, TEMPORARY */

(function(global) {
	'use strict';

	//--------------------------------------------------------------------------
	// Initialize
	var CACHE_SIZE = 50 * 1024 * 1024; //50MB

	function Worker() {
		this.setupWorker();
	}

	Worker.prototype.setupWorker = function() {
		global.addEventListener('message', this.onMessage.bind(this), false);
		global.requestFileSystemSync = global.webkitRequestFileSystemSync ||
			global.requestFileSystemSync;
		this.fs = requestFileSystemSync(TEMPORARY, CACHE_SIZE);
	};

	//--------------------------------------------------------------------------
	// Listener

	Worker.prototype.onMessage = function(ev) {
		var url = ev.data.url;

		console.log(url);

		this.pFindOrCreateCache(url)
			.then(this.formatResponseData.bind(this, url))
			.then(this.pipeSuccessMessage.bind(this, url, ev.data.tabId))
			.catch(this.pipeErrorMessage.bind(this, url, ev.data.tabId));
	};

	//--------------------------------------------------------------------------
	// Pipe

	Worker.prototype.pipeSuccessMessage = function(url, tabId, data) {
		console.log('pipeSuccessMessage');
		global.postMessage({
			result: true,
			data: data,
			tabId: tabId
		});
	};

	Worker.prototype.pipeErrorMessage = function(url, tabId, err) {
		console.log('pipeErrorMessage');
		global.postMessage({
			result: false,
			data: err,
			tabId: tabId
		});
	};

	Worker.prototype.formatResponseData = function(url, blob) {
		return {
			objectUrl: URL.createObjectURL(blob),
			proxiedUrl: url
		};
	};

	//--------------------------------------------------------------------------
	// FileSystem API

	Worker.prototype.pFindOrCreateCache = function(url) {
		return this.pReadFile(url2filePath(url))
			.catch(this.pCreateCache.bind(this, url));
	};

	Worker.prototype.pReadFile = function(filePath) {
		var fs = this.fs;

		return new Promise(function(resolve) {
			var blob = fs.root
				.getFile(filePath, {
					create: false
				})
				.file();

			resolve(blob);
		});
	};

	Worker.prototype.pWriteFile = function(filePath, blob) {
		var fs = this.fs;

		return new Promise(function(resolve) {
			fs.root
				.getFile(filePath, {
					create: true,
					exclusive: false
				})
				.createWriter().write(blob);

			resolve(blob);
		});
	};

	Worker.prototype.pCreateCache = function(url) {
		return this.pFetchImageWithUrl(url)
			.then(this.pWriteFile.bind(this, url2filePath(url)));
	};

	//--------------------------------------------------------------------------
	// Fetch

	Worker.prototype.pFetchImageWithUrl = function(url) {
		return fetch(url).then(res2blob);
	};

	//--------------------------------------------------------------------------
	// Private

	function res2blob(res) {
		return res.blob();
	}

	function url2filePath(url) {
		return encodeURIComponent(url);
	}

	global.worker = new Worker();
})(self);
