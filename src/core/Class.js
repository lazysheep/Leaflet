/*
 * Class powers the OOP facilities of the library. Thanks to John Resig and Dean Edwards for inspiration!
 */

L.Class = function () {};

L.Class.extend = function (/*Object*/ props) /*-> Class*/ {

	// extended class with the new prototype
	/**
	 * [NewClass 作为返回值的新类，实例化或运行该类时，
	 * 运行该类的initialize方法，并将初始化时的参数传给这个方法。]
	 */
	var NewClass = function () {
		if (this.initialize) {
			this.initialize.apply(this, arguments);
		}
	};

	// instantiate class without calling constructor
	/**
	 * [F 一个类，其原型指向L.Class的原型，this指向L.Class]
	 */
	var F = function () {};
	F.prototype = this.prototype;

	/**
	 * [proto F的实例，原型指向L.Class的原型，constructor属性指向NewClass]
	 * @type {F}
	 */
	var proto = new F();
	proto.constructor = NewClass;

	/**
	 * [相当于NewClass.prototype.constructor=NewClass;
	 * NewClass.prototype.__proto__=L.Class.prototype。
	 * L.Class的原型成了NewClass原型链上的第二层]
	 * @type {[type]}
	 */
	NewClass.prototype = proto;

	//inherit parent's statics
	/**
	 * [将L.Class的静态属性复制给NewClass的静态属性]
	 */
	for (var i in this) {
		if (this.hasOwnProperty(i) && i !== 'prototype') {
			NewClass[i] = this[i];
		}
	}

	// mix static properties into the class
	/**
	 * [将props.statics的属性复制给NewClass的静态属性]
	 */
	if (props.statics) {
		L.Util.extend(NewClass, props.statics);
		delete props.statics;
	}

	// mix includes into the prototype
	/**
	 * [调用L.Util.extend,第一个参数是proto，第二个参数是props.includes。
	 * 相当于将后者属性复制给前者，及NewClass的原型]
	 */
	if (props.includes) {
		L.Util.extend.apply(null, [proto].concat(props.includes));
		delete props.includes;
	}

	// merge options
	/**
	 * [合并options]
	 */
	if (props.options && proto.options) {
		props.options = L.Util.extend({}, proto.options, props.options);
	}

	// mix given properties into the prototype
	/**
	 * [将后者复制给前者]
	 */
	L.Util.extend(proto, props);

	return NewClass;
};


// method for adding properties to prototype
/**
 * [include 为原型添加属性，如果调用L.Class.include，则添加所有NewClass的实例的共享的属性，
 * 如果调用NewClass.include,则只为此NewClass的实例添加共享属性]
 * @param  {[Object]} props [description]
 * @return {[type]}       [description]
 */
L.Class.include = function (props) {
	L.Util.extend(this.prototype, props);
};

L.Class.mergeOptions = function (options) {
	L.Util.extend(this.prototype.options, options);
};
/**
 * 总结：1为新类增加静态属性，props.static;
 * 2为新类扩展原型，props.include或NewClass.include;
 * 3为新类扩展原型的options，props.options或NewClass.mergeOptions;
 * 4为所有新类扩展原型，L.Class.include;
 * 5为所有新类扩展原型的options，L.Class.mergeOptions；
 * 6如果调用NewClass.extend,则NewClass的原型成为新类的第二层原型，
 * 及超类，依此方法可以为类分组;
 */