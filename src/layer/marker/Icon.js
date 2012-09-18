L.Icon = L.Class.extend({
	options: {
		/*
		iconUrl: (String) (required)
		iconSize: (Point) (can be set through CSS)
		iconAnchor: (Point) (centered by default if size is specified, can be set in CSS with negative margins)
		popupAnchor: (Point) (if not specified, popup opens in the anchor point)
		shadowUrl: (Point) (no shadow by default)
		shadowSize: (Point)
		shadowAnchor: (Point)
		*/
		className: ''
	},

	initialize: function (options) {
		L.Util.setOptions(this, options);
	},

	createIcon: function () {
		return this._createIcon('icon');
	},

	createShadow: function () {
		return this._createIcon('shadow');
	},
	/**
	 * [_createIcon 创建图片]
	 * @param  {[String]} name [icon||shadow]
	 * @return {[HTMLElement]}      [图片元素]
	 */
	_createIcon: function (name) {
		var src = this._getIconUrl(name);//得到url

		if (!src) {
			if (name === 'icon') {
				throw new Error("iconUrl not set in Icon options (see the docs).");
			}
			return null;
		}

		var img = this._createImg(src);//创建图片元素
		this._setIconStyles(img, name);//设置样式

		return img;
	},
	/**
	 * [_setIconStyles 设置图片样式]
	 * @param {[HTMLElement]} img  [图片元素]
	 * @param {[String]} name [icon||shadow]
	 */
	_setIconStyles: function (img, name) {
		var options = this.options,
			size = L.point(options[name + 'Size']),
			anchor;

		if (name === 'shadow') {//从属性得到偏移量
			anchor = L.point(options.shadowAnchor || options.iconAnchor);
		} else {
			anchor = L.point(options.iconAnchor);
		}

		if (!anchor && size) {//如果属性没设置偏移量，但设置了尺寸，偏移量为中心
			anchor = size.divideBy(2, true);
		}

		img.className = 'leaflet-marker-' + name + ' ' + options.className;

		if (anchor) {//设置图片偏移位置
			img.style.marginLeft = (-anchor.x) + 'px';
			img.style.marginTop  = (-anchor.y) + 'px';
		}

		if (size) {//设置图片尺寸
			img.style.width  = size.x + 'px';
			img.style.height = size.y + 'px';
		}
	},
	/**
	 * [_createImg 创建icon元素]
	 * @param  {[String]} src [图片url]
	 * @return {[HTMLElement]}     [图片元素]
	 */
	_createImg: function (src) {
		var el;

		if (!L.Browser.ie6) {
			el = document.createElement('img');
			el.src = src;
		} else {
			el = document.createElement('div');
			el.style.filter = 'progid:DXImageTransform.Microsoft.AlphaImageLoader(src="' + src + '")';
		}
		return el;
	},
	/**
	 * [_getIconUrl 从options中获得url]
	 * @param  {[String]} name [icon/shadow]
	 * @return {[String]}      [url]
	 */
	_getIconUrl: function (name) {
		return this.options[name + 'Url'];
	}
});

L.icon = function (options) {
	return new L.Icon(options);
};
