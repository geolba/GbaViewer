define(
    [
        "esri/urlUtils",
        "gba/utils/LayerFactory",
        "dojo/when",
        "dojo/_base/declare",
        "dojo/_base/lang",
        "dojo/_base/array",
        "dojo/dom-class",
        "dojo/Deferred",
        "dojo/promise/all",
        //"dojo/i18n",
        "dojo/i18n!app/nls/template",
        "esri/arcgis/utils",
        "dojo/request/xhr",
         "app/proj4js/proj4js-amd",
        "esri/request"
    ], function (
        urlUtils,
        LayerFactory,
        when,
        declare,
        lang,
        array,
        domClass,
        Deferred,
        all,
        //jsapiBundle,
        i18n,
        utils,
        xhr,
        Proj4js,
        esriRequest
) {
        "use strict";
    //namespace utiilities - class App - erbt von keiner Klasse daher null
    var App = declare("app.App", null, {

        config : {},

        //the constructor
        constructor : function (defaults) {
            //specify class defaults 
            this.config.helperServices = defaults.helperServices || {};
            lang.mixin(this.config, defaults);
        },

        init : function () {
            var deferred = new Deferred();
            //Check url parameters for an application id( appid) or webmap id 
            var urlObject = urlUtils.urlToObject(document.location.href);
            urlObject.query = urlObject.query || {};

            if (urlObject.query.url) {
                if (window.location.href.indexOf("_LS99") > -1) {
                    //your url contains the string _LS99"
                    urlObject.query.hasLegend = false;
                }
                else {
                    urlObject.query.hasLegend = true;
                }
            }
           

            lang.mixin(this.config, urlObject.query); 

            all([this.getlocalization(), this.queryWebMap()]).then(lang.hitch(this, function () {

                var extent = this.config.webmapData.item.extent;
                var _wkid = extent.spatialReference.wkid;
                var sourceCoord = Proj4js.defs["EPSG:" + _wkid];
                if (sourceCoord === undefined) {
                    //require(["dojo/text!proj4js/defs/EPSG" + _wkid+".txt"], function (projCode) {
                   
                    //this._requireTextModule("utilities/mobileUtilsuu").then(lang.hitch(this, function (projCode) {
                    this._requestProjectCode(_wkid).then(lang.hitch(this, function (projCode) {
                        Proj4js.defs["EPSG:" + _wkid] = projCode;
                        deferred.resolve(this.config);
                    }),
                    function (error) {
                        /* handle error */
                        deferred.reject(error);
                    });
                }
                else {
                    deferred.resolve(this.config);
                }
            }),
            function (error) {
                /* handle error */
                deferred.reject(error);
            });

            return deferred.promise;
        },

        _requestProjectCode: function (wkid) {
            var url = "http://spatialreference.org/ref/epsg/" + wkid  + "/proj4/";
            var deferred = new Deferred();

            var xhr = esriRequest({
                url: "proxy.ashx?" + url,
                handleAs: "text"
            });
            xhr.then(function (data) {              
                deferred.resolve(data);
            },
            function (error) {
                // This shouldn't occur, but it's defined just in case               
                deferred.reject("Spatial reference error! EPSG isn't supported! " + error);
            });

            return deferred.promise;
        },

        _requireTextModule : function (module) {

            var myRequireDeferred = new Deferred();

            function handleError(error) {
                console.log(error.src, error.id);
                myRequireDeferred.reject("Spatial reference error! EPSG isn't supported!");
            }
            require.on("error", handleError);


            require([module],
                  function (requirement) {
                      if (requirement !== null) {
                          myRequireDeferred.resolve(requirement);
                      }
                      else {
                          myRequireDeferred.reject(requirement);
                      }
                  }
            );

            return myRequireDeferred.promise;
        },

        getlocalization : function () {
            //Get the localization strings for the template and store in an i18n variable. Also determine if the 
            //application is in a right-to-left language like Arabic or Hebrew. 

            var deferred = new Deferred();

            this.config.i18n = i18n;//jsapiBundle.getLocalization("app/resources", "template");
            //Bi-directional language support added to support right-to-left languages like Arabic and Hebrew
            var dirNode = document.getElementsByTagName("html")[0];
            if (this.config.i18n.isRightToLeft) {
                dirNode.setAttribute("dir", "rtl");
                domClass.add(dirNode, "esriRtl");
            } else {
                dirNode.setAttribute("dir", "ltr");
                domClass.add(dirNode, "esriLtr");
            }
            
            deferred.resolve(true);
            return deferred.promise;

        },     

        queryWebMap: function () {           
         
            var deferred = new Deferred();

            var layerInfo = "";
            if (this.config.url) {
                layerInfo = this.config.url;
            }
            else if (this.config.URL) {
                layerInfo = this.config.URL;
            }
            else {
                layerInfo = "http://gisgba.geologie.ac.at/ArcGIS/rest/services/karten_image/is_md_gk50/ImageServer";
                this.config.url = layerInfo;
            }

            var layerFactory = new LayerFactory({ url: layerInfo });

            var promise1 = layerFactory.getLayer({ url: layerInfo });
            (promise1).then(lang.hitch(this, function (data) {
            //(promise1).then(function (data) {
                var webmapData = {};
                webmapData.item = {
                    "extent": data.extent,
                    "snippet": data.snippet,
                    "title": data.title,
                    "subtitle": data.subtitle,
                    "owner": data.author,
                    "accessConstraints": data.accessConstraints,
                    "type": data.type,                   
                    //"visibleLayers": data.visibleLayers, //undefined bei MapServer
                    "visibleLayers": data.visibleLayers !== undefined ? data.visibleLayers : null,
                    ////"layerInfo": data.layerInfo //undefined bei MapServer
                    "layerInfo": data.layerInfo !== undefined ? data.layerInfo : null
                };
                webmapData.itemData = {
                    "baseMap": {
                        "baseMapLayers": [
                        {
                            "opacity": 1,
                            "url": "http://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer",
                            "visibility": true
                        }
                        ],
                        "title": "World_Terrain_Base"
                    },
                    "operationalLayers": [
                    {
                        "opacity": data.opacity,
                        "title": data.title,
                        "url": layerInfo,
                        "visibility": true,
                        "layerType": data.type,
                        "layerObject": data.layer
                    }
                    ],
                    "version": data.currentVersion   
                };
                var response2 = {};
                response2.webmapData = webmapData;
                lang.mixin(this.config, response2);
                deferred.resolve(true);
            }),
            function (error) {
                /* handle error */
                deferred.reject(error);
            });

            return deferred.promise;   

    }

     
    });

    return App;
});