/**
 * Lights.js
 * Light manager untuk editor (2D dan 3D)
 */

import { Color } from './Color.js';
import { Vector2 } from './Vector2.js';
import { Vector3 } from './Vector3.js';
import { Matrix4 } from './Matrix4.js';
import { WARNING_ONCE, WARNING, ERROR, LOG, INFO } from './utils.js';

function Lights() {

    const lights = {};
    const cache = {};
    let version = 0;

    // Light types
    const LIGHT_TYPES = {
        AMBIENT: 'ambient',
        DIRECTIONAL: 'directional',
        SPOT: 'spot',
        POINT: 'point',
        RECT_AREA: 'rectArea',
        HEMISPHERE: 'hemisphere'
    };

    function register(name, light) {
        if (lights[name]) {
            WARNING('Light already exists: ' + name);
        }
        lights[name] = {
            type: light.type || LIGHT_TYPES.AMBIENT,
            color: light.color || new Color('#ffffff'),
            intensity: light.intensity || 1.0,
            position: light.position || new Vector3(0, 0, 0),
            direction: light.direction || new Vector3(0, -1, 0),
            distance: light.distance || 0,
            angle: light.angle || Math.PI / 4,
            penumbra: light.penumbra || 0,
            decay: light.decay || 2,
            castShadow: light.castShadow || false,
            shadow: light.shadow || null,
            target: light.target || null,
            map: light.map || null,
            width: light.width || 0,
            height: light.height || 0,
            groundColor: light.groundColor || new Color('#000000'),
            enabled: light.enabled !== false
        };
        version++;
        LOG('Light registered: ' + name);
        return lights[name];
    }

    function get(name) {
        const light = lights[name];
        if (!light) {
            WARNING_ONCE('Light not found: ' + name);
            return null;
        }
        return light;
    }

    function remove(name) {
        if (lights[name]) {
            delete lights[name];
            delete cache[name];
            version++;
            LOG('Light removed: ' + name);
        }
    }

    function update(name, data) {
        const light = lights[name];
        if (!light) {
            WARNING('Cannot update: Light not found: ' + name);
            return;
        }
        Object.assign(light, data);
        version++;
        LOG('Light updated: ' + name);
    }

    function enable(name) {
        const light = lights[name];
        if (light) {
            light.enabled = true;
            version++;
        }
    }

    function disable(name) {
        const light = lights[name];
        if (light) {
            light.enabled = false;
            version++;
        }
    }

    function toggle(name) {
        const light = lights[name];
        if (light) {
            light.enabled = !light.enabled;
            version++;
        }
    }

    function getAll() {
        return { ...lights };
    }

    function getEnabled() {
        const enabled = {};
        for (const name in lights) {
            if (lights[name].enabled) {
                enabled[name] = lights[name];
            }
        }
        return enabled;
    }

    function getByType(type) {
        const result = {};
        for (const name in lights) {
            if (lights[name].type === type) {
                result[name] = lights[name];
            }
        }
        return result;
    }

    function getVersion() {
        return version;
    }

    function clear() {
        for (const name in lights) {
            delete lights[name];
            delete cache[name];
        }
        version++;
        LOG('All lights cleared');
    }

    function getCount() {
        return Object.keys(lights).length;
    }

    function getEnabledCount() {
        let count = 0;
        for (const name in lights) {
            if (lights[name].enabled) count++;
        }
        return count;
    }

    function getCache(name) {
        return cache[name] || null;
    }

    function setCache(name, data) {
        cache[name] = data;
    }

    return {
        LIGHT_TYPES,
        register,
        get,
        remove,
        update,
        enable,
        disable,
        toggle,
        getAll,
        getEnabled,
        getByType,
        getVersion,
        clear,
        getCount,
        getEnabledCount,
        getCache,
        setCache
    };
}

export { Lights };
