/// <reference path="D:\GbaViewer3\GbaViewer\Scripts/app/legend2.js" />
var profile = {
    // since this build it intended to be utilized with properly-expressed AMD modules;
    // don't insert absolute module ids into the modules
    insertAbsMids: 0,
    internStrings: true,
    // `basePath` is relative to the directory containing this profile file; in this case, it is being set to the
    // Scripts/ directory, which is the same place as the `baseUrl` directory in the loader configuration. (If you change
    // this, you will also need to update run.js.)
    basePath: './scripts',
    releaseDir: "./dist",

    // Builds a new release.
    action: 'release',

    // Strips all comments and whitespace from CSS files and inlines @imports where possible.
    cssOptimize: 'comments',

    // Excludes tests, demos, and original template files from being included in the built version.
    mini: true,

    // Uses Closure Compiler as the JavaScript minifier. This can also be set to "shrinksafe" to use ShrinkSafe,
    // though ShrinkSafe is deprecated and not recommended.
    // This option defaults to "" (no compression) if not provided.
    optimize: 'closure',

    // We're building layers, so we need to set the minifier to use for those, too.
    // This defaults to "shrinksafe" if not provided.
    layerOptimize: 'closure',

    // A list of packages that will be built. The same packages defined in the loader should be defined here in the
    // build profile.
    packages: [
      // Using a string as a package is shorthand for `{ name: 'app', location: 'app' }`     
        {
            name: "app", location: "app"
        },
        {
            name: "gba", location: "gba"
        },
        { name: "esri", location: "../bower_components/esri" },
        { name: 'dojo', location: "../bower_components/dojo" },
        { name: 'dijit', location: "../bower_components/dijit" },
        { name: "dojox", location: "../bower_components/dojox" },

        { name: "dstore", location: "../bower_components/dstore" },
        { name: "dgrid", location: "../bower_components/dgrid" },
        { name: "dgrid1", location: "../bower_components/dgrid1" },
        { name: "xstyle", location: "../bower_components/xstyle" },
        { name: "put-selector", location: "../bower_components/put-selector" },
        {
            name: "moment",
            location: "../bower_components/moment",
            main: "moment",
            trees: [
                // don"t bother with .hidden, tests, min, src, and templates
                [".", ".", /(\/\.)|(~$)|(test|txt|src|min|templates)/]
            ],
            resourceTags: {
                amd: function (filename, mid) {
                    return /\.js$/.test(filename);
                }
            }
        }
    ],

    // Build source map files to aid in debugging.
    // This defaults to true.
    useSourceMaps: false,

    // If present and truthy, instructs the loader to consume the cache of layer member modules
    noref: true,

    // Strips all calls to console functions within the code. You can also set this to "warn" to strip everything
    // but console.error, and any other truthy value to strip everything but console.warn and console.error.
    // This defaults to "normal" (strip all but warn and error) if not provided.
    stripConsole: 'all',

    // The default selector engine is not included by default in a dojo.js build in order to make mobile builds
    // smaller. We add it back here to avoid that extra HTTP request. There is also an "acme" selector available; if
    // you use that, you will need to set the `selectorEngine` property in index.html, too.
    selectorEngine: 'lite',

    // Any module in an application can be converted into a "layer" module, which consists of the original module +
    // additional dependencies built into the same file. Using layers allows applications to reduce the number of HTTP
    // requests by combining all JavaScript into a single file.
    layers: {
        // This is the main loader module. It is a little special because it is treated like an AMD module even though
        // it is actually just plain JavaScript. There is some extra magic in the build system specifically for this
        // module ID.
        'dojo/dojo': {
            // By default, the build system will try to include `dojo/main` in the built `dojo/dojo` layer, which adds
            // a bunch of stuff we do not want or need. We want the initial script load to be as small and quick to
            // load as possible, so we configure it as a custom, bootable base.
            boot: true,
            customBase: true,
            include: [
                "dojo/dojo",
              // include the app
              'app/main',
              //// dpendencies of esri/map that will be requested if not included
              //// probably in a nested require block or something the build script can't resolve
              'dojox/gfx/path',
              'dojox/gfx/svg',
              'dojox/gfx/shape',
              'dojo/cookie'
              //'esri/dijit/Attribution',

              // be sure to include the layer types used in your web map
              // otherwise they will be requested asyncronously
              //'esri/map', 'esri/dijit/Search', 'esri/layers/FeatureLayer', 'esri/InfoTemplate', 'esri/SpatialReference', 'esri/geometry/Extent'

            ],
            exclude: ["app/proj4js/proj4js-amd"]
            //includeLocales: ['en', 'de']
        },
        "dojo/dojo": {
            // By default, the build system will try to include `dojo/main` in the built `dojo/dojo` layer, which adds
            // a bunch of stuff we do not want or need. We want the initial script load to be as small and quick to
            // load as possible, so we configure it as a custom, bootable base.
            boot: true,
            customBase: true,
            include: [
              // include the app, set accordingly for your application
              // dependencies of esri/map that will be requested if not included
              "dojo/dojo",
              "dojo/text",
              "dojo/i18n",
              "dojo/request/script"
            ],
            // You can define the locale for your application if you like
            includeLocales: ["en", "de"]
        },
        "app/main": {
            include: [
              "app/main",
              // a dynamically loaded modules:
              "dojox/gfx/path",
              "dojox/gfx/svg",
              "dojox/gfx/filters",
              "dojox/gfx/svgext",
              "dojox/gfx/shape",
              "esri/dijit/Attribution",
              "esri/IdentityManager",
              "app/desktopUtils",
              "app/mobileUtils"
            ],
            includeLocales: ['en', 'de'],
            exclude: ["app/proj4js/proj4js-amd"]
        },
        // Note: As of 3.18 it is recommended that users create a separate
        // built layer for the VectorTileLayer implementation module.
        "esri/layers/VectorTileLayerImpl": {
            include: [
              "esri/layers/VectorTileLayerImpl"
            ],
            includeLocales: ["en", "de"]
        }

        // In this demo application, we load `app/main` on the client-side, so here we could build a separate layer containing
        // that code. (Practically speaking, you probably just want to roll everything into the `dojo/dojo` layer,
        // but this helps provide a basic illustration of how multi-layer builds work.) Note that when you create a new
        // layer, the module referenced by the layer is always included in the layer (in this case, `app/main`), so it
        // does not need to be explicitly defined in the `include` array.
        // 'app/main': {}
    },

    // Providing hints to the build system allows code to be conditionally removed on a more granular level than simple
    // module dependencies can allow. This is especially useful for creating tiny mobile builds. Keep in mind that dead
    // code removal only happens in minifiers that support it! Currently, only Closure Compiler to the Dojo build system
    // with dead code removal. A documented list of has-flags in use within the toolkit can be found at
    // <http://dojotoolkit.org/reference-guide/dojo/has.html>.
    defaultConfig: {
        hasCache: {
            "dojo-built": 1,
            "dojo-loader": 1,
            "dom": 1,
            "host-browser": 1,
            "config-selectorEngine": "lite"
        },
        async: 1
    },

    staticHasFeatures: {
        "config-dojo-loader-catches": 0,
        "config-tlmSiblingOfDojo": 0,
        "dojo-amd-factory-scan": 0,
        "dojo-combo-api": 0,
        "dojo-config-api": 1,
        "dojo-config-require": 0,
        "dojo-debug-messages": 0,
        "dojo-dom-ready-api": 1,
        "dojo-firebug": 0,
        "dojo-guarantee-console": 1,
        "dojo-has-api": 1,
        "dojo-inject-api": 1,
        "dojo-loader": 1,
        "dojo-log-api": 0,
        "dojo-modulePaths": 0,
        "dojo-moduleUrl": 0,
        "dojo-publish-privates": 0,
        "dojo-requirejs-api": 0,
        "dojo-sniff": 1,
        "dojo-sync-loader": 0,
        "dojo-test-sniff": 0,
        "dojo-timeout-api": 0,
        "dojo-trace-api": 0,
        "dojo-undef-api": 0,
        "dojo-v1x-i18n-Api": 1,
        "dom": 1,
        "host-browser": 1,
        "extend-dojo": 1
    },
       
};