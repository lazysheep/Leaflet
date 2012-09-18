/*
 * L.Util is a namespace for various utility functions.
 */

L.Util = {
	extend: function (/*Object*/ dest) /*-> Object*/ {	// merge src properties into dest
		var sources = Array.prototype.slice.call(arguments, 1);
		for (var j = 0, len = sources.length, src; j < len; j++) {
			src = sources[j] || {};
			for (var i in src) {
				if (src.hasOwnProperty(i)) {
					dest[i] = src[i];
				}
			}
		}
		return dest;
	},

	/**
	 * [bind 函数作用域绑定]
	 * @param  {Function} fn     [被绑定函数]
	 * @param  {[Object]}   obj  [fn中this所指对象]
	 * @return {[Function]}          [返回函数，相当于被绑到obj后的fn本身]
	 */
	bind: function (fn, obj) { // (Function, Object) -> Function
		var args = arguments.length > 2 ? Array.prototype.slice.call(arguments, 2) : null;
		return function () {
			return fn.apply(obj, args || arguments);
		};
	},

	/**
	 * [ 为参数obj添加key属性，并返回key值，如果obj有key则返回key值，如果没有，
	 * 则以lastId为key值，lastId在闭包中不被回收，每调用且赋值一次，累计加一]
	 * @return {[type]} [key值]
	 */
	stamp: (function () {
		var lastId = 0, key = '_leaflet_id';
		return function (/*Object*/ obj) {
			obj[key] = obj[key] || ++lastId;
			return obj[key];
		};
	}()),

	/**
	 * [limitExecByInterval description]
	 * @param  {Function} fn      [description]
	 * @param  {[type]}   time    [description]
	 * @param  {[type]}   context [description]
	 * @return {[type]}           [description]
	 */
	limitExecByInterval: function (fn, time, context) {
		var lock, execOnUnlock;

		return function wrapperFn() {
			var args = arguments;

			if (lock) {
				execOnUnlock = true;
				return;
			}

			lock = true;

			setTimeout(function () {
				lock = false;

				if (execOnUnlock) {
					wrapperFn.apply(context, args);
					execOnUnlock = false;
				}
			}, time);

			fn.apply(context, args);
		};
	},

	falseFn: function () {
		return false;
	},

	/**
	 * [formatNum 四舍五入保留num小数点后有效位数]
	 * @param  {[Number]} num    [原数]
	 * @param  {[Number]} digits [小数点后保留几位]
	 * @return {[Number]}        [description]
	 */
	formatNum: function (num, digits) {
		var pow = Math.pow(10, digits || 5);
		return Math.round(num * pow) / pow;
	},

	splitWords: function (str) {
		return str.replace(/^\s+|\s+$/g, '').split(/\s+/);
	},

	/**
	 * [setOptions 扩充Obj。options]
	 * @param {[Object]} obj     [description]
	 * @param {[Object]} options [要扩充的内容]
	 */
	setOptions: function (obj, options) {
		obj.options = L.Util.extend({}, obj.options, options);
		return obj.options;
	},

	/**
	 * [getParamString 将对象拼成请求参数串]
	 * @param  {[type]} obj [description]
	 * @return {[type]}     [description]
	 */
	getParamString: function (obj) {
		var params = [];
		for (var i in obj) {
			if (obj.hasOwnProperty(i)) {
				params.push(i + '=' + obj[i]);
			}
		}
		return '?' + params.join('&');
	},

	template: function (str, data) {
		return str.replace(/\{ *([\w_]+) *\}/g, function (str, key) {
			var value = data[key];
			if (!data.hasOwnProperty(key)) {
				throw new Error('No value provided for variable ' + str);
			}
			return value;
		});
	},

	emptyImageUrl: 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='
};

(function () {

	function getPrefixed(name) {//找到window。webkit/moz/o/ms[name]的值并返回
		var i, fn,
			prefixes = ['webkit', 'moz', 'o', 'ms'];

		for (i = 0; i < prefixes.length && !fn; i++) {
			fn = window[prefixes[i] + name];
		}

		return fn;
	}

	function timeoutDefer(fn) {//不支持的浏览器的替代函数
		return window.setTimeout(fn, 1000 / 60);
	}

	var requestFn = window.requestAnimationFrame ||
			getPrefixed('RequestAnimationFrame') || timeoutDefer;

	var cancelFn = window.cancelAnimationFrame ||
			getPrefixed('CancelAnimationFrame') ||
			getPrefixed('CancelRequestAnimationFrame') ||
			function (id) {
				window.clearTimeout(id);
			};

	/**
	 * [requestAnimFrame 浏览器帧监听处理]
	 * @param  {Function} fn        [description]
	 * @param  {[type]}   context   [description]
	 * @param  {[type]}   immediate [description]
	 * @param  {[type]}   element   [description]
	 * @return {[type]}             [description]
	 */
	L.Util.requestAnimFrame = function (fn, context, immediate, element) {
		fn = L.Util.bind(fn, context);//将上下文context绑在fn上

		if (immediate && requestFn === timeoutDefer) {
			fn();
		} else {
			return requestFn.call(window, fn, element);
		}
	};

	L.Util.cancelAnimFrame = function (id) {
		if (id) {
			cancelFn.call(window, id);
		}
	};

}());
