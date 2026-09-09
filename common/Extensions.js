/**
 * Extensions.js
 */

import { WARNING_ONCE } from './utils.js';

function Extensions() {

	const extensions = {};

	function getExtension(name) {

		if (extensions[name] !== undefined) {
			return extensions[name];
		}

		let extension = null;

		switch (name) {
			case 'CLIPBOARD':
				extension = 'clipboard' in navigator ? {} : null;
				break;
			case 'FILE_SYSTEM':
				extension = 'showDirectoryPicker' in window ? {} : null;
				break;
			case 'SERVICE_WORKER':
				extension = 'serviceWorker' in navigator ? {} : null;
				break;
			case 'INDEXED_DB':
				extension = 'indexedDB' in window ? {} : null;
				break;
			case 'LOCAL_STORAGE':
				extension = checkLocalStorage() ? {} : null;
				break;
			case 'WEB_WORKER':
				extension = typeof Worker !== 'undefined' ? {} : null;
				break;
			case 'TOUCH':
				extension = 'ontouchstart' in window ? {} : null;
				break;
			case 'POINTER_EVENTS':
				extension = 'PointerEvent' in window ? {} : null;
				break;
			default:
				extension = null;
		}

		extensions[name] = extension;
		return extension;
	}

	function checkLocalStorage() {
		try {
			localStorage.setItem('test', 'test');
			localStorage.removeItem('test');
			return true;
		} catch {
			return false;
		}
	}

	return {

		has: function(name) {
			return getExtension(name) !== null;
		},

		init: function() {
			getExtension('CLIPBOARD');
			getExtension('FILE_SYSTEM');
			getExtension('SERVICE_WORKER');
			getExtension('INDEXED_DB');
			getExtension('LOCAL_STORAGE');
			getExtension('WEB_WORKER');
			getExtension('TOUCH');
			getExtension('POINTER_EVENTS');
		},

		get: function(name) {
			const extension = getExtension(name);

			if (extension === null) {
				WARNING_ONCE('Extensions: ' + name + ' not supported.');
			}

			return extension;
		}

	};

}

export { Extensions };
