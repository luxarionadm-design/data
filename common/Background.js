/**
 * Background.js
 * Background manager untuk text editor
 * Modular - dengan import yang dibutuhkan
 */

import { EventDispatcher } from './core/EventDispatcher.js';
import { ThemeManager } from './core/ThemeManager.js';
import { Cache } from './core/Cache.js';
import { Color } from './core/Color.js';
import { Image } from './core/Image.js';
import { Animation } from './Animation.js';
import { Capabilities } from './Capabilities.js';

function Background(options = {}) {
    const events = new EventDispatcher();
    const themeManager = options.themeManager || new ThemeManager();
    const cache = new Cache({
        maximumSize: 10,
        defaultTimeToLive: 3600000
    });
    const animation = Animation();
    const capabilities = Capabilities();

    const color = new Color(options.backgroundColor || '#1e1e1e');
    let backgroundImage = options.backgroundImage || null;
    let backgroundOpacity = options.backgroundOpacity || 1;
    let isTransparent = options.isTransparent || false;
    let isReady = false;

    let currentBackground = null;
    let currentBackgroundVersion = 0;

    function initialize() {
        isReady = true;
        applyBackground();
        events.emit('initialized', {
            color: color.getHexString(),
            image: backgroundImage,
            opacity: backgroundOpacity
        });
    }

    function setColor(value) {
        if (typeof value === 'string') {
            color.set(value);
        } else if (value instanceof Color) {
            color.copy(value);
        } else if (typeof value === 'object' && value.r !== undefined) {
            color.setRGB(value.r, value.g, value.b);
        }

        cache.set('backgroundColor', color.getHexString());
        applyBackground();
        events.emit('colorChanged', { color: color.getHexString() });
    }

    function setImage(image) {
        if (typeof image === 'string') {
            const imageObj = new Image(image);
            backgroundImage = imageObj;
        } else if (image instanceof Image) {
            backgroundImage = image;
        } else {
            backgroundImage = null;
        }

        cache.set('backgroundImage', backgroundImage ? backgroundImage.getSrc() : null);
        applyBackground();
        events.emit('imageChanged', { image: backgroundImage });
    }

    function setOpacity(value) {
        backgroundOpacity = Math.max(0, Math.min(1, value));
        cache.set('backgroundOpacity', backgroundOpacity);
        applyBackground();
        events.emit('opacityChanged', { opacity: backgroundOpacity });
    }

    function setTransparent(transparent) {
        isTransparent = transparent;
        cache.set('isTransparent', transparent);
        applyBackground();
        events.emit('transparentChanged', { transparent: isTransparent });
    }

    function applyBackground() {
        const style = document.documentElement.style;
        const colorString = color.getStyle();

        if (isTransparent) {
            style.backgroundColor = 'transparent';
            style.backgroundImage = 'none';
        } else if (backgroundImage) {
            style.backgroundColor = colorString;
            style.backgroundImage = `url(${backgroundImage.getSrc()})`;
            style.backgroundSize = 'cover';
            style.backgroundPosition = 'center';
        } else {
            style.backgroundColor = colorString;
            style.backgroundImage = 'none';
        }

        style.opacity = backgroundOpacity;

        currentBackground = colorString;
        currentBackgroundVersion++;
    }

    function getBackground() {
        return {
            color: color.getHexString(),
            colorObject: color,
            image: backgroundImage,
            imageSrc: backgroundImage ? backgroundImage.getSrc() : null,
            opacity: backgroundOpacity,
            transparent: isTransparent,
            isReady: isReady,
            version: currentBackgroundVersion
        };
    }

    function getColor() {
        return color;
    }

    function getColorHex() {
        return color.getHexString();
    }

    function getColorRGB() {
        return color.getRGB();
    }

    function getImage() {
        return backgroundImage;
    }

    function getImageSrc() {
        return backgroundImage ? backgroundImage.getSrc() : null;
    }

    function getOpacity() {
        return backgroundOpacity;
    }

    function isTransparentMode() {
        return isTransparent;
    }

    function loadFromCache() {
        const cachedColor = cache.get('backgroundColor');
        const cachedImage = cache.get('backgroundImage');
        const cachedOpacity = cache.get('backgroundOpacity');
        const cachedTransparent = cache.get('isTransparent');

        if (cachedColor) color.set(cachedColor);
        if (cachedImage) {
            const imageObj = new Image(cachedImage);
            backgroundImage = imageObj;
        }
        if (cachedOpacity !== undefined) backgroundOpacity = cachedOpacity;
        if (cachedTransparent !== undefined) isTransparent = cachedTransparent;

        applyBackground();
        events.emit('cacheLoaded', {
            color: color.getHexString(),
            image: backgroundImage,
            opacity: backgroundOpacity,
            transparent: isTransparent
        });
    }

    function syncWithTheme(themeName) {
        const theme = themeManager.getTheme(themeName);
        if (theme && theme.background) {
            color.set(theme.background);
            applyBackground();
            events.emit('themeSynced', { theme: themeName, color: color.getHexString() });
        }
    }

    function startAnimation() {
        animation.setAnimationLoop((time) => {
            // Background animation jika diperlukan
        });
        animation.start();
    }

    function stopAnimation() {
        animation.stop();
    }

    function on(eventType, listener) {
        events.on(eventType, listener);
        return this;
    }

    function off(eventType, listener) {
        events.off(eventType, listener);
        return this;
    }

    function dispose() {
        events.emit('disposed', {
            color: color.getHexString(),
            image: backgroundImage
        });
        events.clear();
        cache.clear();
        animation.stop();
        isReady = false;
    }

    initialize();

    return {
        setColor: setColor,
        setImage: setImage,
        setOpacity: setOpacity,
        setTransparent: setTransparent,
        getBackground: getBackground,
        getColor: getColor,
        getColorHex: getColorHex,
        getColorRGB: getColorRGB,
        getImage: getImage,
        getImageSrc: getImageSrc,
        getOpacity: getOpacity,
        isTransparentMode: isTransparentMode,
        loadFromCache: loadFromCache,
        syncWithTheme: syncWithTheme,
        startAnimation: startAnimation,
        stopAnimation: stopAnimation,
        on: on,
        off: off,
        dispose: dispose,
        isReady: isReady
    };
}

export { Background };
