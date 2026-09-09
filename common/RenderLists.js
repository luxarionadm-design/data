/**
 * RenderLists.js
 * Render list manager untuk editor
 * Menggunakan private __ (double underscore)
 */

function __painterSortStable(a, b) {
    if (a.groupOrder !== b.groupOrder) {
        return a.groupOrder - b.groupOrder;
    } else if (a.renderOrder !== b.renderOrder) {
        return a.renderOrder - b.renderOrder;
    } else if (a.materialId !== b.materialId) {
        return a.materialId - b.materialId;
    } else if (a.z !== b.z) {
        return a.z - b.z;
    } else {
        return a.id - b.id;
    }
}

function __reversePainterSortStable(a, b) {
    if (a.groupOrder !== b.groupOrder) {
        return a.groupOrder - b.groupOrder;
    } else if (a.renderOrder !== b.renderOrder) {
        return a.renderOrder - b.renderOrder;
    } else if (a.z !== b.z) {
        return b.z - a.z;
    } else {
        return a.id - b.id;
    }
}

function RenderList() {
    const __renderItems = [];
    let __renderItemsIndex = 0;

    const __opaque = [];
    const __transparent = [];

    function __init() {
        __renderItemsIndex = 0;
        __opaque.length = 0;
        __transparent.length = 0;
    }

    function __getNextRenderItem(object, geometry, material, groupOrder, z, group) {
        let renderItem = __renderItems[__renderItemsIndex];

        if (renderItem === undefined) {
            renderItem = {
                id: object.id || 0,
                object: object,
                geometry: geometry,
                material: material,
                materialId: material.id || 0,
                groupOrder: groupOrder || 0,
                renderOrder: object.renderOrder || 0,
                z: z || 0,
                group: group || null
            };
            __renderItems[__renderItemsIndex] = renderItem;
        } else {
            renderItem.id = object.id || 0;
            renderItem.object = object;
            renderItem.geometry = geometry;
            renderItem.material = material;
            renderItem.materialId = material.id || 0;
            renderItem.groupOrder = groupOrder || 0;
            renderItem.renderOrder = object.renderOrder || 0;
            renderItem.z = z || 0;
            renderItem.group = group || null;
        }

        __renderItemsIndex++;
        return renderItem;
    }

    function __push(object, geometry, material, groupOrder, z, group) {
        const renderItem = __getNextRenderItem(object, geometry, material, groupOrder, z, group);

        if (material.transparent) {
            __transparent.push(renderItem);
        } else {
            __opaque.push(renderItem);
        }
    }

    function __unshift(object, geometry, material, groupOrder, z, group) {
        const renderItem = __getNextRenderItem(object, geometry, material, groupOrder, z, group);

        if (material.transparent) {
            __transparent.unshift(renderItem);
        } else {
            __opaque.unshift(renderItem);
        }
    }

    function __sort(customOpaqueSort, customTransparentSort) {
        if (__opaque.length > 1) {
            __opaque.sort(customOpaqueSort || __painterSortStable);
        }
        if (__transparent.length > 1) {
            __transparent.sort(customTransparentSort || __reversePainterSortStable);
        }
    }

    function __finish() {
        for (let i = __renderItemsIndex, il = __renderItems.length; i < il; i++) {
            const renderItem = __renderItems[i];
            if (renderItem.id === null) break;
            renderItem.id = null;
            renderItem.object = null;
            renderItem.geometry = null;
            renderItem.material = null;
            renderItem.group = null;
        }
    }

    function __getOpaque() {
        return [...__opaque];
    }

    function __getTransparent() {
        return [...__transparent];
    }

    function __getAll() {
        return {
            opaque: [...__opaque],
            transparent: [...__transparent]
        };
    }

    function __getCount() {
        return __opaque.length + __transparent.length;
    }

    return {
        opaque: __opaque,
        transparent: __transparent,
        init: __init,
        push: __push,
        unshift: __unshift,
        finish: __finish,
        sort: __sort,
        getOpaque: __getOpaque,
        getTransparent: __getTransparent,
        getAll: __getAll,
        getCount: __getCount
    };
}

function RenderLists() {
    let __lists = new WeakMap();

    function __get(scene, renderCallDepth) {
        const listArray = __lists.get(scene);
        let list;

        if (listArray === undefined) {
            list = new RenderList();
            __lists.set(scene, [list]);
        } else {
            if (renderCallDepth >= listArray.length) {
                list = new RenderList();
                listArray.push(list);
            } else {
                list = listArray[renderCallDepth];
            }
        }

        return list;
    }

    function __remove(scene) {
        __lists.delete(scene);
    }

    function __dispose() {
        __lists = new WeakMap();
    }

    function __getAllLists() {
        const result = {};
        // WeakMap tidak bisa di-iterasi
        return result;
    }

    return {
        get: __get,
        remove: __remove,
        dispose: __dispose,
        getAllLists: __getAllLists
    };
}

export { RenderLists, RenderList };
