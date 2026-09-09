/**
 * Program.js
 * Program manager untuk editor (2D dan 3D)
 * Menggunakan private __ (double underscore)
 */

import { ShaderChunk } from './ShaderChunk.js';
import { 
    NoToneMapping, 
    LinearToneMapping,
    ReinhardToneMapping,
    CineonToneMapping,
    ACESFilmicToneMapping,
    AgXToneMapping,
    NeutralToneMapping,
    CustomToneMapping,
    SRGBTransfer
} from './constants.js';
import { ColorSpace } from './math/ColorSpace.js';
import { Vector3 } from './math/Vector3.js';
import { Matrix3 } from './math/Matrix3.js';
import { WARNING_ONCE, WARNING, ERROR, LOG, INFO } from './utils.js';

const __m0 = new Matrix3();

function __getEncodingComponents(colorSpace) {
    ColorSpace._getMatrix(__m0, ColorSpace.workingColorSpace, colorSpace);
    const encodingMatrix = `mat3( ${ __m0.elements.map( ( v ) => v.toFixed( 4 ) ) } )`;

    switch (ColorSpace.getTransfer(colorSpace)) {
        case 'linear':
            return [encodingMatrix, 'LinearTransferOETF'];
        case 'srgb':
            return [encodingMatrix, 'sRGBTransferOETF'];
        default:
            WARNING('Program: Unsupported color space: ', colorSpace);
            return [encodingMatrix, 'LinearTransferOETF'];
    }
}

function __getTexelEncodingFunction(functionName, colorSpace) {
    const components = __getEncodingComponents(colorSpace);
    return [
        `vec4 ${functionName}( vec4 value ) {`,
        `    return ${components[1]}( vec4( value.rgb * ${components[0]}, value.a ) );`,
        '}'
    ].join('\n');
}

const __toneMappingFunctions = {
    [LinearToneMapping]: 'Linear',
    [ReinhardToneMapping]: 'Reinhard',
    [CineonToneMapping]: 'Cineon',
    [ACESFilmicToneMapping]: 'ACESFilmic',
    [AgXToneMapping]: 'AgX',
    [NeutralToneMapping]: 'Neutral',
    [CustomToneMapping]: 'Custom'
};

function __getToneMappingFunction(functionName, toneMapping) {
    const toneMappingName = __toneMappingFunctions[toneMapping];
    if (toneMappingName === undefined) {
        WARNING('Program: Unsupported toneMapping:', toneMapping);
        return 'vec3 ' + functionName + '( vec3 color ) { return LinearToneMapping( color ); }';
    }
    return 'vec3 ' + functionName + '( vec3 color ) { return ' + toneMappingName + 'ToneMapping( color ); }';
}

const __v0 = new Vector3();

function __getLuminanceFunction() {
    // Default luminance coefficients
    const r = 0.2126;
    const g = 0.7152;
    const b = 0.0722;
    return [
        'float luminance( const in vec3 rgb ) {',
        `    const vec3 weights = vec3( ${ r.toFixed(4) }, ${ g.toFixed(4) }, ${ b.toFixed(4) } );`,
        '    return dot( weights, rgb );',
        '}'
    ].join('\n');
}

function __generatePrecision(parameters) {
    let precisionString = `precision ${parameters.precision} float;\n`;
    precisionString += `precision ${parameters.precision} int;\n`;
    precisionString += `precision ${parameters.precision} sampler2D;\n`;
    precisionString += `precision ${parameters.precision} samplerCube;\n`;
    precisionString += `precision ${parameters.precision} sampler3D;\n`;
    precisionString += `precision ${parameters.precision} sampler2DArray;\n`;
    precisionString += `precision ${parameters.precision} sampler2DShadow;\n`;
    precisionString += `precision ${parameters.precision} samplerCubeShadow;\n`;
    precisionString += `precision ${parameters.precision} sampler2DArrayShadow;\n`;

    if (parameters.precision === 'highp') {
        precisionString += '\n#define HIGH_PRECISION';
    } else if (parameters.precision === 'mediump') {
        precisionString += '\n#define MEDIUM_PRECISION';
    } else if (parameters.precision === 'lowp') {
        precisionString += '\n#define LOW_PRECISION';
    }

    return precisionString;
}

const __includePattern = /^[ \t]*#include +<([\w\d./]+)>/gm;

function __resolveIncludes(string) {
    return string.replace(__includePattern, __includeReplacer);
}

