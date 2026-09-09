/**
 * BufferRenderer.js
 * Render buffer untuk text editor
 * Meniru pola WebGLBufferRenderer
 */

function BufferRenderer() {
    let mode = 'text';
    let info = { characters: 0, lines: 0, updates: 0 };

    function setMode(value) {
        mode = value;
    }

    function render(start, count) {
        // Render teks dari posisi start sebanyak count
        info.characters += count;
        info.updates++;
    }

    function renderLines(start, count) {
        // Render baris dari posisi start sebanyak count
        info.lines += count;
        info.updates++;
    }

    function renderSelection(start, end) {
        // Render selection dari start ke end
        info.updates++;
    }

    function getInfo() {
        return { ...info };
    }

    function resetInfo() {
        info = { characters: 0, lines: 0, updates: 0 };
    }

    return {
        setMode,
        render,
        renderLines,
        renderSelection,
        getInfo,
        resetInfo
    };
}

export { BufferRenderer };
