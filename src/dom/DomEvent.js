/*
 * L.DomEvent contains functions for working with DOM events.
 */

L.DomEvent = {
	/* inpired by John Resig, Dean Edwards and YUI addEvent implementations */
	/**
	 * [addListener 为dom绑定事件]
	 * @param {[HTMLElement]}   obj       [dom]
	 * @param {[String]}   type      [事件类型]
	 * @param {Function} fn        [相应函数]
	 * @param {[obj]}   context [fn的上下文]
	 */
	addListener: function (obj, type, fn, context) { // (HTMLElement, String, Function[, Object])

		var id = L.Util.stamp(fn),//获取fn[key]值
			key = '_leaflet_' + type + id,
			handler, originalHandler, newType;

		if (obj[key]) { return this; }//如果已绑定，返回

		handler = function (e) {
			return fn.call(context || obj, e || L.DomEvent._getEvent());
		};
		//手持双击
		if (L.Browser.touch && (type === 'dblclick') && this.addDoubleTapListener) {
			return this.addDoubleTapListener(obj, handler, id);

		} else if ('addEventListener' in obj) {//支持addEventListener
			
			if (type === 'mousewheel') {
				obj.addEventListener('DOMMouseScroll', handler, false);
				obj.addEventListener(type, handler, false);

			} else if ((type === 'mouseenter') || (type === 'mouseleave')) {

				originalHandler = handler;
				newType = (type === 'mouseenter' ? 'mouseover' : 'mouseout');

				handler = function (e) {
					if (!L.DomEvent._checkMouse(obj, e)) { return; }
					return originalHandler(e);
				};

				obj.addEventListener(newType, handler, false);

			} else {
				obj.addEventListener(type, handler, false);
			}

		} else if ('attachEvent' in obj) {//支持attachEvent
			obj.attachEvent("on" + type, handler);
		}

		obj[key] = handler;//已绑定标识

		return this;
	},
	/**
	 * [removeListener 解除dom绑定]
	 * @param  {[HTMLElement]} obj      [dom]
	 * @param  {[String]} type     [事件类型]
	 * @param  {[Function]} fn [响应函数]
	 */
	removeListener: function (obj, type, fn) {  // (HTMLElement, String, Function)

		var id = L.Util.stamp(fn),
			key = '_leaflet_' + type + id,
			handler = obj[key];

		if (!handler) { return; }

		if (L.Browser.touch && (type === 'dblclick') && this.removeDoubleTapListener) {
			this.removeDoubleTapListener(obj, id);

		} else if ('removeEventListener' in obj) {

			if (type === 'mousewheel') {
				obj.removeEventListener('DOMMouseScroll', handler, false);
				obj.removeEventListener(type, handler, false);

			} else if ((type === 'mouseenter') || (type === 'mouseleave')) {
				obj.removeEventListener((type === 'mouseenter' ? 'mouseover' : 'mouseout'), handler, false);
			} else {
				obj.removeEventListener(type, handler, false);
			}
		} else if ('detachEvent' in obj) {
			obj.detachEvent("on" + type, handler);
		}

		obj[key] = null;

		return this;
	},
	/**
	 * [stopPropagation 阻止冒泡]
	 * @param  {[object]} e [事件对象]
	 * @return {[type]}   [description]
	 */
	stopPropagation: function (e) {

		if (e.stopPropagation) {
			e.stopPropagation();
		} else {
			e.cancelBubble = true;
		}
		return this;
	},
	/**
	 * [disableClickPropagation 阻止点击冒泡]
	 * @param  {[HTMLElement]} el [dom]
	 * @return {[type]}    [description]
	 */
	disableClickPropagation: function (el) {

		var stop = L.DomEvent.stopPropagation;
		
		return L.DomEvent
			.addListener(el, L.Draggable.START, stop)
			.addListener(el, 'click', stop)
			.addListener(el, 'dblclick', stop);
	},

	/**
	 * [preventDefault 阻止标签默认行为]
	 * @param  {[type]} e [事件对象]
	 * @return {[type]}   [description]
	 */
	preventDefault: function (e) {

		if (e.preventDefault) {
			e.preventDefault();
		} else {
			e.returnValue = false;
		}
		return this;
	},
	/**
	 * [stop 同时阻止默认行为和冒泡]
	 * @param  {[type]} e [description]
	 * @return {[type]}   [description]
	 */
	stop: function (e) {
		return L.DomEvent.preventDefault(e).stopPropagation(e);
	},

	getMousePosition: function (e, container) {

		var body = document.body,
			docEl = document.documentElement,
			x = e.pageX ? e.pageX : e.clientX + body.scrollLeft + docEl.scrollLeft,
			y = e.pageY ? e.pageY : e.clientY + body.scrollTop + docEl.scrollTop,
			pos = new L.Point(x, y);

		return (container ? pos._subtract(L.DomUtil.getViewportOffset(container)) : pos);
	},
	/**
	 * [getWheelDelta 跨浏览器取得滚轮滚动值]
	 * @param  {[type]} e [事件对象]
	 * @return {[Number]}   [滚轮滚动值]
	 */
	getWheelDelta: function (e) {

		var delta = 0;

		if (e.wheelDelta) {
			delta = e.wheelDelta / 120;
		}
		if (e.detail) {
			delta = -e.detail / 3;
		}
		return delta;
	},

	// check if element really left/entered the event target (for mouseenter/mouseleave)
	_checkMouse: function (el, e) {

		var related = e.relatedTarget;

		if (!related) { return true; }

		try {
			while (related && (related !== el)) {
				related = related.parentNode;
			}
		} catch (err) {
			return false;
		}
		return (related !== el);
	},

	/*jshint noarg:false */
	_getEvent: function () { // evil magic for IE

		var e = window.event;
		if (!e) {
			var caller = arguments.callee.caller;
			while (caller) {
				e = caller['arguments'][0];
				if (e && window.Event === e.constructor) {
					break;
				}
				caller = caller.caller;
			}
		}
		return e;
	}
	/*jshint noarg:false */
};

L.DomEvent.on = L.DomEvent.addListener;
L.DomEvent.off = L.DomEvent.removeListener;