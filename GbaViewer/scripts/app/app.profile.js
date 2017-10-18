// GbaViewer application
// COPYRIGHT © 2017 Geological Survey of Austria
//
// All rights reserved under the copyright laws of Austria. 
// You may freely redistribute and use this software with or without modification.
//
// Use, reproduction, distribution, and modification of this code is subject to the terms and
// conditions of the MIT license, available at http://www.opensource.org/licenses/mit-license.php
//
// For additional information contact:
// Geologische Bundesanstalt Wien
// Neulinggasse 38
// 1030 Wien
// AUSTRIA
// email:  github@geologie.ac.at

var profile = (function () {
    return {
        resourceTags: {
            amd: function (filename, mid) {
                return /\.js$/.test(filename);
            }
        }
    };
})();