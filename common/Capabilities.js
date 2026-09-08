/**
 * Capabilities.js
 * Deteksi kemampuan browser untuk text editor
 */

function Capabilities() {

	let isChrome;
	let isFirefox;
	let isSafari;
	let isEdge;
	let isMobile;
	let supportsWorker;
	let supportsWebGL;
	let supportsServiceWorker;
	let supportsIndexedDB;
	let supportsLocalStorage;
	let supportsTouch;
	let supportsPointerEvents;
	let supportsClipboard;
	let supportsFileSystem;

	function detectBrowser() {
		const userAgent = navigator.userAgent;
		isChrome = /Chrome/.test(userAgent);
		isFirefox = /Firefox/.test(userAgent);
		isSafari = /Safari/.test(userAgent);
		isEdge = /Edge/.test(userAgent);
		isMobile = /Mobile/.test(userAgent);
	}

	function detectFeatures() {
		supportsWorker = typeof Worker !== 'undefined';
		supportsWebGL = checkWebGL();
		supportsServiceWorker = 'serviceWorker' in navigator;
		supportsIndexedDB = 'indexedDB' in window;
		supportsLocalStorage = checkLocalStorage();
		supportsTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
		supportsPointerEvents = 'PointerEvent' in window;
		supportsClipboard = 'clipboard' in navigator;
		supportsFileSystem = 'showDirectoryPicker' in window;
	}

	function checkWebGL() {
		try {
			const canvas = document.createElement('canvas');
			return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
		} catch {
			return false;
		}
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

	function getBrowserName() {
		if (isChrome) return 'Chrome';
		if (isFirefox) return 'Firefox';
		if (isSafari) return 'Safari';
		if (isEdge) return 'Edge';
		return 'Unknown';
	}

	function getCapabilities() {
		return {
			browser: getBrowserName(),
			isMobile: isMobile,
			supportsWorker: supportsWorker,
			supportsWebGL: supportsWebGL,
			supportsServiceWorker: supportsServiceWorker,
			supportsIndexedDB: supportsIndexedDB,
			supportsLocalStorage: supportsLocalStorage,
			supportsTouch: supportsTouch,
			supportsPointerEvents: supportsPointerEvents,
			supportsClipboard: supportsClipboard,
			supportsFileSystem: supportsFileSystem
		};
	}

	detectBrowser();
	detectFeatures();

	return {
		getBrowserName: getBrowserName,
		getCapabilities: getCapabilities,
		checkWebGL: checkWebGL,
		checkLocalStorage: checkLocalStorage,
		isChrome: isChrome,
		isFirefox: isFirefox,
		isSafari: isSafari,
		isEdge: isEdge,
		isMobile: isMobile,
		supportsWorker: supportsWorker,
		supportsWebGL: supportsWebGL,
		supportsServiceWorker: supportsServiceWorker,
		supportsIndexedDB: supportsIndexedDB,
		supportsLocalStorage: supportsLocalStorage,
		supportsTouch: supportsTouch,
		supportsPointerEvents: supportsPointerEvents,
		supportsClipboard: supportsClipboard,
		supportsFileSystem: supportsFileSystem
	};

}

export { Capabilities };
