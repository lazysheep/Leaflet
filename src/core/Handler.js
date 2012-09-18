/*
 * L.Handler classes are used internally to inject interaction features to classes like Map and Marker.
 */
/**
 * [Handler 各类间相互作用的桥梁]
 * @type {[type]}
 */
L.Handler = L.Class.extend({
	initialize: function (map) {//为类加入对map的引用
		this._map = map;
	},

	enable: function () {//设置可用
		if (this._enabled) { return; }

		this._enabled = true;
		this.addHooks();
	},

	disable: function () {//设置不可用
		if (!this._enabled) { return; }

		this._enabled = false;
		this.removeHooks();
	},

	enabled: function () {//返回是否可用
		return !!this._enabled;
	}
});
