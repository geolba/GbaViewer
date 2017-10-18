define(["require",
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/Evented",
    "dojo/Deferred",
    "dojox/xml/parser",
    "dojo/query",
    "dojo/json",
    "dojo/request",   
    "esri/layers/WMSLayerInfo",
    "esri/request",
    "esri/geometry/Extent",
    "dojo/NodeList-traverse", "dojo/io/script"],
    function (require, declare, lang, Evented, Deferred, Parser, query, JSON, request, WMSLayerInfo, esriRequest, Extent) {
    "use strict";  

    var layerFactory = declare("gba.utils.LayerFactory", [Evented], {

        config: {},

        constructor: function (/*Object*/defaults) {
            // this.map = options.map || null;
            lang.mixin(this.config, defaults);
        },

        /**
       Extracts the name of a map service from its URL.
       @param {String} url
       @returns {String}
       */
        _getMapNameFromUrl: function (url) {
            var arcgisRe = /services\/(.+)\/\w+Server/i, name, match;
            match = url.match(arcgisRe);
            if (match) {
                name = match[1]; // The captured name part of the URL.
            }
        },
       
        _isValidWmsUrl: function (s) {
            var regexp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
            if (regexp.test(s)){// && s.toUpperCase().match('WMS')) {
                return true;
            }
            else {
                return false;
            }
        },
        
        /**
         * Validate the URL is a URL and contains WMS
         */ 
        getLayer: function (options) {
            var self = this;
            var mapServerRe, featureLayerRe, imageServerRe, url;
            //var layerOptions = options.options || {};
            var deferred = new Deferred();

        

            if (options.url) {
                url = options.url;
                //var protocol = window.location.protocol;
                //var arr = url.split("/");
                //arr.shift();
                //arr.unshift(protocol);
                //url = arr.join("/");
            }
            mapServerRe = /MapServer\/?$/i;
            //featureLayerRe = /((?:Feature)|(?:Map))Server\/\d+\/?$/i;
            featureLayerRe = /FeatureServer\/?/i;
            imageServerRe = /ImageServer\/?$/i;
            //ogcMapServerRe = /MapServer\/\WMSServer\/?$/i;

            // Create a different layer type based on the URL.
            if (mapServerRe.test(url)) {
                // Query the map service to see if it is a tiled map service. (We cannot determine this based on the URL alone.)
                //if (!layerOptions.id) {
                //    layerOptions.id = self._getMapNameFromUrl(url);
                //}
                var xhr = esriRequest({
                    url: url,
                    content: {
                        f: "json"
                    },
                    callbackParamName: "callback",
                    handleAs: "json"
                });
                xhr.then(function (response) {
                    var params = {
                        opacity: 0.7
                        //useMapImage: true
                    };
                    if (response.singleFusedMapCache) {
                        // Create a tile map service layer.
                        require(["esri/layers/ArcGISTiledMapServiceLayer"], function (ArcGISTiledMapServiceLayer) {
                            var layer = new ArcGISTiledMapServiceLayer(url, params);
                            var type = "ArcGISTiledMapServiceLayer";
                            var version = response.currentVersion;
                            var layerOptions = {};
                            var capabilitiesUrl = "";
                            if (version < 10.2) {
                                capabilitiesUrl = url + "?f=json&pretty=true";
                                layerOptions = {
                                    layer: layer,
                                    type: type,
                                    title: response.documentInfo.Title,
                                    extent: response.initialExtent,
                                    author: response.documentInfo.Author,
                                    accessConstraints: response.documentInfo.Credits,
                                    subtitle: capabilitiesUrl,
                                    snippet: response.description,
                                    currentVersion: response.currentVersion,
                                    opacity: 0.7
                                };
                                deferred.resolve(layerOptions);
                            }
                            else {
                                capabilitiesUrl = (url.substring(url.length - 1) === "/") ? url + "info/metadata" : url + "/info/metadata";
                                var promise = self.getEsriMetadata(capabilitiesUrl);
                                (promise).then(function (data) {
                                    layerOptions = {
                                        layer: layer,
                                        type: type,
                                        extent: response.initialExtent,
                                        subtitle: capabilitiesUrl,
                                        currentVersion: response.currentVersion,
                                        opacity: 0.7
                                    };
                                    if (data !== false) {
                                        lang.mixin(layerOptions, data);
                                    }
                                    deferred.resolve(layerOptions);
                                },
                                function (error) {
                                    /* handle error */
                                    deferred.reject(error);
                                });
                            }
                        });
                    }
                    else {
                        // Create a dynamic map service layer.
                        require(["esri/layers/ArcGISDynamicMapServiceLayer"], function (ArcGISDynamicMapServiceLayer) {
                            var layer = new ArcGISDynamicMapServiceLayer(url, params);
                            var type = "ArcGISDynamicMapServiceLayer";
                            var version = response.currentVersion;
                            var layerOptions = {};
                            var capabilitiesUrl = "";
                            if (version < 10.2) {
                                capabilitiesUrl = url + "?f=json&pretty=true";                               
                                layerOptions = {
                                    layer: layer,
                                    type: type,
                                    title: response.documentInfo.Title,
                                    extent: response.initialExtent,
                                    author: response.documentInfo.Author,
                                    accessConstraints: response.documentInfo.Credits,
                                    subtitle: capabilitiesUrl,
                                    snippet: response.description,
                                    currentVersion: response.currentVersion,
                                    opacity: 0.7
                                };
                                deferred.resolve(layerOptions);
                            }
                            else
                            {                               
                                //capabilitiesUrl = url + "info/metadata";
                                capabilitiesUrl = (url.substring(url.length - 1) === "/") ? url + "info/metadata" : url + "/info/metadata";
                                var promise = self.getEsriMetadata(capabilitiesUrl);
                                (promise).then(function (data) {                                   
                                    layerOptions = {
                                        layer: layer,
                                        type: type,                                       
                                        extent: response.initialExtent,                                     
                                        subtitle: capabilitiesUrl,                                       
                                        currentVersion: response.currentVersion,
                                        opacity: 0.7
                                    };
                                    if (data !== false) {
                                        lang.mixin(layerOptions, data);
                                    }
                                    deferred.resolve(layerOptions);
                                },
                                function (error) {
                                    /* handle error */
                                    deferred.reject(error);
                                });                               
                            }                          
                         
                        });
                    }
                },function (error) { //error bei der mxd-Abfrage zum REST-MapService
                    /* handle error */
                    if (error.details !== undefined && error.details.length > 0) {
                        deferred.reject(error.details[0]);
                    }
                    else {
                        deferred.reject("rest map service error");
                    }
                });
                
            }
            //if the layer is an image service:
            else if (imageServerRe.test(url)) {
                require(["esri/layers/ArcGISImageServiceLayer"], function (ArcGISImageServiceLayer) {
                    //var layer = new esri.layers.ArcGISImageServiceLayer(url, layerOptions);                      
                    var xhr = esriRequest({
                        url: url,
                        content: {
                            f: "json"
                        },
                        callbackParamName: "callback",
                        handleAs: "json"
                    });
                    xhr.then(function (response) {
                        var params = {
                            opacity: 0.7
                            };
                        var layer = new ArcGISImageServiceLayer(url, params);
                        var type = "ArcGISImageServiceLayer";    
                        var version = response.currentVersion;
                        var layerOptions = {};
                        var capabilitiesUrl = "";
                        if (version < 10.2) {
                            capabilitiesUrl = url + "?f=json&pretty=true";
                            layerOptions = {
                                layer: layer,
                                type: type,
                                title: response.name,
                                extent: response.extent,
                                author: "GBA",
                                accessConstraints: "Copyright GBA, //creativecommons.org/licenses/by-nc-nd/3.0/at/",
                                subtitle: capabilitiesUrl,
                                snippet: response.description,
                                currentVersion: response.currentVersion,
                                opacity: params.opacity
                            };
                            deferred.resolve(layerOptions);
                        }
                        else {                           
                            capabilitiesUrl = (url.substring(url.length - 1) === "/") ? url + "info/metadata" : url + "/info/metadata";
                            var promise = self.getEsriMetadata(capabilitiesUrl);
                            (promise).then(function (data) {                              
                                layerOptions = {
                                    layer: layer,
                                    type: type,
                                    extent: response.initialExtent,
                                    subtitle: capabilitiesUrl,
                                    currentVersion: response.currentVersion,
                                    opacity: 0.7
                                };
                                if (data !== false) {
                                    lang.mixin(layerOptions, data);
                                }
                                deferred.resolve(layerOptions);
                            },
                            function (error) {
                                /* handle error */
                                deferred.reject(error);
                            });
                        }

                    }, function (error) { //error bei der mxd-Abfrage zum REST-ImageService
                        /* handle error */
                        if (error.details !== undefined && error.details.length > 0) {
                            deferred.reject(error.details[0]);
                        }
                        else {
                            deferred.reject("rest image service error");
                        }
                    });
                });
            }
            //if the layer is a Feature Layer
            else if (featureLayerRe.test(url)) {
                require(["esri/layers/FeatureLayer"], function (FeatureLayer) {
                    //var layer = new esri.layers.FeatureLayer(url, layerOptions);
                    var xhr = esriRequest({
                        url: url,
                        content: {
                            f: "json"
                        },
                        callbackParamName: "callback",
                        handleAs: "json"
                    });
                    xhr.then(function (response) {
                        var params = {
                            opacity: 0.7
                        };
                        var layer = new FeatureLayer(url, params);
                        var type = "FeatureLayer";
                        var version = response.currentVersion;
                        var layerOptions = {};
                        //var capabilitiesUrl = "";
                        layerOptions = {
                            layer: layer,
                            type: type,
                            title: null,
                            extent: layer.initialExtent,
                            author: null,
                            accessConstraints: null,
                            subtitle: url + "?f=json&pretty=true",
                            snippet: response.serviceDescription,
                            currentVersion: version,
                            opacity: 1
                        };
                        deferred.resolve(layerOptions);

                    }, function (error) {
                        deferred.reject(error);
                    });
                });
            }

            else if (self._isValidWmsUrl(url)) {
                //require(["gba/layers/WmsLayer"], function (WmsLayer) {
                require(["esri/layers/WMSLayer"], function (WmsLayer) {
                    var xhr = esriRequest({
                        url: "map_proxy.ashx?" + url,
                        handleAs: "text"
                    });
                    xhr.then(lang.hitch(self, function (response) {

                        //var protocol = window.location.protocol;
                        //var arr = url.split("/");
                        //var url = protocol + "//" + arr[2]

                        var json = JSON.parse(response, true);

                        var layerInfos = [];

                        var visibleLayers = [];
                        var strVisibleLayers = "";
                        if (json.Layer.ChildLayers.length > 0) {

                            self.getChildLayers(json.Layer, layerInfos);
                            for (var i = 0; i < layerInfos.length; i++) {
                                strVisibleLayers += layerInfos[i].name;
                                if (i !== layerInfos.length - 1) {
                                    strVisibleLayers += ",";
                                }
                                visibleLayers.push(layerInfos[i].name);
                            }

                         
                        }
                        else {
                            var layerInfo = new WMSLayerInfo({ name: json.Layer.Name, title: json.Layer.Title });
                            layerInfos.push(layerInfo);
                            visibleLayers.push(json.Layer.Name);
                            strVisibleLayers += json.Layer.Name;
                        }

                        var resourceInfo = {
                            extent: new Extent(json.Layer.LatLonBoundingBox.MinX, json.Layer.LatLonBoundingBox.MinY,
                                json.Layer.LatLonBoundingBox.MaxX, json.Layer.LatLonBoundingBox.MaxY, { wkid: 4326 }),
                            layerInfos: layerInfos,                          
                            version: json.WmsVersion
                        };
                        var extent = {
                            xmax: json.Layer.LatLonBoundingBox.MaxX,
                            xmin: json.Layer.LatLonBoundingBox.MinX,
                            ymax: json.Layer.LatLonBoundingBox.MaxY,
                            ymin: json.Layer.LatLonBoundingBox.MinY,
                            spatialReference: {
                                wkid: 4326
                            }
                        };
                        var params = {
                            id: json.Layer.Title,
                            opacity: 0.7,
                            visibleLayers: visibleLayers,
                            resourceInfo: resourceInfo,
                            extent: extent
                        };
                        //var layer = new utilities.WmsLayer(url, params);
                        var layer = new WmsLayer(url, params);
                        //var layer = new esri.layers.WMSLayer(url, params);
                                           
                        var type = "WMSLayer";    
                        var layerOptions = {
                            layer: layer,
                            type: type,
                            //title: json.Layer.Title,
                            title: json.ServiceDescription.Title,
                            extent: extent,
                            author: json.ServiceDescription.ContactInformation.PersonPrimary.Organisation,
                            accessConstraints: json.ServiceDescription.AccessConstraints,
                            subtitle: json.CapabilitiesUrl,
                            snippet: json.ServiceDescription.Abstract,
                            currentVersion: json.WmsVersion,
                            opacity: params.opacity,
                            visibleLayers: strVisibleLayers,
                            layerInfo: json.Layer
                            
                        };
                        deferred.resolve(layerOptions);

                    }));


                });
            }

            else {
                deferred.reject("no supported layer type!");
            }


            return deferred.promise;
        },
        
        getChildLayers: function myself(parentLayer, layerInfos) {
            var childLayers = parentLayer.ChildLayers;
            for (var i = 0; i < childLayers.length; i++) {
                var infoLayer = childLayers[i];
                if (infoLayer.ChildLayers.length > 0) {
                    myself(infoLayer, layerInfos);
                }
                else {
                    var layerInfo = new WMSLayerInfo({
                        name: infoLayer.Name, title: infoLayer.Title, description: infoLayer.Abstract,
                        extent: infoLayer.LatLonBoundingBox, spatialReferences: infoLayer.Crs,
                        legendURL: infoLayer.Style.length > 0 ?  infoLayer.Style[0].LegendUrl.OnlineResource.OnlineResource : null
                    });
                    layerInfo.id = infoLayer.Title;
                    layerInfo.minScale = (infoLayer.MinScaleDenominator !==null) ? parseFloat(infoLayer.MinScaleDenominator) : 0;
                    layerInfo.maxScale = (infoLayer.MaxScaleDenominator !== null) ? parseFloat(infoLayer.MaxScaleDenominator) : 0;
                   
                    layerInfos.push(layerInfo);
                }
               
            }
        },

        getEsriMetadata: function (capabilitiesUrl) {
            var deferred = new Deferred();

            var xhr = esriRequest({
                url: "proxy.ashx?" + capabilitiesUrl,
                handleAs: "xml"
            });
            xhr.then(function (xml) {
                if (xml.childNodes.length > 0) {
                    //var test = Parser.innerXML(xml);

                    var title = "", author = "", snippet = "", accessConstraints = "";

                    if (query("dataIdInfo idCitation resTitle", xml)[0]) {
                        var _title = query("dataIdInfo idCitation resTitle", xml)[0].firstChild;
                        title = (_title !== null) ? _title.nodeValue.replace(/<\/?[^>]+(>|$)/g, "") : "";
                    }
                    //if (query("dataIdInfo idPoC rpOrgName", xml)[0]) {
                    if (query("dataIdInfo idCredit", xml)[0]) {
                        //var _author = query("dataIdInfo idPoC rpOrgName", xml)[0].firstChild;
                        var _author = query("dataIdInfo idCredit", xml)[0].firstChild;
                        author = (_author !== null) ? _author.nodeValue.replace(/<\/?[^>]+(>|$)/g, "") : "";
                    }
                    if (query("dataIdInfo idAbs", xml)[0]) {
                        var _snippet = query("dataIdInfo idAbs", xml)[0].firstChild;
                        snippet = (_snippet !== null) ? _snippet.nodeValue.replace(/<\/?[^>]+(>|$)/g, "") : "";
                    }
                    if (query("dataIdInfo resConst useLimit", xml)[0]) {
                        var _accessConstraints = query("dataIdInfo resConst useLimit", xml)[0].firstChild;
                        accessConstraints = (_accessConstraints !== null) ? _accessConstraints.nodeValue.replace(/<\/?[^>]+(>|$)/g, "") : "";
                    }

                    var json = {
                        title: title,
                        author: author,
                        snippet: snippet,
                        accessConstraints: accessConstraints
                    };
                    deferred.resolve(json);
                }
                else {
                    deferred.resolve(false);
                }

                
            },
            function (error) {
                // This shouldn't occur, but it's defined just in case               
                deferred.reject(error);
            });

            return deferred.promise;
        }
        
    });

    return layerFactory;
});