/**
 * Properties.js
 * Properties manager untuk editor
 * Menggunakan private __ (double underscore)
 */

function Properties() {
    // PRIVATE - Tidak bisa diakses dari luar
    let __properties = new WeakMap();

    function __has(object) {
        return __properties.has(object);
    }

    function __get(object) {
        let map = __properties.get(object);
        if (map === undefined) {
            map = {};
            __properties.set(object, map);
        }
        return map;
    }

    function __remove(object) {
        __properties.delete(object);
    }

    function __update(object, key, value) {
        const map = __properties.get(object);
        if (map) {
            map[key] = value;
        }
    }

    function __getValue(object, key) {
        const map = __properties.get(object);
        if (map) {
            return map[key];
        }
        return undefined;
    }

    function __getAll(object) {
        const map = __properties.get(object);
        return map ? { ...map } : {};
    }

    function __setAll(object, data) {
        let map = __properties.get(object);
        if (map === undefined) {
            map = {};
            __properties.set(object, map);
        }
        Object.assign(map, data);
    }

    function __clear(object) {
        const map = __properties.get(object);
        if (map) {
            for (const key in map) {
                delete map[key];
            }
        }
    }

    function __dispose() {
        __properties = new WeakMap();
    }

    // PUBLIC - Yang bisa diakses dari luar
    return {
        has: __has,
        get: __get,
        remove: __remove,
        update: __update,
        getValue: __getValue,
        getAll: __getAll,
        setAll: __setAll,
        clear: __clear,
        dispose: __dispose
    };
}

export { Properties };
