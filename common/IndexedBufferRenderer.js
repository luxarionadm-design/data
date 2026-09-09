/**
 * IndexedBufferRenderer.js
 * Indexed buffer renderer untuk editor
 */

import { WARNING } from './utils.js';

function IndexedBufferRenderer() {

    let mode = 'triangles';
    let indexData = null;
    let bytesPerElement = 2;

    function setMode(value) {
        mode = value;
    }

    function setIndex(value) {
        if (value && value.data) {
            indexData = value.data;
            bytesPerElement = value.bytesPerElement || 2;
        } else {
            indexData = value;
        }
    }

    function render(start, count) {
        // Render menggunakan indeks
        if (!indexData) {
            WARNING('No index data set');
            return;
        }

        const indices = indexData.slice(start, start + count);
        // Render indices ke layar
        console.log('Render indices:', indices);
    }

    function renderInstances(start, count, instanceCount) {
        if (instanceCount === 0) return;
        if (!indexData) {
            WARNING('No index data set');
            return;
        }

        const indices = indexData.slice(start, start + count);
        // Render dengan instancing
        console.log('Render instances:', indices, instanceCount);
    }

    function renderMultiDraw(starts, counts, drawCount) {
        if (drawCount === 0) return;
        if (!indexData) {
            WARNING('No index data set');
            return;
        }

        for (let i = 0; i < drawCount; i++) {
            const start = starts[i];
            const count = counts[i];
            const indices = indexData.slice(start, start + count);
            console.log('Multi draw:', indices);
        }
    }

    function getIndexData() {
        return indexData;
    }

    function getMode() {
        return mode;
    }

    function getBytesPerElement() {
        return bytesPerElement;
    }

    return {
        setMode,
        setIndex,
        render,
        renderInstances,
        renderMultiDraw,
        getIndexData,
        getMode,
        getBytesPerElement
    };
}

export { IndexedBufferRenderer };
