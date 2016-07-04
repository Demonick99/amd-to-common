var fs = require('fs');
var _ = require('underscore');
var esprima = require('esprima-fb');
var traverse = require('traverse');

var AMDNode = require('./lib/AMDNode');
var requireConverter = require('./lib/require-converter');
var exportConverter = require('./lib/export-converter');
var strictConverter = require('./lib/strict-converter');
var defineRemover = require('./lib/define-remover');

var AMDToCommon = (function(){
  'use strict';

  /**
   * Constructor function for the Human library
   * @param {Object} [options]
   * @private
   */
  var _convert = function(options){
    options = options || {};
    this.files = options.files;
    this.hasDefine = options.hasDefine;
    this.parseOptions = { range: true, comment: true };
  };

  /**
   * Read each file and analyse the content
   */
  _convert.prototype.analyse = function(){
    _.each(this.files, _.bind(function(filename){
      var content = fs.readFileSync(filename, 'utf-8');
      console.log('Analysing file ' + filename);
      var newContent = this.convertToCommon(content);
      if(newContent === content){
        console.log('Nothing to do.');
        return;
      }
      console.log('Converting file to commonJS style require');
      fs.writeFileSync(filename, newContent);
    }, this));
  };

  /**
   * Given the contents of a JS source file, parse the source
   * with esprima, then traverse the AST. Convert to common and
   * and output the new source.
   * @param {String} content The source content
   * @returns {String} The converted source, or the same source if nothing changed.
   */
  _convert.prototype.convertToCommon = function(content){
    var code = esprima.parse(content, this.parseOptions);
    // Filter the nodes to find all AMD style defines
    var amdNodes = traverse(code).reduce(function(memo, node){
      var amdNode = new AMDNode(node);
      if(amdNode.isAMDStyle()){
        memo.push(amdNode);
      }
      return memo;
    }, []);

    // For now, let's operate with a 1 per file assumption.
    var node = _.first(amdNodes);
    if (!node) {
      return content;
    }

    var result = requireConverter(content, node);

    // Do a second pass of the code now that we've rewritten it
    result = exportConverter(result, esprima.parse(result, this.parseOptions));

    result = strictConverter(result, esprima.parse(result, this.parseOptions));

    if (!this.hasDefine) {
      result = defineRemover(result, esprima.parse(result, this.parseOptions));
    }

    return result;
  };

  return _convert;
})();

module.exports = AMDToCommon;
