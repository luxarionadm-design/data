/**
 * Output.js
 * Output manager untuk editor
 * Menggunakan private __ (double underscore)
 */

import {
    NoToneMapping,
    LinearToneMapping,
    ReinhardToneMapping,
    CineonToneMapping,
    ACESFilmicToneMapping,
    AgXToneMapping,
    NeutralToneMapping,
    CustomToneMapping,
    SRGBTransfer,
    HalfFloatType
} from './constants.js';

import { BufferGeometry } from './core/BufferGeometry.js';
import { Float32BufferAttribute } from './core/BufferAttribute.js';
import { RawShaderMaterial } from './materials/RawShaderMaterial.js';
import { Mesh } from './objects/Mesh.js';
import { OrthographicCamera } from './cameras/OrthographicCamera.js';
import { WebGLRenderTarget } from './WebGLRenderTarget.js';
import { ColorSpace } from './math/ColorSpace.js';

import { WARNING_ONCE, WARNING, ERROR, LOG, INFO } from './utils.js';

const __toneMappingMap = {
    [NoToneMapping]: 'NO_TONE_MAPPING',
    [LinearToneMapping]: 'LINEAR_TONE_MAPPING',
    [ReinhardToneMapping]: 'REINHARD_TONE_MAPPING',
    [CineonToneMapping]: 'CINEON_TONE_MAPPING',
    [ACESFilmicToneMapping]: 'ACES_FILMIC_TONE_MAPPING',
    [AgXToneMapping]: 'AGX_TONE_MAPPING',
    [NeutralToneMapping]: 'NEUTRAL_TONE_MAPPING',
    [CustomToneMapping]: 'CUSTOM_TONE_MAPPING'
};

