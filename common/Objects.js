/**
 * Objects.js
 * Object manager untuk editor (2D dan 3D)
 */

import { WARNING_ONCE, WARNING, ERROR, LOG, INFO } from './utils.js';

function Objects() {

    let updateMap = new WeakMap();
    let frame = 0;

    function update(object, geometries, attributes) {
        const currentFrame = frame;

        // Dapatkan geometry
        const geometry = object.geometry;
        const bufferGeometry = geometries.get(object, geometry);

        // Update geometry sekali per frame
        if (updateMap.get(bufferGeometry) !== currentFrame) {
            geometries.update(bufferGeometry);
            updateMap.set(bufferGeometry, currentFrame);
        }

        // Update instance jika InstancedMesh
        if (object.isInstancedMesh) {
            if (updateMap.get(object) !== currentFrame) {
                if (object.instanceMatrix) {
                    attributes.update(object.instanceMatrix);
                }
                if (object.instanceColor) {
                    attributes.update(object.instanceColor);
                }
                updateMap.set(object, currentFrame);
            }
        }

        // Update skeleton jika SkinnedMesh
        if (object.isSkinnedMesh) {
            const skeleton = object.skeleton;
            if (updateMap.get(skeleton) !== currentFrame) {
                skeleton.update();
                updateMap.set(skeleton, currentFrame);
            }
        }

        // Update children
        if (object.children) {
            for (const child of object.children) {
                update(child, geometries, attributes);
            }
        }

        return bufferGeometry;
    }

    function incrementFrame() {
        frame++;
    }

    function getFrame() {
        return frame;
    }

    function dispose() {
        updateMap = new WeakMap();
        LOG('Objects disposed');
    }

    function reset() {
        updateMap = new WeakMap();
        frame = 0;
        LOG('Objects reset');
    }

    function needsUpdate(object) {
        const currentFrame = frame;
        const geometry = object.geometry;
        const bufferGeometry = geometries.get(object, geometry);
        
        return updateMap.get(bufferGeometry) !== currentFrame;
    }

    return {
        update,
        incrementFrame,
        getFrame,
        dispose,
        reset,
        needsUpdate
    };
}

export { Objects };
