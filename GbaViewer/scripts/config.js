window.dojoConfig = {
    async: true,
    // Define the base URL for all of our modules and packages
    baseUrl: 'scripts',
    parseOnLoad: false,
    //mblAlwaysHideAddressBar:true,
    debug: false,
    //deps: ['app/main'],
    packages: [
        { name: "app", location: "app" },
        { name: "gba", location: "gba" },
        //{ name: 'dstore', location: '../bower_components/dstore' },
        // { name: 'dgrid', location: '../bower_components/dgrid' },
        //  { name: 'xstyle', location: '../bower_components/xstyle' },
        // { name: 'put-selector', location: '../bower_components/put-selector' },
        { name: "esri", location: "../bower_components/esri" },
        { name: "moment", location: "../bower_components/moment", main: "moment" },
        { name: 'dojo', location: "../bower_components/dojo" },
        { name: 'dijit', location: "../bower_components/dijit" },
        { name: "dojox", location: "../bower_components/dojox" }
    ]
};