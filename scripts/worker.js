/* global requestFileSystemSync, TEMPORARY */

(function(global) {
	'use strict';

	//--------------------------------------------------------------------------
	// Initialize

	function Worker() {
		this.setupWorker();
	}

	Worker.prototype.setupWorker = function() {
		global.addEventListener('message', this.onMessage.bind(this), false);
		global.requestFileSystemSync = global.webkitRequestFileSystemSync ||
			global.requestFileSystemSync;
	};

	//--------------------------------------------------------------------------
	// Listener

	Worker.prototype.onMessage = function(ev) {
		console.log(ev.data.url);
		this.pGetFileEntry(ev.data.url)
			.catch(this.pWriteFile(ev.data.url))
			.then(this.pipeSuccessMessage(ev.data.url, ev.data.tabId))
			.catch(this.pipeErrorMessage(ev.data.url, ev.data.tabId));
	};

	//--------------------------------------------------------------------------
	// Pipe

	Worker.prototype.pipeSuccessMessage = function(url, tabId) {
		return function(file) {
			console.log('pipeSuccessMessage');
			global.postMessage({
				result: true,
				data: {
					objectUrl: URL.createObjectURL(file),
					proxiedUrl: url
				},
				tabId: tabId
			});
		};
	};

	Worker.prototype.pipeErrorMessage = function(url, tabId) {
		return function(err) {
			console.log('pipeErrorMessage');
			global.postMessage({
				result: false,
				data: err,
				tabId: tabId
			});
		};
	};

	//--------------------------------------------------------------------------
	// FileSystem API

	Worker.prototype.pGetFileEntry = function(url) {
		var filePath = encodeURIComponent(url);
		var fs = requestFileSystemSync(TEMPORARY, 1024 * 1024);
		return new Promise(function(resolve) {
			console.log('in promise of pGetFileEntry');
			var fileEntry = fs.root.getFile(filePath, {
				create: false
			});
			resolve(fileEntry.file());
		});
	};

	Worker.prototype.pWriteFile = function(url) {
		var filePath = encodeURIComponent(url);
		var fs = requestFileSystemSync(TEMPORARY, 1024 * 1024);
		return new Promise(function(resolve) {
			this.pFetchImageWithUrl(url)
				.then(function(blob) {
					console.log('in promise of pWriteFile');
					var fileEntry = fs.root.getFile(filePath, {
						create: true,
						exclusive: false
					});
					fileEntry.createWriter().write(blob);
					resolve(fileEntry.file());
				});
		}.bind(this));
	};

	//--------------------------------------------------------------------------
	// Fetch

	Worker.prototype.pFetchImageWithUrl = function(url) {
		return fetch(url)
			.then(function(res) {
				return res.blob();
			});
	};

	//--------------------------------------------------------------------------
	// Private

	global.worker = new Worker();
})(self);
