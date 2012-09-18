
L.Control = L.Class.extend({
	options: {
		position: 'topright'
	},
	/**
	 * [initialize 初始化，将options中的默认值绑给this，再将传入参数覆盖默认值]
	 * @param  {[Object]} options [参数]
	 * @return {[type]}         [description]
	 */
	initialize: function (options) {
		L.Util.setOptions(this, options);
	},
	/**
	 * [getPosition 得到位置]
	 * @return {[type]} [description]
	 */
	getPosition: function () {
		return this.options.position;
	},
	/**
	 * [setPosition 设置位置，为什么this.options.position而不是this.position]
	 * @param {[type]} position [description]
	 */
	setPosition: function (position) {
		var map = this._map;

		if (map) {
			map.removeControl(this);
		}

		this.options.position = position;

		if (map) {
			map.addControl(this);
		}

		return this;
	},
	
	addTo: function (map) {
		this._map = map;

		var container = this._container = this.onAdd(map),
		    pos = this.getPosition(),
			corner = map._controlCorners[pos];

		L.DomUtil.addClass(container, 'leaflet-control');

		if (pos.indexOf('bottom') !== -1) {
			corner.insertBefore(container, corner.firstChild);
		} else {
			corner.appendChild(container);
		}

		return this;
	},

	removeFrom: function (map) {
		var pos = this.getPosition(),
			corner = map._controlCorners[pos];

		corner.removeChild(this._container);
		this._map = null;

		if (this.onRemove) {
			this.onRemove(map);
		}

		return this;
	}
});

L.control = function (options) {
	return new L.Control(options);
};
