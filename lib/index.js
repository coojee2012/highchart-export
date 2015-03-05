/**
 * Created by LinYong on 2015-03-05.
 * All changes from node-highcharts-exporter.
 * Main change the export way to phantomjs.
 * 采用官方提供的基于phantomjs的算法重写了node-highcharts-exporter。
 */
'use strict';


var fs = require('fs'),
    crypto = require('crypto'),
    async = require('async');

var path = require("path");
var execFile = require("child_process").execFile;
var phantomjsCmd = require("phantomjs").path;
var exportjs = path.resolve(__dirname, "../scripts/highcharts-convert.js");
/**
 * Default exporting configuration. Basic but extendable.
 * @type {Object}
 */
var config = {
    processingDir: process.cwd() + '/highcharts_exports' // Default: the same directory of the using module
};

/**
 * Set and gets config options
 * @param {string}   key   Key of the config object
 * @param {anything} value Value for the key
 */
exports.config = {
    set: function (key, value) {
        if (key && value && config.hasOwnProperty(key)) {
            config[key] = value;
        }
        else {
            throw 'Error! you must supply a valid config property and give a value when calling the set() function.';
        }
    },
    get: function () {
        return config;
    }
};

/**
 * Makes the directory to process and store the requested chart
 * @param  {object} hcExportRequest The Highcharts POSTed export request object
 * @param  {function} asyncCallback A reference to the async callback
 * @return {void}                   Nothing
 */
var _makeDirs = function (hcExportRequest, asyncCallback) {

    var makeThisExportDir = function (mkExportDirErr) {
        var thisExportDir = [config.processingDir, crypto.createHash('md5').update(Date().toString() + hcExportRequest.svg).digest('hex'), ''].join('/');
        fs.mkdir(thisExportDir, function (error) {
            asyncCallback(mkExportDirErr, thisExportDir, hcExportRequest);
        });
    };

    if (fs.existsSync(config.processingDir)) {
        makeThisExportDir(null);
    }
    else {
        fs.mkdir(config.processingDir, function (error) {
            makeThisExportDir(error);
        });
    }
};

/**
 * Exports chart into desired format
 * @param  {string}   processingDir   The processing directory to export the chart to (returned by _makeDirs() function)
 * @param  {object}   hcExportRequest The Highcharts POSTed export request object
 * @param  {Function} asyncCallback   A reference to the async callback
 * @return {void}                     Nothing
 * Notes: At this juncture, if you request anything other than svg, a PNG will be
 *        created first and if requested, a PDF or JPEG will be then created from
 *        that PNG.
 */
var _exportChart = function (processingDir, hcExportRequest, callback) {
    var outputChartName = hcExportRequest.filename,
        width=hcExportRequest.width || 800,
        scale=hcExportRequest.scale || 2,
        outputFormat = hcExportRequest.type.split('/')[1],
        outputExtension = outputFormat == 'svg+xml' ? '.svg' : '.' + outputFormat,
        outputFile = outputChartName + outputExtension,
        outputFilePath = processingDir + outputFile,
        baseSVGFile = processingDir + outputChartName + '.svg',
        exportInfo = {
            fileName: outputChartName,
            file: outputFile,
            type: outputExtension.replace('.', ''),
            parentDir: processingDir,
            filePath: outputFilePath
        };

    fs.writeFile(baseSVGFile, hcExportRequest.svg, function (svgErr) {
        if (outputFormat == 'svg+xml') {
            callback(null, exportInfo);
        }
        else {
            var args = [exportjs, '-infile', baseSVGFile, '-outfile', outputFilePath, '-scale', scale, '-width', width , '-constr', 'Chart'];
            execFile(phantomjsCmd, args, function (err, stdout, stderr) {
                if (err) {
                    callback({message: err}, null);
                } else if (stdout.length > 0) { // PhantomJS always outputs to stdout.
                    if(stdout.toString().trim()===outputFilePath){
                        callback(null, exportInfo);
                    }else{
                        callback(new Error(stdout.toString().trim()));
                    }
                } else if (stderr.length > 0) { // But hey something else might get to stderr.
                    callback(new Error(stderr.toString().trim()));
                } else {
                    callback(null, exportInfo);
                }
            });
        }
    });
};

/**
 * Executes an incoming Highcharts request into the requested format the async way
 * @param  {object}   hcExportRequest An object as POSTed by Highcharts
 * @param  {Function} callback        A callback, with first parameter an error
 *                                    and the second a success function handed the
 *                                    directory where the file is exported.
 * @return {void}                     Nothing
 * Notes: As of Highcharts v3.0.7, the hcExportRequest looks something like this:
 *     {
 *         filename : 'someName'
 *         type     : 'application/pdf',
 *         svg      : '<svg>An SVG representation of the chart here</svg>',
 *         scale    : 2
 *     }
 */
exports.exportChart = function (hcExportRequest, exportCallback) {
    async.waterfall([
            function (callback) {
                _makeDirs(hcExportRequest, callback);
            },
            function (processingDir, hcExportRequest, callback) {
                _exportChart(processingDir, hcExportRequest, callback);
            }
        ],
        function (error, exportedChartInfo) {
            exportCallback(error, exportedChartInfo);
        }
    );
};
