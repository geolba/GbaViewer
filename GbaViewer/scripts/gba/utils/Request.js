define('gba/utils/Request', [],
function () {
    'use strict';
    var callbacks = 0;

    window._Callbacks = {};

    var serialize = function (params) {
        var data = '';

        params.f = params.f || 'json';

        for (var key in params) {
            if (params.hasOwnProperty(key)) {
                var param = params[key];
                var type = Object.prototype.toString.call(param);
                var value;

                if (data.length) {
                    data += '&';
                }

                if (type === '[object Array]') {
                    value = (Object.prototype.toString.call(param[0]) === '[object Object]') ? JSON.stringify(param) : param.join(',');
                } else if (type === '[object Object]') {
                    value = JSON.stringify(param);
                } else if (type === '[object Date]') {
                    value = param.valueOf();
                } else {
                    value = param;
                }

                data += encodeURIComponent(key) + '=' + encodeURIComponent(value);
            }
        }

        return data;
    };

    var createRequest = function (callback, context) {
        var httpRequest = new XMLHttpRequest();

        httpRequest.onerror = function (e) {
            callback.call(context, {
                error: {
                    code: 500,
                    message: 'XMLHttpRequest error: ' + e
                }
            }, null);
        };

        httpRequest.onreadystatechange = function () {
            var response;
            var error;

            if (httpRequest.readyState === 4) {
                try {
                    response = httpRequest.responseText;//JSON.parse(httpRequest.responseText);
                } catch (e) {
                    response = null;
                    error = {
                        code: 500,
                        message: 'Could not parse response as JSON.'
                    };
                }

                if (!error && response.error) {
                    error = response.error;
                    response = null;
                }

                callback.call(context, error, response);
            }
        };

        return httpRequest;
    };

    // AJAX handlers for CORS (modern browsers) or JSONP (older browsers)
    var Request = {

        supportCors: window.XMLHttpRequest && 'withCredentials' in new XMLHttpRequest(),

        request: function (url, params, callback, context) {
            var paramString = serialize(params);
            //var paramString = L.Util.getParamString(params);
            var httpRequest = createRequest(callback, context);
            var requestLength = (url + '?' + paramString).length;

            // request is less then 2000 characters and the browser supports CORS, make GET request with XMLHttpRequest
            if (requestLength < 2000 && this.supportCors) {
                httpRequest.open('GET', url + '?' + paramString);
                httpRequest.send(null);
            }

                // request is less more then 2000 characters and the browser supports CORS, make POST request with XMLHttpRequest
            else if (requestLength >= 2000 && this.supportCors) {
                httpRequest.open('POST', url);
                httpRequest.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                httpRequest.send(paramString);


            }
                // request is less more then 2000 characters and the browser does not support CORS, make a JSONP request
            else if (requestLength <= 2000 && !this.supportCors) {
                return this.get.JSONP(url, params, callback, context);


            }
                // request is longer then 2000 characters and the browser does not support CORS, log a warning	
            else {
                if (console && console.warn) {
                    //logger.warning('a request to ' + url + ' was longer then 2000 characters and this browser cannot make a cross-domain post request. Please use a proxy http://esri.github.io/esri-leaflet/api-reference/request.html', true);
                    console.warn('a request to ' + url + ' was longer then 2000 characters and this browser cannot make a cross-domain post request. Please use a proxy http://esri.github.io/esri-leaflet/api-reference/request.html');
                    return httpRequest.onerror();
                }
            }

            return httpRequest;
        },

        get: {
            JSONP: function (url, params, callback, context) {
                var callbackId = 'c' + callbacks;

                params.callback = 'window._Callbacks.' + callbackId;

                var script = {};
                //var script = L.DomUtil.create('script', null, document.body);
                script.type = 'text/javascript';
                script.src = url + '?' + serialize(params);
                script.id = callbackId;

                window._Callbacks[callbackId] = function (response) {
                    if (window._Callbacks[callbackId] !== true) {
                        var error;
                        var responseType = Object.prototype.toString.call(response);

                        if (!(responseType === '[object Object]' || responseType === '[object Array]')) {
                            error = {
                                error: {
                                    code: 500,
                                    message: 'Expected array or object as JSONP response'
                                }
                            };
                            response = null;
                        }

                        if (!error && response.error) {
                            error = response;
                            response = null;
                        }

                        callback.call(context, error, response);
                        window._Callbacks[callbackId] = true;
                    }
                };

                callbacks++;

                return {
                    id: callbackId,
                    url: script.src,
                    abort: function () {
                        window._Callbacks._callback[callbackId]({
                            code: 0,
                            message: 'Request aborted.'
                        });
                    }
                };
            }
        }

    };

    return Request;


});