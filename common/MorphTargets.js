/**
 * MorphTargets.js
 * Morph target manager untuk 3D editor
 */

import { Vector4 } from './Vector4.js';
import { Vector2 } from './Vector2.js';
import { WARNING_ONCE, WARNING, ERROR, LOG, INFO } from './utils.js';

function MorphTargets() {

    const morphData = new WeakMap();
    const morph = new Vector4();

    function update(object, geometry, influences) {

        // Dapatkan morph targets dari geometry
        const positionTargets = geometry.morphAttributes?.position || [];
        const normalTargets = geometry.morphAttributes?.normal || [];
        const colorTargets = geometry.morphAttributes?.color || [];

        const targetCount = Math.max(
            positionTargets.length,
            normalTargets.length,
            colorTargets.length
        );

        if (targetCount === 0) {
            return null;
        }

        // Cek cache
        let entry = morphData.get(geometry);

        if (entry === undefined || entry.count !== targetCount) {
            if (entry !== undefined) {
                // Cleanup old data
                entry.data = null;
            }

            // Buat data morph
            const vertexCount = geometry.attributes?.position?.count || 0;
            const hasPosition = positionTargets.length > 0;
            const hasNormals = normalTargets.length > 0;
            const hasColors = colorTargets.length > 0;

            let vertexDataCount = 0;
            if (hasPosition) vertexDataCount++;
            if (hasNormals) vertexDataCount++;
            if (hasColors) vertexDataCount++;

            const vertexDataStride = vertexDataCount * 4;
            const totalSize = vertexCount * vertexDataStride * targetCount;

            const buffer = new Float32Array(totalSize);

            for (let i = 0; i < targetCount; i++) {
                const posTarget = positionTargets[i] || null;
                const normTarget = normalTargets[i] || null;
                const colorTarget = colorTargets[i] || null;

                const offset = vertexCount * vertexDataStride * i;

                for (let j = 0; j < vertexCount; j++) {
                    const stride = j * vertexDataStride;

                    if (hasPosition && posTarget) {
                        const v = posTarget.get(j);
                        buffer[offset + stride + 0] = v.x || 0;
                        buffer[offset + stride + 1] = v.y || 0;
                        buffer[offset + stride + 2] = v.z || 0;
                        buffer[offset + stride + 3] = 0;
                    }

                    if (hasNormals && normTarget) {
                        const v = normTarget.get(j);
                        buffer[offset + stride + 4] = v.x || 0;
                        buffer[offset + stride + 5] = v.y || 0;
                        buffer[offset + stride + 6] = v.z || 0;
                        buffer[offset + stride + 7] = 0;
                    }

                    if (hasColors && colorTarget) {
                        const v = colorTarget.get(j);
                        buffer[offset + stride + 8] = v.x || 0;
                        buffer[offset + stride + 9] = v.y || 0;
                        buffer[offset + stride + 10] = v.z || 0;
                        buffer[offset + stride + 11] = v.w || 1;
                    }
                }
            }

            entry = {
                count: targetCount,
                data: buffer,
                vertexCount: vertexCount,
                vertexDataCount: vertexDataCount,
                vertexDataStride: vertexDataStride,
                hasPosition: hasPosition,
                hasNormals: hasNormals,
                hasColors: hasColors
            };

            morphData.set(geometry, entry);
            LOG('Morph targets updated: ' + targetCount + ' targets, ' + vertexCount + ' vertices');
        }

        // Hitung base influence
        let influenceSum = 0;
        if (influences) {
            for (let i = 0; i < influences.length; i++) {
                influenceSum += influences[i];
            }
        }
        const baseInfluence = geometry.morphTargetsRelative ? 1 : 1 - influenceSum;

        return {
            data: entry.data,
            count: entry.count,
            vertexCount: entry.vertexCount,
            vertexDataCount: entry.vertexDataCount,
            vertexDataStride: entry.vertexDataStride,
            hasPosition: entry.hasPosition,
            hasNormals: entry.hasNormals,
            hasColors: entry.hasColors,
            influences: influences || [],
            baseInfluence: baseInfluence
        };
    }

    function dispose(geometry) {
        if (morphData.has(geometry)) {
            morphData.delete(geometry);
            LOG('Morph targets disposed');
        }
    }

    function getMorphData(geometry) {
        return morphData.get(geometry) || null;
    }

    function getTargetCount(geometry) {
        const entry = morphData.get(geometry);
        return entry ? entry.count : 0;
    }

    return {
        update,
        dispose,
        getMorphData,
        getTargetCount
    };
}

export { MorphTargets };
