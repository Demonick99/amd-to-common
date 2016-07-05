var fs = require('fs');
var _ = require('underscore');
var esprima = require('esprima-fb');
var traverse = require('traverse');
var beautify = require('js-beautify').js;

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
    this.isBeautify = options.isBeautify;
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

    if (this.isBeautify) {
      result = beautify(result, {
          "indent_size": 4,
          "indent_char": " ",
          "eol": "\n",
          "indent_level": 0,
          "indent_with_tabs": false,
          "preserve_newlines": true,
          "max_preserve_newlines": 10,
          "jslint_happy": false,
          "space_after_anon_function": false,
          "brace_style": "collapse",
          "keep_array_indentation": false,
          "keep_function_indentation": false,
          "space_before_conditional": true,
          "break_chained_methods": false,
          "eval_code": false,
          "unescape_strings": false,
          "wrap_line_length": 0,
          "wrap_attributes": false,
          "wrap_attributes_indent_size": 4,
          "end_with_newline": false,
          "e4x": true
      });
    }

    return result;
  };

  return _convert;
})();

module.exports = AMDToCommon;
