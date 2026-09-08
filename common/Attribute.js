/**
 * Attribute.js
 * Manajemen attribute untuk text editor
 * Meniru pola WebGLAttributes dari Three.js
 */

function Attributes() {
	const buffers = new WeakMap();

	function createBuffer(attribute) {
		const data = attribute.data;
		const type = attribute.type || 'string';
		const size = data.length;

		const buffer = {
			data: data,
			type: type,
			size: size,
			version: attribute.version || 0
		};

		if (attribute.onUploadCallback) {
			attribute.onUploadCallback();
		}

		return buffer;
	}

	function updateBuffer(buffer, attribute) {
		const data = attribute.data;
		buffer.data = data;
		buffer.size = data.length;

		if (attribute.onUploadCallback) {
			attribute.onUploadCallback();
		}
	}

	function get(attribute) {
		return buffers.get(attribute);
	}

	function remove(attribute) {
		const data = buffers.get(attribute);
		if (data) {
			buffers.delete(attribute);
		}
	}

	function update(attribute) {
		const data = buffers.get(attribute);

		if (data === undefined) {
			buffers.set(attribute, createBuffer(attribute));
		} else if (data.version < attribute.version) {
			updateBuffer(data, attribute);
			data.version = attribute.version;
		}
	}

	return {
		get: get,
		remove: remove,
		update: update
	};
}

export { Attributes };
