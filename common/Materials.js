/**
 * Materials.js
 * Material manager dengan shader support
 */

import { Color } from './Color.js';
import { Vector2 } from './Vector2.js';
import { Vector3 } from './Vector3.js';
import { Matrix4 } from './Matrix4.js';
import { ShaderLib } from './ShaderLib.js';
import { UniformsUtils } from './UniformsUtils.js';
import { WARNING_ONCE, WARNING, ERROR, LOG, INFO } from './utils.js';

function Materials() {

    const materials = {};
    const materialProperties = {};
    let version = 0;

    // Material types dengan shader yang sesuai
    const MATERIAL_TYPES = {
        BASIC: 'basic',
        LAMBERT: 'lambert',
        PHONG: 'phong',
        STANDARD: 'standard',
        PHYSICAL: 'physical',
        TOON: 'toon',
        MATCAP: 'matcap',
        DEPTH: 'depth',
        NORMAL: 'normal',
        DISTANCE: 'distance',
        LINE: 'line',
        DASHED: 'dashed',
        POINTS: 'points',
        SPRITE: 'sprite',
        SHADOW: 'shadow',
        SHADER: 'shader',
        CUSTOM: 'custom'
    };

    // Shader mapping
    const SHADER_MAP = {
        'basic': 'basic',
        'lambert': 'lambert',
        'phong': 'phong',
        'standard': 'standard',
        'physical': 'physical',
        'toon': 'toon',
        'matcap': 'matcap',
        'depth': 'depth',
        'normal': 'normal',
        'distance': 'distance',
        'line': 'line',
        'dashed': 'dashed',
        'points': 'points',
        'sprite': 'sprite',
        'shadow': 'shadow'
    };

    function register(name, material) {
        if (materials[name]) {
            WARNING('Material already exists: ' + name);
        }

        const shaderName = SHADER_MAP[material.type] || 'basic';
        const shader = ShaderLib[shaderName];

        materials[name] = {
            type: material.type || MATERIAL_TYPES.BASIC,
            shader: shader,
            color: material.color || new Color('#ffffff'),
            opacity: material.opacity || 1.0,
            transparent: material.transparent || false,
            emissive: material.emissive || new Color('#000000'),
            emissiveIntensity: material.emissiveIntensity || 0,
            roughness: material.roughness || 0.5,
            metalness: material.metalness || 0,
            shininess: material.shininess || 30,
            side: material.side || 'front',
            wireframe: material.wireframe || false,
            map: material.map || null,
            alphaMap: material.alphaMap || null,
            bumpMap: material.bumpMap || null,
            bumpScale: material.bumpScale || 1,
            normalMap: material.normalMap || null,
            normalScale: material.normalScale || new Vector2(1, 1),
            envMap: material.envMap || null,
            envMapIntensity: material.envMapIntensity || 1,
            lightMap: material.lightMap || null,
            lightMapIntensity: material.lightMapIntensity || 1,
            aoMap: material.aoMap || null,
            aoMapIntensity: material.aoMapIntensity || 1,
            specular: material.specular || new Color('#111111'),
            specularMap: material.specularMap || null,
            roughnessMap: material.roughnessMap || null,
            metalnessMap: material.metalnessMap || null,
            emissiveMap: material.emissiveMap || null,
            displacementMap: material.displacementMap || null,
            displacementScale: material.displacementScale || 1,
            displacementBias: material.displacementBias || 0,
            alphaTest: material.alphaTest || 0,
            depthTest: material.depthTest !== false,
            depthWrite: material.depthWrite !== false,
            fog: material.fog !== false,
            uniforms: material.uniforms || {},
            vertexShader: material.vertexShader || (shader ? shader.vertexShader : null),
            fragmentShader: material.fragmentShader || (shader ? shader.fragmentShader : null),
            attributes: material.attributes || {},
            defines: material.defines || {},
            extensions: material.extensions || {},
            clippingPlanes: material.clippingPlanes || [],
            clipIntersection: material.clipIntersection || false,
            clipShadows: material.clipShadows || false,
            shadowSide: material.shadowSide || null,
            toneMapped: material.toneMapped !== false,
            userData: material.userData || {},
            version: 0
        };

        version++;
        LOG('Material registered: ' + name + ' (shader: ' + shaderName + ')');
        return materials[name];
    }

    function get(name) {
        const material = materials[name];
        if (!material) {
            WARNING_ONCE('Material not found: ' + name);
            return null;
        }
        return material;
    }

    function remove(name) {
        if (materials[name]) {
            delete materials[name];
            delete materialProperties[name];
            version++;
            LOG('Material removed: ' + name);
        }
    }

    function update(name, data) {
        const material = materials[name];
        if (!material) {
            WARNING('Cannot update: Material not found: ' + name);
            return;
        }
        Object.assign(material, data);
        material.version++;
        version++;
        LOG('Material updated: ' + name);
    }

    function updateUniform(name, uniformName, value) {
        const material = materials[name];
        if (!material) {
            WARNING('Material not found: ' + name);
            return;
        }
        if (!material.uniforms) {
            material.uniforms = {};
        }
        material.uniforms[uniformName] = { value: value };
        material.version++;
        version++;
    }

    function getShader(name) {
        const material = materials[name];
        if (!material) {
            return null;
        }
        return material.shader || null;
    }

    function getVertexShader(name) {
        const material = materials[name];
        if (!material) {
            return null;
        }
        return material.vertexShader || null;
    }

    function getFragmentShader(name) {
        const material = materials[name];
        if (!material) {
            return null;
        }
        return material.fragmentShader || null;
    }

    function setShader(name, shader) {
        const material = materials[name];
        if (!material) {
            WARNING('Material not found: ' + name);
            return;
        }
        material.shader = shader;
        material.vertexShader = shader ? shader.vertexShader : null;
        material.fragmentShader = shader ? shader.fragmentShader : null;
        material.version++;
        version++;
    }

    function setCustomShader(name, vertexShader, fragmentShader) {
        const material = materials[name];
        if (!material) {
            WARNING('Material not found: ' + name);
            return;
        }
        material.type = MATERIAL_TYPES.SHADER;
        material.vertexShader = vertexShader;
        material.fragmentShader = fragmentShader;
        material.shader = null;
        material.version++;
        version++;
        LOG('Custom shader set for: ' + name);
    }

    function setProperty(name, property, value) {
        const material = materials[name];
        if (!material) {
            WARNING('Material not found: ' + name);
            return;
        }
        material[property] = value;
        material.version++;
        version++;
    }

    function getProperty(name, property) {
        const material = materials[name];
        if (!material) {
            return null;
        }
        return material[property];
    }

    function getUniforms(name) {
        const material = materials[name];
        if (!material) {
            return null;
        }
        return material.uniforms || {};
    }

    function getColor(name) {
        const material = materials[name];
        if (!material) {
            return null;
        }
        return material.color;
    }

    function setColor(name, color) {
        const material = materials[name];
        if (!material) {
            WARNING('Material not found: ' + name);
            return;
        }
        if (typeof color === 'string') {
            material.color.set(color);
        } else if (color instanceof Color) {
            material.color = color;
        }
        material.version++;
        version++;
    }

    function setOpacity(name, opacity) {
        const material = materials[name];
        if (!material) {
            WARNING('Material not found: ' + name);
            return;
        }
        material.opacity = Math.max(0, Math.min(1, opacity));
        material.transparent = material.opacity < 1;
        material.version++;
        version++;
    }

    function setMap(name, map) {
        const material = materials[name];
        if (!material) {
            WARNING('Material not found: ' + name);
            return;
        }
        material.map = map;
        material.version++;
        version++;
    }

    function getAll() {
        return { ...materials };
    }

    function getByType(type) {
        const result = {};
        for (const name in materials) {
            if (materials[name].type === type) {
                result[name] = materials[name];
            }
        }
        return result;
    }

    function getVersion() {
        return version;
    }

    function getMaterialVersion(name) {
        const material = materials[name];
        if (!material) {
            return -1;
        }
        return material.version;
    }

    function needsUpdate(name) {
        const material = materials[name];
        if (!material) {
            return false;
        }
        const props = materialProperties[name];
        if (!props) {
            return true;
        }
        return props.version !== material.version;
    }

    function clear() {
        for (const name in materials) {
            delete materials[name];
            delete materialProperties[name];
        }
        version++;
        LOG('All materials cleared');
    }

    function getCount() {
        return Object.keys(materials).length;
    }

    return {
        MATERIAL_TYPES,
        SHADER_MAP,
        register,
        get,
        remove,
        update,
        updateUniform,
        getShader,
        getVertexShader,
        getFragmentShader,
        setShader,
        setCustomShader,
        setProperty,
        getProperty,
        getUniforms,
        getColor,
        setColor,
        setOpacity,
        setMap,
        getAll,
        getByType,
        getVersion,
        getMaterialVersion,
        needsUpdate,
        clear,
        getCount
    };
}

export { Materials };
