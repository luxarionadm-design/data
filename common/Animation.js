/**
 * Animation.js
 * Animation manager untuk text editor
 */

function Animation() {
    let context = null;
    let isAnimating = false;
    let animationLoop = null;
    let requestId = null;
    let frameCount = 0;
    let fps = 0;
    let lastFpsUpdate = 0;

    function onAnimationFrame(time) {
        requestId = context.requestAnimationFrame(onAnimationFrame);

        frameCount++;
        if (time - lastFpsUpdate > 1000) {
            fps = frameCount;
            frameCount = 0;
            lastFpsUpdate = time;
        }

        if (animationLoop) {
            animationLoop(time, fps);
        }
    }

    return {
        start: function() {
            if (isAnimating === true) return;
            if (animationLoop === null) return;
            if (context === null) context = window;

            requestId = context.requestAnimationFrame(onAnimationFrame);
            isAnimating = true;
        },

        stop: function() {
            if (context !== null) {
                context.cancelAnimationFrame(requestId);
            }
            isAnimating = false;
        },

        setAnimationLoop: function(callback) {
            animationLoop = callback;
        },

        setContext: function(value) {
            context = value;
        },

        getFPS: function() {
            return fps;
        },

        isAnimating: function() {
            return isAnimating;
        }
    };
}

export { Animation };
