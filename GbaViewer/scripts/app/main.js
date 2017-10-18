/**
* @preserve
* GbaViewer application
* COPYRIGHT © 2017 Geological Survey of Austria

* All rights reserved under the copyright laws of Austria. 
* You may freely redistribute and use this software with or without modification.

* Use, reproduction, distribution, and modification of this code is subject to the terms and
* conditions of the MIT license, available at http://www.opensource.org/licenses/mit-license.php

* For additional information contact:
* Geologische Bundesanstalt Wien
* Neulinggasse 38
* 1030 Wien
* AUSTRIA
* email: github@geologie.ac.at
*/

define([
    "app/mapmodule",
    "app/proj4js/proj4js-amd",
    "app/commonConfig",
    "esri/geometry/Extent",
    "app/App",   
    "dojo/domReady!"
],
    function (mapmodule, Proj4js, commonConfig, Extent, App) {
        'use strict';

        function init() {
            //call the parser to create the dijit layout dijits
            //parser.parse();

            var defaults = {
                //Specify a theme for the template. Valid options are (seaside, pavement, chrome, contemporary_blue, contemporary_green).               
                theme: "layout",
                //Enter a title, if no title is specified, the webmap's title is used.
                //title: "title",
                //Enter a subtitle, if not specified the ArcGIS.com web map's summary is used
                //subtitle: "subtitle",
                //owner: "GBA",
                //specify a proxy url if needed
                proxyurl: "map_proxy.ashx", 
                helperServices: commonConfig.helperServices
            };

            //utilities namespace - App Klasse:
            //var app = new utilities.App(defaults);
            var app = new App(defaults);
            app.init().then(function (options) {              

                var extent = options.webmapData.item.extent;
                var _wkid = extent.spatialReference.wkid;
                var minPoint = { x: extent.xmin, y: extent.ymin, spatialReference: { wkid: _wkid } };
                var maxPoint = { x: extent.xmax, y: extent.ymax, spatialReference: { wkid: _wkid } };               
                                             
                var dest = new Proj4js.Proj("EPSG:4326");
                var source = new Proj4js.Proj("EPSG:" + _wkid);

                var minPoint84 = Proj4js.transform( source, dest, minPoint );
                var maxPoint84 = Proj4js.transform( source, dest, maxPoint );

                var initExtent = new Extent( {
                    xmax : maxPoint84.x,
                    xmin : minPoint84.x,
                    ymax : maxPoint84.y,
                    ymin : minPoint84.y,
                    spatialReference : {
                        wkid : 4326
                    }
                } );
                //options.webmapData.item.extent = [[minPoint84.x, minPoint84.y], [maxPoint84.x, maxPoint84.y]];
                options.webmapData.item.extent = initExtent;

                mapmodule.initMap(options);

                //initialize google analytics:
                var _gaq = window._gaq = window._gaq || [];
                _gaq.push(['_setAccount', 'UA-36825195-1']);
                _gaq.push(['_trackPageview']);              
                //var src = ('https:' === window.document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
                //script.get(src);        
                var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
                ga.src = ('https:' === document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
                var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
              
            },
            function ( error ) {
                /* handle error */
                alert(error);
            } );
        }
        // domReady! replaces dojo.ready()
        init();            
    } );