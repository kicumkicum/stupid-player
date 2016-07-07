/**
 * @externs
 */


/**
 * Global object
 * @type {Chai}
 */
var chai;



/**
 * @constructor
 */
Chai = function() {};


/**
 * @param {*} value
 * @param {string} errorMessage
 * @return {Assertion}
 */
Chai.prototype.expect = function(value, errorMessage) {};


/**
 * @param {*} expression
 * @param {string} errorMessage
 * @throws {AssertionError}
 */
Chai.prototype.assert = function(expression, errorMessage) {};


/**
 * @param {function(Chai, Object):void} plugin
 * @throws {AssertionError}
 */
Chai.prototype.use = function(plugin) {};


/**
 * @type {Object.<string, Function>}
 */
Chai.prototype.should = undefined;


/**
 * @type {Function}
 */
Chai.prototype.Assertion = undefined;



/**
 * @constructor
 */
Assertion = function() {};


/**
 * @return {Assertion}
 */
Assertion.prototype.to;


/**
 * @return {Assertion}
 */
Assertion.prototype.be;


/**
 * @return {Assertion}
 */
Assertion.prototype.have;


/**
 * @return {Assertion}
 */
Assertion.prototype.that;


/**
 * @return {Assertion}
 */
Assertion.prototype.is;


/**
 * @return {Assertion}
 */
Assertion.prototype.deep;


/**
 * @throws {AssertionError}
 */
Assertion.prototype.exist;


/**
 * @param {string} type
 * @throws {AssertionError}
 */
Assertion.prototype.a = function(type) {};


/**
 * @param {string} type
 * @throws {AssertionError}
 */
Assertion.prototype.an = function(type) {};


/**
 * @param {number} value
 * @throws {AssertionError}
 */
Assertion.prototype.length = function(value) {};


/**
 * @param {number} value
 * @throws {AssertionError}
 */
Assertion.prototype.above = function(value) {};


/**
 * @param {number} value
 * @throws {AssertionError}
 */
Assertion.prototype.below = function(value) {};


// Plugins


/**
 * @return {Assertion}
 */
Assertion.prototype.oipf;


/**
 * @throws {AssertionError}
 */
Assertion.prototype.collection;


/**
 * @return {Assertion}
 */
Assertion.prototype.will;


/**
 * @return {Assertion}
 */
Assertion.prototype.after;


/**
 * @return {Assertion}
 */
Assertion.prototype.informed;


/**
 * @return {Assertion}
 */
Assertion.prototype.confirmed;


/**
 * @param {string} text
 * @throws {AssertionError}
 */
Assertion.prototype.by = function(text) {};



/**
 * @constructor
 * @extends {Error}
 */
AssertionError = function() {};
