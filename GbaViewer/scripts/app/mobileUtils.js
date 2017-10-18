define([
    "esri/main",
    "dijit/registry",
    "dojo/dom",
    "dojo/ready",   
    "dojox/mobile/Pane",
    "dojox/mobile/Button",   
    "dojo/dom-construct",
     "dojo/window",
    "dojo/_base/window",
    "dojo/dom-style",
    "dojo/dom-geometry", 
    "dojox/mobile/deviceTheme",    
    "dojox/mobile/View",
    "dojox/mobile/Container",
    "dojox/mobile/ScrollableView",
    "dojox/mobile/ToolBarButton",
    "dojox/mobile/Heading",
    "dojox/mobile/RoundRectCategory",
    "dojox/mobile/FixedSplitter",
    "dojox/mobile/ContentPane",
    "dojox/mobile/TabBar",
    "dojox/mobile/SimpleDialog",    
     "dojox/mobile/compat"
], function (esri, registry, dom, ready, Pane, Button, domConstruct, win, baseWin, domStyle, domGeometry) {

    'use strict';
    //private members:   
    var isPhone, isTablet;

    var buildTabletDOM = function (hasLegend) {
        isPhone = false;
        isTablet = true;

        var mainContainer = new dojox.mobile.FixedSplitter({
            orientation: "H"
        }).placeAt(baseWin.body(), 'last');
        mainContainer.startup();

        //left panel: -> leftView:
        var leftView = new dojox.mobile.Container({ id: "groupView", selected: true, style: { height: '100%', width: '30%' } });

        if (hasLegend === true) {
            var groupTabBar = new dojox.mobile.TabBar({ id: "groupTabBar", barType: "segmentedControl" });
            var listItemLegend = new dojox.mobile.TabBarButton({ id: "listItemLegend", moveTo: "legendSubView" });
            var listItemAbout = new dojox.mobile.TabBarButton({ id: "listItemAbout", moveTo: "aboutSubView", selected: true });
            groupTabBar.addChild(listItemLegend);
            groupTabBar.addChild(listItemAbout);
            leftView.addChild(groupTabBar);
            var legendSubView = new dojox.mobile.ScrollableView({ id: "legendSubView" });
            var legendPane = new Pane({
                id: 'legend',
                innerHTML: '<div id="legendHeader">' +
                                '<h4 id="legendHeaderText"></h4>' +
                            '</div>' +
                          '<div id="legendDiv"></div>'
            });
            legendSubView.addChild(legendPane);
            leftView.addChild(legendSubView);
        }

        var aboutSubView = new dojox.mobile.ScrollableView({id: "aboutSubView", selected: true});
        var aboutPane = new Pane({
            id: 'description',
            innerHTML: '<h4 id="title"></h4>' +
                        //'<hr/>' +
                        '<div id="descriptionText"></div>' +
                        '<hr/>' +
                        //'<a id="subtitle" href="" target="_blank"></a>' +
                        '<div id="owner"></div>' +
                        '<div id="footerText"></div>' +
                        '<div id="creativeCommons"></div>'
        });
        aboutSubView.addChild(aboutPane);         
        leftView.addChild(aboutSubView);

        //add left bar to main container:
        mainContainer.addChild(leftView);
        
        //right panel: -> mapView:
        var mapView = new dojox.mobile.Container({ id: "mapView", selected: true, style: { height: '100%', width: '70%' } });
        var mapViewHeading = new dojox.mobile.Heading({ id: "mapViewHeader" });
        mapView.addChild(mapViewHeading);
        var mapPane = new Pane({
            id: "ui-esri-map",
            innerHTML: "<div id='HomeButton'></div>" +                   
                        "<div id='LocateButton'></div>"
        });
        mapView.addChild(mapPane);     
      
        mainContainer.addChild(mapView);
       

        //////////////////////////////////////////////////////////////////////////////////////
        //////////////////Buttons//////////////////////////////////////////////////////////

        //// 'Geolocate' button
        //var geoLocateToolBarButton = new dojox.mobile.ToolBarButton({
        //    id: 'geoLocateToolbarButton',
        //    //label: 'edit',
        //    icon: 'images/geolocateIcon.png',
        //    iconPos: "-7,-10",
        //    style: { float: 'right', width: '40px' }
        //});
        //mapViewHeading.addChild(geoLocateToolBarButton);
        //on(geoLocateToolBarButton.domNode, "click",
        //    function () {
        //        _map = mapmodule.getMap();
        //        _geoLocate();                
        //    });
            

        window.addEventListener('resize', _orientationChanged, false);
        window.addEventListener('orientationchange', _orientationChanged, false);
        _orientationChanged();

    };

    var buildPhoneDOM = function (hasLegend) {
        isPhone = true;
        isTablet = false;

        var mainContainer = new dojox.mobile.View({ id: "groupView", selected: true, style: { height: '100%', width: '100%' } }).placeAt(baseWin.body(), 'last');
        mainContainer.startup();

        var mapView = new dojox.mobile.View({
            id: "mapView",
            selected: true,
            style: "height:100%;width:100%;"
        });        
        //var mapViewHeading = new dojox.mobile.Heading({ id: "mapViewHeader", label: "Header Text" });
        var mapViewHeading = new dojox.mobile.Heading({
            id: "mapViewHeader"
            //innerHTML: "<label id='mapViewHeaderLabel' style='max-width:50px;'></label>"
        });
        
        // 'Info' button
        var infoToolbarButton = new dojox.mobile.ToolBarButton({
            id: 'infoToolbarButton',
            label: 'Info',
            style: "float:right;",
            moveTo: '#aboutSubView',transition:'fade'
        });
        infoToolbarButton.placeAt(mapViewHeading, "first");
        //mapViewHeading.addChild(infoToolbarButton); 

        if (hasLegend === true) {
            // 'Legend' button
            var legendToolbarButton = new dojox.mobile.ToolBarButton({
                id: 'legendToolbarButton',
                //toggle: true,
                icon: 'images/legendIcon.png',
                iconPos: '-7,-10',
                style: "float:left;width:40px;",
                moveTo: '#legendSubView', transition: 'fade'
            });
            legendToolbarButton.placeAt(mapViewHeading, "first");
            //mapViewHeading.addChild(legendToolbarButton);   
        }
        mapView.addChild(mapViewHeading);

        var mapPane = new Pane({
            id: "ui-esri-map",
            style: "background-color:green;width:100%;height:100%;",
            innerHTML: "<div id='HomeButton'></div>" +                     
                        "<div id='LocateButton'></div>"
        });
        mapView.addChild(mapPane);
        mainContainer.addChild(mapView);
        //mapView.startup(); 


        //var header = domGeometry.position(dom.byId("mapViewHeader"));
        //var vp = win.getBox();
        //var viewportHeight = vp.h;
        //var contentHeight = viewportHeight - (2*header.h);
        //document.getElementById("ui-esri-map").style.height = contentHeight + "px";
        //document.getElementById("ui-esri-map").style.width = vp.w + "px";



        if (hasLegend === true) {
            var legendSubView = new dojox.mobile.ScrollableView({ id: "legendSubView",scrolldir:"h" });
            var legendSubViewHeading = new dojox.mobile.Heading({ id: "legendSubViewHeading", label: "Legende", back: "Karte", moveTo: "mapView", transition: "fade" });
            legendSubView.addChild(legendSubViewHeading);
            var legendPane = new Pane({
                id: 'legend',
                innerHTML: '<div id="legendHeader"><h4 id="legendHeaderText"></h4></div>' +
                          '<div id="legendDiv"></div>'
            });
            legendSubView.addChild(legendPane);
            mainContainer.addChild(legendSubView);
        }

        var aboutSubView = new dojox.mobile.ScrollableView({ id: "aboutSubView" });
        var aboutSubViewHeading = new dojox.mobile.Heading({ id: "aboutSubViewHeading", label: "Beschreibung", back: "Karte", moveTo: "mapView", transition: "fade" });
        aboutSubView.addChild(aboutSubViewHeading);
        var aboutPane = new Pane({
            id: 'description',
            innerHTML:'<h4 id="title"></h4>' +
                        '<div id="descriptionText"></div><hr />' +
                        //'<a id="subtitle" href="" target="_blank"></a>' +
                        '<div id="owner"></div>' +
                        '<div id="footerText"></div>'   +
                        '<div id="creativeCommons"></div>'
        });        
        aboutSubView.addChild(aboutPane);
        mainContainer.addChild(aboutSubView);
            
        //////////////////////////////////////////////////////////////////////////////////////
        //////////////////Buttons//////////////////////////////////////////////////////////

        //// 'Geolocate' button
        //var geoLocateToolBarButton = new dojox.mobile.ToolBarButton({
        //    id: 'geoLocateToolbarButton',
        //    //label: 'edit',
        //    icon: 'images/geolocateIcon.png',          
        //    iconPos: "-7,-10",
        //    style: { float: 'right', width: '40px' }
        //});
        //mapViewHeading.addChild(geoLocateToolBarButton);      
        //on(geoLocateToolBarButton.domNode, "click",
        //    function () {
        //        _map = mapmodule.getMap();
        //        _geoLocate();
        //    });      

        //mainContainer.startup();       
        window.addEventListener('resize', _orientationChanged, false);
        window.addEventListener('orientationchange', _orientationChanged, false);
        _orientationChanged();
    };

    var _orientationChanged = function () {
        var header = domGeometry.position(dom.byId("mapViewHeader"));

        var vp = win.getBox();
        // get the viewport size      
        //var viewportWidth = vp.w;
        var viewportHeight = vp.h;
        ////The innerHeight property sets or returns the inner height of a window's content area = viewport
        //var viewportHeight = window.innerHeight;
        //var viewportWidth = window.innerWidth;
        //var clientHeight = document.documentElement.clientHeight; 
        var contentHeight = viewportHeight - header.h;
        document.getElementById("ui-esri-map").style.height = contentHeight + "px";
    };

    //var _navigateTo = function (currentPage, pagetoId) {
    //    var w = registry.byId(currentPage);
    //    w.performTransition('#' + pagetoId, 1, "fade", null);
    //    //currentPage = pagetoId;
    //};

    var dojoSimpleMessage = function (title, message) {
        var dlg = new dojox.mobile.SimpleDialog({
            id: "simpleDialog"
        });
        baseWin.body().appendChild(dlg.domNode);

       domConstruct.create("div",{
                                             'class': "mblSimpleDialogTitle",
                                             innerHTML: title
        }, dlg.domNode);

        domConstruct.create("div", {
            'class': "mblSimpleDialogText",
            innerHTML: message
        }, dlg.domNode);

        var cancelBtn = new Button({
            'class': "mblSimpleDialogButton mblRedButton",
            innerHTML: "OK",          
            onClick: function () {
                _hideProgIndDlg(dlg);
            }
        });       
        cancelBtn.placeAt(dlg.domNode);

        dlg.show();       

        var _hideProgIndDlg = function (simpleDlg) {          
            simpleDlg.hide();
            dlg.destroyRecursive();            
        };


    };


        return {           
            buildPhoneDOM: buildPhoneDOM,
            buildTabletDOM: buildTabletDOM,
            dojoSimpleMessage: dojoSimpleMessage
        };

    });