function __includeReplacer(match, include) {
    let string = ShaderChunk[include];
    if (string === undefined) {
        throw new Error('Program: Can not resolve #include <' + include + '>');
    }
    return __resolveIncludes(string);
}

const __unrollLoopPattern = /#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;

function __unrollLoops(string) {
    return string.replace(__unrollLoopPattern, __loopReplacer);
}

function __loopReplacer(match, start, end, snippet) {
    let string = '';
    for (let i = parseInt(start); i < parseInt(end); i++) {
        string += snippet
            .replace(/\[\s*i\s*\]/g, '[ ' + i + ' ]')
            .replace(/UNROLLED_LOOP_INDEX/g, i);
    }
    return string;
}

function __filterEmptyLine(string) {
    return string !== '';
}

let __programIdCount = 0;

function Program(renderer, cacheKey, parameters, bindingStates) {
    const gl = renderer.getContext();

    const __defines = parameters.defines;
    let __vertexShader = parameters.vertexShader;
    let __fragmentShader = parameters.fragmentShader;

    const __program = gl.createProgram();

    let __prefixVertex = '';
    let __prefixFragment = '';

    if (parameters.isRawShaderMaterial) {
        __prefixVertex = [
            '#define SHADER_TYPE ' + parameters.shaderType,
            '#define SHADER_NAME ' + parameters.shaderName,
            __defines ? __generateDefines(__defines) : ''
        ].filter(__filterEmptyLine).join('\n');

        __prefixFragment = [
            '#define SHADER_TYPE ' + parameters.shaderType,
            '#define SHADER_NAME ' + parameters.shaderName,
            __defines ? __generateDefines(__defines) : ''
        ].filter(__filterEmptyLine).join('\n');
    } else {
        __prefixVertex = [
            __generatePrecision(parameters),
            '#define SHADER_TYPE ' + parameters.shaderType,
            '#define SHADER_NAME ' + parameters.shaderName,
            __defines ? __generateDefines(__defines) : '',
            parameters.map ? '#define USE_MAP' : '',
            parameters.envMap ? '#define USE_ENVMAP' : '',
            parameters.lightMap ? '#define USE_LIGHTMAP' : '',
            parameters.aoMap ? '#define USE_AOMAP' : '',
            parameters.bumpMap ? '#define USE_BUMPMAP' : '',
            parameters.normalMap ? '#define USE_NORMALMAP' : '',
            parameters.displacementMap ? '#define USE_DISPLACEMENTMAP' : '',
            parameters.emissiveMap ? '#define USE_EMISSIVEMAP' : '',
            parameters.roughnessMap ? '#define USE_ROUGHNESSMAP' : '',
            parameters.metalnessMap ? '#define USE_METALNESSMAP' : '',
            parameters.alphaMap ? '#define USE_ALPHAMAP' : '',
            parameters.vertexColors ? '#define USE_COLOR' : '',
            parameters.skinning ? '#define USE_SKINNING' : '',
            parameters.morphTargets ? '#define USE_MORPHTARGETS' : '',
            parameters.shadowMapEnabled ? '#define USE_SHADOWMAP' : '',
            parameters.doubleSided ? '#define DOUBLE_SIDED' : '',
            parameters.flipSided ? '#define FLIP_SIDED' : '',
            'uniform mat4 modelMatrix;',
            'uniform mat4 modelViewMatrix;',
            'uniform mat4 projectionMatrix;',
            'uniform mat4 viewMatrix;',
            'uniform mat3 normalMatrix;',
            'uniform vec3 cameraPosition;',
            'attribute vec3 position;',
            'attribute vec3 normal;',
            'attribute vec2 uv;',
            '#ifdef USE_COLOR',
            '    attribute vec3 color;',
            '#endif',
            '#ifdef USE_SKINNING',
            '    attribute vec4 skinIndex;',
            '    attribute vec4 skinWeight;',
            '#endif',
            '\n'
        ].filter(__filterEmptyLine).join('\n');

        __prefixFragment = [
            __generatePrecision(parameters),
            '#define SHADER_TYPE ' + parameters.shaderType,
            '#define SHADER_NAME ' + parameters.shaderName,
            __defines ? __generateDefines(__defines) : '',
            parameters.useFog && parameters.fog ? '#define USE_FOG' : '',
            parameters.map ? '#define USE_MAP' : '',
            parameters.envMap ? '#define USE_ENVMAP' : '',
            parameters.lightMap ? '#define USE_LIGHTMAP' : '',
            parameters.aoMap ? '#define USE_AOMAP' : '',
            parameters.bumpMap ? '#define USE_BUMPMAP' : '',
            parameters.normalMap ? '#define USE_NORMALMAP' : '',
            parameters.emissiveMap ? '#define USE_EMISSIVEMAP' : '',
            parameters.roughnessMap ? '#define USE_ROUGHNESSMAP' : '',
            parameters.metalnessMap ? '#define USE_METALNESSMAP' : '',
            parameters.alphaMap ? '#define USE_ALPHAMAP' : '',
            parameters.alphaTest ? '#define USE_ALPHATEST' : '',
            parameters.vertexColors ? '#define USE_COLOR' : '',
            parameters.gradientMap ? '#define USE_GRADIENTMAP' : '',
            parameters.doubleSided ? '#define DOUBLE_SIDED' : '',
            parameters.flipSided ? '#define FLIP_SIDED' : '',
            parameters.shadowMapEnabled ? '#define USE_SHADOWMAP' : '',
            (parameters.toneMapping !== NoToneMapping) ? '#define TONE_MAPPING' : '',
            (parameters.toneMapping !== NoToneMapping) ? __getToneMappingFunction('toneMapping', parameters.toneMapping) : '',
            parameters.dithering ? '#define DITHERING' : '',
            __getTexelEncodingFunction('linearToOutputTexel', parameters.outputColorSpace),
            __getLuminanceFunction(),
            'uniform mat4 viewMatrix;',
            'uniform vec3 cameraPosition;',
            '\n'
        ].filter(__filterEmptyLine).join('\n');
    }

    __vertexShader = __resolveIncludes(__vertexShader);
    __fragmentShader = __resolveIncludes(__fragmentShader);
    __vertexShader = __unrollLoops(__vertexShader);
    __fragmentShader = __unrollLoops(__fragmentShader);

    const __vertexGlsl = __prefixVertex + __vertexShader;
    const __fragmentGlsl = __prefixFragment + __fragmentShader;

    const __glVertexShader = __createShader(gl, gl.VERTEX_SHADER, __vertexGlsl);
    const __glFragmentShader = __createShader(gl, gl.FRAGMENT_SHADER, __fragmentGlsl);

    gl.attachShader(__program, __glVertexShader);
    gl.attachShader(__program, __glFragmentShader);

    if (parameters.hasPositionAttribute === true) {
        gl.bindAttribLocation(__program, 0, 'position');
    }

    gl.linkProgram(__program);

    let __cachedUniforms = null;
    let __cachedAttributes = null;
    let __programReady = (parameters.rendererExtensionParallelShaderCompile === false);

    function __createShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        return shader;
    }

    function __getUniforms() {
        if (__cachedUniforms === null) {
            __cachedUniforms = new WebGLUniforms(gl, __program);
        }
        return __cachedUniforms;
    }

    function __getAttributes() {
        if (__cachedAttributes === null) {
            __cachedAttributes = __fetchAttributeLocations(gl, __program);
        }
        return __cachedAttributes;
    }

    function __fetchAttributeLocations(gl, program) {
        const attributes = {};
        const n = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
        for (let i = 0; i < n; i++) {
            const info = gl.getActiveAttrib(program, i);
            attributes[info.name] = {
                type: info.type,
                location: gl.getAttribLocation(program, info.name),
                locationSize: 1
            };
        }
        return attributes;
    }

    function __isReady() {
        if (__programReady === false) {
            const COMPLETION_STATUS_KHR = 0x91B1;
            __programReady = gl.getProgramParameter(__program, COMPLETION_STATUS_KHR);
        }
        return __programReady;
    }

    function __destroy() {
        if (bindingStates && bindingStates.releaseStatesOfProgram) {
            bindingStates.releaseStatesOfProgram(this);
        }
        gl.deleteProgram(__program);
    }

    this.getUniforms = __getUniforms;
    this.getAttributes = __getAttributes;
    this.isReady = __isReady;
    this.destroy = __destroy;

    this.type = parameters.shaderType;
    this.name = parameters.shaderName;
    this.id = __programIdCount++;
    this.cacheKey = cacheKey;
    this.usedTimes = 1;
    this.program = __program;
    this.vertexShader = __glVertexShader;
    this.fragmentShader = __glFragmentShader;

    return this;
}

export { Program };
