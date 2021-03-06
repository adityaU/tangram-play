'use strict';

module.exports = function (config) {
    config.set({
        basePath: '',
        frameworks: ['browserify', 'mocha', 'sinon'],
        files: [
            // Source
            // 'src/js/**/*.js',
            // // Application
            // 'build/css/main.css',
            // 'build/js/modernizr.js',
            // 'index.html',
            // Test suites
            'test/**/*.js'
        ],

        exclude: [],
        preprocessors: {
            // 'src/js/**/*.js': ['browserify'],
            'test/**/*.js': ['browserify']
        },

        browserify: {
            debug: true,
            transform: [['babelify', { presets: 'es2015' }], 'brfs']
        },

        plugins: [
            'karma-mocha',
            'karma-sinon',
            'karma-phantomjs-launcher',
            'karma-mocha-reporter',
            'karma-browserify'
        ],
        reporters: ['mocha'],

        port: 9876,
        colors: true,

        logLevel: config.LOG_INFO,
        autoWatch: false,
        browsers: ['PhantomJS'],

        singleRun: true
    });
};
