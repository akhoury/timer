(function() {
	var defaultLabel = 'no-label',
		iFramed = location !== parent.location,

		h = {},

		log = function() {
			if (window.console) {
				var args = Array.prototype.slice.call(arguments);
				args.unshift('timer.js');
				try {
					if(console.log.apply)
						console.log.apply(console, args);
					else
						console.log(args.join(', '));
				}
				catch(e) {}
			}
		},

		resolveType = function (str) {
			var type = typeof str;
			if (type !== 'string') {
				return str;
			} else {
				var nb = parseFloat(str);
				if (!isNaN(nb) && isFinite(str))
					return nb;
				if (str === 'false')
					return false;
				if (str === 'true')
					return true;
				if (str === 'undefined')
					return undefined;
				if (str === 'null')
					return null;

				try {
					str = JSON.parse(str);
				} catch (e) {}

				return str;
			}
		},

		firstElementChild = function(el) {
			if (el.firstElementChild) {
				return el.firstElementChild;
			}

			var node = el.firstChild,
				firstElementChild = null;

			for ( ; node; node = node.nextSibling) {
				if (node && node.nodeType === 1) {
					firstElementChild = node;
					break;
				}
			}
			return firstElementChild;
		},

		id = 'timer-text-' + (+ new Date()),

		el,

		ensureTopTextdiv = function() {
			if (!el && document.body) {
				el = document.createElement('div');
				el.id = id;
				el.setAttribute('style', 'font-size:10px;position:fixed;left:0;right:0;top:0;width:100%;background:yellow;padding:10px;margin:0 0 10px 0;z-index:' + (-1 >>> 1) + ' !important;');
				document.body.insertBefore(el, firstElementChild(document.body));
			}
		},

		getParameterByName = function (name) {
			name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
			var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
				results = regex.exec(location.search);
			return results == null ? undefined : resolveType(decodeURIComponent(results[1].replace(/\+/g, " ")));
		},

		now = (function() {
			if (window.performance && performance.now) {
				return performance.now.bind(performance);
			} else {
				return function() {
					return +(new Date());
				}
			}
		})(),

		re = /^timer:/,

		attachEventFn = window.addEventListener ? 'addEventListener' : 'attachEvent',
		scripts = document.getElementsByTagName('script'),
		script = scripts[scripts.length - 1],

		defaultPersistapi = script.src.replace(/\.js/, '.php'),
		defaultAutoreload = 3000,
		defaultTimeout = 60000,

		timeoutQuery = getParameterByName('timerTimeout'),
		hiddenQuery = getParameterByName('timerHidden'),
		autoreloadQuery = getParameterByName('timerAutoreload'),
		persistapiQuery = getParameterByName('timerPersistapi'),

	// from mdn
		keys = Object.keys || (function() {
			var hasOwnProperty = Object.prototype.hasOwnProperty,
				hasDontEnumBug = !({ toString: null }).propertyIsEnumerable('toString'),
				dontEnums = [
					'toString',
					'toLocaleString',
					'valueOf',
					'hasOwnProperty',
					'isPrototypeOf',
					'propertyIsEnumerable',
					'constructor'
				],
				dontEnumsLength = dontEnums.length;
			return function(obj) {
				if (typeof obj !== 'object' && (typeof obj !== 'function' || obj === null)) {
					throw new TypeError('Object.keys called on non-object');
				}
				var result = [], prop, i;
				for (prop in obj) {
					if (hasOwnProperty.call(obj, prop)) {
						result.push(prop);
					}
				}
				if (hasDontEnumBug) {
					for (i = 0; i < dontEnumsLength; i++) {
						if (hasOwnProperty.call(obj, dontEnums[i])) {
							result.push(dontEnums[i]);
						}
					}
				}
				return result;
			};
		})(),

		timer = {

			timeout: timeoutQuery ? typeof timeoutQuery === 'number' ? timeoutQuery : 60000 : false,
			hidden: typeof hiddenQuery === 'boolean' ? hiddenQuery : true,
			autoreload: autoreloadQuery ? typeof autoreloadQuery === 'number' ? autoreloadQuery : defaultAutoreload : false,
			persistapi: persistapiQuery ? typeof persistapiQuery === 'string' ? persistapiQuery : defaultPersistapi : false,

			start: function(label, options) {
				options = options || {};
				label = label || defaultLabel;

				h[label] = {
					t: now(),
					options: options
				};

				h[label].options.hidden = typeof h[label].options.hidden === 'boolean' ? h[label].options.hidden : timer.hidden;

				h[label].options.persistapi =
						typeof h[label].options.persistapi === 'undefined' ?
					timer.persistapi ? typeof timer.persistapi === 'string' ? timer.persistapi : defaultPersistapi : false :
					h[label].options.persistapi ? typeof h[label].options.persistapi === 'string' ? h[label].options.persistapi : defaultPersistapi : false;

				h[label].options.timeout = typeof h[label].options.timeout === 'undefined' ?
					timer.timeout ? typeof timer.timeout === 'number' ? timer.timeout : defaultTimeout :
						false : h[label].options.timeout ? typeof h[label].options.timeout === 'number' ? h[label].options.timeout : defaultTimeout : false;

				window.parent.postMessage('timer:started:' + label + ',' + JSON.stringify(options), '*');

				if (! h[label].options.hidden) {
					var m = 'Started Task: "' + label + '"';
					ensureTopTextdiv();
					if (el) {
						var d = document.getElementById('timer-' + label);
						if (!d) {
							d = document.createElement("div");
							d.id = 'timer-' + label;
						}
						d.innerHTML = m;
						el.appendChild(d);
					} else {
						log(m);
					}
				}

				if (h[label].options.timeout) {
					setTimeout(function() {
						timer.stop(label);
					}, h[label].options.timeout);
				}

			},
			stop: function(label) {
				label = label || defaultLabel;

				if (!h[label]) return;

				var duration = (now() - h[label].t).toFixed(2);

				window.parent.postMessage('timer:stopped:' + label + ',' + duration, '*');

				var ondone = function() {
					timer.last(h[label]);
					delete h[label];
				};


				if (h[label].options.persistapi) {
					var date = new Date();
					var img = document.createElement('img');
					img.onerror = ondone;
					img.src = (h[label].options.persistapi)
						+ '?label=' + encodeURIComponent(label)
						+ '&duration=' + duration
						+ '&page=' + encodeURIComponent(location.href)
						+ '&clientdate=' + date.toISOString()
				}

				if (!h[label].options.hidden) {
					var m = 'Ended Task: "' + label + '" took ' + duration + ' ms';
					if (el) {
						var d = document.getElementById('timer-' + label);
						if (d) {
							d.innerHTML = m;
						}
					} else {
						log(m);
					}
				}

				if (!h[label].options.persistapi) {
					ondone();
				}

				return duration;
			},

			last: function(currentTest) {
				if (keys(h).length === 1) {
					window.parent.postMessage('timer:done:', '*');

					if (timer.autoreload) {

						var ms = typeof timer.autoreload === 'number' ? timer.autoreload : defaultAutoreload;

						if (el && ! currentTest.options.hidden) {
							var p = document.createElement('p');
							p.innerHTML = 'Reloading page in ' + (ms/1000).toFixed(2) + ' seconds';
							el.appendChild(p);
						}

						setTimeout(function() {
							location.reload(true);
						}, ms);
					}
				}
			},

			_bind: function() {
				window[attachEventFn](attachEventFn === 'attachEvent' ? 'onmessage' : 'message', function(e) {
					if (e && e.data && re.test(e.data)) {
						var parts = (e.data || '').split(':');
						var fn = parts[1];
						var args = (parts[2] || '');
						try {
							args = JSON.parse(args);
							args = [args];
						} catch (e) {
							args.split(',');
						}
						if (typeof timer[fn] === 'function') {
							timer[fn].apply(timer, args);
						}
					}
				},false);
			}
		};

	timer.hash = h;
	window.timer = timer;
	timer._bind();
})();