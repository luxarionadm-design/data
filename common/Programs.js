/**
 * Programs.js
 * Program manager untuk editor
 * Menggunakan private __ (double underscore)
 */

import { 
    BackSide, DoubleSide, CubeUVReflectionMapping, 
    ObjectSpaceNormalMap, TangentSpaceNormalMap, 
    NoToneMapping, NormalBlending, SRGBTransfer,
    RGFormat, RG11_EAC_Format, RED_GREEN_RGTC2_Format 
} from './constants.js';

import { Layers } from './core/Layers.js';
import { Program } from './Program.js';
import { ShaderCache } from './ShaderCache.js';
import { ShaderLib } from './ShaderLib.js';
import { UniformsUtils } from './UniformsUtils.js';
import { ColorSpace } from './math/ColorSpace.js';
import { WARNING_ONCE, WARNING, ERROR, LOG, INFO } from './utils.js';

function __isPackedRGFormat(format) {
    return format === RGFormat || 
           format === RG11_EAC_Format || 
           format === RED_GREEN_RGTC2_Format;
}

function __getChannel(value) {
    if (value === 0) return 'uv';
    return `uv${value}`;
}

let __programIdCount = 0;

function Programs(renderer, environments, extensions, capabilities, bindingStates, clipping) {
    const __programLayers = new Layers();
    const __shaderCache = new ShaderCache();
    const __activeChannels = new Set();
    const __programs = [];
    const __programsMap = new Map();

    const __logarithmicDepthBuffer = capabilities.logarithmicDepthBuffer;
    let __precision = capabilities.precision;

    const __shaderIDs = {
        'MeshBasicMaterial': 'basic',
        'MeshLambertMaterial': 'lambert',
        'MeshPhongMaterial': 'phong',
        'MeshStandardMaterial': 'physical',
        'MeshPhysicalMaterial': 'physical',
        'MeshToonMaterial': 'toon',
        'MeshMatcapMaterial': 'matcap',
        'MeshDepthMaterial': 'depth',
        'MeshNormalMaterial': 'normal',
        'LineBasicMaterial': 'basic',
        'LineDashedMaterial': 'dashed',
        'PointsMaterial': 'points',
        'SpriteMaterial': 'sprite'
    };

    function __getParameters(material, lights, shadows, scene, object, lightProbeGrids) {
        const fog = scene.fog;
        const geometry = object.geometry;
        const environment = scene.environment || null;

        const envMap = environments.get(material.envMap || environment);
        const envMapCubeUVHeight = (envMap && envMap.mapping === CubeUVReflectionMapping) ? envMap.image.height : null;

        const shaderID = __shaderIDs[material.type];

        if (material.precision !== null) {
            __precision = capabilities.getMaxPrecision(material.precision);
        }

        const morphAttribute = geometry.morphAttributes?.position || geometry.morphAttributes?.normal || geometry.morphAttributes?.color;
        const morphTargetsCount = (morphAttribute !== undefined) ? morphAttribute.length : 0;

        let morphTextureStride = 0;
        if (geometry.morphAttributes?.position) morphTextureStride = 1;
        if (geometry.morphAttributes?.normal) morphTextureStride = 2;
        if (geometry.morphAttributes?.color) morphTextureStride = 3;

        let vertexShader, fragmentShader;
        let customVertexShaderID, customFragmentShaderID;

        if (shaderID) {
            const shader = ShaderLib[shaderID];
            vertexShader = shader.vertexShader;
            fragmentShader = shader.fragmentShader;
        } else {
            vertexShader = material.vertexShader;
            fragmentShader = material.fragmentShader;
            const vertexShaderStage = __shaderCache.getVertexShaderStage(material);
            const fragmentShaderStage = __shaderCache.getFragmentShaderStage(material);
            __shaderCache.update(material, vertexShaderStage, fragmentShaderStage);
            customVertexShaderID = vertexShaderStage.id;
            customFragmentShaderID = fragmentShaderStage.id;
        }

        const currentRenderTarget = renderer.getRenderTarget();
        const reversedDepthBuffer = renderer.state?.buffers?.depth?.getReversed() || false;

        const IS_INSTANCEDMESH = object.isInstancedMesh === true;

        const HAS_MAP = !!material.map;
        const HAS_MATCAP = !!material.matcap;
        const HAS_ENVMAP = !!envMap;
        const HAS_AOMAP = !!material.aoMap;
        const HAS_LIGHTMAP = !!material.lightMap;
        const HAS_BUMPMAP = !!material.bumpMap;
        const HAS_NORMALMAP = !!material.normalMap;
        const HAS_DISPLACEMENTMAP = !!material.displacementMap;
        const HAS_EMISSIVEMAP = !!material.emissiveMap;
        const HAS_METALNESSMAP = !!material.metalnessMap;
        const HAS_ROUGHNESSMAP = !!material.roughnessMap;
        const HAS_ALPHAMAP = !!material.alphaMap;
        const HAS_ALPHATEST = material.alphaTest > 0;

        let toneMapping = NoToneMapping;
        if (material.toneMapped) {
            if (currentRenderTarget === null) {
                toneMapping = renderer.toneMapping;
            }
        }

        const parameters = {
            shaderID: shaderID,
            shaderType: material.type,
            shaderName: material.name,
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            defines: material.defines,
            customVertexShaderID: customVertexShaderID,
            customFragmentShaderID: customFragmentShaderID,
            isRawShaderMaterial: material.isRawShaderMaterial === true,
            glslVersion: material.glslVersion,
            precision: __precision,
            instancing: IS_INSTANCEDMESH,
            instancingColor: IS_INSTANCEDMESH && object.instanceColor !== null,
            outputColorSpace: (currentRenderTarget === null) ? renderer.outputColorSpace : ColorSpace.workingColorSpace,
            alphaToCoverage: !!material.alphaToCoverage,
            map: HAS_MAP,
            matcap: HAS_MATCAP,
            envMap: HAS_ENVMAP,
            envMapMode: HAS_ENVMAP && envMap.mapping,
            envMapCubeUVHeight: envMapCubeUVHeight,
            aoMap: HAS_AOMAP,
            lightMap: HAS_LIGHTMAP,
            bumpMap: HAS_BUMPMAP,
            normalMap: HAS_NORMALMAP,
            displacementMap: HAS_DISPLACEMENTMAP,
            emissiveMap: HAS_EMISSIVEMAP,
            normalMapObjectSpace: HAS_NORMALMAP && material.normalMapType === ObjectSpaceNormalMap,
            normalMapTangentSpace: HAS_NORMALMAP && material.normalMapType === TangentSpaceNormalMap,
            packedNormalMap: HAS_NORMALMAP && material.normalMapType === TangentSpaceNormalMap && __isPackedRGFormat(material.normalMap?.format),
            metalnessMap: HAS_METALNESSMAP,
            roughnessMap: HAS_ROUGHNESSMAP,
            alphaMap: HAS_ALPHAMAP,
            alphaTest: HAS_ALPHATEST,
            opaque: material.transparent === false && material.blending === NormalBlending && material.alphaToCoverage === false,
            combine: material.combine,
            mapUv: HAS_MAP && __getChannel(material.map?.channel || 0),
            aoMapUv: HAS_AOMAP && __getChannel(material.aoMap?.channel || 0),
            lightMapUv: HAS_LIGHTMAP && __getChannel(material.lightMap?.channel || 0),
            bumpMapUv: HAS_BUMPMAP && __getChannel(material.bumpMap?.channel || 0),
            normalMapUv: HAS_NORMALMAP && __getChannel(material.normalMap?.channel || 0),
            displacementMapUv: HAS_DISPLACEMENTMAP && __getChannel(material.displacementMap?.channel || 0),
            emissiveMapUv: HAS_EMISSIVEMAP && __getChannel(material.emissiveMap?.channel || 0),
            metalnessMapUv: HAS_METALNESSMAP && __getChannel(material.metalnessMap?.channel || 0),
            roughnessMapUv: HAS_ROUGHNESSMAP && __getChannel(material.roughnessMap?.channel || 0),
            alphaMapUv: HAS_ALPHAMAP && __getChannel(material.alphaMap?.channel || 0),
            vertexColors: material.vertexColors,
            vertexAlphas: material.vertexColors === true && !!geometry.attributes?.color && geometry.attributes.color.itemSize === 4,
            vertexNormals: !!geometry.attributes?.normal,
            vertexTangents: !!geometry.attributes?.tangent && (HAS_NORMALMAP),
            fog: !!fog,
            useFog: material.fog === true,
            flatShading: material.wireframe === false && (material.flatShading === true),
            skinning: object.isSkinnedMesh === true,
            hasPositionAttribute: geometry.attributes?.position !== undefined,
            morphTargets: geometry.morphAttributes?.position !== undefined,
            morphNormals: geometry.morphAttributes?.normal !== undefined,
            morphColors: geometry.morphAttributes?.color !== undefined,
            morphTargetsCount: morphTargetsCount,
            morphTextureStride: morphTextureStride,
            numSunLights: lights.sun?.length || 0,
            numDirLights: lights.directional?.length || 0,
            numPointLights: lights.point?.length || 0,
            numSpotLights: lights.spot?.length || 0,
            numHemiLights: lights.hemi?.length || 0,
            numRectAreaLights: lights.rectArea?.length || 0,
            numSunLightShadows: lights.sunShadowMap?.length || 0,
            numDirLightShadows: lights.directionalShadowMap?.length || 0,
            numPointLightShadows: lights.pointShadowMap?.length || 0,
            numSpotLightShadows: lights.spotShadowMap?.length || 0,
            numLightProbes: lights.numLightProbes || 0,
            numLightProbeGrids: lightProbeGrids?.length || 0,
            numClippingPlanes: clipping?.numPlanes || 0,
            numClipIntersection: clipping?.numIntersection || 0,
            dithering: material.dithering,
            shadowMapEnabled: renderer.shadowMap?.enabled && shadows?.length > 0,
            shadowMapType: renderer.shadowMap?.type || 0,
            toneMapping: toneMapping,
            premultipliedAlpha: material.premultipliedAlpha,
            doubleSided: material.side === DoubleSide,
            flipSided: material.side === BackSide,
            useDepthPacking: material.depthPacking >= 0,
            depthPacking: material.depthPacking || 0,
            index0AttributeName: material.index0AttributeName,
            extensionMultiDraw: (material.extensions?.multiDraw === true) && extensions.has('WEBGL_multi_draw'),
            rendererExtensionParallelShaderCompile: extensions.has('KHR_parallel_shader_compile'),
            customProgramCacheKey: material.customProgramCacheKey?.() || ''
        };

        __activeChannels.clear();
        return parameters;
    }

    function __getProgramCacheKey(parameters) {
        const array = [];

        if (parameters.shaderID) {
            array.push(parameters.shaderID);
        } else {
            array.push(parameters.customVertexShaderID);
            array.push(parameters.customFragmentShaderID);
        }

        if (parameters.defines) {
            for (const name in parameters.defines) {
                array.push(name);
                array.push(parameters.defines[name]);
            }
        }

        if (parameters.isRawShaderMaterial === false) {
            array.push(parameters.precision);
            array.push(parameters.outputColorSpace);
            array.push(parameters.envMapMode);
            array.push(parameters.mapUv);
            array.push(parameters.aoMapUv);
            array.push(parameters.lightMapUv);
            array.push(parameters.bumpMapUv);
            array.push(parameters.normalMapUv);
            array.push(parameters.displacementMapUv);
            array.push(parameters.emissiveMapUv);
            array.push(parameters.metalnessMapUv);
            array.push(parameters.roughnessMapUv);
            array.push(parameters.alphaMapUv);
            array.push(parameters.combine);
            array.push(parameters.numSunLights);
            array.push(parameters.numDirLights);
            array.push(parameters.numPointLights);
            array.push(parameters.numSpotLights);
            array.push(parameters.numHemiLights);
            array.push(parameters.numRectAreaLights);
            array.push(parameters.numSunLightShadows);
            array.push(parameters.numDirLightShadows);
            array.push(parameters.numPointLightShadows);
            array.push(parameters.numSpotLightShadows);
            array.push(parameters.numLightProbes);
            array.push(parameters.shadowMapType);
            array.push(parameters.toneMapping);
            array.push(parameters.numClippingPlanes);
            array.push(parameters.numClipIntersection);
            array.push(parameters.depthPacking);
        }

        array.push(parameters.customProgramCacheKey);
        return array.join('|');
    }

    function __getUniforms(material) {
        const shaderID = __shaderIDs[material.type];
        let uniforms;

        if (shaderID) {
            const shader = ShaderLib[shaderID];
            uniforms = UniformsUtils.clone(shader.uniforms);
        } else {
            uniforms = material.uniforms || {};
        }

        return uniforms;
    }

    function __acquireProgram(parameters, cacheKey) {
        let program = __programsMap.get(cacheKey);

        if (program) {
            program.usedTimes++;
        } else {
            program = new Program(renderer, cacheKey, parameters, bindingStates);
            __programs.push(program);
            __programsMap.set(cacheKey, program);
            LOG('Program acquired: ' + cacheKey);
        }

        return program;
    }

    function __releaseProgram(program) {
        if (--program.usedTimes === 0) {
            const i = __programs.indexOf(program);
            __programs[i] = __programs[__programs.length - 1];
            __programs.pop();
            __programsMap.delete(program.cacheKey);
            program.destroy();
            LOG('Program released: ' + program.cacheKey);
        }
    }

    function __releaseShaderCache(material) {
        __shaderCache.remove(material);
    }

    function __dispose() {
        __shaderCache.dispose();
        for (const program of __programs) {
            program.destroy();
        }
        __programs.length = 0;
        __programsMap.clear();
        LOG('Programs disposed');
    }

    function __getPrograms() {
        return [...__programs];
    }

    function __getProgramCount() {
        return __programs.length;
    }

    return {
        getParameters: __getParameters,
        getProgramCacheKey: __getProgramCacheKey,
        getUniforms: __getUniforms,
        acquireProgram: __acquireProgram,
        releaseProgram: __releaseProgram,
        releaseShaderCache: __releaseShaderCache,
        getPrograms: __getPrograms,
        getProgramCount: __getProgramCount,
        dispose: __dispose
    };
}

export { Programs };
