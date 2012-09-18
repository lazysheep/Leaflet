/*
 * L.Map is the central class of the API - it is used to create a map.
 */

L.Map = L.Class.extend({

	includes: L.Mixin.Events,

	options: {
		crs: L.CRS.EPSG3857,

		/*
		center: LatLng,
		zoom: Number,
		layers: Array,
		*/

		fadeAnimation: L.DomUtil.TRANSITION && !L.Browser.android23,
		trackResize: true,
		markerZoomAnimation: L.DomUtil.TRANSITION && L.Browser.any3d
	},

	initialize: function (id, options) { // (HTMLElement or String, Object)
		options = L.Util.setOptions(this, options);

		this._initContainer(id);
		this._initLayout();
		this._initHooks();
		this._initEvents();

		if (options.maxBounds) {
			this.setMaxBounds(options.maxBounds);
		}

		if (options.center && options.zoom !== undefined) {
			this.setView(L.latLng(options.center), options.zoom, true);
		}

		this._initLayers(options.layers);
	},


	// public methods that modify map state

	// replaced by animation-powered implementation in Map.PanAnimation.js
	/**
	 * [setView 设置中心点和级别坐标]
	 * @param {[type]} center [description]
	 * @param {[type]} zoom   [description]
	 */
	setView: function (center, zoom) {
		this._resetView(L.latLng(center), this._limitZoom(zoom));
		return this;
	},
	/**
	 * [setZoom 设置级别]
	 * @param {[type]} zoom) { // (Number [description]
	 */
	setZoom: function (zoom) { // (Number)
		return this.setView(this.getCenter(), zoom);
	},
	/**
	 * [zoomIn 放大一级]
	 * @return {[type]} [description]
	 */
	zoomIn: function () {
		return this.setZoom(this._zoom + 1);
	},
	/**
	 * [zoomOut 减小一级]
	 * @return {[type]} [description]
	 */
	zoomOut: function () {
		return this.setZoom(this._zoom - 1);
	},
	/**
	 * [fitBounds 设置bounds]
	 * @param  {[type]} bounds [description]
	 * @return {[type]}         [description]
	 */
	fitBounds: function (bounds) { // (LatLngBounds)
		var zoom = this.getBoundsZoom(bounds);
		return this.setView(L.latLngBounds(bounds).getCenter(), zoom);
	},
	/**
	 * [fitWorld 设置到世界级]
	 * @return {[type]} [description]
	 */
	fitWorld: function () {
		var sw = new L.LatLng(-60, -170),
		    ne = new L.LatLng(85, 179);

		return this.fitBounds(new L.LatLngBounds(sw, ne));
	},
	/**
	 * [panTo 移动到指定点]
	 * @param  {[type]} center  [description]
	 * @return {[type]}         [description]
	 */
	panTo: function (center) { // (LatLng)
		return this.setView(center, this._zoom);
	},
	/**
	 * [panBy 移动指定距离，由x，y值指定]
	 * @param  {[type]} offset  [description]
	 * @return {[type]}         [description]
	 */
	panBy: function (offset) { // (Point)
		// replaced with animated panBy in Map.Animation.js
		this.fire('movestart');

		this._rawPanBy(L.point(offset));

		this.fire('move');
		return this.fire('moveend');
	},
	/**
	 * [setMaxBounds 设置bounds最大值]
	 * @param {[type]} bounds [description]
	 */
	setMaxBounds: function (bounds) {
		bounds = L.latLngBounds(bounds);

		this.options.maxBounds = bounds;

		if (!bounds) {
			this._boundsMinZoom = null;
			return this;
		}

		var minZoom = this.getBoundsZoom(bounds, true);

		this._boundsMinZoom = minZoom;

		if (this._loaded) {
			if (this._zoom < minZoom) {
				this.setView(bounds.getCenter(), minZoom);
			} else {
				this.panInsideBounds(bounds);
			}
		}

		return this;
	},

	panInsideBounds: function (bounds) {
		bounds = L.latLngBounds(bounds);//传入bounds

		var viewBounds = this.getBounds(),//该地图bounds
		    viewSw = this.project(viewBounds.getSouthWest()),//地图西南像素
		    viewNe = this.project(viewBounds.getNorthEast()),//地图东北像素
		    sw = this.project(bounds.getSouthWest()),//传入bounds西南像素
		    ne = this.project(bounds.getNorthEast()),//传入bounds东北像素
		    dx = 0,
		    dy = 0;

		if (viewNe.y < ne.y) { // north//如果地图像素值小于传入值，得到差值
			dy = ne.y - viewNe.y;
		}
		if (viewNe.x > ne.x) { // east
			dx = ne.x - viewNe.x;
		}
		if (viewSw.y > sw.y) { // south
			dy = sw.y - viewSw.y;
		}
		if (viewSw.x < sw.x) { // west
			dx = sw.x - viewSw.x;
		}

		return this.panBy(new L.Point(dx, dy, true));
	},
	/**
	 * [addLayer 叠加覆盖物]
	 * @param {[type]} layer [description]
	 */
	addLayer: function (layer) {
		// TODO method is too big, refactor

		var id = L.Util.stamp(layer);//得到layer的id

		if (this._layers[id]) { return this; }//已存在则退出

		this._layers[id] = layer;//缓存在map上

		// TODO getMaxZoom, getMinZoom in ILayer (instead of options)
		// 设置图层最大最小级别
		if (layer.options && !isNaN(layer.options.maxZoom)) {
			this._layersMaxZoom = Math.max(this._layersMaxZoom || 0, layer.options.maxZoom);
		}
		if (layer.options && !isNaN(layer.options.minZoom)) {
			this._layersMinZoom = Math.min(this._layersMinZoom || Infinity, layer.options.minZoom);
		}

		// TODO looks ugly, refactor!!!
		if (this.options.zoomAnimation && L.TileLayer && (layer instanceof L.TileLayer)) {
			this._tileLayersNum++;
            this._tileLayersToLoad++;
            layer.on('load', this._onTileLayerLoad, this);
		}

		var onMapLoad = function () {
			layer.onAdd(this);//加载图层
			this.fire('layeradd', {layer: layer});//触发layeradd事件
		};

		if (this._loaded) {//如果地图已加载，则加图层
			onMapLoad.call(this);
		} else {//如果没加载，加过地图后再加图层
			this.on('load', onMapLoad, this);
		}

		return this;
	},
	/**
	 * [removeLayer 删除图层]
	 * @param  {[type]} layer [description]
	 * @return {[type]}       [description]
	 */
	removeLayer: function (layer) {
		var id = L.Util.stamp(layer);

		if (!this._layers[id]) { return; }

		layer.onRemove(this);

		delete this._layers[id];

		// TODO looks ugly, refactor
		if (this.options.zoomAnimation && L.TileLayer && (layer instanceof L.TileLayer)) {
			this._tileLayersNum--;
            this._tileLayersToLoad--;
            layer.off('load', this._onTileLayerLoad, this);
		}

		return this.fire('layerremove', {layer: layer});
	},
	/**
	 * [hasLayer 是否有该图层]
	 * @param  {[type]}  layer [description]
	 * @return {Boolean}       [description]
	 */
	hasLayer: function (layer) {
		var id = L.Util.stamp(layer);
		return this._layers.hasOwnProperty(id);
	},

	invalidateSize: function (animate) {
		var oldSize = this.getSize();

		this._sizeChanged = true;

		if (this.options.maxBounds) {
			this.setMaxBounds(this.options.maxBounds);
		}

		if (!this._loaded) { return this; }

		var offset = oldSize.subtract(this.getSize()).divideBy(2, true);

		if (animate === true) {
			this.panBy(offset);
		} else {
			this._rawPanBy(offset);

			this.fire('move');

			clearTimeout(this._sizeTimer);
			this._sizeTimer = setTimeout(L.Util.bind(this.fire, this, 'moveend'), 200);
		}
		return this;
	},

	// TODO handler.addTo
	//为map绑定handler
	addHandler: function (name, HandlerClass) {
		if (!HandlerClass) { return; }

		this[name] = new HandlerClass(this);//绑给地图

		if (this.options[name]) {//设置可用
			this[name].enable();
		}

		return this;
	},


	// public methods for getting map state
	// 得到地图状态的方法

	getCenter: function () { // (Boolean) -> LatLng
		return this.layerPointToLatLng(this._getCenterLayerPoint());
	},

	getZoom: function () {
		return this._zoom;
	},

	getBounds: function () {
		var bounds = this.getPixelBounds(),
		    sw = this.unproject(bounds.getBottomLeft()),
		    ne = this.unproject(bounds.getTopRight());

		return new L.LatLngBounds(sw, ne);
	},

	getMinZoom: function () {
		var z1 = this.options.minZoom || 0,
		    z2 = this._layersMinZoom || 0,
		    z3 = this._boundsMinZoom || 0;

		return Math.max(z1, z2, z3);
	},

	getMaxZoom: function () {
		var z1 = this.options.maxZoom === undefined ? Infinity : this.options.maxZoom,
		    z2 = this._layersMaxZoom  === undefined ? Infinity : this._layersMaxZoom;

		return Math.min(z1, z2);
	},

	getBoundsZoom: function (bounds, inside) { // (LatLngBounds, Boolean) -> Number
		bounds = L.latLngBounds(bounds);

		var size = this.getSize(),
		    zoom = this.options.minZoom || 0,
		    maxZoom = this.getMaxZoom(),
		    ne = bounds.getNorthEast(),
		    sw = bounds.getSouthWest(),
		    boundsSize,
		    nePoint,
		    swPoint,
		    zoomNotFound = true;

		if (inside) {
			zoom--;
		}

		do {
			zoom++;
			nePoint = this.project(ne, zoom);
			swPoint = this.project(sw, zoom);
			boundsSize = new L.Point(Math.abs(nePoint.x - swPoint.x), Math.abs(swPoint.y - nePoint.y));

			if (!inside) {
				zoomNotFound = boundsSize.x <= size.x && boundsSize.y <= size.y;
			} else {
				zoomNotFound = boundsSize.x < size.x || boundsSize.y < size.y;
			}
		} while (zoomNotFound && zoom <= maxZoom);

		if (zoomNotFound && inside) {
			return null;
		}

		return inside ? zoom : zoom - 1;
	},

	getSize: function () {
		if (!this._size || this._sizeChanged) {
			this._size = new L.Point(
				this._container.clientWidth,
				this._container.clientHeight);

			this._sizeChanged = false;
		}
		return this._size;
	},

	getPixelBounds: function () {
		var topLeftPoint = this._getTopLeftPoint();
		return new L.Bounds(topLeftPoint, topLeftPoint.add(this.getSize()));
	},

	getPixelOrigin: function () {
		return this._initialTopLeftPoint;
	},

	getPanes: function () {
		return this._panes;
	},

	getContainer: function () {
		return this._container;
	},


	// TODO replace with universal implementation after refactoring projections

	getZoomScale: function (toZoom) {
		var crs = this.options.crs;
		return crs.scale(toZoom) / crs.scale(this._zoom);
	},

	getScaleZoom: function (scale) {
		return this._zoom + (Math.log(scale) / Math.LN2);
	},


	// conversion methods
	/**
	 * [project 经纬度转像素坐标]
	 * @param  {[type]} latlng  [经纬度]
	 * @param  {[type]} zoom [级别]
	 * @return {[type]}         [description]
	 */
	project: function (latlng, zoom) { // (LatLng[, Number]) -> Point
		zoom = zoom === undefined ? this._zoom : zoom;
		return this.options.crs.latLngToPoint(L.latLng(latlng), zoom);
	},
	/**
	 * [unproject 像素转经纬度]
	 * @param  {[type]} point   [description]
	 * @param  {[type]} zoom)   {            // (Point[ [description]
	 * @param  {[type]} Number] [description]
	 * @return {[type]}         [description]
	 */
	unproject: function (point, zoom) { // (Point[, Number]) -> LatLng
		zoom = zoom === undefined ? this._zoom : zoom;
		return this.options.crs.pointToLatLng(L.point(point), zoom);
	},

	layerPointToLatLng: function (point) { // (Point)
		var projectedPoint = L.point(point).add(this._initialTopLeftPoint);
		return this.unproject(projectedPoint);
	},

	latLngToLayerPoint: function (latlng) { // (LatLng)
		var projectedPoint = this.project(L.latLng(latlng))._round();
		return projectedPoint._subtract(this._initialTopLeftPoint);
	},

	containerPointToLayerPoint: function (point) { // (Point)
		return L.point(point).subtract(this._getMapPanePos());
	},

	layerPointToContainerPoint: function (point) { // (Point)
		return L.point(point).add(this._getMapPanePos());
	},

	containerPointToLatLng: function (point) {
		var layerPoint = this.containerPointToLayerPoint(L.point(point));
		return this.layerPointToLatLng(layerPoint);
	},

	latLngToContainerPoint: function (latlng) {
		return this.layerPointToContainerPoint(this.latLngToLayerPoint(L.latLng(latlng)));
	},

	mouseEventToContainerPoint: function (e) { // (MouseEvent)
		return L.DomEvent.getMousePosition(e, this._container);
	},

	mouseEventToLayerPoint: function (e) { // (MouseEvent)
		return this.containerPointToLayerPoint(this.mouseEventToContainerPoint(e));
	},

	mouseEventToLatLng: function (e) { // (MouseEvent)
		return this.layerPointToLatLng(this.mouseEventToLayerPoint(e));
	},


	// map initialization methods
	// 地图初始化方法

	_initContainer: function (id) {
		var container = this._container = L.DomUtil.get(id);

		if (container._leaflet) {
			throw new Error("Map container is already initialized.");
		}

		container._leaflet = true;//给容器对象家标识
	},

	_initLayout: function () {//初始化布局，加样式，设置position
		var container = this._container;

		container.innerHTML = '';
		L.DomUtil.addClass(container, 'leaflet-container');

		if (L.Browser.touch) {
			L.DomUtil.addClass(container, 'leaflet-touch');
		}

		if (this.options.fadeAnimation) {//淡入淡出
			L.DomUtil.addClass(container, 'leaflet-fade-anim');
		}

		var position = L.DomUtil.getStyle(container, 'position');

		if (position !== 'absolute' && position !== 'relative' && position !== 'fixed') {
			container.style.position = 'relative';
		}

		this._initPanes();

		if (this._initControlPos) {
			this._initControlPos();
		}
	},

	_initPanes: function () {//创建内部div，并绑样式
		var panes = this._panes = {};

		this._mapPane = panes.mapPane = this._createPane('leaflet-map-pane', this._container);

		this._tilePane = panes.tilePane = this._createPane('leaflet-tile-pane', this._mapPane);
		this._objectsPane = panes.objectsPane = this._createPane('leaflet-objects-pane', this._mapPane);

		panes.shadowPane = this._createPane('leaflet-shadow-pane');
		panes.overlayPane = this._createPane('leaflet-overlay-pane');
		panes.markerPane = this._createPane('leaflet-marker-pane');
		panes.popupPane = this._createPane('leaflet-popup-pane');

		var zoomHide = ' leaflet-zoom-hide';

		if (!this.options.markerZoomAnimation) {
			L.DomUtil.addClass(panes.markerPane, zoomHide);
			L.DomUtil.addClass(panes.shadowPane, zoomHide);
			L.DomUtil.addClass(panes.popupPane, zoomHide);
		}
	},
	/**
	 * [_createPane 创建div]
	 * @param   {[String]} className [类名]
	 * @param   {[HTMLElement]} container [父元素]
	 * @return  {[HTMLElement]}           [div]
	 * @private
	 */
	_createPane: function (className, container) {
		return L.DomUtil.create('div', className, container || this._objectsPane);
	},

	_initializers: [],

	_initHooks: function () {
		var i, len;
		for (i = 0, len = this._initializers.length; i < len; i++) {
			this._initializers[i].call(this);
		}
	},

	_initLayers: function (layers) {
		layers = layers ? (layers instanceof Array ? layers : [layers]) : [];

		this._layers = {};
		this._tileLayersNum = 0;

		var i, len;

		for (i = 0, len = layers.length; i < len; i++) {
			this.addLayer(layers[i]);
		}
	},


	// private methods that modify map state
	/**
	 * [_resetView 改变地图状态，触发各种事件]
	 * @param   {[type]} center            [中心点]
	 * @param   {[type]} zoom              [级别]
	 * @param   {[Boolean]} preserveMapOffset [是否设置地图偏移量]
	 * @param   {[type]} afterZoomAnim     [description]
	 * @return  {[type]}                   [description]
	 * @private
	 */
	_resetView: function (center, zoom, preserveMapOffset, afterZoomAnim) {

		var zoomChanged = (this._zoom !== zoom);

		if (!afterZoomAnim) {
			this.fire('movestart');//触发movestart事件

			if (zoomChanged) {
				this.fire('zoomstart');//触发zoomstart事件
			}
		}

		this._zoom = zoom;

		this._initialTopLeftPoint = this._getNewTopLeftPoint(center);//左上角像素坐标

		if (!preserveMapOffset) {
			L.DomUtil.setPosition(this._mapPane, new L.Point(0, 0));
		} else {
			this._initialTopLeftPoint._add(this._getMapPanePos());//左上角像素坐标加上偏移量
		}

		this._tileLayersToLoad = this._tileLayersNum;

		this.fire('viewreset', {hard: !preserveMapOffset});

		this.fire('move');

		if (zoomChanged || afterZoomAnim) {
			this.fire('zoomend');
		}

		this.fire('moveend', {hard: !preserveMapOffset});

		if (!this._loaded) {
			this._loaded = true;
			this.fire('load');
		}
	},

	_rawPanBy: function (offset) {
		L.DomUtil.setPosition(this._mapPane, this._getMapPanePos().subtract(offset));
	},


	// map events

	_initEvents: function () {//事件绑定
		if (!L.DomEvent) { return; }

		L.DomEvent.on(this._container, 'click', this._onMouseClick, this);

		var events = ['dblclick', 'mousedown', 'mouseup', 'mouseenter', 'mouseleave', 'mousemove', 'contextmenu'],
			i, len;

		for (i = 0, len = events.length; i < len; i++) {
			L.DomEvent.on(this._container, events[i], this._fireMouseEvent, this);
		}

		if (this.options.trackResize) {
			L.DomEvent.on(window, 'resize', this._onResize, this);
		}
	},

	_onResize: function () {
		L.Util.cancelAnimFrame(this._resizeRequest);
		this._resizeRequest = L.Util.requestAnimFrame(this.invalidateSize, this, false, this._container);
	},

	_onMouseClick: function (e) {
		if (!this._loaded || (this.dragging && this.dragging.moved())) { return; }

		this.fire('preclick');
		this._fireMouseEvent(e);
	},

	_fireMouseEvent: function (e) {//鼠标事件响应函数
		if (!this._loaded) { return; }

		var type = e.type;

		type = (type === 'mouseenter' ? 'mouseover' : (type === 'mouseleave' ? 'mouseout' : type));

		if (!this.hasEventListeners(type)) { return; }

		if (type === 'contextmenu') {
			L.DomEvent.preventDefault(e);
		}

		var containerPoint = this.mouseEventToContainerPoint(e),
			layerPoint = this.containerPointToLayerPoint(containerPoint),
			latlng = this.layerPointToLatLng(layerPoint);

		this.fire(type, {
			latlng: latlng,
			layerPoint: layerPoint,
			containerPoint: containerPoint,
			originalEvent: e
		});
	},

	_onTileLayerLoad: function () {
		// TODO super-ugly, refactor!!!
		// clear scaled tiles after all new tiles are loaded (for performance)
		this._tileLayersToLoad--;
		if (this._tileLayersNum && !this._tileLayersToLoad && this._tileBg) {
			clearTimeout(this._clearTileBgTimer);
			this._clearTileBgTimer = setTimeout(L.Util.bind(this._clearTileBg, this), 500);
		}
	},


	// private methods for getting map state

	_getMapPanePos: function () {
		return L.DomUtil.getPosition(this._mapPane);
	},

	_getTopLeftPoint: function () {
		if (!this._loaded) {
			throw new Error('Set map center and zoom first.');
		}

		return this._initialTopLeftPoint.subtract(this._getMapPanePos());
	},

	_getNewTopLeftPoint: function (center, zoom) {//得到左上角像素坐标
		var viewHalf = this.getSize().divideBy(2);//长宽除以2
		// TODO round on display, not calculation to increase precision?
		return this.project(center, zoom)._subtract(viewHalf)._round();
	},

	_latLngToNewLayerPoint: function (latlng, newZoom, newCenter) {
		var topLeft = this._getNewTopLeftPoint(newCenter, newZoom).add(this._getMapPanePos());
		return this.project(latlng, newZoom)._subtract(topLeft);
	},

	_getCenterLayerPoint: function () {
		return this.containerPointToLayerPoint(this.getSize().divideBy(2));
	},

	_getCenterOffset: function (center) {
		return this.latLngToLayerPoint(center).subtract(this._getCenterLayerPoint());
	},

	_limitZoom: function (zoom) {
		var min = this.getMinZoom(),
			max = this.getMaxZoom();

		return Math.max(min, Math.min(max, zoom));
	}
});
/**
 * [addInitHook 将参数函数或地图原型上某函数绑到地图原型_initializers数组中，
 * 跟地图一起初始化，用于绑定Handler子类]
 * @param {Function} fn [description]
 */
L.Map.addInitHook = function (fn) {
	var args = Array.prototype.slice.call(arguments, 1);//去除第一元素后的参数数组

	var init = typeof fn === 'function' ? fn : function () {
		this[fn].apply(this, args);
	};

	this.prototype._initializers.push(init);//将函数绑在Map上，
};

L.map = function (id, options) {
	return new L.Map(id, options);
};
