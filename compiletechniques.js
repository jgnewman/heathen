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
    fn.call(data, data[i], i);
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

function last (data) {
  return data[data.length - 1];
}

/*
 * Places a value into the wrapper of a lazy value.
 */
function lazy() {
  return 'function () { return ' + this.val.compile() + '; }';
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

function paramFn(paramArray) {
  var begin = '(',
      list = [];
  loop(paramArray, function (each, index) {
    var compiled = each.compile();
    if (index !== 0) {
      begin += ', ';
    }
    begin += compiled;
    list.push(compiled);
  });
  begin += ')';
  return {
    "compiled" : begin,
    "list" : list
  };
}

/*
 * Creates a basic function call.
 */
function functionCall() {
  var begin, typeIsFunc;

  switch (this.fn[0].val) {

    case 'param':
      return paramFn(this.args);

    default:
      typeIsFunc = (this.fn[0].type === 'FunctionDefinition' || this.fn[0].type === 'PatternMatchDefinition');
      begin = '';
      if (typeIsFunc) {
        begin += '(';
      }
      begin += this.fn[0].compile() + '(';
      loop(this.args, function (each, index) {
        if (index !== 0) {
          begin += ', ';
        }
        begin += each.compile();
      });
      begin += ')';
      if (typeIsFunc) {
        begin += ')';
      }
      return begin;
  }
}


/*
 * Creates a complex function call allowing flags.
 * From: (animate -selector '#mydiv' -distance '400px')
 * To:   HN.bashCall(animate, {"selector" : "#mydiv", "distance" : "400px"});
 */
function complexCall() {
  var begin  = 'HN.bashCall(' + this.fn[0].compile() + ', {',
      flags  = [],
      args   = [],
      errMsg = "If you use flags, you have to pass a flag for every argument. Line " + this.pos + ".";
  library.push('bashCall');

  if (this.args[0].type !== 'Flag') {
    throw new Error(errMsg);
  }

  /*
   * Separate flags from args
   */
  loop(this.args, function (each, index) {
    if (index % 2 === 0) {
      flags.push(each);
    } else {
      args.push(each);
    }
  });

  /*
   * Make sure we have the same amount of flags and args
   */
  if (flags.length !== args.length) {
    throw new Error(errMsg);
  }

  /*
   * Build the rest of the call.
   */
  loop(flags, function (each, index) {
    if (index !== 0) {
      begin += ', ';
    }
    begin += ('"' + each.compile() + '" : ' + args[index].compile());
  });
  begin += '})';
  return begin;
}

/*
 * Parse conditions into immediate functions
 * with returns.
 */
function condition() {
  var begin = '(function () {\n',
      cons  = [],
      rets  = [],
      noEnd;

  loop(this.body, function (each, index) {
    if (index % 2 === 0) {
      cons.push(each);
    } else {
      rets.push(each);
    }
  });
  loop(cons, function (each, index) {
    if (index === 0 && rets[index]) {
      begin += ('  if (' + each.compile() + ') {\n');
      begin += ('    return ' + rets[index].compile() + ';\n');
      begin += ('  }');
    } else if (index !== 0 && rets[index]) {
      begin += (' else if (' + each.compile() + ') {\n');
      begin += ('    return ' + rets[index].compile() + ';\n');
      begin += ('  }');
    } else if (index !== 0 && !rets[index]) {
      begin += (' else {\n');
      begin += ('    return ' + each.compile() + ';\n');
      begin += ('  }\n');
    } else {
      noEnd = true;
      begin += ('  var _cache = ' + each.compile() + ';\n');
      begin += ('  if (_cache) {\n    return _cache;\n  }\n  return false;\n');
      begin += ('}())');
    }
  });
  if (!noEnd) {
    begin += '\n  return null;\n}())';
  }
  return begin;
}

function flag() {
  return rest(this.val);
}

/*
 * Compiles named functions that don't use pattern matching.
 */
function namedFunction() {
  var name   = first(this.body).compile(),
      params = first(rest(this.body)).compile(),
      begin  = '// Define a closure to house the ' + name + ' function...\n';

  begin += (name + ' = (function () {\n\n');
  begin += ('  // Create the ' + name + ' function that will be callable to the user...\n');
  begin += ('  var _output = function ' + name + params.compiled + '{\n');
  loop(rest(rest(this.body)), function (each, index) {
    if (index === this.length - 1) {
      begin += '    return ';
    } else {
      begin += '    ';
    }
    begin += (each.compile());
    if (last(begin) !== '}' || each.type === 'Variable' || each.type === 'Reassignment') {
      begin += ';';
    }
    begin += '\n';
  });
  begin += ('  };\n\n');
  begin += ("  // Create and store references to each parameter's name and position in the list...\n");
  begin += ('  _output._paramPositions = {');
  loop(params.list, function (each, index) {
    if (index !== 0) {
      begin += ', ';
    }
    begin += ('"' + each + '" : ' + index);
  });
  begin += ('};\n\n');
  begin += ('  // Return the callable function...\n');
  begin += ('  return _output;\n\n');
  begin += ('}())');

  this.scope.push(name);
  return begin;
}

/*
 * Compiles anonymous functions that don't use pattern matching.
 */
function anonymousFunction() {
  var params = first(this.body).compile(),
      begin  = ('function ' + params.compiled + ' {\n');

  loop(rest(this.body), function (each, index) {
    if (index === this.length - 1) {
      begin += '  return ';
    } else {
      begin += '  ';
    }
    begin += (each.compile());
    if (last(begin) !== '}' || each.type === 'Variable' || each.type === 'Reassignment') {
      begin += ';';
    }
    begin += '\n';
  });
  begin += ('}');

  return begin;
}

/*
 * Decides whether to parse a named or anonymous function.
 */
function functionDefinition() {
  if (this.pattern === 'NameParam') {
    return namedFunction.call(this);
  } else if (this.pattern === 'Param') {
    return anonymousFunction.call(this);
  }
}

/*
 * Compiles named pattern match functions
 */
function patternMatchDefinition() {
  console.log('here')
}

/*
 * Calls .compile() for every item in the parse tree.
 * Puts the compiled code together.
 */
function program() {
  var out = [];
  loop(this.parseTree, function (each) {
    out.push(each.compile());
  });
  return out.join('\n');
}


function noop() {
  return 'no compile technique exists';
}

module.exports = {
  "library"                : library,
  "Lazy"                   : lazy,
  "Flag"                   : flag,
  "Value"                  : value,
  "Operator"               : operator,
  "FunctionDefinition"     : functionDefinition,
  "PatternMatchDefinition" : patternMatchDefinition,
  "Condition"              : condition,
  "Variable"               : noop,
  "Reassignment"           : noop,
  "Method"                 : noop,
  "FunctionCall"           : functionCall,
  "ComplexCall"            : complexCall,
  "Program"                : program
};
