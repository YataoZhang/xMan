/**
 * Created by zhangyatao on 15/9/21.
 */
!function (entrance) {
    "use strict";
    if ("object" === typeof exports && "undefined" !== typeof module) {
        module.exports = entrance();
    } else if ("function" === typeof define && define.amd) {
        define([], entrance());
    } else {
        var f;
        if ("undefined" !== typeof window) {
            f = window;
        } else {
            throw new Error('wrong execution environment');
        }
        f.x = entrance();
    }
}(function () {
    "use strict";
    /**
     * jsonp
     * iframe name|(on/post)message
     * iframe domain
     *
     * 原生 ajax接口
     * iframe form
     */

    var console = window.console || {
            log: function () {
            },
            warn: function () {
            }
        };
    var Base = function () {
        this.manger = new Manager();
        util.each(['Jsonp', 'CORS', 'Frame', 'FrameForm'], function (item) {
            this[item] = this.manger['get' + item]();
        }, this);
    };
    var Manager = function () {
        this.obtainId = (function () {
            var id = 0;
            return function (str) {
                return (str || 'obtainId_') + id++;
            };
        })();
        this.queue = {};
    };
    Manager.prototype.getJsonp = function () {
        var that = this;
        return function (url, data, key, callback) {
            var funcName = 'cb' + that.obtainId();
            var callbackName = 'window.x.' + funcName;
            var __script = document.createElement('script');
            window.x[funcName] = function (data) {
                try {
                    callback(data);
                } finally {
                    delete window.x[funcName];
                    __script.parentNode.removeChild(__script);
                }
            };
            var arr = '';
            if (util.isObject(data)) {
                arr = util.encodeObject2URIString(data);
            }
            arr += arr.length > 0 ? '&' : '';
            __script.src = util.hasSearch(url, arr + key + '=' + callbackName);
            document.body.appendChild(__script);
        };
    };
    Manager.prototype.getCORS = function (conf) {
        var supportCORS = (function () {
            if (!('XMLHttpRequest' in window)) {
                return false;
            }
            if ('withCredentials' in new XMLHttpRequest()) {
                return XMLHttpRequest;
            }
            if ('XDomainRequest' in window) {
                return window.XDomainRequest;
            }
            return null;
        })();
        return function (type, url, data, callback, conf) {
            console.info('使用此方法必须服务器端配合.\n1:在响应头中加上Access-Control-Allow-Origin\n2:需要前端携带凭据的话,则后端必须加上Access-Control-Allow-Credentials:true\n3:' +
                '如果需要自定义头信息则响应头必须加上Access-Control-Request-Headers和Access-Control-Allow-Headers\n详情请参考http://www.w3.org/TR/cors/');
            if (!supportCORS) {
                console.warn('[WARN] 当前浏览器支持此功能,请常识其他方式进行跨域请求.');
                return;
            }
            if (util.isPureObject(data)) {
                data = util.encodeObject2URIString(data);
            }
            if (String(type).toLowerCase() === 'get' && util.isString(data) && data.length > 0) {
                url = util.hasSearch(url, data);
                data = void 0;
            }
            conf = conf || {};
            var xhr = new supportCORS();
            xhr.open(type, url);
            util.forIn(conf.headers, function (key, value) {
                xhr.setRequestHeader(key, value);
            });
            xhr.withCredentials = !!conf.withCredentials;
            xhr.onload = function () {
                callback(xhr.responseText);
            };
            xhr.send(data);
        };
    };
    Manager.prototype.getFrame = function () {
        return function (target) {
            return new frameHandle(target);
        };
    };
    Manager.prototype.createIframe = function (frameName) {
        var iframe, that = this;
        try {
            iframe = document.createElement('<iframe name="' + frameName + '">');
        } catch (ex) {
            iframe = document.createElement('iframe');
        }
        iframe.name = frameName;
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        iframe.onload = function () {
            var cb = that.queue[iframe.name];
            if (cb) {
                try {
                    cb(iframe.contentWindow.name);
                } finally {
                    iframe.parentNode.removeChild(iframe);
                    delete that.queue[iframe.name];
                }
            }
        };
    };
    Manager.prototype.getFrameForm = function () {
        var form = null, that = this;
        // enctype [application/x-www-form-urlencoded] [multipart/form-data] [text/plain]
        return function (type, url, data, callback, enctype) {
            if (form === null) {
                form = document.createElement('form');
                document.body.appendChild(form);
            }
            var frameName = that.obtainId();
            that.createIframe(frameName);
            form.method = type;
            form.enctype = enctype || 'application/x-www-form-urlencoded';
            form.setAttribute('target', frameName);
            form.action = url;
            that.queue[frameName] = callback;
            form.innerHTML = "";
            util.forIn(data, function (key, value) {
                var input = document.createElement('input');
                input.type = 'hidden';
                input.name = key;
                input.value = value;
                form.appendChild(input);
            });
            form.submit();
        };
    };
    var frameHandle = function (target) {
        this.target = target;
        this.frameHandle = getFrameHelper();
        this.frameHandle.init();
    };
    frameHandle.prototype = {
        on: function (name, cb) {
            this.frameHandle['on' + name] = function (data) {
                cb(data);
            };
        },
        send: function (message) {
            var that = this;
            that.frameHandle.postMessage(message, that.target);
        },
        emit: function (name, param) {
            var that = this;
            that.frameHandle.postMessage({
                type: 'event',
                eventName: name,
                param: param || {}
            }, that.target);
        },
        fire: function (name, params) {
            this.frameHandle.dispatchEvent(name, params);
        }
    };
    var getFrameHelper = (function () {
        var conf = {
            DEBUG: false,
            supportPostMessage: (function () {
                if (window.postMessage) {
                    try {
                        return window.postMessage.toString().indexOf('[native code]') >= 0;
                    } catch (e) {
                        return true;
                    }
                }
                return false;
            })()
        };
        return function () {
            return {
                postMessage: function (message, targetWindow) {
                    if (typeof message === 'object') {
                        message = util.stringify(message);
                    }
                    if (typeof message !== 'string' || !targetWindow) {
                        this.dispatchEvent('Error', ['发送的信息格式出现问题']);
                        if (conf.DEBUG) {
                            console.log('[WARN] the message is not a string type or the target window is not exist.');
                        }
                        return;
                    }
                    this.sendMessage(message, targetWindow);
                    this.dispatchEvent('PostMessage', [message, targetWindow]);
                },
                setEventDelegate: function (obj) {
                    this.eventDelegate = obj;
                },
                eventDelegate: this,
                dispatchEvent: function (e, args) {
                    var delegate = this;
                    if (this.eventDelegate) {
                        delegate = this.eventDelegate;
                    }
                    if (typeof delegate['on' + e] === 'function') {
                        if (delegate.DEBUG) {
                            console.log('[LOG] call the delegate function `on' + e + '` of the obj:', delegate, ' successful');
                        }
                        if (Object.prototype.toString.call(args) === '[object Array]' || typeof args === 'object' && args.length) {
                            delegate['on' + e].apply(delegate, args);
                        } else {
                            delegate['on' + e].apply(delegate);
                        }
                        return delegate;
                    }
                    if (delegate.DEBUG) {
                        console.log('[WARN] the delegate function `on' + e + '` of the crossDomainOuter is not a function');
                    }
                    return false;
                },
                bind: function (el, type, fn) {
                    if (!el || typeof fn !== 'function') {
                        return;
                    }
                    if (el.addEventListener) {
                        el.addEventListener(type, fn, false);
                    } else if (el.attachEvent) {
                        el.attachEvent('on' + type, fn);
                    }
                },
                sendMessage: function (message, targetWindow) {
                    if (conf.DEBUG) {
                        console.log('[LOG] will send message to innerWindow:', targetWindow, ', message is:', message);
                    }
                    if (conf.supportPostMessage) {
                        targetWindow.postMessage(message, '*');
                    } else {
                        targetWindow.name = message;
                    }
                },
                init: function () {
                    var that = this;
                    this.eventDelegate = this;
                    var dispatchMsg = function (msg) {
                        if (msg.type === 'event') {
                            that.dispatchEvent(msg.eventName, [msg.param]);
                        } else {
                            that.dispatchEvent('Message', [msg]);
                        }
                    };
                    if (conf.supportPostMessage) {
                        this.bind(window, 'message', function (event) {
                            if (event.data) {
                                var msg = util.parseJSON(event.data);
                                dispatchMsg(msg);
                            }
                        });
                    } else {
                        window.name = '';
                        that.windowName = window.name;
                        setInterval(function () {
                            if (window.name !== that.windowName && window.name !== '') {
                                that.windowName = window.name;
                                var msg = util.parseJSON(that.windowName);
                                dispatchMsg(msg);
                                setTimeout(function () {
                                    window.name = '';
                                    that.windowName = '';
                                }, 20);
                            }
                        }, 100);
                    }
                }
            };
        };
    })();
    var isType = function (type) {
        return function (obj) {
            return Object.prototype.toString.call(obj) === '[object ' + type + ']';
        };
    };
    var util = {
        encodeObject2URIString: function (obj) {
            if (typeof obj === 'string') {
                return obj;
            }
            var arr = [];
            for (var n in obj) {
                if (!obj.hasOwnProperty(n) || typeof obj[n] === 'function') {
                    continue;
                }
                arr.push(encodeURIComponent(n) + '=' + encodeURIComponent(obj[n]));
            }
            return arr.join('&');
        },
        stringify: function (obj) {
            var t = typeof obj;
            var callee = util.stringify;
            if (t !== 'object' || obj === null) {
                if (t === 'string') {
                    obj = '"' + obj + '"';
                }
                return String(obj);
            } else {
                if (typeof JSON === 'object' && JSON.stringify) {
                    return JSON.stringify(obj);
                }
                var v;
                var json = [];
                var arr = obj && obj.constructor === Array;
                for (var n in obj) {
                    if (obj.hasOwnProperty(n)) {
                        v = obj[n];
                        t = typeof v;
                        if (t === 'string') {
                            v = '"' + v + '"';
                        }
                        else if (t === 'object' && v !== null) {
                            v = callee(v);
                        }
                        json.push((arr ? '' : '"' + n + '":') + String(v));
                    }
                }
                return (arr ? '[' : '{') + String(json) + (arr ? ']' : '}');
            }
        },
        parseJSON: function (data) {
            var rvalidchars = /^[\],:{}\s]*$/;
            var rvalidescape = /\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g;
            var rvalidtokens = /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g;
            var rvalidbraces = /(?:^|:|,)(?:\s*\[)+/g;
            if (typeof data === 'object') {
                return data;
            }
            if (typeof data !== 'string' || !data) {
                return null;
            }
            data = data.replace(/(^\s+)|(\s+$)/g, '');
            if (rvalidchars.test(data.replace(rvalidescape, '@').replace(rvalidtokens, ']').replace(rvalidbraces, ''))) {
                return window.JSON && window.JSON.parse ? window.JSON.parse(data) : (new Function('return ' + data))();
            } else {
                return data;
            }
        },
        // 绑定函数中的this关键字
        bind: function (func, context) {
            if (Function.prototype.bind) {
                return func.bind(context);
            }
            return function () {
                func.apply(context, arguments);
            };
        },
        hasSearch: function (str, data) {
            var symbol = '';
            if (/\?/.test(str)) {
                symbol = '&';
            } else {
                symbol = '?';
            }
            return str + symbol + data;
        },
        /**
         * obj [object] 需要遍历的那个对象
         * callback [function] 回调函数
         * */
        forIn: function (obj, callback) {
            if (!util.isObject(obj)) {
                return;
            }
            for (var n in obj) {
                if (obj.hasOwnProperty(n)) {
                    callback.call(null, n, obj[n]);
                }
            }
        },
        //遍历  不管对象还是数组都可以遍历
        /***
         * iteraler [object|array] 需要进行遍历的参数
         */
        iteral: function (iteraler, callback) {
            if (util.isArray(iteraler)) {
                return util.each.apply(null, [iteraler, callback]);
            }
            if (util.isObject(iteraler)) {
                return util.forIn.apply(null, arguments);
            }
        },
        each: (function () {
            if ([].forEach) {
                /**
                 * list [array] 要遍历的集合
                 * callback [function] 回调函数
                 * */
                return function (list) {
                    [].forEach.apply(list, [].slice.call(arguments, 1));
                };
            }
            return function (list, callback) {
                for (var i = 0, len = list.length; i < len; i++) {
                    callback.call(arguments[2], list[i], i, list);
                }
            };
        })(),
        init: function () {
            util.each(['Object', 'String', 'Function', 'Array'], function (item) {
                util['is' + item] = isType(item);
            });
        },
        isPureObject: function (data) {
            return !!(util.isObject(data) && data.constructor === Object);
        }
    };
    util.init();
    var verify = function (obj) {
        if (!(this instanceof  verify)) {
            return new verify(obj);
        }
        this.data = obj;
        this.queue = [];
    };
    verify.prototype.pushVerify = function () {
        [].push.apply(this.queue, arguments);
        return this;
    };
    verify.prototype.start = function () {
        var that = this;
        util.each(this.queue, function (item) {
            if (!item.verify.call(that.data)) {
                throw new Error('[VERIFY LOG] name: ' + item.name + '; ' + item.errorMsg || '验证出现错误,缺少失败原因');
            }
        });
    };
    var baseInstance = new Base();
    var entrance = function (conf) {
        if (!util.isObject(conf))
            return;
        var DefaultSettions = {
            method: 'get',
            type: 'jsonp',
            data: {},
            success: function () {
            },
            url: '',
            contentType: 'application/x-www-form-urlencoded',
            callbackName: 'cb',
            withCredentials: false,
            headers: {},
            targetWindow: window.frames[0] || window.top,
            cache: false
        };
        util.forIn(DefaultSettions, function (key) {
            DefaultSettions[key] = conf[key] || DefaultSettions[key];
        });
        verify(DefaultSettions).pushVerify({
            name: '验证method',
            verify: function () {
                if (/^(get|post)$/igm.test(this.method)) {
                    if (this.method === 'post') {
                        return !/^(jsonp|frame)$/.test(this.type);
                    }
                    return true;
                }
            },
            errorMsg: '[ERROR:如使用post方法则不能使用以下方式进行跨域请求"jsonp,frame"]'
        }, {
            name: '验证type',
            verify: function () {
                return /^(jsonp|crossDomain|frame|formRequest)$/igm.test(this.type);
            },
            errorMsg: '[ERROR:只能使用以下方法方式进行跨域请求"jsonp,crossDoamin,frame,formRequest"]'
        }, {
            name: '验证url',
            verify: function () {
                if (this.method === 'get' && /(jsonp|crossDomain|formRequest)/.test(this.type)) {
                    this.url = util.hasSearch(this.url, util.encodeObject2URIString(this.data));
                    this.data = void 0;
                }
                return true;
            }
        }, {
            name: '验证cache',
            verify: function () {
                if (this.cache === false) {
                    this.url = util.hasSearch(this.url, '_=' + parseInt(Math.random() * 0xffffff, 10));
                }
                return true;
            }
        }).start();
        switch (DefaultSettions.type) {
            case 'jsonp':
                return baseInstance.Jsonp(DefaultSettions.url, DefaultSettions.data, DefaultSettions.callbackName, DefaultSettions.success);
            case 'crossDomain':
                return baseInstance.CORS(DefaultSettions.method, DefaultSettions.url, DefaultSettions.data, DefaultSettions.success, {
                    headers: DefaultSettions.headers,
                    withCredentials: DefaultSettions.withCredentials
                });
            case  'frame':
                return baseInstance.Frame(DefaultSettions.targetWindow);
            case  'formRequest':
                return baseInstance.FrameForm(DefaultSettions.method, DefaultSettions.url, DefaultSettions.data, DefaultSettions.success, DefaultSettions.contentType);
        }
    };
    util.forIn({
        jsonp: 'Jsonp',
        crossDomain: 'CORS',
        frame: 'Frame',
        formRequest: 'FrameForm'
    }, function (key, value) {
        entrance[key] = function () {
            return baseInstance[value].apply(null, arguments);
        };
    });
    entrance.version = '0.9.0';
    return entrance;
});