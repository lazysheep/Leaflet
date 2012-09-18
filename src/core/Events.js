/*
 * L.Mixin.Events adds custom events functionality to Leaflet classes
 */

var key = '_leaflet_events';

L.Mixin = {};

L.Mixin.Events = {
	
	addEventListener: function (types, fn, context) { // (String, Function[, Object]) or (Object[, Object])
		var events = this[key] = this[key] || {},
			type, i, len;
		
		// Types can be a map of types/handlers
		/**
		 * [types types可以是存有事件绑定信息的索引对象，遍历此对象，循环掉用该方法]
		 * @type {[type]}
		 */
		if (typeof types === 'object') {
			for (type in types) {
				if (types.hasOwnProperty(type)) {
					this.addEventListener(type, types[type], fn);//?为什么第三个参数是fn，第三个参数代表什么
				}
			}
			
			return this;
		}
		
		types = L.Util.splitWords(types);//将types字符串转成数组，以空格分隔
		
		/**
		 * [遍历types将事件响应信息绑到this['_leaflet_events']上]
		 * @type {Number}
		 */
		for (i = 0, len = types.length; i < len; i++) {
			events[types[i]] = events[types[i]] || [];
			events[types[i]].push({
				action: fn,
				context: context || this
			});
		}
		
		return this;
	},

	/**
	 * [hasEventListeners 对象是否绑定了type类型事件]
	 * @param  {[String]}  type [事件类型]
	 * @return {Boolean}       [是否已绑定]
	 */
	hasEventListeners: function (type) { // (String) -> Boolean
		return (key in this) && (type in this[key]) && (this[key][type].length > 0);
	},

	removeEventListener: function (types, fn, context) { // (String[, Function, Object]) or (Object[, Object])
		var events = this[key],
			type, i, len, listeners, j;
		
		if (typeof types === 'object') {//批量删除
			for (type in types) {
				if (types.hasOwnProperty(type)) {
					this.removeEventListener(type, types[type], fn);
				}
			}
			
			return this;
		}
		
		types = L.Util.splitWords(types);

		for (i = 0, len = types.length; i < len; i++) {//遍历事件类型

			if (this.hasEventListeners(types[i])) {
				listeners = events[types[i]];
				
				for (j = listeners.length - 1; j >= 0; j--) {//遍历某类型下的函数并删除
					if (
						(!fn || listeners[j].action === fn) &&
						(!context || (listeners[j].context === context))
					) {
						listeners.splice(j, 1);
					}
				}
			}
		}
		
		return this;
	},

	/**
	 * [fireEvent 触发指定事件]
	 * @param  {[String]} type    [事件类型]
	 * @param  {[Object]} data    [扩充事件对象]
	 * @return {[type]}         [description]
	 */
	fireEvent: function (type, data) { // (String[, Object])
		if (!this.hasEventListeners(type)) {//为绑定返回
			return this;
		}

		var event = L.Util.extend({//扩充事件对象
			type: type,
			target: this
		}, data);

		var listeners = this[key][type].slice();

		for (var i = 0, len = listeners.length; i < len; i++) {//遍历触发
			listeners[i].action.call(listeners[i].context || this, event);
		}

		return this;
	}
};

L.Mixin.Events.on = L.Mixin.Events.addEventListener;//别名
L.Mixin.Events.off = L.Mixin.Events.removeEventListener;
L.Mixin.Events.fire = L.Mixin.Events.fireEvent;
