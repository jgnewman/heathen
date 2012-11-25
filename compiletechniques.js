/*
 * Name: compiletechniques.js
 * Description: How we go about compiling each kind of data.
 */

var library = [];

/*
 * A simple, functional, iterator.
 */
function loop(data, fn) {
  var len = data.length, i;
  for (i = 0; i < len; i += 1) {
    fn(data[i], i);
  }
}

function lead(data) {
  return data.slice(0, data.length - 1);
}

function first(data) {
  return data[0];
}

function rest(data) {
  return data.slice(1);
}

/*
 * Compiles + - * /
 * Takes the operator symbol and a number to return
 * in the event that there are no arguments.
 */
function basicMath(oper, noArgs) {
  var output;
  if (!this.args.length) {
    return noArgs;
  }
  output = '';
  loop(this.args, function (each, index) {
    if (index === 0) {
      output += each.compile();
    } else {
      output += (' ' + oper + ' ' + each.compile());
    }
  });
  return '(' + output + ')';
}

/*
 * Compiles:
 * (++ x) -> ++x
 * (-- x) -> --x
 */
function oneArgMath(oper) {
  if (this.args.length !== 1) {
    throw new Error(oper + ' must be called with a single argument. Line ' + this.pos + '.');
  }
  return '(' + oper + this.args[0].compile() + ')';
}

/*
 * Compiles % += -= *= /= %= = != <= >= < >
 */
function twoArgMath(oper) {
  if (this.args.length !== 2) {
    throw new Error(oper + ' must be called with two arguments. Line ' + this.pos + '.');
  }
  return '(' + this.args[0].compile() + ' ' + oper + ' ' + this.args[1].compile() + ')';
}

/*
 * Compiles the >>= operator.
 * Expects the arguments to be a bind function, a monadic value, and functions for the monad.
 */
function monadChain() {
  var begin = 'HN.monadChain(';
  begin += (first(this.args).compile() + ').pass(');
  begin += (first(rest(this.args)).compile() + ').to(');
  loop(rest(rest(this.args)), function (each, index) {
    if (index !== 0) {
      begin += ', ';
    }
    begin += each.compile();
  });
  begin += ')';
  library.push('monadChain');
  return begin;
}

/*
 * Compiles the &&= operator.
 * Handles method chaining via library code.
 */
function methodChain() {
  var begin = 'HN.methodChain(';
  loop(this.args, function (each, index) {
    if (index !== 0) {
      each = 'function () { return this.' + each.compile() + '; }';
      begin += ', ';
    } else {
      each = 'function () { return ' + each.compile() + '; }';
    }
    begin += each;
  });
  begin += ')';
  library.push('methodChain');
  return begin;
}

/*
 * Determines how to compile each operator.
 */
function operator() {
  switch (this.fn) {

    case '+':
      return basicMath.call(this, '+', '0');

    case '-':
      return basicMath.call(this, '-', '0');

    case '*':
      return basicMath.call(this, '*', '1');

    case '/':
      return basicMath.call(this, '/', '1');

    case '++':
      return oneArgMath.call(this, '++');

    case '--':
      return oneArgMath.call(this, '--');

    case '%':
      return twoArgMath.call(this, '%');

    case '+=':
      return twoArgMath.call(this, '+=');

    case '-=':
      return twoArgMath.call(this, '-=');

    case '*=':
      return twoArgMath.call(this, '*=');

    case '/=':
      return twoArgMath.call(this, '/=');

    case '%=':
      return twoArgMath.call(this, '%=');

    case '<':
      return twoArgMath.call(this, '<');

    case '>':
      return twoArgMath.call(this, '>');

    case '=':
      return twoArgMath.call(this, '===');

    case '!=':
      return twoArgMath.call(this, '!==');

    case '<=':
      return twoArgMath.call(this, '<=');

    case '>=':
      return twoArgMath.call(this, '>=');

    case '>>=':
      return monadChain.call(this);

    case '&&=':
      return methodChain.call(this);

    default:
      throw new Error('Compiler bug related to ' + this.fn + ' on ' + this.pos + '. No compile method available for this operator.');
  }
}

function value() {
  return this.val;
}


function noop() {}

module.exports = {
  "library"            : library,
  "Flag"               : noop,
  "Value"              : value,
  "Operator"           : operator,
  "FunctionDefinition" : noop,
  "Condition"          : noop,
  "Variable"           : noop,
  "Reassignment"       : noop,
  "Method"             : noop,
  "FunctionCall"       : noop
};
