define([
    "dojo/_base/window", 
    "dojo/dom-construct"   
], function (baseWin, domConstruct) {
    'use strict';

    var buildDesktopDOM = function (title, serviceUrl) {

       
        var mainContainer = domConstruct.create("div", { id: 'mainWindow' }, baseWin.body(), "last");
        //var mainContainer = new BorderContainer({
        //    id: 'mainWindow'          
        //}).placeAt(baseWin.body(), 'first');

        var topPane = domConstruct.create("div", {
            id: 'banner', 'class': 'header',          
            innerHTML:'<div id="headerArea">' +
                           '<div id="logoArea">' +
                                '<a href="http://www.geologie.ac.at/services/web-services/" target="_blank">' +
                                    '<img src="data:image/gif;base64,iVBORw0KGgoAAAANSUhEUgAAAJwAAAAyCAYAAACprrLTAAAYdklEQVR4XuyYS4skWRXHz7333Ee88lXVU93T3TM1Da3oKI62X0DQhQuZ1Si40KXiN/ADCG4EF6ILN7MUeyXMTnGlNDg6wgijND4Quu2u6u4yMysfEZkR93oNLnWzgkgiNZg0q6wD/zr3FZHx+NU55waB/18jrdY2z5FNx1r017ebff2cN+P9OWkn432twHtvePkg8et2AJLauTbtFnA1thtg0ysqnK+oAmyN4eWJIu2jxocASeP8xnPt4aoK6vo1sGnnixXY8tJ7EadV8Iw/XzNw5H+ZatpHlfbtFkBsxTeNNUBG16yDushWgSt3WjpP3Hj1WFKbUhse9lajxm5Gkfa+/djm7ZaqQqPrQHOiTuvSsa4FrulGm3379jZg2QI4LYBpOdcMHK3pNwGnS/n0uXRaWGUNwJnKuPHAuYM21Tajx/ah8H4L0LQb84JNIeOM0Qg5T4QUPRVIWRgc7A0UORmx/cEgDIFIVQDvxbHEyYwfHLzUJQ//jrHCzoNE/vwHf/r9ew429MDVRUXXrjGskEpr+qRe7WHYJhwNc1sHpXmueY1kyBQiCxliLKSQ2uCd6zc6YjwV1/qDOASicJqKJI5COprwbq8bs3nGBaFKGFBklvJIR6HOcypGINligVQb5M9SAYslY4/HApY5MSSDN269MQGAP1ulVsyz4VNoRaR20+APrvh6Ea9diBy+vRuwNK8LOMeQIUbIMZFKiMLgaxYSWULST8R8IQLKpIUkIs+H2On3IjqbC2GIFFpLmi64EjKE8YRxjpIucqRac1xoDnnO8G9TbvKcwNMjMGc1/TMrCvD4eU2pfOxe+fjcJZMzVggY0HDt2fBjANC1ElbsDCavovrZpCatlp3YnQAr3qkBvJZ1SIvt+4ccQbwSITFExIRLHkvJRaHxtRs3u2J4Ki0ksUgXUhEmu0kcFv84RgtJTMZTLoVQYpkLmuci4CIww1NEIQRNM4YAnBaak6JAZgDNMndvJV8JGNT5alVi3JwvlUjD3quNGShAx0n2zWjy3YdHT44AYGJ16jR1mrnol7k6b7lS/5lV4HpW6MSd0Imtg68FKC2ixObH3+72wogwPlCh6gehwnnG92ydImYpJnEcyEUuZWFkHAYhnIyx0+1E5NRCwrniy0LSxZIrwQMzmjCOKEm2REYIsiLnJDeMas1MUT7L8oV4SJhV4YE4BwnzkPi/lTUEds7cPf70s3fv//C3v3rXgTZ2OnUAzqrQeeBcXXcGmZdwqoKHVehagFIrpJS82t+LwsKIvTBSfSv2b0j6gwCnM9HpdBSOJiJEVFEYheRkiEmvF5HRKRfIFZulHAGEpCyA6Rwlw4DOU84yIuF4SsvbffrUPbyTlcihXbo5qoEEzkUSjwIpR3x0QThvrMV38l00Ukbezyzp6wDwR7979TtX57GeEW+4AppckVgRXwedYoiHe/thkGuxF8WqKwPFZynvd7shTue82+tZPxMBRRlHYaiPTzBJYgvJhKtAWUgyzgwIxZgydr0yTEGaIqZEmidjAsZYEB6XiACc1R8ekkdHNWWih4SsmSP/BRRXxuDgeHRTcZGky0XhAMucpIMOK9BVawJjG3BoJX/05le/MP/gYUftD/r58YuIS55IYLEZjVUQRx1j042SMiTzTLCiEByIoukCeRlJ5gyBSJ0tzoAwzvuQbIAAW/l9Uw+Jjyg79J9/ZQY0ABfm26/I+w/+8vCvADC0+qfTyKXXiavn5lZpTVotgfuIlfolXH+XAhGrkFh5SD0ITqYOkksMx5VpyOBn9z764Pu/+/VvHGgnzg9L6Hw9N3fymwcHHLq0qQyQjAC1bdqi/rjcdmUGPp2SQwD4gwNKWcn1pReQigx1i2UTMFd2ZQQQXn70fO96r985B5sHjjdsHAh1i6RpJO7KroBjIEYjce/g5kuVjWYVNrYOOgcciItwuxpSKGACBvSleYUGCihgajWHi/EOFnBPJTfOpVLvsSHClQPoFpNdL1hvfesb8PG3fwzBnUMwsLgERXgK8adeh0/85G24+73vAGEMDJidh+7uJL9W+XbLG6IcASfqqdxtM7CE/hc/BwdffwvEwX4ZGS6u+XtSr96Ca195Ew6+9mUARsrRXa/jbhwNe68M9pMKaLXfa71cSnUTeCHC+TwtW6YoLk0Rnj16Ai/e+QU8u/8OgDbl6K7XcWwyxM/fvvNy3YahIa2SMxq3v2m4MgoBnL73Prz/pbfKHrN9ciFeg4ZPGn4dAD7wsG22cXAdYP/pV2cNC+uXNXOFm9O1KcTOrTljBgVMrE6t5hulTH/M1F9L47mn/hpqrs/On60zkK893+rv2b7VHMA/l+Zn5+6PALXiQK3WHuE2S1ZlG0CvWVmUz86vzdakaO3PWd7rzF9zk7lrPnwxHXBEX8dtmFZ9uNvQ/sW6lYA3WWXtN1/WJmmbrmm60gVaaGmBtuzKUECQRYdfwUERRRBhBEHHCi7jgKK/sqiIMzCD6P+jojMgggNUQHwojlW2AgVZCpSldKdbkiZpli//ec7zNU8oraXwf89zn+RL7ndz7znvPec959zQ8qEICoIupRfUxmi+v+k7XSB0yT0hV2vaCUaE2hTDzxE59jtr5WbB6DMyED3jCcTO/SPCxtwHuVbLwutoal6PCA8cCOo/gJ55EpEPToYqysQguTkCdLESArP6wfTodMQ8NRsREyZBm5zix5d43vysOjYOxqmPIG7uszBOfggqo7HdmF7IlCro0noT9+ohKdhGc89EyIiRkAe3ycXE33UkO7lWx/JRhYXz2gW1mu/VUdHtwCGTgC0ieOAgxMyazS140GBAxt/5y4bnIdfpEH7fWJLhPJaLvne6NIbnpjEhyHgc0/QZiJk5i5/RxMd3AwUKGOqa9OnRcSEdcrjOAwffG+H2AeeEJikOOecKkVGwiScvgY53TOziecgp/RHRz8+GG1afoKGQI6twKzK++xwQ2qqrTlKSHulbPsWAI7sR+cRDMIwdhj7/Wo/sk98jZPgwVvgtc3C7kbbmA/TduxmJq15B+vZPkHPmAEwzHmvrz2BThBrQ97vNyD6xDz3//g6SPliKjJ2bMPBiEQJ6JkqWTuS+yW8vRe7ZQsS9NA+Bo3KQtPp15Jb+B7Hz5rAywT1dUMeZkHumEGmffcjrTV7xJnJO7Ufi20ugMhmRc/YAsop2QAgIaA867h//6gLkXvwJQcNz4UYjtOmpLK+ef3uLN5g/gAKSk9Dvx+3IOrAFYZPHIHL6ZPT/ZScyD2wlgMQxeNrGDZ8wHrnnD6LXxysRPHoQouY+huySfUj9ZC1kKrlkWR3QpqTwGNSQ8tflSF77Jvru+ZKfVRrDWBa3Y+HgtMryImJib3GpnadHuDHgukcaVWg5dRb2S1egy+wDTUyM5Hq8EKCBIW8YZDRs2IRRfA94+Xt1bAwpOQnWYyVwu5qZq3hlHqRueB8RD0/CmSlzUTxqPEomT8WRjBGgnU/A+xjKoLBbXFvSyleh7ZOKI1n3oig6A6cnPg65NgCpn34Iw8AhrCxSBoFhKULH5qF0Tj6KYjLwiykLR/vl4drbawCRa8DcN3b+HMS/vBDX3/8HjuTci9NTpuNQ+mA0HygiILyL4NxB/mBgC+Ox25GwcBHi859Fa0UlbOcvwnruJCxHTiAgKQGh40byMzdZf0UQwqdMhLvZjKYDP0MGNQCwvCAX/Pq6oQwJQ9+dXyB4+CCUjJ6GExN/j6Mjx6Bs8XIY7h2CXutXATIvzz+ofy7Sv94Ix+XrOJJ5L049/CiODh2JsiVvwzRzGhJefUGiCF6krFmOwNz+OD1pBsmkL34mmRQPHo/K9Z9BJld0Aw5e9G1xRzHAujzS5s/hunexktweC5p/PMSuUZeVxpZKhAsaUyx0fXvDK3qg75cBTXQcf07fQ5feCwDoucOSC3PAMGQ4IqZMwo3tBajauYnHFqCCueIkKtf9L1SmSIRNHOtTHLxefgkcOADnZzyH1spKyNwK1Ozaguur1rHiYhY9zQqTC4EIHjkU7qZmVG34Am6zGZ4WB6wnS3Dp1aWwl5aBt48hCj3efAmOq+W4/Ppy3uE0B7Taq3DtrQ8BAMbpD/GYPhfsckOf2Rux+fNw+oEZONxrCEpn/YnXVbNpC/cxPfM4R3TSM8zxDPcMgbZnEq+3tbkSAusEfmvji9drmjEN2rQU1Hy2BfVF30OJMCigo/G/5j6h9+dBm5DCViv2hbm8QS/MXQx7UxnPH/CifPVaklE1omZNY7ArNcEIGppNxuIq6nZ+C9Fqg8fSAvOhQ7jw/BI4K2o4cr7tMldtsyFUH6jtTuAg3GmZvpl2KAAYRgxhQROoCAj9iN8FMljkeh2ChuXAx0PIhQBgCyCDkhVrGD2MP9Nn9cGA3d+hXwG5j4JtyKH3UTMfAY+fN/SWvzjWfv41bFUXQXCXQKpF/Y69gJcVAU1YPESvAx5rCxSGYCS/t5RWqoCIFghQ83NtWXN9/77cR67TkkXZjP4FO3kO2QV7kbxmGRjgg/ozOPxduirKiCuvrUT1v/8F0ebk35ZDi9ovd8BZXQMDgV2XlOoLUPh/AY88wO+rN3zJYOz48rIyQ8eP5Lv6b/f6QCBACU+zBRVrNqD6ky8helxQKkMRPIxlixRyjwMK9vH8+xd8i8zd/4SaNq06xgR1dDREt4MBpkmMQ/yihRJ/dnC0THPvdnpE09iszo3rEeFv5boKHhR3BjgVLIeO86403DcC8sV6eEQr8Yyx5F6qULHqHzDNeRwRUyeiestXvJiQcb+Dq74Btl/Ps+BEeIijJPB4rderYT1xCjJofIC2Hv4VoqMVLSfPcLpA9OMW5qJj/grj8RxXrsNtsTB4AhLjYau/hMoPNxKnWY3Y5+cgaPAAXFv5EW58s1N6hjkWub94vnfV1sNa8iuvjecAzvcRkPfxmgSoIEquXaZSwllXT7mzXVDC0DYXBgZZLv48ZsFTCJ88DldWn+LPVZpQhD04Fvayq2RRjoLUxZuxw6BMoYc6IQ4smysVfmAXINrtKF2Uz+6R1o2AhGSooo0sK+uJs/Rqk/QL1o/5P0chughYtPncbguqPt6MHsvykfz+MtZJOcmkYf9+XrcAdTcSzzLe1NnqIOMeoKwd6Do9JX6HgFOy4OwXyqDrTRGWMQrOmhqETRqD+u17YL5SDPNPh4k/jYQqIByCRkPkOA0N/94Lp7VOsjACR2zsZg/+gvOv5UOBwA5yVSoGB/x4nKO80idUnyJsdtr9ZrawcmqkUFRs/JQVmLj8ZQQNyUHGtv9BQ8F+4kFvwHKqBAB8c7CRiy195aUOdjoDSfqcgwCmEs7y6+SizQy29n1rN29nwBlnTsX1tRvgcZoRcs8IsoqRKH/3I1I8zRNBnVs4Fa1Zo5Yw4+3Atuh96Rg6Qs3u1GOz4epfVsFhucb6ufUZHT93dflqiK0OJPz5T6wfajTfr4nvvQV7+VVe5+2DTkCa2RHZZeAgtTu3cMzjmlG/63uyHs9A2zuZXZIyNBQNew6wqa794hsYfjcMzOk8HghKpY+/SfYDHgdzMwSkJrGlIKF0qgS+BAF853TeQm69opea6N+fhVexcSODLPbFeYiZN5Nc7iiydtkoGTMVDccKfXPQ9ukJjSoGotPF6+vqEh2cS2sPOAa6+cgRCo5OQp+dRQR/OGq/30oU4Q/8fd3W3QyI35IuuWxpjWAe23lOUkZAayEAOSGnqDigVyKcx26wR+h84sCVd1fixo4CxFHAY5r5KCIffYg2ZC5Kxj1CG+8iW7rb5XGxVY0hPSOMwRfqasxdcDkpSr2LEkfj3oP8Xj8gE0H3DGSFW346xru36QeJ440aRjwpnd9bDh9v4yMsxNarFWCORDxKoQruItlLgHKyC4IQoGm3C0X6TM35QQBwN1vaQMNzcVbW4MIL+Sgeej+5s2IoQgxIXPE6ZJIrZtAn94A2tSe8aL3r+oHH04KKtZ8CAPG2iVCpjAilqN1CILQUFzMoO5crgcjZQh6jTpLfcJZLZzpwVtXBWVvHkXNgbr/bONQgsExs5y7g7Kx5ODFyMhzkrTSJ8QTABRC7mQAW7Fb5YGOssRPrxu3/CXAqWI+f4d1FxB7h/3U/8bNzcFSUswu0Xy6D7Uwpwh64D6HEFTwtNrq/xC5SEhZbPADQkLKDKfjwwNppWM4ALa8C9+8Rd1OqROQieAwUhiC4btSzuydgS9YUDCwFDDAfP4rzjz/HFkSXngqVMgItxaeY+5GbZHDc/TEhsIWh+ihHyKHjRyHqqcfY1dds2gqPaOMZdXUMy3L4BACw/JQazo91CDiXvYFTTQCINz8GuaD/jY3r9clEgJqBV1+4F+eeWMif6TJSpYqHt1v/Wc0SNMbbOTlyN4DjfdJaUwlrcQnvwtDxeWSm97LCSBDweFuIoBcwWQ+dOIaF4myq5e/alNJYWMhRKwAkvvsKVCFGuNHEYJIqEBKwZDcBNPzhCT4OI5Wj+MQFZDJyWbvQ2ngdgiIAglIFN8z+47D1A8DRntfrhr3+GkV8/wQr7I9PwpA5BC40SFUKt69U1V2O66gv5whTHR2F5JV/htjaioad+1nRXdsNFVGSbZxeopweJYsXcRJdhN1PNk6fyqs3bAYAjrhjFzwNFxp9a6a583sfN5QrJJk4fZvW3dDke5Xk1C0rl9jQEiYXhM7OxinuHnC+nWinBGYRBJUaMkGO+m0F0g4Bv/IJCMiY1DYXHWlXjhHgcdhQ+kw+XHX17Faz9m1D+PgJUBojoAwP45KUJi5Oyo1pKJr6AeZfjlFSeTSS31gGVXQkFFFhSJj/IuIWP0vupQblKz4Ck3y9Fpn7v0JC/ovQZ6YzFwoakM0VB5lCgfL31sPjtnJK5cpf3oHl6AkoydVm/rAVMU/Ohjo+hjkplaqIo6a1WQ0GNb8o5F1SjuqNX/F7uV6PpsKfYSsrZTD5Lv/x5P5RtwZNxYdw+eX/5vuE1xah9/p10GX1hTIsDOooEwIzMwG5wDy1bvdulK/6G/dN/uANpL6zkjhpL56/OjoWQTm57NBUxjBkHdxKpa+50Kb1ZPmFDB1BCfP3+dmqDZ+j+5cCIXXN+t6mGAMAZRfRKsH9zi/eyfXf7IHp6enEhcrR8ut5v7SCiu/NPx/lCgPt7vZJRQ4SzMeP4fg9k5BEnCp0XB4yd30F0enk8F90uSih+gJs5Zxz49D/9O+foCz7SlLCQsQtmQ94RQZ8U2ERLsxbDNvli6ww0eGAXBeAZBoX1Lyim3Nx5HJx6aVlqPz7J1JEJpDVa8bJ0VMoml2CyGmTkUYVCy+N67FYOeCp+GADyt44yWDxuj00RgO1xi7datPBnziICszORNW6TZL10NwcILhcPJ67sdnfsnCS9+qK9yhlVEHltvmIfmYGN4pGmRJYj59CSd4fpPSIGpfyX4fj8jXEPDebNt8Cbh6rlVMittNncXLEFLgtVi6/9Vq3QoqASSYyBRzXrpNbnY/a7TtYzt0NIGWtFiHP1Dv2dEV5VVdlLhmABwGE7EP0X1WQadH9i2uWXqeLFwjI2hXz9ZCpVSxQWmGnnAXwcqVCk5IIpcEAV0MD7BevwFVzw29MGZNizp/FJ5HlSSEQCZzSsF+6xL8nldO4UWqBLZWa+J08QEsWsBq2sxd8qRm/cX2uR22I4jqryhjJ5Ssq4aH1WiUgStG1IDBXJKXDY7b4r7fjYr0mAII2gNbf1AE18nI5SR4c2KH8ADBdkMt0nLMkYs9rojN0JJvLnMT19YeX+yqUwTx/jZTHIzBxUCDa2a1ygV+dEMtyEVRK4sUVaCGu7W5tZpnc6cnlS31Sq2efKfoOQL1fa/D7CyH/Z/XuAQcvL1XiWR2SSvj+BC3rYhy31LjOSU3BrbO+UkTFfdiVQ9Ze4b4xpTlQU/Lrb5Bgib+JvCLfHCDrYr2dgw4QO1p/N8YTIfrWAWkdik7kLfpOyUiykZrgtz63n14UkkyEuzq5bA+PcEyzX93R1GKtaQe4Rglwlg4B93/t3b1KA0EUBeBz7yRaaHCJ2QQjFlGSSiwsgrWP5nvpW1hoaSFE4r9x/d2rgYELC1PIlJ4PDixse9nZZJkz+DMiA0RwMinOTi/OLwHMfeB+4zvzF4osRP6Za9rpDpo/GprvcQrAkI1IcTCvtuJgJT9xqT8T8xA3Sfdv7jf2ykEnDlfyfzjLHTgigSK8voRpOSwBaCrqvaxEyC8tbK/1AUiMNiLqBz/kIlKMHqpe4gEmy2i8+SWZyyqRooXe7K442h0XqfMa1I+0yUWksLfncLw53PaVE+bxgftUSEA2IsP+O3Yatfm1N2DGgVugnrUg6wbTGlCLa65fe82lwQT/GgnEvCjaYwjWvrpe9bpVr1xd5gfBfj9TG+lEbgAAAABJRU5ErkJggg==" alt="ws_logo">' +
                                '</a>' +
                            '</div>' +
                         '<div id="titleArea">' +
                            '<a id="subtitle" target="_blank"></a>' +
                        '</div>' +
                          '<div id="searchArea">' +
                            '<div id="search"></div>' +
                        '</div>' +
                    '</div>'
        });
        domConstruct.place(topPane, mainContainer);



        var mainPane = domConstruct.create("div", {
            id: 'main', 'class': 'content',
            innerHTML: '<div id="leftPane" class="sidebar left">' +
                            '<div id="wrapper">' +
                                '<div style="position:relative;display:-webkit-flex;display:flex;flex-direction:column;height:100%;width:100%;">' +
                                     '<div id="legendHeader">' +
                                        '<span id="legendHeaderText"></span>' +
                                    '</div>' +
                                    '<div id="descriptionPanel">' +
                                        '<div id="description" class="descriptionDesktop"><div id="descriptionText"></div></div>' +
                                    '</div>' +
                                    '<div id="legendPanel" class="box">' +
                                        '<div id="legendDiv" class="legendDesktop"></div>' +
                                    '</div>' +
                                '</div>' +
                            '</div>' +
                            '<div id="logoPanel" class="box">' +
                                '<a class=logoPic href="http://www.geologie.ac.at/" target="_blank"><img src="images/gbalogo_schriftzug.png" alt="gbalogo"></a>' +
                            '</div>' +
                       '</div>' +

                        '<div id="right-bar" class="sidebar right">' +
                                '<div id="div_map">' +
                                    '<div id="ui-esri-map" class="mapDesktop">' +
                                        '<div id="HomeButton"></div>' +
                                         '<div id="menudiv"></div>' +
                                        '<div id="info"></div>' +
                                        '<div id="scalebar"></div>' +
                                        '<div id="progressArea">' +
                                            '<img id="loadingImg" alt="" src="images/loading.gif" style="display:none;"></>' +
                                        '</div>' +                                       
                                    '</div>' +
                                '</div>' +
                         '</div>'
        });
        domConstruct.place(mainPane, mainContainer);



        var twitterUrl = "http://twitter.com/intent/tweet?" +
             "url=" + encodeURIComponent("http://gisgba.geologie.ac.at/gbaviewer/?url=" + serviceUrl) +
             "&amp;text=" + encodeURIComponent(title);

        var facebook_url = "http://www.facebook.com/sharer.php?" +
            "s=100" +
            "&p[url]=" + encodeURIComponent("http://gisgba.geologie.ac.at/gbaviewer/?url=" + serviceUrl) +
             "&p[title]=" + encodeURIComponent(title);       

        var google_url = "https://plus.google.com/share?" +
            "url=" + encodeURIComponent("http://gisgba.geologie.ac.at/gbaviewer/?url=" + serviceUrl);

        var bottomPane = domConstruct.create("div", {
            id: 'bottomPane', 'class': 'footer',
            innerHTML: '<div id="ownerArea">' +
                        '<div id="fText"><span id=footerText></span></div>' +
                        '<div class="tabSpace"></div>' +
                        '<div id="creativeCommons"></div>' +
                        '<div id="socialButtons">' + 
                            //'<a  class="share-facebook" target="_blank"  href="http://www.facebook.com/sharer.php?u=http://gisgba.geologie.ac.at/gbaviewer/&t=Der neue GBA UniversalMapViewer" rel="nofollow">Facebook</a>' +
                            '<a  class="share-facebook" target="_blank"  href="' + facebook_url + '" rel="nofollow">Facebook</a>' +
                           //'<a class="share-twitter" target="_blank" data-lang="de" href="http://twitter.com/share?url=' + currentLocation + '&amp;text=Der neue GBA UniversalMapViewer&amp;count=vertical" rel="nofollow">Twitter</a>' +
                             '<a class="share-twitter" target="_blank" data-lang="de" href="' + twitterUrl + '" rel="nofollow">Twitter</a>' +
                             //'<div id="googleButton" href="' + currentLocation + '" class="g-plusone"></div>'+
                            '<a class="share-google" target="_blank" href="' + google_url + '">Google+</a>' +
                           //'<div class="fb-share-button" data-href="http://gisgba.geologie.ac.at/gbaviewer/" data-type="button_count"></div>' +
                        '</div>'+                            
                    '</div>'      
        });      
        domConstruct.place(bottomPane, mainContainer);

        //window.addEventListener('resize', function () {
        //    var leftPaneHeight = domGeometry.position(dom.byId("leftPane")).h;
        //    var descriptionPanelHeight = domGeometry.position(dom.byId("descriptionPanel")).h;
        //    var legendHeaderHeight = domGeometry.position(dom.byId("legendHeader")).h;
        //    var logoPanelHeight = domGeometry.position(dom.byId("logoPanel")).h;
        //    //document.getElementById("logoPanel").style.height = (logoPanelHeight) + "px";
        //    document.getElementById("legendPanel").style.height = (leftPaneHeight - (descriptionPanelHeight + legendHeaderHeight + logoPanelHeight) - 30) + "px";
        //});

    };

    return {
        buildDesktopDOM: buildDesktopDOM
    };

});