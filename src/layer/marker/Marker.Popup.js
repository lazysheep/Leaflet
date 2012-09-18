/*
 * Popup extension to L.Marker, adding openPopup & bindPopup methods.
 */
/**
 * 为Marker扩展原型
 */
L.Marker.include({
	/**
	 * [openPopup 打开tip]
	 * @return {[type]} [description]
	 */
	openPopup: function () {
		if (this._popup && this._map) {
			this._popup.setLatLng(this._latlng);
			this._map.openPopup(this._popup);
		}

		return this;
	},

	closePopup: function () {
		if (this._popup) {
			this._popup._close();
		}
		return this;
	},

	bindPopup: function (content, options) {
		//得到偏移量
		var anchor = L.point(this.options.icon.options.popupAnchor) || new L.Point(0, 0);
		//垒加L.Popup的偏移量
		anchor = anchor.add(L.Popup.prototype.options.offset);
		//累加传入的偏移量
		if (options && options.offset) {
			anchor = anchor.add(options.offset);
		}
		为options添加offset
		options = L.Util.extend({offset: anchor}, options);
		//如果该点还没绑popup，为点绑定单击事件，打开popup，
		//如果已经帮过，则只替换popup，不重复绑定单击事件
		if (!this._popup) {
			this.on('click', this.openPopup, this);
		}
		//新建popup
		this._popup = new L.Popup(options, this)
			.setContent(content);

		return this;
	},
	/**
	 * [unbindPopup 撤销popup]
	 * @return {[type]} [description]
	 */
	unbindPopup: function () {
		if (this._popup) {
			this._popup = null;
			this.off('click', this.openPopup);
		}
		return this;
	}
});
