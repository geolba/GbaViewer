define(["dojo/_base/declare", "dojo/_base/lang", "dojo/request", "esri/graphic", "dojo/_base/array", "app/proj4js/proj4js-amd", "esri/geometry/Extent", "dojo/dom-construct", "dojo/NodeList-manipulate"],
    function (declare, lang, request, Graphic, array, proj4js, Extent, domConstruct) {
        "use strict";

        var wmsIdentify = declare("gba.tasks.WmsIdentify", [], {
          
            //properties
            declaredClass: "gba.tasks.WmsIdentify",
            lastSearchResult: null,      
            queryParams: null,
            seatGeekUrl: null,
            visibleLayers: null,
            layerInfos: null,
            _REVERSED_LAT_LONG_RANGES: [[4001, 4999], [2044, 2045], [2081, 2083], [2085, 2086],
                [2093, 2093], [2096, 2098], [2105, 2132], [2169, 2170], [2176, 2180], [2193, 2193],
                [2200, 2200], [2206, 2212], [2319, 2319], [2320, 2462], [2523, 2549], [2551, 2735],
                [2738, 2758], [2935, 2941], [2953, 2953], [3006, 3030], [3034, 3035], [3058, 3059],
                [3068, 3068], [3114, 3118], [3126, 3138], [3300, 3301], [3328, 3335], [3346, 3346],
                [3350, 3352], [3366, 3366], [3416, 3416], [20004, 20032], [20064, 20092], [21413, 21423],
                [21473, 21483], [21896, 21899], [22171, 22177], [22181, 22187], [22191, 22197], [25884, 25884],
                [27205, 27232], [27391, 27398], [27492, 27492], [28402, 28432], [28462, 28492], [30161, 30179],
                [30800, 30800], [31251, 31259], [31275, 31279], [31281, 31290], [31466, 31700]],

            //constructor for initializing the class
            constructor: function (options) {
                options = options || {};
                //specify class defaults:
                this.seatGeekUrl = options.defaultUrl;
                this.layerInfos = options.layerInfos;

                // returnEvents is called by an external function, esri.request
                // hitch() is used to provide the proper context so that returnEvents
                // will have access to the instance of this class
                this.returnEvents = lang.hitch(this, this.returnEvents);
                //this.execute = lang.hitch(this, this.execute);

                this._initialize();
            },

            _initialize: function () {
                //this.layerInfos &&
                if (this.layerInfos !== null && this.layerInfos !== undefined) {
                    this.layers = [],
                    array.forEach(this.layerInfos, function (layerInfo) {
                        var isSupported = true;//this._isSupportedLayerType(layerInfo.layer);
                        //if (this._isSupportedLayerType(layerInfo.layer)) {
                        if (isSupported) {
                            if (layerInfo.title) {
                                layerInfo.layer._titleForLegend = layerInfo.title;
                            }


                            layerInfo.layer._hideDefaultSymbol = (false === layerInfo.defaultSymbol) ? true : false;
                            if (layerInfo.hideLayers) {
                                layerInfo.layer._hideLayersInLegend = layerInfo.hideLayers;
                                //this._addSubLayersToHide(layerInfo);
                            }
                            else {
                                layerInfo.layer._hideLayersInLegend = [];
                                layerInfo.hoverLabel && (layerInfo.layer._hoverLabel = layerInfo.hoverLabel);
                                layerInfo.hoverLabels && (layerInfo.layer._hoverLabels = layerInfo.hoverLabels);
                                this.layers.push(layerInfo.layer);
                            }
                        }
                    }, this);
                }           
              
            },
          
            execute: function (params) {
                //this.supportedCrs = params.supportedCrs;
                //var eventsResponse;
                this.visibleLayers = "";//params.visibleLayers.split(',');

                var mapScale = params.mapScale;
                for (var j = this.layers.length - 1; j >= 0; j--) {
                    var layer = this.layers[j];
                    if (layer.visible) {
                        for (var i = layer.layerInfos.length - 1; i >= 0; i--) {
                            var layerInfo = layer.layerInfos[i];
                            if (-1 < array.indexOf(layer.visibleLayers, layerInfo.name)) {
                                if (this._isWmsLayerInScale(layerInfo, mapScale)) {
                                    if (this.visibleLayers === "") {
                                        this.visibleLayers += layerInfo.name;
                                    }
                                    else {
                                        this.visibleLayers += "," + layerInfo.name;
                                    }
                                }
                            }
                        }
                    }
                }


                var extent = params.extent;             

                //var isEsriProjection = (extent.spatialReference.wkid === 102100 || extent.spatialReference.wkid === 3857) ? true : false;              
                //if ((extent.spatialReference.wkid !== params.wkidDest) && isEsriProjection === false) {
                            

                var wkidSrc = extent.spatialReference.wkid;
                var wkidDest = "3857";// params.wkidDest;
                var minPoint = { x: extent.xmin, y: extent.ymin, spatialReference: { wkid: wkidSrc } };
                var maxPoint = { x: extent.xmax, y: extent.ymax, spatialReference: { wkid: wkidSrc } };

                var source = new proj4js.Proj("EPSG:" + wkidSrc);
                var dest = new proj4js.Proj("EPSG:" + wkidDest);
                var minPointDest = proj4js.transform(source, dest, minPoint);
                var maxPointDest = proj4js.transform(source, dest, maxPoint);
                extent = new Extent({
                    xmax: maxPointDest.x,
                    xmin: minPointDest.x,
                    ymax: maxPointDest.y,
                    ymin: minPointDest.y,
                    "spatialReference": {
                        "wkid": wkidDest
                    }
                });
              


                this.queryParams = {
                    service: "WMS",
                    request: "GetFeatureInfo",
                    version: params.version, //"1.1.1",
                    layers: params.visibleLayers,
                    //"LAYERS": this.visibleLayers,                  
                    transparent: "TRUE",
                    width: params.width.toString(),
                    height: params.height.toString(),
                    query_layers: this.visibleLayers,
                    x: Math.round(params.geometry.x),
                    y: Math.round(params.geometry.y),                    
                    //"INFO_FORMAT": "text/html",
                    info_format: 'text/html'
                };
                //this.queryParams[params.version === '1.3.0' ? 'i' : 'x'] = Math.round(params.geometry.x);
                //this.queryParams[params.version === '1.3.0' ? 'j' : 'y'] = Math.round(params.geometry.y);


                //Referenzangabe versionsbedingt finden:
                //var _wkid = extent.spatialReference ? extent.spatialReference.wkid : NaN;
                var _wkid = wkidDest;
                if (!isNaN(_wkid)) {
                    if (this.queryParams.version === "1.3.0") {
                        this.queryParams.crs = "EPSG:" + _wkid;
                    }
                    else {
                        this.queryParams.srs = "EPSG:" + _wkid;
                    }
                }
                //BBOX korrekt ermitteln
                var _a = extent.xmin;
                var _b = extent.xmax;
                var _c = extent.ymin;
                var _d = extent.ymax;
                if (this.queryParams.VERSION === "1.3.0" && this._useLatLong(_wkid)) {
                    this.queryParams.BBOX = _c + "," + _a + "," + _d + "," + _b;
                }
                else {
                    this.queryParams.BBOX = _a + "," + _c + "," + _b + "," + _d;
                }

                // Assemble the new uri with its query string attached.
                //var queryStr = ioQuery.objectToQuery(this.queryParams);
                var query_params = this.seatGeekUrl;
                query_params = (query_params.indexOf("?") === -1) ? (query_params+"?") : (query_params+"");
                for (var property in this.queryParams) {
                    if (this.queryParams.hasOwnProperty(property)) {
                        query_params += (query_params.substring(query_params.length - 1, query_params.length) === "?") ? "" : "&"; query_params += property + "=" + this.queryParams[property];
                    }
                }
                var urlGet = "proxy.ashx?" + query_params;
              
                // seat geek endpoints:   
                var eventsResponse = request.get(urlGet, {
                    data: this.queryParams
                    //handleAs: "text"
                });
                return eventsResponse.then(this.returnEvents, this.err);

                   
                //var url = this.seatGeekUrl;
                //url = (url.indexOf("?") === -1) ? (url + "?") : (url + "");
                //myRequest.request("http://gisgba.geologie.ac.at/arcgis/services/maps/TGW500/MapServer/WMSServer",
                //  this.queryParams,
                //    function (error, data) {
                //        if (error) {
                //            if (error.message !== "abort") {
                //                //// probably nothing to do here: the request was aborted as a response to subsequent user action
                //                //logger.error(error.message + ": points couldn't be loaded222", true);
                //            }
                //            return this.err();
                //        }
                //        else {
                //            return this.returnEvents();
                //        }
                //    }, this);

            },
            
            returnEvents: function (response) {
                // check number of results              
                if (response === null || response === "") {
                    // console.log("Seat Geek returned zero events: ", response);
                    return null;
                }
                            //test if text is html
                if (this._isHTML(response)) {
                    //return response;
                    var bodyHtml = (/<body.*?>([\s\S]*)<\/body>/).exec(response);
                    var style = (/<style.*?>([\s\S]*)<\/style>/).exec(response);
                   
                    if (bodyHtml === null) {
                        bodyHtml = response;
                    }
                    else {
                        bodyHtml = bodyHtml[1];
                    }
                    if (bodyHtml === "") {
                        return null;
                    }
                    var cssJSON = {};
                    if (style) {
                        var origCssJSON = this._parseCSS(style[1]);
                        //var str = JSON.stringify(test);
                      
                        for (var property in origCssJSON) {
                            if (origCssJSON.hasOwnProperty(property)) {
                                //var newPropertyName = ".wmsstyle " + property;
                                var newPropertyName = property.split(',').map(function (e) {
                                    if (e === "body") {
                                        return "#responseDiv";                                       
                                    }
                                    if (e.indexOf(".") > 0) {
                                        return e;
                                    }
                                    if (e.charAt(0) === ".") {
                                        return "#responseDiv " + e;
                                    }
                                    //table, th or td in the div
                                    else {
                                        return "#responseDiv " + e;
                                    }
                                }).join(', ');                               
                                var propertyValue = origCssJSON[property];
                                cssJSON[newPropertyName] = propertyValue;
                            }
                        } 
                    }  
                    var cssSTRING = this._stringifyCSS(cssJSON);
                    var bdiv = domConstruct.create("div", { id: "responseDiv", innerHTML: bodyHtml, 'class': "wmsstyle" }); 
                    return bdiv.outerHTML + cssSTRING;                   
                }
                else {
                    return "<div>" + response + "</div>";
                }

                //var doc = document.implementation.createHTMLDocument("example");
                //doc.documentElement.innerHTML = response;
                //var body = doc.getElementsByTagName("body")[0];
                //var tables = body.getElementsByTagName("table");
                //var features = [];
                //for (var i = 0; i < tables.length; i++) {

                //    //var table = tables[i];                    
                //    var test2 = query(tables[i]).prev();
                //    var heading = "";
                //    if (test2.length > 0) {
                //        heading = test2[0].innerHTML;
                //    }


                //    var feature = this._tableToJson(tables[i], heading);
                //    if (!this._isEmpty(feature)) {
                //        features.push(feature[0]);
                //    }
                //}

                //// save search result
                //this.lastSearchResult = features;
                //// console.log("set last search result: ", response, this);
                //return features;
              
            },

            _stringifyCSS: function(cssJSON){
                var cssSTRING = '<style type="text/css">';

                for (var objKey in cssJSON) {
                    if (cssJSON.hasOwnProperty(objKey)) {
                        // objKey is the name of the key in the JavaScript object.
                        // In this case, it's also the CSS selector.
                        cssSTRING += objKey + " {";

                        var cssProperties = cssJSON[objKey];
                        for (var cssPropertyName in cssProperties) {
                            if (cssProperties.hasOwnProperty(cssPropertyName)) {
                                cssSTRING += cssPropertyName + ": " + cssProperties[cssPropertyName] + ";";
                            }
                        }

                        cssSTRING += "} \n";
                    }
                }            
                cssSTRING += '</style>';

                return cssSTRING;
            },

            _parseCSS: function(css) {
                var rules = {};
                css = this._removeComments(css);
                var blocks = css.split('}');
                blocks.pop();
                var len = blocks.length;
                for (var i = 0; i < len; i++)
                {
                    var pair = blocks[i].split('{');
                    var property = pair[0].trim();
                    var value = pair[1];
                    rules[property] = this._parseCSSBlock(value);
                }
                return rules;
            },

            _parseCSSBlock: function(css) { 
                var rule = {};
                var declarations = css.split(';').filter(function (e) {
                    var attribute = e.trim();
                    if (attribute === "") {
                        return;
                    }
                    return attribute;
                });
                //declarations.pop();
                var len = declarations.length;
                for (var i = 0; i < len; i++)
                {
                    var loc = declarations[i].indexOf(':');
                    var property = declarations[i].substring(0, loc).trim();
                    var value = declarations[i].substring(loc + 1).trim();

                    if (property !== "" && value !== "")
                        rule[property] = value;
                }
                return rule;
            },

            _removeComments: function(css) {
                return css.replace(/\/\*(\r|\n|.)*\*\//g,"");
            },
          
            _isHTML: function (str) {
                var a = document.createElement('div');
                a.innerHTML = str;
                for (var c = a.childNodes, i = c.length; i--;) {
                    if (c[i].nodeType === 1) return true;
                }
                return false;
            },

            _isEmpty: function(x,p){
                for (p in x) {
                    if (x.hasOwnProperty(p)) {
                        return !1;
                    }
                }
                return !0;
            },
    
            err: function (err) {
                console.log("Failed to get results from GetFeatureInfo: ", err);
            },

            _useLatLong: function (wkid) {
                var isLatLon;
                for (var i = 0; i < this._REVERSED_LAT_LONG_RANGES.length; i++) {
                    var range = this._REVERSED_LAT_LONG_RANGES[i];
                    if (wkid >= range[0] && wkid <= range[1]) {
                        isLatLon = true;
                        break;
                    }
                }
                return isLatLon;
            },            

            _tableToJson: function (table, heading) {
                var results = [];

                // first row needs to be headers
                var headers = [];
                for (var i=0; i<table.rows[0].cells.length; i++) {
                    headers[i] = table.rows[0].cells[i].innerHTML.toLowerCase().replace(/ /gi,'');
                }

                // go through cells
                for (var j=1; j < table.rows.length; j++) {
                    var tableRow = table.rows[j];
                    var result = {};
                    var attributes = {};
                    for (var k=0; k<tableRow.cells.length; k++) {
                        //rowData[ headers[k] ] = tableRow.cells[k].innerHTML;                       
                        attributes[headers[k]] = tableRow.cells[k].innerHTML;
                    }
                    var feature = new Graphic();
                    feature.setAttributes(attributes);
                    //result.layerName = this.visibleLayers[index];
                    result.layerName = heading;
                    result.feature = feature;


                    results.push(result);
                }      

                return results;
            },           

            _isWmsLayerInScale: function (layerInfo, mapScale) {
                var d = true;
                if (layerInfo.minScale || layerInfo.maxScale) {
                    if ((layerInfo.minScale && mapScale < layerInfo.minScale) || (layerInfo.maxScale && mapScale > layerInfo.maxScale)) {
                        d = false;
                    }
                }
                return d;
            }

        });
        return wmsIdentify;
    });        