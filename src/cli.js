'use strict';

var _ = require('underscore');
var args = require('minimist')(process.argv.slice(2));
var glob = require('glob-all');
var path = require('path');
var fs = require('fs');
var AMDToCommon = require('./amd-to-common-fb');

function getFileGlobString(arg, ext){
  ext = ext || 'js';
  var stat = fs.lstatSync(arg);
  if(stat.isDirectory()){
    return path.join(arg, '**/*.' + ext);
  }
  return arg;
}

var directory = _.first(args._) || './';
var allJSFiles = getFileGlobString(directory, 'js');
var allJSXFiles = getFileGlobString(directory, 'jsx');
var excludedPattern = '!' + args.exclude;
var hasDefine = !!args.d || !!args.define;
var isBeautify = !!args.b || !!args.beautify;

glob([allJSFiles, allJSXFiles, excludedPattern], {}, function(error, files){
  var converter = new AMDToCommon({
    files: files,
    hasDefine: hasDefine,
    isBeautify: isBeautify
  });
  converter.analyse();
});
