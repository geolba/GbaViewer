define(
"gba/dijit/HomeButton", ["dojo/Evented",
"dojo/_base/declare",
"dijit/_WidgetBase",
"dijit/_TemplatedMixin",
"dojo/_base/lang",
"dojo/dom-construct",
"dijit/a11yclick", // Custom press, release, and click synthetic events which trigger on a left mouse click, touch, or space/enter keyup
"dojo/on",
"dojo/Deferred",
"dojo/dom-style",
"dojo/dom-class",
"dojo/i18n!../nls/jsapi"],  // localization
function (
    Evented,
     declare,
     _WidgetBase,
     _TemplatedMixin,
     lang,
     domConstruct,
     a11yclick,
     on,
     Deferred,
     domStyle,
     domClass,
     i18n
) {
    'use strict';

    //dijit._WidgetBase is the base class for all widgets in dijit, and in general is the base class for all dojo based widgets. 
    //Usually widgets also extend other mixins such as dijit._TemplatedMixin.
    var HomeButton = declare("gba.dijit.HomeButton", [_WidgetBase, _TemplatedMixin, Evented], {
                
        //We've given all nodes an attach point, meaning that in our widget code, we can use that name to reference that node directly
        templateString: '<div class="${theme}" role="presentation">' +
                            '<div class="${_baseClass.container}">' +
                                '<div data-dojo-attach-point="_testNode" title="${_i18n.widgets.homeButton.home.title}" role="button" class="${_baseClass.home}"><span>Home</span></div>' +
                            '</div>' +
                        '</div>',

        // default options
        _options: {
            theme: "MyHomeButton",
            map: null,
            extent: null,
            fit: false,
            visible: true
        },

        // A class to be applied to the root node in our template
        _baseClass: {
            container: "homeContainer",
            home: "home",
            loading: "loading"
        },

        // store localized strings
        _i18n : i18n,

        // from_WidgetBase -> override:
        constructor: function (options, srcRefNode) {
            // mix in settings and defaults
            var defaults = lang.mixin({}, this._options, options);
            // widget node
            this.domNode = srcRefNode;
            // store localized strings
            this._i18n = i18n;
            // properties           
            this.set("map", defaults.map); //same as this.map = defaults.map;
            this.set("theme", defaults.theme);
            this.set("visible", defaults.visible);
            this.set("extent", defaults.extent);
            this.set("fit", defaults.fit);
        },

        //buildRendering: function(){
        //    // create the DOM for this widget
        //    this.domNode = domConstruct.create("button", {innerHTML: "push me"});
        //},

        //postCreate() is called after buildRendering() is finished, and is typically used for connections etc. 
        //that can’t be done until the DOM tree has been created.
        postCreate: function () {
            //use this.inherited(arguments) to call the superclass method of the same name.
            //this.inherited(arguments);
            this.inherited('postCreate', [arguments]);

            // every time the user clicks the button, increment the counter
            //this.connect(this.domNode, "onclick", "increment");
            // Using dijit/Destroyable's "own" method ensures that event handlers are unregistered when the widget is destroyed
            this.own(
                on(this._testNode, a11yclick, lang.hitch(this, this.home))
            );
          
        },

        // connections/subscriptions will be cleaned up during the destroy() lifecycle phase
        destroy: function () {
            this.inherited(arguments);
        },

        // Finalizes the creation of this dijit. called by user
        startup: function () {
            // map not defined
            if (!this.map) {
                this.destroy();
                console.log('HomeButton::map required');
            }

            // when map is loaded
            if (this.map.loaded) {
                this._init();
            }
            else {
                on.once(this.map, "load", lang.hitch(this, function () {
                    this._init();
                }));
            }
        },
     
        /* Public Functions */
        /* ---------------- */    
        home: function () {          
            // get extent property
            var defaultExtent = this.get("extent");
            // show loading spinner
            this._showLoading();
            // event object
            var homeEvt = { extent: defaultExtent };
            if (defaultExtent) {
                // extent is not the same as current extent
                if (this.map.extent !== defaultExtent) {
                    // set map extent
                    this.map.setExtent(defaultExtent, false).
                        then(lang.hitch(this, function () {
                            // hide loading spinner
                            this._hideLoading();
                            // home event
                            this.emit("home", homeEvt);                          
                        }),
                        lang.hitch(this, function (error) {
                            if (!error) {
                                error = new Error("HomeButton::Error setting map extent");
                            }
                            homeEvt.error = error;
                            // home event
                            this.emit("home", homeEvt);                           
                    }));
                }
                else {
                    // same extent
                    this._hideLoading();
                    this.emit("home", homeEvt);                   
                }
            }
            else {
                // hide loading spinner
                this._hideLoading();
                var error = new Error("HomeButton::home extent is undefined");
                homeEvt.error = error;
                this.emit("home", homeEvt);
            }
           
        },

        /* ---------------- */
        /* Private Functions */
        /* ---------------- */
        _init: function() {
            // show or hide widget
            this._visible();
            // if no extent set, set extent to map extent
            if(!this.get("extent")){
                this.set("extent", this.map.extent);
            }
            // widget is now loaded
            this.set("loaded", true);
            //this.emit("load", {});
        },
        // show or hide widget
        _visible: function () {
            if (this.get("visible")) {
                domStyle.set(this.domNode, 'display', 'block');
            }
            else {
                domStyle.set(this.domNode, 'display', 'none');
            }
        },
        // show loading spinner
        _showLoading: function () {
            domClass.add(this._testNode, this._baseClass.loading);
        },
        // hide loading spinner
        _hideLoading: function () {
            domClass.remove(this._testNode, this._baseClass.loading);
        }

        
    });
    //lang.mixin(Widget, { ALIGN_LEFT: 0, ALIGN_RIGHT: 1 });
    return HomeButton;
    //return (gba.dijit.HomeButton = new HomeButton());
});