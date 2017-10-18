define([    
    "gba/tasks/WmsIdentify",
    "app/legend2",
     "esri/graphic",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/tasks/IdentifyTask",
    "esri/tasks/IdentifyParameters",
    "esri/tasks/ImageServiceIdentifyTask",
    "esri/tasks/ImageServiceIdentifyParameters",
    "dojo/_base/Color",
    "dojo/_base/window",
    "dijit/registry",
    "esri/map",  
    "gba/dijit/HomeButton",
    "esri/config",
    "esri/InfoTemplate",
    "esri/geometry/Point",
    "esri/dijit/Geocoder",  
    "esri/symbols/PictureMarkerSymbol",
    "esri/geometry/webMercatorUtils",
    "esri/domUtils",
    "dojo/dom-class",
    "dojo/has",
    "dojo/_base/array",
    "dojo/query",
    "dojo/dom-construct",
    "dojo/dom",
    "dijit/place",
    "dojo/dom-style",
    "dojo/on",
    "dojo/json",
    "dojo/DeferredList",
    "dojo/_base/Deferred",
    "esri/SpatialReference",
    "dijit/TooltipDialog",
    "dijit/popup",
    "dojo/dnd/Moveable",   
    "esri/dijit/LocateButton",
    //"gba/dijit/MenuBar",
    "esri/dijit/Scalebar",
    "dojo/dom-attr",
    "esri/geometry/scaleUtils"  
], function (WmsIdentify, Legend, Graphic, SimpleMarkerSymbol, IdentifyTask, IdentifyParameters, ImageServiceIdentifyTask, ImageServiceIdentifyParameters,
    Color, baseWin, registry, Map, HomeButton, esriConfig, InfoTemplate, Point, Geocoder, PictureMarkerSymbol, webMercatorUtils, domUtils, domClass,
    has, array, query, domConstruct, dom, place, domStyle, on, JSON, DeferredList, Deferred, SR, TooltipDialog, dijitPopup, Moveable, LocateButton, Scalebar, domAttr, scaleUtils) {

    'use strict';
    //var CONSTANTS
    var MAX_SMARTPHONE_WIDTH = 550;

    //private members:
    var map; var dialog; var layers; var configOptions; var popup; var geocoder;
    var isSmartPhone = false; var isTablet = false; var isDesktop = false;
    var _loading;// = dom.byId("loadingImg");
    var homeWidget;

    //vom Turorial:
    var identifyParams, imageParams, wmsIdentifyParams;
    var tasks; var clickPoint;

    var _createMap2 = function () {    

        map = new Map("ui-esri-map", {
            navigationMode: "css-transforms",
            sliderStyle: "small",
            basemap: "topo",
            showAttribution: false,
            logo: true,
            slider: true,
            nav: false,
            wrapAround180: true,
            infoWindow: popup,
            //spatialReference: new SR({ wkid: 4326 }),
            extent: configOptions.webmapData.item.extent
        });
        //map.setExtent(configOptions.webmapData.item.extent);
        dialog = new TooltipDialog({
            id: "tooltipDialog",
            //content: tipContent,
            style: "position: absolute; background-color:white; display: inline; font: normal normal bold 10pt Tahoma;z-index:100"            
        });
        dialog.startup();

        //var mapServiceURL = "http://server.arcgisonline.com/arcgis/rest/services/World_Topo_Map/MapServer";
        ////var params = {
        ////   useMapImage: true
        ////};
        //map.addLayer(new ArcGISTiledMapServiceLayer(mapServiceURL));
        //var layerInfo = new WMTSLayerInfo({
        //    identifier: "geolandbasemap",
        //    tileMatrixSet: "google3857",
        //    format: "png"
        //});
        //var options = {
        //    serviceMode: "KVP",
        //    layerInfo: layerInfo
        //};
        //var wmtsLayer = new WMTSLayer("http://services.arcgisonline.com/arcgis/rest/services/World_Topo_Map/MapServer/WMTS/1.0.0/WMTSCapabilities.xml", options);
        //map.addLayer(wmtsLayer);
                  
        configOptions.title = configOptions.webmapData.item.title || configOptions.i18n.viewer.mainPanel.title;
        configOptions.subtitle = configOptions.webmapData.item.subtitle || configOptions.i18n.viewer.mainPanel.subtitle;
        configOptions.owner = configOptions.webmapData.item.owner || configOptions.i18n.viewer.footer.owner;
        configOptions.i18n.viewer.sidePanel.description = configOptions.webmapData.item.snippet ||
                configOptions.i18n.viewer.sidePanel.description;
        configOptions.accessConstraints = configOptions.webmapData.item.accessConstraints || configOptions.i18n.viewer.footer.accessConstraints;

        _loading = dom.byId("loadingImg");

        if (dom.byId('legendHeaderText')) {
            //dom.byId('legendHeaderText').innerHTML = configOptions.i18n.viewer.sidePanel.title;
            dom.byId('legendHeaderText').innerHTML = configOptions.title;            
        }
      
        if (dom.byId('subtitle')) {
            dom.byId('subtitle').innerHTML = configOptions.url;
            dom.byId('subtitle').href = configOptions.subtitle;
        }

        if (isSmartPhone === true || isTablet === true) {
            registry.byId('mapViewHeader').set("label", configOptions.title);
            //dom.byId('mapViewHeaderLabel').innerHTML = configOptions.title;
        }

        //dom.byId('footerText').innerHTML = configOptions.i18n.viewer.footer.label + ' ' + configOptions.owner;
        dom.byId('footerText').innerHTML = configOptions.owner;
        //dom.byId('creativeCommons').innerHTML = '<a rel="license" href="http://creativecommons.org/licenses/by/3.0/at/"><img alt="Creative Commons Lizenzvertrag" style="border-width:0" src="http://i.creativecommons.org/l/by/3.0/at/88x31.png" /></a>';
        dom.byId('creativeCommons').innerHTML = createCreativeCommonLogo(configOptions.accessConstraints);// configOptions.accessConstraints;

        dom.byId('descriptionText').innerHTML = configOptions.i18n.viewer.sidePanel.description;

        if (dom.byId('listItemLegend')) {
            dom.byId('listItemLegend').innerHTML = configOptions.i18n.viewer.buttons.legend;
        }
        if (dom.byId('listItemAbout')) {
            dom.byId('listItemAbout').innerHTML = configOptions.i18n.viewer.buttons.about;
        }
           
        //var mapOnUpdateStartHandle = on(map, "update-start", _showLoading);
        //var mapOnUpdateEndHandle = on(map, "update-end", _hideLoading);     
        var mapOnExtentChangeHandle = on(map, "extent-change", function () {
            //mapOnExtentChangeHandle = map.on("extent-change", function () {               
            popup.isShowing && popup.hide();
            if (dom.byId("scalebar")) {
                var scale = scaleUtils.getScale(map);
                domAttr.set(dom.byId("scalebar"), "title", Math.round(scale));               
            }
        });

        if (isDesktop === true) {                  
            var mapOnMouseMoveHandle = on(map, "mouse-move", _showCoordinates);
            var mapOnMouseDragHandle = on(map, "mouse-drag", _showCoordinates);         
        }

        var mapOnLoadHandle, mapOnClickHandle;
        if (map.loaded) {
            if (layerIsQueryable() === true) {
                identifyParams = new IdentifyParameters();
                identifyParams.tolerance = 4;
                identifyParams.returnGeometry = false;
                identifyParams.layerOption = IdentifyParameters.LAYER_OPTION_VISIBLE;

                imageParams = new ImageServiceIdentifyParameters();
                imageParams.returnGeometry = false;

                //mapOnClickHandle = map.on("click", doIdentify);
                mapOnClickHandle = on(map, 'click', doIdentify);
            }
            if (isDesktop === true) {
                on(map.graphics, 'mouse-over', showTooltip);
                on(map.graphics, 'mouse-out', closeDialog);
            }

            initUI(layers);
        }
        else {
            mapOnLoadHandle = on(map, 'load', function () {
                if (layerIsQueryable() === true) {
                    identifyParams = new IdentifyParameters();
                    identifyParams.tolerance = 4;
                    identifyParams.returnGeometry = false;
                    identifyParams.layerOption = IdentifyParameters.LAYER_OPTION_VISIBLE;

                    imageParams = new ImageServiceIdentifyParameters();
                    imageParams.returnGeometry = false;

                    //mapOnClickHandle = map.on("click", doIdentify);
                    mapOnClickHandle = on(map, 'click', doIdentify);
                }
                if (isDesktop === true) {
                    on(map.graphics, 'mouse-over', showTooltip);
                    on(map.graphics, 'mouse-out', closeDialog);
                }

                initUI(layers);
            });
        }

      

        var mapOnUpdateStartHandle, mapOnUpdateEndHandle;
        // add the specified layer to map
        layers = configOptions.webmapData.itemData.operationalLayers;
        for (var j = 0; j < layers.length; j++) {
            var layer = layers[j].layerObject;
            map.addLayer(layer);
            mapOnUpdateStartHandle = on(layer, "update-start", _showLoading);
            mapOnUpdateEndHandle = on(layer, "update-end", _hideLoading);
        }

        //setup Identify:
        setupIdentify(configOptions);

        //To avoid memory leaks, you should remove listeners when the application is being closed. 
        on(map, "unload", function () {
            typeof mapOnUpdateStartHandle !== 'undefined' && mapOnUpdateStartHandle && mapOnUpdateStartHandle.remove();
            typeof mapOnUpdateEndHandle !== 'undefined' && mapOnUpdateEndHandle && mapOnUpdateEndHandle.remove();
            typeof mapOnExtentChangeHandle !== 'undefined' && mapOnExtentChangeHandle && mapOnExtentChangeHandle.remove();
            typeof mapOnMouseMoveHandle !== 'undefined' && mapOnMouseMoveHandle && mapOnMouseMoveHandle.remove();
            typeof mapOnMouseDragHandle !== 'undefined' && mapOnMouseDragHandle && mapOnMouseDragHandle.remove();
            typeof mapOnLoadHandle !== 'undefined' && mapOnLoadHandle && mapOnLoadHandle.remove();
            typeof mapOnClickHandle !== 'undefined' && mapOnClickHandle && mapOnClickHandle.remove();
        });

    };   

    var layerIsQueryable = function  () {
        var layerType = configOptions.webmapData.item.type;
        if (layerType !== "WMSLayer") {
            return true;
        }
        else {//it's a WMS
            var wmsInfo = configOptions.webmapData.item.layerInfo;
            if (wmsInfo.Queryable === true) {
                return true;
            }
            else {
                return IsSublayerQueryable(wmsInfo);
            }           
        }
    };
   
    var IsSublayerQueryable = function (layerInfo) {
       
        for (var i = 0; i < layerInfo.ChildLayers.length; i++) {
            var layer = layerInfo.ChildLayers[i];
            if (layer.Queryable === true) {
                return true;
              
            }
            else if (layer.Queryable === false && layer.ChildLayers.length > 0) {
                var sublayerIsQueryable = IsSublayerQueryable(layer);
                if (sublayerIsQueryable === true) {
                    return true;                   
                }
            }
        }
    };

    var createCreativeCommonLogo = function (accessConstraintsText) {       
        var accessConstraints = accessConstraintsText.split(',');
        if (accessConstraints.length < 2) {
            return "<span>" + accessConstraintsText + "</span>";
        }
        var url = accessConstraints[1];
        //var copyRightext = accessConstraints[0];

        //var url = accessConstraintsText;

        if (validate(url) === true) {
            if (url.indexOf("http://creativecommons.org/licenses/") !== -1) {
                var link = '<a rel="license" href="' + url + '" target="_blank">' +
                   '<img alt="Creative Commons Lizenzvertrag" style="border-width:0" src="images/cc_logo.png" />' +
                   '</a>';// +               
                var copyrightText = url.replace("http://creativecommons.org/licenses/", "");
                copyrightText = "<span>" + copyrightText + "</span>";
                return link + " " + copyrightText;
            }
        }
        return "<span>" + accessConstraintsText + "</span>";
    };

    var validate = function (url) {
        var pattern = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
        if (pattern.test(url)) {
            //alert("Url is valid");
            return true;
        }
        //alert("Url is not valid!");
        return false;
    };

    //on mouse-over
    var showTooltip = function (evt) {
        //closeDialog();
        if (evt.graphic.attributes === undefined) {
            return;
        }
        var tipContent = evt.graphic.attributes.Name;
        dialog.setContent('<div class="closePopupWrapper">' + tipContent + '</div>');
        
        //dialog.setContent('<div class="closePopupWrapper"><button dojoType="dijit.form.Button" type="button" id="closePopup_" >X</button></div>' + tipContent);       
        //dialog.getChildren().forEach(function(w) {
        //    if (w.id == 'closePopup_') {
        //        //------------THIS CONNECT DOESN'T WORK
        //        on(w, 'click', function(e) {
        //            map.graphics.remove(evt.graphic);
        //        });  
        //    }
        //});

        domStyle.set(dialog.domNode, "opacity", "0.90");       
        //place.at(dialog.domNode, { x: evt.pageX, y: evt.pageY }, ["TL", "BL"], { x: 10, y: 10 });
        dijitPopup.open({
            //parent: this,
            popup: dialog,
            x: evt.pageX,
            y: evt.pageY,
            orient: ["below-centered", "above-centered"]
        });
    };

    var closeDialog = function () {       
        dijitPopup.close(dialog);
    };

    var showLocation = function (evt) {
        //map.graphics.clear();
        evt.result.feature.attributes.Name = evt.result.name;
        //var graphic = evt.result.feature;       
        var symbol = new PictureMarkerSymbol({
            "angle": 0,
            "xoffset": 0,
            "yoffset": 12,
            "type": "esriPMS",
            "url": "images/flag.png",
            "contentType": "image/png",
            "width": 24,
            "height": 24
        });
        //graphic.setSymbol(symbol);

        var point = evt.result.feature.geometry;
        var attributes = evt.result.feature.attributes;
        var graphic = new Graphic(point, symbol, attributes);
        //Add graphic to the map graphics layer.
        map.graphics.add(graphic);
    };

    var initMap = function (options) {
        //configure map animation to be faster
        esriConfig.defaults.map.panDuration = 250; // time in milliseconds, default panDuration: 250
        esriConfig.defaults.map.panRate = 25; // default panRate: 25
        esriConfig.defaults.map.zoomDuration = 500; // default zoomDuration: 500
        esriConfig.defaults.map.zoomRate = 30; // default zoomRate: 25
        esriConfig.defaults.map.logoLink = "http://www.geologie.ac.at/"; //Link auf das eigene Map-Logo setzen
        //esriConfig.defaults.io.proxyUrl = "../proxy.ashx";        
        //esri.config.defaults.io.alwaysUseProxy = true;
        esriConfig.defaults.io.useCors = true;
        //esriConfig.defaults.io.corsEnabledServers.push("http://server.arcgisonline.com/arcgis/rest/services/World_Topo_Map/MapServer");
        esriConfig.defaults.io.corsEnabledServers.push("http://server.arcgisonline.com");      
        esriConfig.defaults.io.corsEnabledServers.push("http://js.arcgis.com");  

        configOptions = options;

        //// Find matches
        var mql = window.matchMedia("(orientation:portrait)");
        var deviceWidth = MAX_SMARTPHONE_WIDTH;
        // If there are matches, we're in portrait
        if (mql.matches) {
            // Portrait orientation
            deviceWidth = window.innerWidth > 0 ? window.innerWidth : screen.width;
        } else {
            // Landscape orientation
            deviceWidth = window.innerHeight > 0 ? window.innerHeight : screen.height;
        }
       
        // Smartphone, Tablet, or Desktop
        //if (has('touch') && window.innerWidth <= MAX_SMARTPHONE_WIDTH) {
        if (has('touch') && deviceWidth <= MAX_SMARTPHONE_WIDTH) {
            isSmartPhone = true;
        }
        //else if (has('touch') && window.innerWidth > MAX_SMARTPHONE_WIDTH) {
        else if (has('touch') && deviceWidth > MAX_SMARTPHONE_WIDTH) {
            isTablet = true;
        } else {
            isDesktop = true;
        }

        var link = document.createElement('link');
        link.type = 'text/css';
        link.rel = 'stylesheet';

        //isDesktop = false;
        //isSmartPhone = false;
        //isTablet = true;

        //define custom popup options       
        var popupOptions = {
            offsetX: 3,
            fillSymbol: false,
            highlight: false,
            lineSymbol: false,
            //marginLeft: 10,
            //marginTop: 10,
            markerSymbol: new SimpleMarkerSymbol("circle", 32, null, new dojo.Color([0, 0, 0, 0.25])),
            offsetY: 3,
            zoomFactor: 4
        };

        if (isSmartPhone === true || isTablet === true) {
            isDesktop = false;     
            //_requireModule("utilities/mobileUtils.min").then(
            //    function (mobileUtils) {   
            //        if (isSmartPhone === true) {
            //            mobileUtils.buildPhoneDOM();
            //        } else {
            //            mobileUtils.buildTabletDOM();
            //        }
            //        document.dojoClick = false;
            //        _createMap2();
            //    }, function () { // failure
            //        alert('Error - Attempted to add an unknown module!');
            //    });

            require(["app/mobileUtils", "esri/dijit/PopupMobile"], function (mobileUtils, PopupMobile) {
                // mobile popup   
               
                if (mobileUtils !== null) {
                    if (isSmartPhone === true) {
                        mobileUtils.buildPhoneDOM(configOptions.hasLegend);
                    } else {
                        mobileUtils.buildTabletDOM(configOptions.hasLegend);
                    }
                    //remove loading gif
                    var elem = document.getElementById("overlay");
                    elem && elem.parentElement.removeChild(elem);
                    document.dojoClick = false;                 
                }
                if (PopupMobile !== null) {                   
                    popup = new PopupMobile(popupOptions, domConstruct.create("div", { id: "identifyDiv" }, baseWin.body(), 'first'));
                }
                _createMap2();
            });

        }
        else {
            isSmartPhone = false; isTablet = false;
            
            //add stylesheet to the head of the document
            link.href = "content/page-layout.css";
            link.onload = function () {
                require(["app/desktopUtils", "esri/dijit/Popup"], function (desktopUtils, Popup) {
                //require(["app/desktopUtils2", "gba/dijit/InfoWindow"], function (desktopUtils, Popup) {

                    if (desktopUtils !== null) {
                        desktopUtils.buildDesktopDOM(configOptions.webmapData.item.title, configOptions.url);
                        //remove loading gif
                        var elem = document.getElementById("overlay");
                        elem && elem.parentElement.removeChild(elem);
                    }
                    // desktop popup   
                    if (Popup !== null) {
                        popup = new Popup(popupOptions, domConstruct.create("div", { id: "identifyDiv" }, baseWin.body(), 'first'));
                        //popup = new Popup({ domNode: domConstruct.create("div", { id: "identifyDiv" }, baseWin.body(), 'first') });
                        domClass.add(popup.domNode, "modernGrey");
                        //make the popup dragable    
                        var popupDiv = document.querySelector(".titlePane");
                        var dnd;
                        if (popupDiv) {
                            dnd = new Moveable(dojo.byId("identifyDiv"), {
                                handle: popupDiv
                            });
                        }
                    }
                    _createMap2();

                });
            };
            document.getElementsByTagName("head")[0].appendChild(link);

        }

    };    

    var setupIdentify = function (options) {
        //loop through operational layers and add identify task for each. 
        //map() iterates all the elements in an array, passing them to the callback function and then returning a new array with any of the modified results.
        //tasks = array.map(results, function (result) {
        //    if (result.resourceInfo.serviceDataType == "esriImageServiceDataTypeRGB") {
        //        var deferred = new esri.tasks.ImageServiceIdentifyTask(result.layerObject.url);
        //        return deferred;
        //    }
        //    else {
        //        var deferred = new esri.tasks.IdentifyTask(result.layerObject.url);
        //        return deferred;
        //    }
        //});

        var layerInfo = buildLayersList(layers);

        tasks = [];
        var deferred;
        if (options.webmapData.item.type === "ArcGISImageServiceLayer") {
            deferred = new ImageServiceIdentifyTask(options.url);
            tasks.push(deferred);
        }
        else if (options.webmapData.item.type === "ArcGISDynamicMapServiceLayer") {
            deferred = new IdentifyTask(options.url);
            tasks.push(deferred);
        }
        else if (options.webmapData.item.type === "WMSLayer") {
            deferred = new WmsIdentify({
                defaultUrl: options.url ? options.url : options.URL,
                layerInfos: layerInfo
            });
            tasks.push(deferred);
        }

    };

    var doIdentify = function (evt) {

        map.infoWindow.hide();
        //clickPoint = evt.mapPoint;

        var mapScale = map.getScale();
        //var layerInfo = buildLayersList(layers);
        //for (var i = layer.layerInfos.length - 1; i >= 0; i--) {
        //    var layerInfo = layer.layerInfos[i];
        //    var layerIndex = i;
        //}

        var options = configOptions;
        //var extent = map.extent;       
        wmsIdentifyParams = {};
        wmsIdentifyParams.geometry = evt.screenPoint;
        wmsIdentifyParams.width = map.width;
        wmsIdentifyParams.height = map.height;
        wmsIdentifyParams.extent = map.extent;
        wmsIdentifyParams.visibleLayers = options.webmapData.item.visibleLayers;
        wmsIdentifyParams.wkidDest = options.webmapData.item.extent.spatialReference.wkid;
        wmsIdentifyParams.version = options.webmapData.itemData.version;
        wmsIdentifyParams.mapScale = mapScale;

        identifyParams.geometry = evt.mapPoint;
        identifyParams.mapExtent = map.extent;
        identifyParams.width = map.width;
        identifyParams.height = map.height;

        imageParams.geometry = evt.mapPoint;

        var deferreds = array.map(tasks, function (task) {
            if (task instanceof IdentifyTask) {
                return task.execute(identifyParams);
            }
            else if (task instanceof ImageServiceIdentifyTask) {
                return task.execute(imageParams);
            }
            else if (task instanceof WmsIdentify) {
                return task.execute(wmsIdentifyParams);
            }
        });
        map.infoWindow.clearFeatures();
        //_showLoading();
        map.infoWindow.setContent(
              '<p><img src="images/map/loading.gif" alt="loading"></p>'
            );

        map.infoWindow.show(evt.mapPoint);
        var dlist = new DeferredList(deferreds);
        dlist.then(handleQueryResults);
    };

    var handleQueryResults = function (results) {
        var features = [];

        var response = results[0];
        if (response[0] === true && response[1] !== null) {
            //wenn feature
            if (response[1].length > 0 && _isHTML(response) === false) {
                array.forEach(response[1], function (r) {
                    var feature = r.feature;
                    //den Layernamen nur bei mehreren Layern anzeigen:
                    if (response[1].length > 1) {
                        feature.attributes.Layer = r.layerName;
                    }

                    var content = "<ul class='identifyList'>";
                    for (var prop in feature.attributes) {
                        if (feature.attributes.hasOwnProperty(prop)) {
                            var attribute = feature.attributes[prop];

                            if (attribute === null || attribute === "Null" || attribute === "" || attribute === "System.Byte[]") {
                                continue;
                            }
                            if (typeof attribute === 'string' && attribute.indexOf("http://") === 0) {
                                ////attribute = attribute.replace("http://", "//");
                                //if png show the picture
                                if (attribute.toLowerCase().indexOf(".png") !== -1) {
                                    content += "<li><a href='" + attribute + "' target='_blank'><img src='" + attribute + "' alt='vorschau' width='100%' height='60%'></a></li>";
                                }
                                else {
                                    content = content + "<li><a href='" + attribute + "' target='_blank'>" + prop + "</a></li>";
                                }
                            }
                            else if (typeof attribute === 'string' && attribute.indexOf("https://") === 0) {
                                ////attribute = attribute.replace("https://", "//");
                                //if png show the picture
                                if (attribute.toLowerCase().indexOf(".png") !== -1) {
                                    content += "<li><a href='" + attribute + "' target='_blank'><img src='" + attribute + "' alt='vorschau' width='100%' height='60%'></a></li>";
                                }
                                else {
                                    content = content + "<li><a href='" + attribute + "' target='_blank'>" + prop + "</a></li>";
                                }
                            }
                            else {
                                content += "<li><b>" + prop + ": </b>" + attribute + "</li>";
                            }
                        }
                    }
                    content += "</ul>";


                    var json = { title: "Feature Attributes", content: content };
                    var infoTemplate = new InfoTemplate(json);
                    feature.setInfoTemplate(infoTemplate);
                    features.push(feature);
                });
            }
            else if (response[0] === true && _isHTML(response) === true) {
                var content = response[1];
                var json = { title: "WMS Results", content: content };
                var infoTemplate = new InfoTemplate(json);
                var feature = new Graphic();
                feature.setInfoTemplate(infoTemplate);
                features.push(feature);
            }

                //wenn image
            else if (response[1].catalogItems !== undefined && response[1].catalogItems.features.length > 0) {
                array.forEach(response[1].catalogItems.features, function (r) {
                    var feature = r;
                    feature.attributes.type = "ArcGISImageServiceLayer";

                    var content = "<ul class='identifyList'>";
                    for (var prop in feature.attributes) {
                        if (feature.attributes.hasOwnProperty(prop)) {
                            var attribute = feature.attributes[prop];

                            if (attribute === null || attribute === "Null" || attribute === "" || attribute === "System.Byte[]") {
                                continue;
                            }
                            if (typeof attribute === 'string' && attribute.indexOf("http://") === 0) {
                                //if png show the picture
                                if (attribute.toLowerCase().indexOf(".png") !== -1) {
                                    content += "<li><a href='" + attribute + "' target='_blank'><img src='" + attribute + "' alt='vorschau' width='100%' height='60%'></a></li>";
                                }
                                else {
                                    content += "<li><a href='" + attribute + "' target='_blank'>" + prop + "</a></li>";
                                }
                            }
                            else {
                                content += "<li><b>" + prop + ": </b>" + attribute + "</li>";
                            }
                        }
                    }

                    content += "</ul>";

                    feature.geometry = new Point(clickPoint, map.spatialReference);

                    var json = { title: "Image Service", content: content };
                    //var json = { title: "Image Service", content: "${*}" };
                    var infoTemplate = new InfoTemplate(json);
                    feature.setInfoTemplate(infoTemplate);
                    features.push(feature);

                });
            }

            ////_hideLoading();            
            //map.infoWindow.setFeatures(features);
            ////map.infoWindow.show(clickPoint);
        }
        //_hideLoading();            
        map.infoWindow.setFeatures(features);
        //map.infoWindow.show(clickPoint);

    };

    var _isHTML = function (str) {
        var a = document.createElement('div');
        a.innerHTML = str;
        for (var c = a.childNodes, i = c.length; i--;) {
            if (c[i].nodeType === 1) return true;
        }
        return false;
    };
   
    var _showCoordinates = function (evt) {
        var mp;
        //get mapPoint from event       
        if (evt.mapPoint.spatialReference.wkid !== 4326) {
            //The map is in web mercator - modify the map point to display the results in geographic
            mp = webMercatorUtils.webMercatorToGeographic(evt.mapPoint);
        }
        else {
            mp = evt.mapPoint;
        }
        //var x = mp.x;
        //var y = mp.y;
        var koordx = _dec2sex(mp.x, 'X');
        var koordy = _dec2sex(mp.y, 'y');

        //display mouse coordinates
        //dojo.byId("info").innerHTML = mp.x.toFixed(3) + ", " + mp.y.toFixed(3);
        dojo.byId("info").innerHTML = "LON: " + koordx + ", " + "LAT: " + koordy;
    };

    var _dec2sex = function (dec, dir) {
        var plus = Math.abs(dec);
        var degr = Math.floor(plus);
        var minu = Math.floor(60 * (plus - degr));
        var sec = Math.floor(60 * (60 * (plus - degr) - minu));
        var compass = "?";
        if (minu < 10) {
            minu = "0" + minu;
        }
        if (sec < 10) {
            sec = "0" + sec;
        }
        if (dir === 'y') {
            compass = dec < 0 ? "S" : "N";
        }
        else {
            compass = dec < 0 ? "W" : "E";
        }
        return "" + degr + "° " + minu + "' " + sec + '" ' + compass;
    };

    var _showLoading = function () {
        domUtils.show(_loading);
        //map.disableMapNavigation();
        //map.hideZoomSlider();
    };

    var _hideLoading = function () {
        domUtils.hide(_loading);
        //map.enableMapNavigation();
        //map.showZoomSlider();
    };

    var initUI = function (layers) {

        if (configOptions.hasLegend === true) {
            var layerInfo = buildLayersList(layers);
            // if there are layers, create a legend
            if (layerInfo.length > 0) {
                var legendDijit = new Legend({
                    map: map,
                    layerInfos: layerInfo
                }, 'legendDiv');
                legendDijit.startup();

            }
            else {
                dom.byId('legendDiv').innerHTML = configOptions.i18n.viewer.sidePanel.message;
            }
        }
      
        //add home button:  
        homeWidget = new HomeButton({
            map: map
        }, "HomeButton");
        //homeWidget.on('home', function (obj) {
        //    console.log(obj);
        //});
        homeWidget.startup();

        //if desktop add the scalebar and the geocoder     
        if (isDesktop === true) {

            ////initialize the scalebar
            var scalebar = new Scalebar({
                map: map,
                scalebarUnit: configOptions.i18n.viewer.main.scaleBarUnits
            }, dom.byId("scalebar"));
            var scale = scaleUtils.getScale(map);          
            domAttr.set(dom.byId("scalebar"), "title", Math.round(scale));
            //domAttr.set(dom.byId("scalebar"), "title", esri.geometry.getScale(map.extent, map.width, map.spatialReference.wkid));

            ////add home button:  
            //homeWidget = new HomeButton({
            //    map: map              
            //}, "DesktopHomeButton");
            ////homeWidget.on('home', function (obj) {
            ////    console.log(obj);
            ////});
            //homeWidget.startup();

            //var menuWidget = new MenuBar({
            //    map: map
            //}, "menudiv");
            //menuWidget.startup();

            geocoder = new Geocoder({
                map: map,
                autoComplete: true,
                arcgisGeocoder: {
                    name: "Esri World Geocoder", url: '//geocodedev.arcgis.com/arcgis/rest/services/World/GeocodeServer', placeholder: "Ortssuche"
                },
                highlightLocation:false
            }, "search");
            geocoder.startup();
            geocoder.on("select", showLocation);

            ////add the overview map 
            //var overviewMapDijit = new OverviewMap({
            //    map: map,
            //    visible: false,
            //    attachTo: "top-right",
            //    color: "green",
            //    opacity: 0.40
            //});
            //overviewMapDijit.startup();

            //registry.byId('mainWindow').resize();
        }
        //if mobile
        else {
            //addgeolocate button:
            var geoLocate = new LocateButton({
                map: map,
                highlightLocation: false,
                scale: 36111.911040,
                geolocationOptions: {
                    maximumAge: 0,
                    timeout: 8000,
                    enableHighAccuracy: true
                }
            }, "LocateButton");
            geoLocate.startup();
            geoLocate.on('locate', function (evt) {               
                if (evt.error) {
                    var error = evt.error;
                    require(["app/mobileUtils"], function (mobileUtils) {
                        mobileUtils.dojoSimpleMessage("Location error", 'code: ' + error.code + '<br>' +
                                     'message: ' + error.message);
                    });
                }

            });
        }

    };
    
    /*------------------------------------*/
    // BUILD LAYERS LIST
    /*------------------------------------*/
    var buildLayersList = function (layers) {
        //build a list of layers for the legend.
        var layerInfos = [];
        array.forEach(layers, function (mapLayer) {
            if (mapLayer.layerObject !== null) {
                layerInfos.push({
                    "layer": mapLayer.layerObject,
                    "title": mapLayer.title,
                    "defaultSymbol": false
                });
            }
        });
        return layerInfos;
    };

    //public: returning the map::
    var getMap = function () {
        return map;
    };

    return {
        initMap: initMap,
        getMap: getMap
    };

});