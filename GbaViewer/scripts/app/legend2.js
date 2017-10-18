define(
    [          
         "dojo/_base/declare", "dojo/_base/lang", "dojo/_base/connect", "esri/request", "dojo/DeferredList", "esri/config", "dojo/Deferred",
        "esri/dijit/_EventedWidget", "dijit/_Widget", "dojo/i18n!esri/nls/jsapi", "dojo/i18n!dojo/cldr/nls/number", "dojo/has", "dojo/_base/array", "dojo/dom-construct", "dojo/dom", "dojo/dom-style",
        "dojo/dom-attr", "dijit/a11yclick" ,"dojo/json", "dojo/query", "dojo/NodeList-traverse"       
    ], function (            
        declare, lang, connect, esriRequest, E, esriConfig, Deferred,
        eventedWidget, widget, jsapi, number, has, array, domConstruct, dom,domStyle ,
        domAttr,a11yclick, json, query
) {
        //"use strict";

        //namespace utiilities - class Legend - erbt von vpn den Klassen eventedWidget und widget
        var u = declare("app.Legend", [eventedWidget, widget], {
            //var u = declare("utilities.Legend", null, {

            //properties
            declaredClass: "app.Legend",
            widgetsInTemplate: false, //!0 = true; !1 = false
            layers: null,
            alignRight: false,
            hoverLabelShowing: false,
            dotDensitySwatchSize: 26,
            dotCoverage: 75,
            reZeros: RegExp("\\" + number.decimal + "0+$", "g"),
            reZerosFractional: RegExp("(\\d)0*$", "g"),
            _ieTimer: 100,
            clickEvents: [],

            //the constructor
            constructor: function (options, legendDiv) {  
                lang.mixin(this, jsapi.widgets.legend);                
                options = options || {};              

                if (options.map !== null) {
                    if (legendDiv !== null) {
                        this.map = options.map;
                        this.layerInfos = options.layerInfos;
                        
                        if (options.respectCurrentMapScale === false) {
                            this._respectCurrentMapScale = false;
                        }
                        else {
                            this._respectCurrentMapScale = true;
                        }
                        if (options.arrangement === u.ALIGN_RIGHT) {
                            this.arrangement = u.ALIGN_RIGHT;
                        }
                        else {
                            this.arrangement = u.ALIGN_LEFT;
                        }
                        if (options.autoUpdate === false) {
                            this.autoUpdate = false;
                        }
                        else {
                            this.autoUpdate = true;
                        }
                        this._surfaceItems = [];

                    }
                    else {
                        console.error("utilities.Legend: must specify a container for the legend");
                    }
                }
                else {
                    console.error("utilities.Legend: unable to find the 'map' property in parameters");
                }  
              
            },

            startup: function () {
                //When using dojo's declare you can use this.inherited(arguments) in the child function to call the parent function, see: 
                this.inherited(arguments);
                this._initialize();
                //has("ie") && (this._repaintItems = lang.hitch(this, this._repaintItems) setTimeout(this._repaintItems, this._ieTimer)));
            },

            _initialize: function () {
                //this.layerInfos &&
                if (this.layerInfos !== null && this.layerInfos !== undefined) {
                    this.layers = [],
                    array.forEach(this.layerInfos, function (layerInfo) {
                        var test = this._isSupportedLayerType(layerInfo.layer);
                        //if (this._isSupportedLayerType(layerInfo.layer)) {
                        if (test) {
                            if (layerInfo.title) {
                                layerInfo.layer._titleForLegend = layerInfo.title;
                            }


                            layerInfo.layer._hideDefaultSymbol = false === layerInfo.defaultSymbol ? true : false;
                            if(layerInfo.hideLayers){
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

                this.useAllMapLayers = false;
                if (!this.layers) {
                    this.useAllMapLayers = !0;
                    this.layers = [];
                    var a = [], b = [];
                    array.forEach(this.map.layerIds, function (c) {
                        c = this.map.getLayer(c);
                        var e;
                        if (this._isSupportedLayerType(c)) {
                            if(c.arcgisProps && c.arcgisProps.title){
                                c._titleForLegend = c.arcgisProps.title;
                            }                            
                            this.layers.push(c);
                        }
                        if ("esri.layers.KMLLayer" === c.declaredClass) {
                            e = c.getLayers();
                            array.forEach(e, function (b) { 
                                a.push(b.id);
                            }, this);
                        }
                        if("esri.layers.GeoRSSLayer" === c.declaredClass){
                            e = c.getFeatureLayers();
                            array.forEach(e, function (a) {
                                b.push(a.id);
                            }, this);
                        }

                    }, this);
                   
                }

                this._createLegend();
            },

            _createLegend: function () {
                var mapScale = this.map.getScale();
                var a = false;
                domStyle.set(this.domNode, "position", "relative");
                domConstruct.create("div", { id: this.id + "_msg", innerHTML: this.NLS_creatingLegend + "..." }, this.domNode);
                var b = [];
                array.forEach(this.layers, function (layer) {
                   
                    if ("esri.layers.WMSLayer" === layer.declaredClass) {
                        if(layer.loaded){
                            if (layer.visible) {
                                if (0 < layer.layerInfos.length && array.some(layer.layerInfos, function (a) { return a.legendURL; })){
                                        
                                    //domConstruct.create("div", { innerHTML: "\x3cspan class\x3d'esriLegendServiceLabel'\x3e" + (layer._titleForLegend || layer.name || layer.id) + "\x3c/span\x3e" }, this.domNode)
                                    var bdiv = domConstruct.create("div", { id: this.id + "_" + layer.id, style: "display: none;", "class": "esriLegendService" });
                                    var btable = domConstruct.create("table", { width: "95%", "class": "esriLegendServiceTable" }, bdiv);
                                    var bbody = domConstruct.create("tbody", {}, btable);
                                    var brow = domConstruct.create("tr", {}, bbody);
                                    var bdata = domConstruct.create("td", { align: this.alignRight ? "right" : "left" }, brow);                                       
                                    ////domConstruct.create("span", { innerHTML: this._getServiceTitle(layer), "class": "esriLegendServiceLabel" }, bdata);
                                    domConstruct.create("span", { innerHTML:"LEGENDE", "class": "esriLegendServiceLabel" }, bdata);
                                    domConstruct.place(bdiv, this.id, "first");
                                    has("ie") && domStyle.set(dom.byId(this.id + "_" + layer.id), "display", "visible");

                                    //array.forEach(layer.layerInfos, function (layerInfo, layerIndex) {
                                    //for (var i = 0; i < array.length; i++) {
                                    for (var i = layer.layerInfos.length - 1; i >= 0; i--) {
                                        var layerInfo = layer.layerInfos[i];
                                        //var layerIndex = i;
                                        if (-1 < array.indexOf(layer.visibleLayers, layerInfo.name)) {
                                            var d = dom.byId(this.id + "_" + layer.id);
                                            var p = layerInfo.parentLayerId === undefined ? -1 : layerInfo.parentLayerId;

                                            if (!this._respectCurrentMapScale || this._respectCurrentMapScale && this._isWmsLayerInScale(layerInfo, mapScale)) {
                                                //create esriLegendLayerLabel:
                                                var cdiv = domConstruct.create("div",
                                                    { id: this.id + "_" + layer.id + "_" + layerInfo.id, style: "display:visible;", "class": -1 < p ? this.alignRight ? "esriLegendRight" : "esriLegendLeft" : "" },
                                                    -1 === p ? d : dom.byId(this.id + "_" + layer.id + "_" + p + "_group"));
                                                has("ie") && domStyle.set(cdiv, "display", "visible");
                                                var legendLabelTable = domConstruct.create("tbody", {}, domConstruct.create("table", { width: "95%", "class": "esriLegendLayerLabel" }, cdiv));
                                                var legendLabelRow = domConstruct.create("tr", {}, legendLabelTable);
                                                domConstruct.create("td", { innerHTML: layerInfo.title ? layerInfo.title : "", align: this.alignRight ? "right" : "left" }, legendLabelRow);

                                                //create esriLegendLayer:
                                                var legendTable, legendRow;
                                                if (layerInfo.legendURL) {
                                                    layer.hasLegendResponse = true;


                                                    legendTable = domConstruct.create("tbody", {}, domConstruct.create("table", { width: "95%", "class": "esriLegendLayer" }, d));
                                                    legendRow = domConstruct.create("tr", {}, legendLabelTable);
                                                    domConstruct.create("td", { innerHTML: "\x3cimg src\x3d'" + layerInfo.legendURL + "'/\x3e" }, legendRow);
                                                    a = true;
                                                }
                                                    //kein Legendeneintrag:
                                                else {
                                                    layer.hasLegendResponse = false;


                                                    legendTable = domConstruct.create("tbody", {}, domConstruct.create("table", { width: "95%", "class": "esriLegendLayer" }, d));
                                                    legendRow = domConstruct.create("tr", {}, legendLabelTable);
                                                    domConstruct.create("td", { innerHTML: "no legend entry" }, legendRow);
                                                    a = true;
                                                }
                                            }

                                        }
                                    }
                                    //}, this);

                                    if (a === true) {
                                        domStyle.set(dom.byId(this.id + "_" + layer.id), "display", "block");
                                        domStyle.set(dom.byId(this.id + "_msg"), "display", "none");
                                    }
                                }
                            }
                        }
                        else
                        {
                            connect.connect(layer, "onLoad", lang.hitch(this, function () { this.refresh(this.layerInfos); }));
                        }
                    }
                    //if no wms layer(but dynamic and image services)
                    else {
                        b.push(layer);
                    }
                    //}
                }, this);

                var c = [];
                array.forEach(b, function (layer) {
                    if (layer.loaded) {
                        if (true === layer.visible && (layer.layerInfos || layer.renderer || "esri.layers.ArcGISImageServiceLayer" === layer.declaredClass)) {
                            var bdiv = domConstruct.create("div", { id: this.id + "_" + layer.id, style: "display: none;", "class": "esriLegendService" });
                            
                            var btable = domConstruct.create("table", { width: "95%" }, bdiv);
                            var bbody = domConstruct.create("tbody", {}, btable);
                            var brow = domConstruct.create("tr", {}, bbody);
                            var bdata = domConstruct.create("td", { align: this.alignRight ? "right" : "left" }, brow);
                            //domConstruct.create("span", { innerHTML: this._getServiceTitle(layer), "class": "esriLegendServiceLabel" }, bdata);
                            domConstruct.create("span", { innerHTML: "LEGENDE", "class": "esriLegendServiceLabel" }, bdata);
                            domConstruct.place(bdiv, this.id, "first");

                            domStyle.set(dom.byId(this.id + "_" + layer.id), "display", "visible");
                            layer.legendResponse || layer.renderer ? this._createLegendForLayer(layer) : c.push(this._legendRequest(layer));
                        }
                    }
                    else {
                        var p = connect.connect(layer, "onLoad", this, function () {
                            connect.disconnect(p);
                            p = null;
                            this.refresh();
                        });
                    }
                }, this);          
            

                if (0 === c.length && !a) {
                    dom.byId(this.id + "_msg").innerHTML = this.NLS_noLegend;
                    this._activate();
                }
                else {
                    (new E(c)).addCallback(lang.hitch(this, function () {
                        a ? dom.byId(this.id + "_msg").innerHTML = "" : dom.byId(this.id + "_msg").innerHTML = this.NLS_noLegend;
                        this._activate();
                    }));
                }

            }, //Ende  _createLegend

            _deactivate: function () {
                this._ozeConnect && connect.disconnect(this._ozeConnect);
                //this._olaConnect && connect.disconnect(this._olaConnect);
                //this._olroConnect && connect.disconnect(this._olroConnect);
                //this._olrConnect && connect.disconnect(this._olrConnect);
                array.forEach(this.layers, function (a) {
                    a.ovcConnect && connect.disconnect(a.ovcConnect);
                    a.oscConnect && connect.disconnect(a.oscConnect);
                    a.odcConnect && connect.disconnect(a.odcConnect);
                    a.oirConnect && connect.disconnect(a.oirConnect);
                }, this);

                array.forEach(this.clickEvents, function (clickEvent) {
                    clickEvent && connect.disconnect(clickEvent);                   
                }, this);

                //array.forEach(query(".RowToClick"), function (row) {
                //    var test = row;
                //    row.clickEvent && (connect.disconnect(row.clickEvent));
                //}, this);

            },

            _activate: function () {
                this._deactivate();

                if (this.autoUpdate) {
                    if (this._respectCurrentMapScale) {
                        this._ozeConnect = connect.connect(this.map, "onZoomEnd", this, "_refreshLayers");
                    }
                    
                    array.forEach(query(".RowToClick"), function (row) {
                        var callback = lang.hitch(this, this._showhide, row);
                        this.clickEvents.push(connect.connect(row, a11yclick, null, callback));
                        //row.clickEvent = connect.connect(row, "onclick", null, callback);
                    }, this);



                        //.nextAll("tr");

                    //this.useAllMapLayers && (this._olaConnect = l.connect(this.map, "onLayerAdd", this, "_updateAllMapLayers"), this._olrConnect = l.connect(this.map, "onLayerRemove", this, "_updateAllMapLayers"), this._olroConnect = l.connect(this.map, "onLayersReordered",
                    //this, "_updateAllMapLayers")), m.forEach(this.layers, function (a) {
                    //    a.ovcConnect = l.connect(a, "onVisibilityChange", this, "_refreshLayers"); a.oscConnect = l.connect(a, "onScaleRangeChange", this, "_refreshLayers"); "esri.layers.ArcGISDynamicMapServiceLayer" === a.declaredClass && a.supportsDynamicLayers && (a.odcConnect = l.connect(a, "_onDynamicLayersChange", s.hitch(this, "_updateDynamicLayers", a))); "esri.layers.ArcGISImageServiceLayer" === a.declaredClass && (a.oirConnect = l.connect(a, "onRenderingChange", s.partial(this._updateImageServiceLayers,
                    //    this, a)))
                    //}, this)
                }

            },

            _showhide: function (row) {
                var rowImage = query("img", row)[0];
                //var expand = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAMAAABg3Am1AAABqlBMVEUAAAAAldoAldoAldoAldoAldoAldoAldoAldoAldoAldoAldoAldoAldoAldoAn+IAouQAo+UApOYApecAqOkAqeoAqusArOwAre0Aq+wAoeQApugAltsApucAoOMAp+gAp+kAoeMAmNwAm98Aq+sApeYArO0AnuEBru4Cr+4Gse8Jsu8/seQ/seU/suU/t+n///8AquovqODv+Pw/r+MAru0AnOA/uesKs+8Amt4Hse8Al9sAl9wMtO8Nte8Ote8fot4AouUAlto/sOM/sOQAo+YAmd0Pm9w/s+Y/tOY/tec/tugDr+4/uOoDsO4/uus/uuxCw/JFxfNHxvNKx/NMyPNPt+ZPyvNRy/RfvOfP6/jf9PwEsO4FsO4/wfEAneEAoOILs+8Gse7f8foftu4UuPARt/AIsu+/5PU/tukAneAPtvB/yuwRtvCv3fMvquIguPBIxvOf1/FMyfNNyfNOyfMQsu4LtO8AmN0St/Bfvuhfvul82PcNtO8VuPAXufAAnuIFse4ft+8Br+4Bru1Bw/IAnN9ExPMfpOA/uepJx/MPse0fo98/tOf09d91AAAADnRSTlMADx8vP19vf5+vv8/f7zY48mAAAAL8SURBVHhezZZVc+MwFIWTTbbdNKnMHGZmKDMzM/MyMzP/55WsdJPUrTfTpz0zfpDmfNaVdXXGhv9YJrOuTLVuY6MN1KjPbu+rnWluNFa9vRmAnnxZ/QPxeCKRTCYS8fhA/+lsD0RMVf78SfofOsn/JYw2sJquQ6vAhqtqANl0XcqCBhWwgjv1AXeAVQUAQKO1X96h1i83QoRTJnspihqEDyk7d4jtoq/V+20NeQCoAga8Q74isvdSdIBxQDEBGjIeInTD1/rsLq7JVAGSQz74eg9J0YzicrNQbpfiCNC9svMdJLzIkwfmCjAC/U4Z2d0sl+GhMhzLuhw0RToJSGiA0aLqd7jYDC8dbEEdSH7IKMwgidbQAGMhQqYCCsvxQlBMq3oiCn6OdSEiVNQA44SHoqHfHxTDExiYjRREiYcEJRMhDXDdSdIOlpPETxObUQzMbU6ERYFnFZryEBogJVOMi/OL4am94xYMzMeiGxFR4lgHTe5ogEkSFsQLhalo7GkXBhY6W9o2wqKfg0V50ER/GbCrAFpAEiN7sc7u2xh4ePN1S9tUQeDhErJ6uGWgHQ1KcAd8MLxxvNt9dIiB5ec3O2PvI3AJhSbRRLwMdGAA7uDD56/zPxYfr2Dg1fKjhftzs/cEVBOaSFQD07AiIX2ufvJsGejDgNonM4w7cwGwhTah9pu9BmD5iwA/q1wWuGRJlU2vn+dfFyqbPvtZxUi0pev24VvsXHlz1L0LT06qfNZLHJxeayzC1ohqWqOu5gucNp+2vYNn2vujpr01F6igf4G0V1Q494pu64SAFBTV81gX9UKgEjMIEYRgUBBQzLgVhsIxoxtkXB1BlqiOSlc5KhmdqFyqCWPmbBgvIU8PuIKBHBzkXiRHRsfGr6cmv5emZ1RNl0qTqdT42O+R5EvVUo57C3iQrksPgEUFzGA4V48/NwyuGlQ1gex+Hf4saDJgGa1g+Naavn3/1jCwGg2nhKXmJ6C9w6uqo91uBxVZsB/LfM2m/+tgu2bGzj9qmkLgNEH0JwAAAABJRU5ErkJggg==";
                var expand = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC4AAAANCAYAAADWgVyvAAAE6UlEQVRIicWW209UVxTG51/sk0mtcr8OM8DUikJUxCIWQoXOMAwXS4BBQFFrg1EJIAxgghIfeBkTEiWRB2NQigPMOfuyfn3YZ6iUvve8nH32Pnvtb631rfXtEAYQOALgAAQ8cqAAq8hjEcCgwfj4WIyAQeEZQEmwDoLFx8MLvgF8AKOBI/IAKDgEjeCTo/BYaxERgBPvwvjbeYAQhUOsRQSMArRbNDin4AANaCyID3lAOTDg4b3spTFylQkOHVLttgk+HgAeaA8MiKcA6xzSBmMM3z7W2lOg/wt8SNBo34ACjwPAugAZjQfk0eCBr/8CI2jEgbEKY0BbIJOkoeoS9zkCo/AFPBSoI4Q8iAXR+ICgsUYh1gd7EhRALpdjb2/veF5rF0Xf910wjWF3d5dQngV6r8do7+vjYsV5SqN1XBiYZbyzhKJwmJK6Nh5oDVhQ67S3lvJd7AxlkXJaJgXw0C/uUBf5hb6+eooayzgbraPvpWPb80Qzpc3NVIbrKe5MIWLAOsoYdQIzIsLnz5958uQJb9++PbHmeR67u7s8fvyYzc1NQrBG/8UznGvp5zkWPdNFSUUl4d8XMDzjdlOEcHIFLIzcOk9x+59YAf+PDsrrovSsHsBSP5fDtdT1ZMjzlYft9RQ1DLGCZTkRobS2iWlxEfaso5xYCDw4AXx/f59UKsXw8DCbm5sopRARtre3mZmZYXBwkPfv3xNSvKDvUjXVyWcYwFvtIhbt4KEHiM/drmJqBuc45B5tkWraJ4zjvjfH7eYamh8YWOikrDbGr+uuLtRUKz+09DCHsDoY40xLLxsGrPjAEVbAK5QPp+mytbXFo0ePSKVSrK2t8fr1a8bGxhgZGWFrawtrLSFf5km0XODKmAJjUcsJYrVtjANwxNTNMLH4PDBNU7SCmqoYRRUl1MaqOFtVQWMyg1ntpaa+l0krrj4mW6i7PMCyFeYHL1B0Y5xDV3povoIKHJSTBVngMMCXL1+YnZ0lmUwSj8dJp9N8/PgR3/cxxhCCF3Q31XBzyjULWeol0nCNtHWZnLxRQ3R4Ecs47dUR4hkPUBzguxZogNVuaqJtjAd0YPIaxRe7eQas/NZIaec4RgBRQbZMAfEpquzs7PDq1Svy+TwiwsbGBouLi7x79w6AnZ0dstksIZijq7mSq5OuD9tMisbqdtJosPDg53IakgsoYKwzSlnHKFhBL8dpCNdz5Z7FrsSJRFsZVy7/6n4rxc0jZKxPJtnI2VvTCASKYB14o0/QxBhzzOV0Os3c3Bz7+/v4vo+IsLe3RzabZWJigtXVVUKYDN0tEW7cDcK32Etj9DqjKBC401lDQ/8SecDapyQul3MuWk5VtIpw6qlr+ZnbRCo7mEaBKJi8TvFPPSzhsZj8ke9v3XPps3mUtvzTue0pqogI8/PzDA0NMTU1xfb2NgDLy8skEgnS6TRKKUJOKA6xAqBcrw3U1A28oKgCXTLBgRIolQF8QePUFEtBRp1NsSAWLQVB04GJfEHnEJFjbhcy8ObNGwYGBhgeHiaRSDA6OsrKysrxfyFnJQCAh4gTCcRRRwIfMIKgEIKDDRgsBu2kXACrgsgS7A+gSWBDNMYEXQmFRo4FpkCXfN5dDHzfJ5vNMjo6SjweZ319nVwuh4i4iP/fwAuA/+0AONX88OEDnz59Qmt94jrwN10oaJWPbOUKAAAAAElFTkSuQmCC";
                //var up = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAMAAABg3Am1AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAdpQTFRFAAAAAJXaAJXaAJXaAJXaAJXaAJXaAJXaAJXaAJXaAJXaAJXaAJXaAJXaAJXaAJbaAJbbAJfbAJfcAJjcAJjdAJndAJreAJvfAJzfAJzgAJ3gAJ3hAJ7hAJ7iAJ/iAKDiAKDjAKHjAKHkAKLkAKLlAKPlAKPmAKTmAKXmAKXnAKbnAKboAKfoAKfpAKjpAKnqAKrqAKrrAKvrAKvsAKzsAKztAK3tAK7tAa7tAa7uAa/uAq/uA6/uA7DuBLDuBbDuBbHuBrHuBrHvB7HvCLLvCbLvCbPvCrPvC7PvC7TvDLTvDbTvDbXvDrXvD5vcD7HtD7XwD7bwELbwEbbwEbfwErfwE7fwE7jwFLjwFbjwFbnwFrnwF7nwGLrxGbrxGbvxGrvxG7zxHLzxHbzxHb3xH6LeH6PfH6TgH7fvILjwL6jgL6riP6/jP7DjP7DkP7HkP7HlP7LlP7PmP7TmP7TnP7XnP7boP7bpP7fpP7jqP7nqP7nrP7rrP7rsP8HxQcPyQsPyRMTzRcXzR8bzSMbzScfzSsfzTMjzTcnzTsnzT7fmT8rzUcv0Usz0U8z0VMz0VM30Vc30X7znX77oX77pf8rsn9fxr93zv+T1z+v43/H63/T87/j8////8UvS/AAAAA50Uk5TAA8fLz9fb3+fr7/P3+82OPJgAAAC8klEQVRIx82Wv44cZRDEq6pn7qxzhnSyQEIgkdpCMuIdeAAkEsRrkBAQ8BZkRFxA4sDyOyAIsEVI4ACJB7Dhdr+uIpidvb0/9h0Zo9FqRtu/r7u/r6s0wP/u4vpQfGtc+hLAo1mX1yGSy8Rmkz1QJ8QXx/tYgiCCIHvq/Ax53TugTvjVw/mW2rcvfsjrBgjwvr67f4d2X33jV0EBR/OXH9xlf45On6chYMaju+3oI8zABBSOAIxffhIlSSIJMIDjpO30548n4AgFFHCMzwA8P5NqqqpSLb+iWCTI8PfTdwGc/jYy7Q9OWu41BZLEarrR+vExAIHYA1RpWgDuAdggQXStcQeAJpVKEkWQSWKKbqDQ1wCVVFVFFUkRQcPuZcYu5uSwpFIVq1glEklliAaQXEzaYUmq4lSaViCDDQIRcjMgVtU0VRWJxOqhbVyBfB1YTo3TXFNNEpKtRBhpRVpHewKwFCiR0jTVXEclwVFvgFiJxUOAu3gt+1TH0w4g4ppiEtcBQOQnDyRJRQmx07b918/NyyXtmgb06U1D+v6fL1dFc6l/l45vsoGPl+UAcm14Ff4breXiL/1XXzoArvjKocUcnLSA5S1I4JvC/RSI1yX3uxQX/P18PM/H81QS7R7b8+12s4m9T4VpzQBYiYdIIiKd0d3dTrBDggPAlulWU+exSKd7093DSdayF2BJaCvmEJFMEuLRPcaIbfsSsNsjmyQHEreIpN1jdHd8paRd0zTVbMdeBdTddrp3GXAVAGtEWRXnjLTbdnffAIBoVCfpAxOIu21fV5wbBhLFEpsIEsf2cPcNQMwxYYcsA5DAbrvdfb0HGxjKImxkARYv7u5c7+E9A1miRDaXx12K+GsAOIcXIATe+fYPUtxd6/g6cOJ8dA9AzhZgO2+OAZ48vE0KG2wBAVs8y12kk2cYQAGul6cPbldefn0yzoECMKYXmw9vEWtvnj7pv/eOcW8+9IKLpi9pcPtPLkxsmia99dPBYwwAwL9AmtuvmJRxnwAAAABJRU5ErkJggg==";
                var up = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC4AAAANCAYAAADWgVyvAAABmUlEQVRIic2Vz6uyQBiF7/8PEa00rYUVtBIKWhUFLSTbSNQi6BdBtoikNFBLHZ9vcdFbd3N3nx4YmHmHgWcOZ975ogRKkgSANE0/6tk623+vf/0ftL8lhPgA/X0J+AYWQgAUD56BZEqShNfrlc/X6zXH4zF3PYoioCTgmbtxHPN8PgFwXRfTNFEUBU3TWK1WOXQURcWDZxJC5O57nsdoNEKSJNrtNpIkoaoqpmkSxzFQAsd/Z9nzPAaDAbIsYxgGQRBg2za6rqOqKuPxGCgReJqmJEmCZVlomsZkMiFN03xcr1eGwyGKonC5XIoHh88Hulwu2Ww2ADiOQ7fbpdfr4fs+AIvFgvP5XDz4e1SEEIRhCMDpdKLf71OpVJBlmel0iuu6+ZlSgL/3ZyEEtm1Tr9epVqscDgdmsxm1Wo1ms8ntdiOO4+LB4cd1IQTb7RZZlul0Ouz3e+C7n8/ncxqNBq1WC9/3iwd/7+NCCCzLwjAMPM8Dfj6cIAi43+/ous5utyseHD4fp+M42LadxycIgjxOAGEY8ng8+AdjHR5hIWHMswAAAABJRU5ErkJggg==";
                // get node title
                var imgSrc = domAttr.get(rowImage, "src");
                if (imgSrc === expand) {
                    domAttr.set(rowImage, "src", up);
                }
                else {
                    domAttr.set(rowImage, "src", expand);
                }

              
                array.forEach(query(row).nextAll("tr"), function (row1) {                   
                    var display = domStyle.get(row1, 'display');
                    if (display !== "none") {
                        domStyle.set(row1, 'display', 'none');
                    }
                    else {
                        domStyle.set(row1, 'display', 'table-row');
                    }
                });
            },

            _refreshLayers: function () {
                this.refresh();
            },

            refresh: function (a) {
                if (this.domNode) {
                    //if (a) {
                        //this.layerInfos = a;
                        //this.layers = [];
                        //array.forEach(this.layerInfos, function (a) {
                        //    if (this._isSupportedLayerType(a.layer)) {
                        //        a.title && (a.layer._titleForLegend = a.title);
                        //        a.layer._hideDefaultSymbol = false === a.defaultSymbol ? !0 : !1,
                        //        a.hideLayers ?
                        //        (a.layer._hideLayersInLegend = a.hideLayers, this._addSubLayersToHide(a)) : a.layer._hideLayersInLegend = [],
                        //        a.hoverLabel && (a.layer._hoverLabel = a.hoverLabel);
                        //        a.hoverLabels && (a.layer._hoverLabels = a.hoverLabels);
                        //        this.layers.push(a.layer);
                        //    }
                        //}, this);
                    //}
                    if (!a) {
                        this.useAllMapLayers && (this.layers = this.layerInfos = null);
                        for (a = this.domNode.children.length - 1; 0 <= a; a--) {
                            domConstruct.destroy(this.domNode.children[a]);
                        }
                        this.startup();
                    }
                }
            },

            destroy: function () {
                this._deactivate();             
                this.inherited(arguments);
            },         
  
            _legendRequest: function (layer) {
                if (layer.loaded) {
                    //return 10.01 <= layer.version ? this._legendRequestServer(layer) : this._legendRequestTools(layer);
                    if (10.01 <= layer.version) {
                        if ("esri.layers.ArcGISImageServiceLayer" === layer.declaredClass && layer.version < 10.2) {

                            return this._buildManuallyLegendResponseImg().then(lang.hitch(this, function (legendResponse) {
                                this._processLegendResponse(layer, legendResponse);
                            }));

                           
                        }
                        else {

                            return this._legendRequestServer(layer);
                        }
                    }
                    //else {
                    //    return this._legendRequestTools(layer);
                    //}
                }
                    //if not loaded:
                else {
                    layer.connect(layer, "onLoad", lang.hitch(this, "_legendRequest"));
                }
            },
         
            _legendRequestServer: function (layer) {
                var legendUrl = layer.url;
                var c = legendUrl.indexOf("?");
                legendUrl = (-1 < c) ? legendUrl.substring(0, c) + "/legend" + legendUrl.substring(c) : legendUrl + "/legend";
                (c = layer._getToken()) && (legendUrl += "?token\x3d" + c);
                var e = lang.hitch(this, "_processLegendResponse");
                c = { f: "json" };
                layer._params.dynamicLayers && (c.dynamicLayers = json.stringify(this._createDynamicLayers(layer)), "[{}]" === c.dynamicLayers && (c.dynamicLayers = "[]"));
                layer._params.bandIds && (c.bandIds = layer._params.bandIds);
                layer._params.renderingRule && (c.renderingRule = layer._params.renderingRule);
                return esriRequest({
                    url: legendUrl,
                    content: c,
                    callbackParamName: "callback",
                    load: function (response, io) {
                        e(layer, response, io);                      
                    },
                    error: function () {
                        //esriConfig.defaults.io.errorHandler;
                    }
                });
            },

            _processLegendResponse: function (layer, legendResponse) {
                if (legendResponse && legendResponse.layers) {

                    layer.legendResponse = legendResponse;
                    domConstruct.empty(dom.byId(this.id + "_" + layer.id));

                    //WebService-Überschrift generieren:
                    var table = domConstruct.create("table", { width: "95%" }, dom.byId(this.id + "_" + layer.id));
                    var body = domConstruct.create("tbody", {}, table);
                    var row = domConstruct.create("tr", {}, body);
                    var td = domConstruct.create("td", { align: this.alignRight ? "right" : "left" }, row);
                    //domConstruct.create("span", { innerHTML: this._getServiceTitle(a), "class": "esriLegendServiceLabel" }, td);
                    domConstruct.create("span", { innerHTML: "LEGENDE", "class": "esriLegendServiceLabel" }, td);

                    this._createLegendForLayer(layer);
                }
                else {
                    console.log("Legend could not get generated for " + layer.url);
                }
            },
           
            _createLegendForLayer: function (layer) {
                if (layer.legendResponse || layer.renderer) {
                    var b = false;

                    if (layer.legendResponse) {
                        var layerInfos = layer.dynamicLayerInfos || layer.layerInfos;
                        //map services:
                        if (layerInfos !== undefined && layerInfos.length > 0) {

                            array.forEach(layerInfos, function (layerInfo, layerIndex) {
                                if (!layer._hideLayersInLegend || -1 === array.indexOf(layer._hideLayersInLegend, layerInfo.id)) {
                                    var boolResponse = this._buildWebservicelayerHeadings(layer, layerInfo, layerIndex);
                                    b = b || boolResponse;
                                }
                            }, this);
                        }
                            //image services:
                        else {
                            if ("esri.layers.ArcGISImageServiceLayer" === layer.declaredClass) {
                                b = this._buildWebservicelayerHeadings(layer, { id: 0, name: null, title: layer.name, subLayerIds: null, parentLayerId: -1 }, 0);
                            }
                        }
                        
                    }

                    if (b === true) {
                        domStyle.set(dom.byId(this.id + "_" + layer.id), "display", "block");
                        domStyle.set(dom.byId(this.id + "_msg"), "display", "none");
                    }
                }
                               
            },

            _buildManuallyLegendResponseImg: function () {
                var deferred = new Deferred();

                var legendResponse = {
                    "layers": [
                     {
                         "layerId": 0,
                         "layerName": "Test/MD_Gebietskarten",
                         "layerType": "Raster Layer",
                         "minScale": 0,
                         "maxScale": 0,
                         "legendType": "RGB Composite",
                         "legend": [
                          {
                              "label": "Red:    Band_1",
                              "url": "2929cfae2efac980ef6c9ea09223463e",
                              "imageData": "iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAAAAAAAAAAHqZRakAAAANUlEQVQ4jWPMy8v7z0BFwMLAwMAwcdIkqhiWn5fHwEQVk5DAqIGjBo4aOGrgqIEQwEjtKgAATl0Hu6JrzFUAAAAASUVORK5CYII=",
                              "contentType": "image/png",
                              "height": 20,
                              "width": 20
                          },
                          {
                              "label": "Green: Band_2",
                              "url": "49f1c6a1be24c5484bbf3e629796273e",
                              "imageData": "iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAAAAAAAAAAHqZRakAAAANUlEQVQ4jWPMy8v7z0BFwMLAwMAwaeIkqhiWl5/HwEQVk5DAqIGjBo4aOGrgqIEQwEjtKgAATl0Hu6sKxboAAAAASUVORK5CYII=",
                              "contentType": "image/png",
                              "height": 20,
                              "width": 20
                          },
                          {
                              "label": "Blue:   Band_3",
                              "url": "ea7072b100ba7bef3760e98b91c4313f",
                              "imageData": "iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAAAAAAAAAAHqZRakAAAANUlEQVQ4jWPMy8v7z0BFwMLAwMAwadJEqhiWl5fPwEQVk5DAqIGjBo4aOGrgqIEQwEjtKgAATl0Hu75+IUcAAAAASUVORK5CYII=",
                              "contentType": "image/png",
                              "height": 20,
                              "width": 20
                          }
                         ]
                     }
                    ]
                };
                deferred.resolve(legendResponse);
                return deferred.promise;
                //return legendResponse;
            },

            //_buildLegendLabels: function (layer, layerInfo, layerIndex) {
            _buildWebservicelayerHeadings: function (webservicelayer, layerInfo, layerIndex) {
                var e = false;
                var d = dom.byId(this.id + "_" + webservicelayer.id);
                var parentLayerId = layerInfo.parentLayerId;
                var grundDiv;
                var mapScale = this.map.getScale();
                var _id, _class1, _attributes, _refNode, _table, _tr;
                //oberster Gruppenlayer:                
                if (layerInfo.subLayerIds) {
                    //todo: testen ob alle sublayer im Maßstab sichtbar sind
               
                    //if (!this._respectCurrentMapScale || this._respectCurrentMapScale && this._isLayerInScale(layer, layerInfo, mapScale)) {

                    //attributes
                    _id = this.id + "_" + webservicelayer.id + "_" + layerInfo.id + "_group";
                    var _style = "display: visible;";
                    //_class1;
                    if (parentLayerId === -1) {
                        if (0 < layerIndex) {
                            _class1 = "esriLegendGroupLayer";
                        }
                        else {
                            _class1 = "";
                        }
                    }
                    else {
                        _class1 = "esriLegendLeft";
                    }
                    _attributes = { id: _id, style: _style, "class": _class1 };
                    _refNode = -1 === parentLayerId ? d : dom.byId(this.id + "_" + webservicelayer.id + "_" + parentLayerId + "_group");

                    grundDiv = domConstruct.create("div", _attributes, _refNode);
                    domStyle.set(dom.byId(_id), "display", "visible");

                    //to write the lable of the group-layer, at least one sublayer must be visible in scale:
                    if (this.__atLeastOneSublayerVisible(webservicelayer, layerInfo) === true) {
                    //label für den Legendeneintrag zum Gruppenlayer (der dann die sublayer beinhaltet) via table: 
                        _table = domConstruct.create("table", { width: "95%", "class": "esriLegendLayerLabel" }, grundDiv);
                        var _tbody = domConstruct.create("tbody", {}, _table);
                        _tr = domConstruct.create("tr", {}, _tbody);
                        domConstruct.create("td", { innerHTML: layerInfo.name, align: this.alignRight ? "right" : "left" }, _tr);
                    }
                  
                }
                   
                    //}

                    //einfache layer und sichtbare sub-layer:
                else {
                    //nicht sichtbare Layer/Sublayer ausschließen:
                    if (webservicelayer.visibleLayers && -1 === ("," + webservicelayer.visibleLayers + ",").indexOf("," + layerInfo.id + ",")) {
                        return e;
                    }

                    //atrributes
                    _id = this.id + "_" + webservicelayer.id + "_" + layerInfo.id;
                    //_class1;
                    if (-1 < parentLayerId) {
                        _class1 = "esriLegendLeft";                        
                    }
                    else {
                        _class1 = "";
                    }
                    _attributes = { id:_id, style: "display: visible;", "class": _class1 };                  
                    _refNode = -1 === parentLayerId ? d : dom.byId(this.id + "_" + webservicelayer.id + "_" + parentLayerId + "_group");

                    grundDiv = domConstruct.create("div", _attributes, _refNode);
                    domStyle.set(dom.byId(_id), "display", "visible");

                    //var mapScale = this.map.getScale();
                    if (!this._respectCurrentMapScale || this._respectCurrentMapScale && this._isLayerInScale(webservicelayer, layerInfo, mapScale)) {
                        _table = domConstruct.create("tbody", {}, domConstruct.create("table", { width: "95%", "class": "esriLegendLayerLabel" }, grundDiv));
                        _tr = domConstruct.create("tr", {}, _table);
                        domConstruct.create("td", { innerHTML: layerInfo.name ? layerInfo.name : "", align: this.alignRight ? "right" : "left" }, _tr);
                                          
                        //e = e || this._buildLegendItems_Tools(layer, b, grundDiv);
                        e = this._buildLayerLegendItems(webservicelayer, layerInfo, grundDiv);
                    }
                }

                return e;
            },         

            _buildLayerLegendItems: function (webservicelayer, layerInfo, grundDiv) {
                 
                var hasLegendResponse = false;

                var _getLegendResponseForSpecificLayer = function (legendResponseLayers, layerInfo) {
                    var c, d; 
                    for (c = 0; c < legendResponseLayers.length; c++) {
                        if (layerInfo.dynamicLayerInfos) {
                            for (d = 0; d < layerInfo.dynamicLayerInfos[d].length; d++) {

                                if (layerInfo.dynamicLayerInfos[d].mapLayerId === legendResponseLayers[c].layerId) {
                                    return legendResponseLayers[c];
                                }

                            }
                        }
                        else if (layerInfo.id === legendResponseLayers[c].layerId) {
                            return legendResponseLayers[c];
                        }
                    }


                    return {};
                };             
                var legendResponsesForLayer = _getLegendResponseForSpecificLayer(webservicelayer.legendResponse.layers, layerInfo).legend;
                if (legendResponsesForLayer) {
                    var _table = domConstruct.create("table", { cellpadding: 0, cellspacing: 0, width: "95%", "class": "esriLegendLayer" }, grundDiv);
                    var _tbody = domConstruct.create("tbody", {}, _table);

                    var _tr = domConstruct.create("tr", { "class": "RowToClick" }, _tbody);                    
                    //domConstruct.create("td", { innerHTML: '', align: this.alignRight ? "right" : "left" }, _tr);
                    var rowVisibility = "row-table";
                    if (legendResponsesForLayer.length > 10) {
                        rowVisibility = "none";
                        var expandDataCell = dojo.create("td", { align: this.alignRight ? "right" : "left" }, _tr);
                        //var imgSrc = "data:image/png;base64," + "iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAMAAABg3Am1AAABqlBMVEUAAAAAldoAldoAldoAldoAldoAldoAldoAldoAldoAldoAldoAldoAldoAldoAn+IAouQAo+UApOYApecAqOkAqeoAqusArOwAre0Aq+wAoeQApugAltsApucAoOMAp+gAp+kAoeMAmNwAm98Aq+sApeYArO0AnuEBru4Cr+4Gse8Jsu8/seQ/seU/suU/t+n///8AquovqODv+Pw/r+MAru0AnOA/uesKs+8Amt4Hse8Al9sAl9wMtO8Nte8Ote8fot4AouUAlto/sOM/sOQAo+YAmd0Pm9w/s+Y/tOY/tec/tugDr+4/uOoDsO4/uus/uuxCw/JFxfNHxvNKx/NMyPNPt+ZPyvNRy/RfvOfP6/jf9PwEsO4FsO4/wfEAneEAoOILs+8Gse7f8foftu4UuPARt/AIsu+/5PU/tukAneAPtvB/yuwRtvCv3fMvquIguPBIxvOf1/FMyfNNyfNOyfMQsu4LtO8AmN0St/Bfvuhfvul82PcNtO8VuPAXufAAnuIFse4ft+8Br+4Bru1Bw/IAnN9ExPMfpOA/uepJx/MPse0fo98/tOf09d91AAAADnRSTlMADx8vP19vf5+vv8/f7zY48mAAAAL8SURBVHhezZZVc+MwFIWTTbbdNKnMHGZmKDMzM/MyMzP/55WsdJPUrTfTpz0zfpDmfNaVdXXGhv9YJrOuTLVuY6MN1KjPbu+rnWluNFa9vRmAnnxZ/QPxeCKRTCYS8fhA/+lsD0RMVf78SfofOsn/JYw2sJquQ6vAhqtqANl0XcqCBhWwgjv1AXeAVQUAQKO1X96h1i83QoRTJnspihqEDyk7d4jtoq/V+20NeQCoAga8Q74isvdSdIBxQDEBGjIeInTD1/rsLq7JVAGSQz74eg9J0YzicrNQbpfiCNC9svMdJLzIkwfmCjAC/U4Z2d0sl+GhMhzLuhw0RToJSGiA0aLqd7jYDC8dbEEdSH7IKMwgidbQAGMhQqYCCsvxQlBMq3oiCn6OdSEiVNQA44SHoqHfHxTDExiYjRREiYcEJRMhDXDdSdIOlpPETxObUQzMbU6ERYFnFZryEBogJVOMi/OL4am94xYMzMeiGxFR4lgHTe5ogEkSFsQLhalo7GkXBhY6W9o2wqKfg0V50ER/GbCrAFpAEiN7sc7u2xh4ePN1S9tUQeDhErJ6uGWgHQ1KcAd8MLxxvNt9dIiB5ec3O2PvI3AJhSbRRLwMdGAA7uDD56/zPxYfr2Dg1fKjhftzs/cEVBOaSFQD07AiIX2ufvJsGejDgNonM4w7cwGwhTah9pu9BmD5iwA/q1wWuGRJlU2vn+dfFyqbPvtZxUi0pev24VvsXHlz1L0LT06qfNZLHJxeayzC1ohqWqOu5gucNp+2vYNn2vujpr01F6igf4G0V1Q494pu64SAFBTV81gX9UKgEjMIEYRgUBBQzLgVhsIxoxtkXB1BlqiOSlc5KhmdqFyqCWPmbBgvIU8PuIKBHBzkXiRHRsfGr6cmv5emZ1RNl0qTqdT42O+R5EvVUo57C3iQrksPgEUFzGA4V48/NwyuGlQ1gex+Hf4saDJgGa1g+Naavn3/1jCwGg2nhKXmJ6C9w6uqo91uBxVZsB/LfM2m/+tgu2bGzj9qmkLgNEH0JwAAAABJRU5ErkJggg==";
                        var imgSrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC4AAAANCAYAAADWgVyvAAAE6UlEQVRIicWW209UVxTG51/sk0mtcr8OM8DUikJUxCIWQoXOMAwXS4BBQFFrg1EJIAxgghIfeBkTEiWRB2NQigPMOfuyfn3YZ6iUvve8nH32Pnvtb631rfXtEAYQOALgAAQ8cqAAq8hjEcCgwfj4WIyAQeEZQEmwDoLFx8MLvgF8AKOBI/IAKDgEjeCTo/BYaxERgBPvwvjbeYAQhUOsRQSMArRbNDin4AANaCyID3lAOTDg4b3spTFylQkOHVLttgk+HgAeaA8MiKcA6xzSBmMM3z7W2lOg/wt8SNBo34ACjwPAugAZjQfk0eCBr/8CI2jEgbEKY0BbIJOkoeoS9zkCo/AFPBSoI4Q8iAXR+ICgsUYh1gd7EhRALpdjb2/veF5rF0Xf910wjWF3d5dQngV6r8do7+vjYsV5SqN1XBiYZbyzhKJwmJK6Nh5oDVhQ67S3lvJd7AxlkXJaJgXw0C/uUBf5hb6+eooayzgbraPvpWPb80Qzpc3NVIbrKe5MIWLAOsoYdQIzIsLnz5958uQJb9++PbHmeR67u7s8fvyYzc1NQrBG/8UznGvp5zkWPdNFSUUl4d8XMDzjdlOEcHIFLIzcOk9x+59YAf+PDsrrovSsHsBSP5fDtdT1ZMjzlYft9RQ1DLGCZTkRobS2iWlxEfaso5xYCDw4AXx/f59UKsXw8DCbm5sopRARtre3mZmZYXBwkPfv3xNSvKDvUjXVyWcYwFvtIhbt4KEHiM/drmJqBuc45B5tkWraJ4zjvjfH7eYamh8YWOikrDbGr+uuLtRUKz+09DCHsDoY40xLLxsGrPjAEVbAK5QPp+mytbXFo0ePSKVSrK2t8fr1a8bGxhgZGWFrawtrLSFf5km0XODKmAJjUcsJYrVtjANwxNTNMLH4PDBNU7SCmqoYRRUl1MaqOFtVQWMyg1ntpaa+l0krrj4mW6i7PMCyFeYHL1B0Y5xDV3povoIKHJSTBVngMMCXL1+YnZ0lmUwSj8dJp9N8/PgR3/cxxhCCF3Q31XBzyjULWeol0nCNtHWZnLxRQ3R4Ecs47dUR4hkPUBzguxZogNVuaqJtjAd0YPIaxRe7eQas/NZIaec4RgBRQbZMAfEpquzs7PDq1Svy+TwiwsbGBouLi7x79w6AnZ0dstksIZijq7mSq5OuD9tMisbqdtJosPDg53IakgsoYKwzSlnHKFhBL8dpCNdz5Z7FrsSJRFsZVy7/6n4rxc0jZKxPJtnI2VvTCASKYB14o0/QxBhzzOV0Os3c3Bz7+/v4vo+IsLe3RzabZWJigtXVVUKYDN0tEW7cDcK32Etj9DqjKBC401lDQ/8SecDapyQul3MuWk5VtIpw6qlr+ZnbRCo7mEaBKJi8TvFPPSzhsZj8ke9v3XPps3mUtvzTue0pqogI8/PzDA0NMTU1xfb2NgDLy8skEgnS6TRKKUJOKA6xAqBcrw3U1A28oKgCXTLBgRIolQF8QePUFEtBRp1NsSAWLQVB04GJfEHnEJFjbhcy8ObNGwYGBhgeHiaRSDA6OsrKysrxfyFnJQCAh4gTCcRRRwIfMIKgEIKDDRgsBu2kXACrgsgS7A+gSWBDNMYEXQmFRo4FpkCXfN5dDHzfJ5vNMjo6SjweZ319nVwuh4i4iP/fwAuA/+0AONX88OEDnz59Qmt94jrwN10oaJWPbOUKAAAAAElFTkSuQmCC";
                        domConstruct.create("img", { src: imgSrc, border: 0, style: "width:46px;height:13px" }, expandDataCell);
                        //dojo.connect(_tr, 'onclick', this._showhide);
                    }
                   

                    array.forEach(legendResponsesForLayer, function (legendResponseRow) {                         
                        hasLegendResponse = true;
                        this._buildTableRow(legendResponseRow, _tbody, webservicelayer, layerInfo.id, rowVisibility);
                    }, this);
                }
              
                if (hasLegendResponse)
                {
                    domStyle.set(dom.byId(this.id + "_" + webservicelayer.id + "_" + layerInfo.id), "display", "visible");
                }
                return hasLegendResponse;
            },

            _buildTableRow: function (legendResponseRow, tbody, webservicelayer, e, rowVisibility) {
                var legendEntryRow = domConstruct.create("tr", {}, tbody);
                domStyle.set(legendEntryRow, 'display', rowVisibility);

                var imgDataCell, lblDataCell;

                if (this.alignRight) {
                    lblDataCell = domConstruct.create("td", { align: "right" }, legendEntryRow);
                    imgDataCell = domConstruct.create("td", { align: "right", width: 35 }, legendEntryRow);
                }
                else {
                    imgDataCell = domConstruct.create("td", { width: 35 }, legendEntryRow);
                    lblDataCell = domConstruct.create("td", {}, legendEntryRow);
                }

                //legend entry image:
                var imgSrc= legendResponseRow.url;
                if ((!has("ie") || 8 < has("ie")) && legendResponseRow.imageData && 0 < legendResponseRow.imageData.length) {
                    imgSrc = "data:image/png;base64," + legendResponseRow.imageData;
                }
                else {
                    if (0 !== legendResponseRow.url.indexOf("http")) {
                        imgSrc = webservicelayer.url + "/" + e + "/images/" + legendResponseRow.url;
                        (e = webservicelayer._getToken()) && (imgSrc += "?token\x3d" + e);
                    }
                }
                domConstruct.create("img", { src: imgSrc, border: 0, style: "opacity:" + webservicelayer.opacity }, imgDataCell);

                //legend entry label
                var _table = domConstruct.create("table", { width: "95%", dir: "ltr" }, lblDataCell);
                var _tbody = domConstruct.create("tbody", {}, _table);
                var _tr = domConstruct.create("tr", {}, _tbody);
                domConstruct.create("td", { innerHTML: legendResponseRow.label.replace(/[\&]/g, "\x26amp;").replace(/</g, "\x26lt;").replace(/[\>]/g, "\x26gt;").replace(/^#/, ""), align: this.alignRight ? "right" : "left" }, _tr);

            },

            //_contains: function(arr, item){
            //    return array.indexOf(arr, item) >= 0;
            //},

            __atLeastOneSublayerVisible: function (webservicelayer, groupLayerInfo) {
                var webservicelLayerInfos = webservicelayer.layerInfos;
                //var groupLayerInfos = webservicelLayerInfos
                var filteredWebservicelLayerInfos = array.filter(webservicelLayerInfos, function (item) {
                   
                    return array.indexOf(groupLayerInfo.subLayerIds, item.id) >= 0;
                });
                //var isVisible = false;
                var mapScale = this.map.getScale();             
                //at least one sublayer must be in scale:
                var isVisible = array.some(filteredWebservicelLayerInfos, function (layerInfo) {
                    return this._isLayerInScale(webservicelayer, layerInfo, mapScale);
                }, this);

                return isVisible;
            },
            
            _isLayerInScale: function (a, b, c) {
                var e;
                var d = true;
                if (a.legendResponse && a.legendResponse.layers) for (e = 0; e < a.legendResponse.layers.length; e++) {
                    var f = a.legendResponse.layers[e];
                    if (b.id === f.layerId) {
                        var k, h;
                        !a.minScale && 0 !== a.minScale || !a.maxScale && 0 !== a.maxScale ? (0 === f.minScale && a.tileInfo && (k = a.tileInfo.lods[0].scale),
                        0 === f.maxScale && a.tileInfo && (h = a.tileInfo.lods[a.tileInfo.lods.length - 1].scale)) : (k = Math.min(a.minScale, f.minScale) || a.minScale || f.minScale, h = Math.max(a.maxScale, f.maxScale)); if (0 < k && k < c || h > c) d = !1; break;
                    }
                }
                else if (a.minScale || a.maxScale) {
                    if (a.minScale && a.minScale < c || a.maxScale && a.maxScale > c) {
                        d = false;
                    }
                }
                return d;
            },

            _isWmsLayerInScale: function (layerInfo, mapScale) {
                var d = true;
                if (layerInfo.minScale || layerInfo.maxScale) {
                    if (layerInfo.minScale && mapScale < layerInfo.minScale || layerInfo.maxScale && mapScale > layerInfo.maxScale) {
                        d = false;
                    }
                }
                return d;
            },

            _isSupportedLayerType: function (layer) {
                var isSupported = layer &&
                    ("esri.layers.ArcGISDynamicMapServiceLayer" === layer.declaredClass || ("esri.layers.ArcGISImageServiceLayer" === layer.declaredClass) || "esri.layers.ArcGISTiledMapServiceLayer" ===
                layer.declaredClass || "esri.layers.FeatureLayer" === layer.declaredClass || "esri.layers.KMLLayer" === layer.declaredClass || "esri.layers.GeoRSSLayer" === layer.declaredClass || "esri.layers.WMSLayer" === layer.declaredClass);

                return isSupported ? true : false;
            }
                       
        });
        lang.mixin(u, { ALIGN_LEFT: 0, ALIGN_RIGHT: 1 });      
        return u;
});