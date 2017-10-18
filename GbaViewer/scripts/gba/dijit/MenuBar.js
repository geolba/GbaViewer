define([   
    "dojo/_base/declare",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dojo/_base/lang",
    "dijit/a11yclick", // Custom press, release, and click synthetic events which trigger on a left mouse click, touch, or space/enter keyup
    "dojo/on",
    "dojo/dom-style",
    "dojo/_base/fx",
     "dijit/Dialog",
      "esri/dijit/BasemapLayer",
    "esri/dijit/Basemap",
    "esri/dijit/BasemapGallery",
    "dijit/registry",
    "dojo/i18n!../nls/jsapi" // localization
], 
function (  
     declare,
     _WidgetBase,
     _TemplatedMixin,
     lang,
     a11yclick,
     on,
     domStyle,
     fx,
     Dialog,
     BasemapLayer, Basemap, BasemapGallery,
     registry,
     i18n
) {

    //dijit._WidgetBase is the base class for all widgets in dijit, and in general is the base class for all dojo based widgets. 
    //Usually widgets also extend other mixins such as dijit._TemplatedMixin.
    var Widget = declare("gba.dijit.MenuBar", [_WidgetBase, _TemplatedMixin], {

        //We've given all nodes an attach point, meaning that in our widget code, we can use that name to reference that node directly
        templateString: '<div class="${theme}" role="presentation">' + //this is the source node: the widgetid                           
                            '<a data-dojo-attach-point="icon_widget" id="icon_widget" class="link"></a>' +
                            '<div data-dojo-attach-point="menu_content" id="menu_content"> ' +
                                '<h2>${_i18n.widgets.menuBar.main.title}</h2>' +
                                '<ul id="menunav">' +           
                                    '<li data-dojo-attach-point="help_icon" id="help_icon" title="${_i18n.widgets.menuBar.icons.help}"></li>' +
                                    '<li data-dojo-attach-point="basemap_icon" id="basemap_icon" title="${_i18n.widgets.menuBar.icons.basemap}"></li>' +
                                    '<li data-dojo-attach-point="print_icon" id="print_icon" title="${_i18n.widgets.menuBar.icons.basemap}"></li>' +
                                '</ul>' +
                            '</div>'+                               
                         '</div>',                     
                            

        // default options
        _options: {
            theme: "MenuBar",
            map: null,
            visible: true
        },
        // store localized strings
        _i18n: i18n,

        // from_WidgetBase -> override:
        constructor: function (options, srcRefNode) {
            // mix in settings and defaults
            var defaults = lang.mixin({}, this._options, options);
            this.domNode = srcRefNode;
            //this.basemapDialog;            

            //properties
            this.set("map", defaults.map); //same as this.map = defaults.map;
            this.set("visible", defaults.visible);
            this.set("theme", defaults.theme);
           
        },

        //postCreate() is called after buildRendering() is finished, and is typically used for connections etc. 
        //that can’t be done until the DOM tree has been created.
        postCreate: function () {
            this.inherited(arguments);
            this.beginningWidth = this.domNode.clientWidth;

            // Using dijit/Destroyable's "own" method ensures that event handlers are unregistered when the widget is destroyed
            this.own(
                on(this.icon_widget, a11yclick, lang.hitch(this, this.minimize)),
                on(this.basemap_icon, a11yclick, lang.hitch(this, this.showBasemapDialog)),
                on(this.help_icon, a11yclick, lang.hitch(this, this.showHelpDialog))
            );
        },

        // connections/subscriptions will be cleaned up during the destroy() lifecycle phase
        destroy: function () {
            this.inherited(arguments);
        },

        // Finalizes the creation of this dijit. called by user
        startup: function () {
            this._init();
        },

        /* Public Functions */
        /* ---------------- */     

        minimize: function () {           
            var width = domStyle.get("menudiv", "width");
            if (width === this.beginningWidth) {
                //dojo.style(dojo.byId('menu_content'), "display", "none");
                domStyle.set(this.menu_content, "display", "none");
                fx.animateProperty({
                    node: "menudiv",
                    duration: 1000,
                    properties: { width: { end: 55 } }
                }).play();
            }
            else if (width === 55) {
                fx.animateProperty({
                    node: "menudiv",
                    duration: 1000,
                    properties: { width: { end: this.beginningWidth } },
                    onEnd: function () {
                        //dojo.style(dojo.byId('menu_content'), "display", "block");
                        domStyle.set('menu_content', "display", "block");
                    }
                }).play();
            }
        },

        showBasemapDialog: function () {
            registry.byId("basemapDlg").show();
        },

        showHelpDialog: function () {
            registry.byId("helpDlg").show();
        },

        /* ---------------- */
        /* Private Functions */
        /* ---------------- */
        _init: function () {

            this._createBasemapGallery();

            var helpDialog = new Dialog({
                id: "helpDlg",
                title: "Geology of Austria viewer Help",
                content:  "<br />" +
               " At the full extent, 1:625 000 scale geology is displayed. Zoom in to switch to 1:" +
                "50 000 scale geology. The scale of the currently displayed geology is shown. Zooming" +       
                "<br/>  "       
            });
           
            // widget is now loaded
            this.set("loaded", true);
        },

        _createBasemapGallery: function () {

            //// create the dialog for selecting the basemaps:
            this.basemapDialog = new Dialog({
                id: "basemapDlg",
                title: "Switch Basemap",
                content: '<div id="basemapGallery"></div>',
                style: "width: 300px; background-color: #FFFFFF"
            });

            var basemaps = [];

            var worldstreetmapLayer = new BasemapLayer({
                url: "http://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer"
            });
            var worldstreetmapBasemap = new Basemap({
                layers: [worldstreetmapLayer],
                title: "Street Map",
                thumbnailUrl: "/images/basemapgallery/streets_thumb.jpg"
            });
            basemaps.push(worldstreetmapBasemap);

            var worldimageLayer = new BasemapLayer({
                url: "http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer"
            });
            var worldlabelsLayer = new BasemapLayer({
                url: "http://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer"
            });
            var worldimageBasemap = new Basemap({
                layers: [worldlabelsLayer, worldimageLayer],
                title: "Imagery",
                thumbnailUrl: "/images/basemapgallery/imagery_with_labels_thumb.png"
            });
            basemaps.push(worldimageBasemap);

            var osmBasemap = new Basemap({
                layers: [new BasemapLayer({
                    type: "OpenStreetMap"
                })],
                id: "osm",
                title: "OpenStreetMap",
                thumbnailUrl: "/images/basemapgallery/openstreetmap.png"
            });
            basemaps.push(osmBasemap);

            var worldtopoLayer = new BasemapLayer({
                url: "http://server.arcgisonline.com/arcgis/rest/services/World_Topo_Map/MapServer"
            });
            var worldTopoBasemap = new Basemap({
                layers: [worldtopoLayer],
                id: "Topography",
                title: "Topografie",
                thumbnailUrl: "/images/basemapgallery/openstreetmap.png"
            });
            basemaps.push(worldTopoBasemap);

            var basemapGallery = new BasemapGallery({
                showArcGISBasemaps: false,
                basemaps: basemaps,
                map: this.map
            }, "basemapGallery");
            basemapGallery.startup();
        }

    });

    //lang.mixin(Widget, { ALIGN_LEFT: 0, ALIGN_RIGHT: 1 });
    return Widget;

});