var _ = require('underscore');

/**
 * Given the content and an AST node, convert the return statement
 * to be a module.export
 * @param {String} content The code
 * @param {Object} node The AST node
 * @returns {String} The converted content
 */
module.exports = function convert(content, node){
  var defineFunction = node.body[0].expression.arguments[0].body;

  return content.substring(defineFunction.range[0] + 1, defineFunction.range[1] - 1).replace(/(^|\n)(\t|[\s]{2})/g, '$1');
};
