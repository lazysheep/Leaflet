var L, originalL;//定义命名空间，和别名，避免冲突

if (typeof exports !== undefined + '') {//已存在，直接赋值
	L = exports;
} else {
	originalL = window.L;
	L = {};
	/**
	 * [noConflict L免冲突，如果L发生冲突被重写，用originalL将L值重写回来]
	 * @return {[type]} [矫正过的L]
	 */
	L.noConflict = function () {
		window.L = originalL;
		return this;
	};

	window.L = L;
}

L.version = '0.4.4';//版本号
