module.exports = function(grunt) {

    /** 
    * This will load all grunt tasks in package.json
    * To add a grunt task, just do npm install --save grunt-<task>
    * The task will be available wothout manually loading it
    */
    require('load-grunt-tasks')(grunt);

    grunt.initConfig({

        /**
         * jshint config
         */
        jshint: {
            options: {
            //    jshintrc: '.jshintrc',
            //    jshintignore: '.jshintignore'
            },
            facebookConnectPlugin: ['facebookConnectPlugin.js'],
            gruntfile: ['gruntfile.js'],
            scripts: ['scripts/**/*.js'],
            tests: ['tests/**/*.js']
        }
    });

    grunt.registerTask('default', ['jshint']);
};