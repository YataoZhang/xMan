/**
 * Created by zhangyatao on 15/9/21.
 */
!function (base) {
    if ("object" == typeof exports && "undefined" != typeof module) {
        module.exports = base();
    } else if ("function" == typeof define && define.amd) {
        define([], base());
    } else {
        var f;
        if ("undefined" != typeof window) {
            f = window
        } else {
            "undefined" != typeof global ? f = global : "undefined" != typeof self && (f = self)
        }
        f.x = base()
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

    var base = function () {
        this.manger = new Manager();
        this.jsonp = this.manger.getJsonp();
        this.cors = this.manger.getCORS();
        this.frameOuter = this.manger.getFrameOuter();
        this.frameInner = this.manger.getFrameInner();
        this.framePost = this.manger.getFrameForm();
    };

    var Manager = function () {
        this.type = {
            Inner: 'inner',
            Outer: 'outer'
        };
    };
    Manager.prototype.getJsonp = function () {
        var i = 0;
        return function (url, data, key, callback) {
            var funcName = 'cb' + i++;
            var callbackName = 'window.x.' + funcName;

            try {
                window.x[funcName] = function (data) {
                    callback(data);
                }
            } finally {
                delete window.x[funcName];
                __script && __script.parentNode.removeChild(__script);
            }

            var __script = document.createElement('script');
            __script.src = url + (/\?/.test(url) ? '&' : '?') + util.encodeObject2URIString(data) + '&' + key + '=' + callbackName;
            document.body.appendChild(__script);
        }
    };
    Manager.prototype.getCORS = function (conf) {
        var supportCORS = (function () {
            if (!('XMLHttpRequest' in window)) {
                return false;
            }
            if ('withCredentials' in new XMLHttpRequest) {
                return XMLHttpRequest;
            }
            if ('XDomainRequest' in window) {
                return XDomainRequest;
            }
            return null;
        })();
        return function (type, url, data, callback,conf) {
            console.info('使用此方法必须服务器端配合.\n1:在响应头中加上Access-Control-Allow-Origin\n2:需要前端携带凭据的话,则后端必须加上Access-Control-Allow-Credentials:true\n3:' +
                '如果需要自定义头信息则响应头必须加上Access-Control-Request-Headers和Access-Control-Allow-Headers\n详情请参考http://www.w3.org/TR/cors/');
            var setings = {
                headers: {},
                withCredentials: false
            };
            var xhr = new supportCORS;
            xhr.open(type, url);
            xhr.onload = function () {
                callback(xhr.responseText);
            };
            xhr.send(data);

        }
    };
    Manager.prototype.getFrame = function (type) {
        if (type === this.type.Inner) {
            return this.getFrameInner()
        } else {
            return this.getFrameOuter();
        }
    };
    Manager.prototype.getFrameInner = function () {
        return new frameHandle(window.top);
    };
    Manager.prototype.getFrameOuter = function () {
        return new frameHandle(window.frames[0])
    };
    Manager.prototype.getFrameForm = function () {
        return function () {
        }
    };

    var frameHandle = function (target) {
        this.target = target;
        this.frameHandle = getFrameHelper();
    };
    frameHandle.prototype = {
        addCallback: function (name, cb) {
            this.frameHandle['on' + name] = function () {
                cb();
            };
        },
        sendMessage: function (name, param, targetWindow) {
            crossDomainOuter.postMessage({
                type: 'event',
                eventName: name,
                param: param || {}
            }, targetWindow || this.target);
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
                        if (window.postMessage.toString().indexOf('[native code]') >= 0) {
                            return true;
                        }
                        return false;
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
            }
        }
    })();


    var util = {
        encodeObject2URIString: function (obj) {
            if (typeof obj == 'string') {
                return obj;
            }
            var arr = [];
            for (var n in obj) {
                if (!obj.hasOwnPropertyn(n) || typeof obj[n] === 'function') {
                    continue;
                }
                arr.push(encodeURIComponent(n) + '=' + encodeURIComponent(obj[n]));
            }
            return arr.join('&');
        },
        stringify: function (obj) {
            var t = typeof obj;
            var callee = this.stringify;
            if (t !== 'object' || obj == null) {
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
                    v = obj[n];
                    t = typeof v;
                    if (obj.hasOwnProperty(n)) {
                        if (t === 'string') {
                            v = '"' + v + '"';
                        }
                        else if (t === 'object' && v != null) {
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
        }
    };

    return new base();
});