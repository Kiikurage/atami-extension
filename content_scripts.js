/* global $ chrome Clipboard */
'use strict';

/**********************************************************************
 * Common
 */

/**
 * Constants
 */
var $base = null,
	$search = null;
var focusedElement = null;


function init() {
	window.addEventListener('keydown', function(ev) {
		if (ev.shiftKey) {
			if (ev.keyCode !== 68) return;
			ev.preventDefault();

			focusedElement = document.activeElement;

			var $focusedElement = $(document.activeElement),
				offset = $focusedElement.offset(),
				top = offset.top,
				left = offset.left,
				bottom = window.innerHeight - top,
				right = window.innerWidth - left;

			if (top > bottom) {
				$base.css({
					'top': '',
					'bottom': bottom + $focusedElement.height()
				});
			} else {
				$base.css({
					'top': top + $focusedElement.height(),
					'bottom': ''
				});
			}

			if (left > right) {
				$base.css({
					'left': '',
					'right': right
				});
			} else {
				$base.css({
					'left': left,
					'right': ''
				});
			}
			$base.appendTo(document.body);
			$search.focus();
			setupListener();
		}
	}, false);
	loadHTML();
}

function loadHTML() {
	$.get(chrome.extension.getURL('form.html'))
		.done(function(html) {
			$base = $(html);
			$search = $base.find('#atami-search');
		});
}

function setupListener() {
	new Clipboard('.stampImage');

	document.querySelector('#atami-form').addEventListener('submit', function(ev) {
		var text = document.querySelector('#atami-search').value;
		ev.preventDefault();

		chrome.runtime.sendMessage({
			'q': text
		});
	});
}

chrome.runtime.onMessage.addListener(function(json) {
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
	var listener = function() {
		focusedElement.value = this.src;
		focusedElement.focus();
		$base.remove();
	};

	for (var i = 0; i < children.length; i++) {
		var child = document.createElement('img');

		child.classList.add('stampImage');
		child.src = children[i].proxiedUrl;
		child.dataset.clipboardText = children[i].proxiedUrl;
		child.setAttribute('tabindex', 0);
		child.addEventListener('click', listener);

		parent.appendChild(child);
	}
}

/**
 * Clear all elements of parent
 */
function removeAllChildren(parent) {
	parent.innerHTML = '';
}
