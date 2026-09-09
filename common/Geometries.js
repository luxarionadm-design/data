/**
 * Geometries.js
 * Geometry manager untuk editor (2D dan 3D)
 */

import { WARNING_ONCE, WARNING, ERROR, LOG, INFO } from './utils.js';

function Geometries() {

    const geometries = {};

    function register(name, geometry) {
        if (geometries[name]) {
            WARNING('Geometry already exists: ' + name);
        }
        geometries[name] = geometry;
        LOG('Geometry registered: ' + name);
        return geometries[name];
    }

    function get(name) {
        const geometry = geometries[name];
        if (!geometry) {
            WARNING_ONCE('Geometry not found: ' + name);
            return null;
        }
        return geometry;
    }

    function remove(name) {
        if (geometries[name]) {
            delete geometries[name];
            LOG('Geometry removed: ' + name);
        }
    }

    function update(name, data) {
        const geometry = geometries[name];
        if (!geometry) {
            WARNING('Cannot update: Geometry not found: ' + name);
            return;
        }
        Object.assign(geometry, data);
        LOG('Geometry updated: ' + name);
    }

    function exists(name) {
        return !!geometries[name];
    }

    function getAll() {
        return { ...geometries };
    }

    function clear() {
        const names = Object.keys(geometries);
        for (const name of names) {
            delete geometries[name];
        }
        LOG('All geometries cleared');
    }

    function getCount() {
        return Object.keys(geometries).length;
    }

    return {
        register,
        get,
        remove,
        update,
        exists,
        getAll,
        clear,
        getCount
    };
}

export { Geometries };
