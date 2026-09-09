/**
 * Info.js
 * Info/statistics tracker untuk editor
 */

import { ERROR } from './utils.js';

function Info() {

    const memory = {
        characters: 0,
        lines: 0,
        files: 0,
        plugins: 0,
        themes: 0
    };

    const render = {
        frame: 0,
        updates: 0,
        characters: 0,
        lines: 0,
        selections: 0,
        highlights: 0
    };

    function update(type, count = 1) {
        render.updates++;

        switch (type) {
            case 'character':
                render.characters += count;
                break;
            case 'line':
                render.lines += count;
                break;
            case 'selection':
                render.selections += count;
                break;
            case 'highlight':
                render.highlights += count;
                break;
            default:
                ERROR('Info: Unknown update type:', type);
                break;
        }
    }

    function reset() {
        render.updates = 0;
        render.characters = 0;
        render.lines = 0;
        render.selections = 0;
        render.highlights = 0;
    }

    function incrementMemory(type, count = 1) {
        if (memory[type] !== undefined) {
            memory[type] += count;
        }
    }

    function decrementMemory(type, count = 1) {
        if (memory[type] !== undefined) {
            memory[type] = Math.max(0, memory[type] - count);
        }
    }

    function getMemory() {
        return { ...memory };
    }

    function getRender() {
        return { ...render };
    }

    function getFrame() {
        return render.frame;
    }

    function incrementFrame() {
        render.frame++;
    }

    return {
        memory,
        render,
        update,
        reset,
        incrementMemory,
        decrementMemory,
        getMemory,
        getRender,
        getFrame,
        incrementFrame
    };
}

export { Info };
