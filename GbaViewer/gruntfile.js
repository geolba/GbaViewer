/// <vs />
module.exports = function (grunt) {
    //load dependencies   
    grunt.loadNpmTasks('grunt-dojo');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');

    grunt.initConfig({
       
        clean: {
            // clean the output directory before each build
            dist: ['dist'],

            //// remove dojo source code (i.e. before fresh bower install)
            //dojo: ['Scripts/dgrid', 'Scripts/dijit', 'Scripts/dojo', 'Scripts/dojox', 'Scripts/put-selector', 'Scripts/util', 'Scripts/xstyle'],

            // remove esri source code (before slurping ersi code)
            esri: ['Scripts/esri'],

            // remove uncompressed files from dist
            uncompressed: ['dist/**/*.uncompressed.js'],

            // remove console stripped files from dist
            stripped: ['dist/**/*.consoleStripped.js'],

            unnecessary: ['dist/dgrid', 'dist/dgrid1', 'dist/dstore', 'dist/xstyle', 'dist/put-selector']
        },

        //neu testen
        copy: {
            main: {
                files: [{
                    expand: true,
                    cwd: 'src/',
                    src: ['built.html'],
                    dest: './dist/',
                    rename: function (dest, src) {
                        return dest + 'index.html';
                    }
                }]
            }
        },

        // dojo build configuration, mainly taken from dojo boilerplate
        dojo: {
            dist: {
                options: {
                    //profile: 'build.profile.js'
                    releaseDir: '../dist' // Optional: release dir rel to basePath (Default: 'release')
                }
            },
            options: {
                profile: 'build.profile.js', // Profile for build
                dojo: 'bower_components/dojo/dojo.js', // Path to dojo.js file in dojo source
                load: 'build', // Optional: Utility to bootstrap (Default: 'build')
                cwd: './', // Directory to execute build within  
                basePath: './scripts'
            }
        }

    });

    //aliases:
    grunt.registerTask('build', ['clean:dist', 'dojo','clean:unnecessary', 'clean:uncompressed', 'clean:stripped']);
};