function Output(type, width, height, antialias, depth, stencil) {

    const __targetScene = new WebGLRenderTarget(width, height, {
        type: type,
        depthBuffer: depth,
        stencilBuffer: stencil,
        samples: antialias ? 4 : 0,
        storeMultisampledDepthBuffer: false,
        storeMultisampledStencilBuffer: false,
        resolveDepthBuffer: false,
        resolveStencilBuffer: false
    });

    let __targetA = null;
    let __targetB = null;

    const __geometry = new BufferGeometry();
    __geometry.setAttribute('position', new Float32BufferAttribute([-1, 3, 0, -1, -1, 0, 3, -1, 0], 3));
    __geometry.setAttribute('uv', new Float32BufferAttribute([0, 2, 0, 0, 2, 0], 2));

    const __material = new RawShaderMaterial({
        uniforms: {
            tDiffuse: { value: null }
        },
        vertexShader: `
            precision highp float;
            uniform mat4 modelViewMatrix;
            uniform mat4 projectionMatrix;
            attribute vec3 position;
            attribute vec2 uv;
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            precision highp float;
            uniform sampler2D tDiffuse;
            varying vec2 vUv;

            #ifdef NO_TONE_MAPPING
                vec3 NoToneMapping(vec3 color) { return color; }
            #endif
            #ifdef LINEAR_TONE_MAPPING
                vec3 LinearToneMapping(vec3 color) { return clamp(color, 0.0, 1.0); }
            #endif
            #ifdef REINHARD_TONE_MAPPING
                vec3 ReinhardToneMapping(vec3 color) {
                    float luminance = 0.2126 * color.r + 0.7152 * color.g + 0.0722 * color.b;
                    float scale = (luminance + 1.0) / (luminance + 1.0);
                    return color * scale;
                }
            #endif

            void main() {
                gl_FragColor = texture2D(tDiffuse, vUv);

                #ifdef LINEAR_TONE_MAPPING
                    gl_FragColor.rgb = LinearToneMapping(gl_FragColor.rgb);
                #endif
                #ifdef REINHARD_TONE_MAPPING
                    gl_FragColor.rgb = ReinhardToneMapping(gl_FragColor.rgb);
                #endif

                #ifdef SRGB_TRANSFER
                    gl_FragColor = sRGBTransferOETF(gl_FragColor);
                #endif
            }
        `,
        depthTest: false,
        depthWrite: false
    });

    const __mesh = new Mesh(__geometry, __material);
    const __camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

    let __outputColorSpace = null;
    let __outputToneMapping = null;
    let __isCompositing = false;
    let __savedToneMapping = null;
    let __savedRenderTarget = null;
    let __effects = [];
    let __hasRenderPass = false;

    function __setSize(width, height) {
        __targetScene.setSize(width, height);
        if (__targetA !== null) __targetA.setSize(width, height);
        if (__targetB !== null) __targetB.setSize(width, height);
        for (let i = 0; i < __effects.length; i++) {
            const effect = __effects[i];
            if (effect.setSize) effect.setSize(width, height);
        }
        LOG('Output size set: ' + width + 'x' + height);
    }

    function __setEffects(newEffects) {
        __effects = newEffects;
        __hasRenderPass = __effects.length > 0 && __effects[0].isRenderPass === true;

        const width = __targetScene.width;
        const height = __targetScene.height;

        if (__effects.length > 0 && __targetA === null) {
            __targetA = new WebGLRenderTarget(width, height, {
                type: HalfFloatType,
                depthBuffer: false,
                stencilBuffer: false
            });
            __targetB = new WebGLRenderTarget(width, height, {
                type: HalfFloatType,
                depthBuffer: false,
                stencilBuffer: false
            });
        }

        for (let i = 0; i < __effects.length; i++) {
            const effect = __effects[i];
            if (effect.setSize) effect.setSize(width, height);
        }
        LOG('Effects set: ' + __effects.length + ' effects');
    }

    function __begin(renderer, renderTarget) {
        if (__isCompositing) return false;
        if (renderer.toneMapping === NoToneMapping && __effects.length === 0) return false;

        __savedRenderTarget = renderTarget;

        if (renderTarget !== null) {
            const width = renderTarget.width;
            const height = renderTarget.height;
            if (__targetScene.width !== width || __targetScene.height !== height) {
                __setSize(width, height);
            }
        }

        if (__hasRenderPass === false) {
            renderer.setRenderTarget(__targetScene);
        }

        __savedToneMapping = renderer.toneMapping;
        renderer.toneMapping = NoToneMapping;

        __isCompositing = true;
        return true;
    }

    function __hasRenderPass() {
        return __hasRenderPass;
    }

    function __end(renderer, deltaTime) {
        renderer.toneMapping = __savedToneMapping;
        __isCompositing = true;

        let readBuffer = __targetScene;
        let writeBuffer = __targetA;

        for (let i = 0; i < __effects.length; i++) {
            const effect = __effects[i];
            if (effect.enabled === false) continue;
            effect.render(renderer, writeBuffer, readBuffer, deltaTime);
            if (effect.needsSwap !== false) {
                readBuffer = writeBuffer;
                writeBuffer = (writeBuffer === __targetA) ? __targetB : __targetA;
            }
        }

        if (__outputColorSpace !== renderer.outputColorSpace ||
            __outputToneMapping !== renderer.toneMapping) {
            __outputColorSpace = renderer.outputColorSpace;
            __outputToneMapping = renderer.toneMapping;

            __material.defines = {};
            if (ColorSpace.getTransfer(__outputColorSpace) === SRGBTransfer) {
                __material.defines.SRGB_TRANSFER = '';
            }
            const toneMapping = __toneMappingMap[__outputToneMapping];
            if (toneMapping) __material.defines[toneMapping] = '';
            __material.needsUpdate = true;
        }

        __material.uniforms.tDiffuse.value = readBuffer.texture;
        renderer.setRenderTarget(__savedRenderTarget);
        renderer.render(__mesh, __camera);

        __savedRenderTarget = null;
        __isCompositing = false;
    }

    function __isCompositing() {
        return __isCompositing;
    }

    function __dispose() {
        __targetScene.dispose();
        if (__targetA !== null) __targetA.dispose();
        if (__targetB !== null) __targetB.dispose();
        __geometry.dispose();
        __material.dispose();
        LOG('Output disposed');
    }

    return {
        setSize: __setSize,
        setEffects: __setEffects,
        begin: __begin,
        hasRenderPass: __hasRenderPass,
        end: __end,
        isCompositing: __isCompositing,
        dispose: __dispose
    };
}

export { Output };
