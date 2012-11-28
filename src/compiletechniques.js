/*
 * Name: compiletechniques.js
 * Description: How we go about compiling each kind of data.
 */

var libs         = require('./library'),
    version      = '0.0.1',
    library      = [],
    atoms        = {},
    identifier   = new RegExp(/^[a-zA-Z\_\$]/),
    stringMarker = new RegExp(/\`string\_\d+\`/);

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

/*
 * How to parse a basic value.
 */
function value() {
  if (first(this.val) === '@') {
    atoms[rest(this.val)] = true;
    library.push('registerModuleAtoms');
    return 'HN.atoms["' + rest(this.val) + '"]';
  } else {
    /*
     * Disallow creating global variables and/or modifying library code.
     */
    if (/^_HN_global$|^HN[\.\[]/.test(this.val)) {
      throw new Error('Nice try.  No creating globals and no modifying library code allowed. Line ' + this.pos + '.');
    }
    return this.val;
  }
}

/*
 * Compiles a list of parameters.
 */
function paramFn(paramArray) {
  var begin = '(',
      list = [],
      defaults = [],
      isDef;
  loop(paramArray, function (each, index) {
    var compiled = each.compile();
    if (compiled === '->') {
      isDef = last(list);
      return;
    }
    if (isDef) {
      defaults.push([isDef, compiled]);
      isDef = false;
      return;
    }
    if (index !== 0) {
      begin += ', ';
    }
    begin += compiled;
    list.push(compiled);
  });
  begin += ')';
  return {
    "compiled" : begin,
    "list"     : list,
    "defaults" : defaults
  };
}

/*
 * Compiles the special form 'at' function.
 */
function atFn(args, pos) {
  var collection, key;
  if (args.length !== 2) {
    throw new Error("The 'at' function must be called with 2 arguments. Line " + pos + ".");
  }
  collection = args[0].compile();
  key = args[1].compile();
  return collection + '[' + key + ']';
}

/*
 * Compiles the special form 'new' function.
 */
function newFn(args, pos) {
  var begin, className, restArgs;
  if (!args.length) {
    throw new Error("The 'new' function must be called with at least 1 argument. Line " + pos + ".");
  }
  
  begin = 'new ';
  className = args[0];
  restArgs = rest(args);
  
  begin += (className.compile() + '(');
  loop(restArgs, function (each, index) {
    if (index !== 0) {
      begin += ', ';
    }
    begin += each.compile();
  });
  begin += ')';
  return begin;
}

/*
 * Compiles the special form 'all' and '!' functions.
 */
function compareFn(args, wantsTruthy) {
  var begin = '(';
  loop(args, function (each, index) {
    if (index !== 0) {
      begin += '&& ';
    }
    begin += (wantsTruthy ? each.compile() : '!' + each.compile());
  });
  begin += ')';
  return begin;
}

/*
 * Compiles the special form 'any' function.
 */
function anyFn(args) {
  var begin = '(';
  loop(args, function (each, index) {
    if (index !== 0) {
      begin += '|| ';
    }
    begin += each.compile();
  });
  begin += ')';
  return begin;
}

/*
 * Creates a basic function call.
 */
function functionCall() {
  var begin, typeIsFunc, compiled;

  /*
   * Hand off to special form function calls...
   */
  switch (this.fn[0].val) {

    case 'param':
      return paramFn(this.args);

    case 'at':
      return atFn(this.args, this.pos);

    case 'new':
      return newFn(this.args, this.pos);

    case 'all':
      return compareFn(this.args, true);

    case '!':
      return compareFn(this.args, false);

    case 'any':
      return anyFn(this.args);

    default:
      typeIsFunc = (this.fn[0].type === 'FunctionDefinition' || this.fn[0].type === 'PatternMatchDefinition');
      begin = '';
      if (typeIsFunc) {
        begin += '(';
      }
      compiled = this.fn[0].compile();
      switch (compiled) {

        case 'first':
          library.push('first');
          compiled = 'HN.first';
          break;

        case 'rest':
          library.push('rest');
          compiled = 'HN.rest';
          break;

        case 'lead':
          library.push('lead');
          compiled = 'HN.lead';
          break;

        case 'last':
          library.push('last');
          compiled = 'HN.last';
          break;

        case 'map':
          library.push('map');
          compiled = 'HN.map';
          break;

        case 'chart':
          library.push('chart');
          compiled = 'HN.chart';
          break;

        case 'typeof':
          library.push('getType');
          compiled = 'HN.getType';
          break;

        default:
          break;
      }

      begin += compiled + '(';
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
 * The procedure for writing a 'var' statement.
 */
function writeVars(toStr, vars, atProgramLevel) {
  var build, newVars = [], used = {}, i;
  if (vars.length) {
    build = toStr + '  var ';

    /*
     * Create a new var list with no duplicates.
     * If we're not at the program level, don't overwrite
     * the HN library var.
     */
    loop(vars, function (each) {
      used[each] = true;
    });
    for (i in used) {
      if (Object.prototype.hasOwnProperty.call(used, i)) {
        if (atProgramLevel || i !== 'HN') {
          newVars.push(i);
        }
      }
    }

    if (newVars.length) {
      /*
       * Loop over the new list and write vars.
       */
      loop(newVars, function (each, index) {
        if (index !== 0) {
          build += ', '
        }
        build += each; 
      });
      build += ';\n';
      return build;
    } else {
      return toStr;
    }
  } else {
    return toStr;
  }
}

/*
 * Compiles named functions that don't use pattern matching.
 */
function namedFunction() {
  var name   = first(this.body).compile(),
      params = first(rest(this.body)).compile(),
      begin  = '// Define a closure to house the ' + name + ' function...\n',
      anon_1 = '',
      anon_2 = '',
      vars;

  begin += (name + ' = (function () {\n\n');
  begin += ('  // Create the ' + name + ' function that will be callable to the user...\n');
  begin += ('  var _output = function ' + name + params.compiled + '{\n');
  loop(rest(rest(this.body)), function (each, index) {
    if (index === this.length - 1 && each.type !== 'Variable' && each.type !== 'Reassignment') {
      anon_2 += '    return ';
    } else {
      anon_2 += '    ';
    }
    anon_2 += (each.compile());
    if (last(anon_2) !== '}' || each.type === 'Variable' || each.type === 'Reassignment') {
      anon_2 += ';';
    }
    anon_2 += '\n';
  });
  anon_2 += ('  };\n\n');

  anon_1 = writeVars('  ', this.vars);

  /*
   * Insert parameter defaults.
   */
  loop(params.defaults, function (each) {
    anon_1 += ('  if (' + each[0] + ' === undefined) { ' + each[0] + ' = ' + each[1] + '; }\n');
  });

  anon_1 += anon_2;
  begin += anon_1;

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
      front  = ('function ' + params.compiled + ' {\n'),
      begin  = '';

  /*
   * Insert parameter defaults.
   */
  loop(params.defaults, function (each) {
    front += ('  if (' + each[0] + ' === undefined) { ' + each[0] + ' = ' + each[1] + '; }\n');
  });

  loop(rest(this.body), function (each, index) {
    if (index === this.length - 1 && each.type !== 'Variable' && each.type !== 'Reassignment') {
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

  /*
   * Add in variable definitions
   */
  front = writeVars(front, this.vars);

  return front + begin;
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
 * How to compile the basic array.
 */
function list() {
  var charRangeMarker = new RegExp(/^\`string\_\d+\`(\.\.|\.\.\.)\`string\_\d+\`$/),
      numRangeMarker = new RegExp(/^\d+(\.\.|\.\.\.)\d+$/),
      inclusiveMarker = new RegExp(/\.\.\./),
      inclusive,
      compiled,
      begin,
      front,
      back,
      i;

  /*
   * Build alphabetical ranges if we have 'em.
   */
  if (this.body.length === 1 && this.body[0].type === 'Value' && charRangeMarker.test(this.body[0].val)) {
    library.push('buildRange');
    compiled = this.body[0].compile();
    if (inclusiveMarker.test(compiled)) {
      inclusive = true;
    }
    front = compiled.match(/^\`string\_\d+\`/)[0];
    back  = compiled.match(/\`string\_\d+\`$/)[0];
    begin = 'HN.buildRange(' + front + ', ' + back + ', false, ' + inclusive + ')';
    return begin;

  /*
   * Build numerical ranges if we have 'em.
   */
  } else if (this.body.length === 1 && this.body[0].type === 'Value' && numRangeMarker.test(this.body[0].val)) {
    library.push('buildRange');
    compiled = this.body[0].compile();
    if (inclusiveMarker.test(compiled)) {
      inclusive = true;
    }
    front = compiled.match(/^\d+/)[0];
    back  = compiled.match(/\d+$/)[0];
    begin = 'HN.buildRange(' + front + ', ' + back + ', true, ' + inclusive + ')';
    return begin;
  }

  /*
   * Otherwise...
   */
  begin = '[';
  loop(this.body, function (each, index) {
    if (index !== 0) {
      begin += ', ';
    }
    begin += each.compile();
  });
  begin += ']';
  return begin;
}

/*
 * How to compile a hash map
 */
function hash() {
  var keys = [],
      vals = [],
      begin = '{ ';
  loop(this.body, function (each, index) {
    if (index % 2 === 0) {
      keys.push(each.compile());
    } else {
      vals.push(each.compile());
    }
  });
  if (keys.length !== vals.length) {
    throw new Error('No matching value for key. Line ' + this.pos + '.');
  }
  loop(keys, function (each, index) {
    begin += (stringMarker.test(each) ? each : '"' + each + '"');
    begin += ' : ';
    begin += vals[index];
    if (index !== this.length - 1) {
      begin += ', ';
    } else {
      begin += ' ';
    }
  });
  begin += '}';
  return begin;
}

/*
 * How to compile the 'method' call.
 */
function method() {
  var params = [],
      begin  = 'function (',
      anon_1 = '',
      anon_2 = '';

  if (this.body[0].type !== 'List') {
    throw new Error("Method's first argument must be a list. Line " + this.pos + ".");
  }

  /*
   * Get the values that are dynamic parameters
   */
  loop(first(this.body).body, function (each) {
    if (each.type !== 'Value') {
      throw new Error('You can not perform operations inside argument patterns. Line ' + this.pos + '.');
    }
    if (identifier.test(each.val)) {
      params.push(each.compile());
    }
  });

  /*
   * Add params into the parens.
   */
  loop(params, function (each, index) {
    if (index !== 0) {
      begin += ', '; 
    }
    begin += each;
  });

  begin += ') { ';

  /*
   * Construct the function body.
   */
  loop(rest(this.body), function (each, index) {
    if (index === this.length - 1 && each.type !== 'Variable' && each.type !== 'Reassignment') {
      anon_2 += 'return ';
    }
    anon_2 += (each.compile());
    if (last(anon_2) !== '}' || each.type === 'Variable' || each.type === 'Reassignment') {
      anon_2 += ';';
    }
  });

  /*
   * Write var statement and put it together with the rest of the function body.
   * Afterward, get rid of new lines for visual appeal.  Also, put spaces after semis
   * and cut extraneous whitespace off the beginning.
   */
  anon_1 = (writeVars('', this.scope) + ' ' + anon_2).replace(/^\s*/, ' ').replace(/\n/g, ' ').replace(/(\;)(\S)/g, '$1' + ' ' + '$2');
  begin += anon_1;

  begin += ' }';

  return begin;
}

/*
 * How to compile a 'match' call.
 * Returns a list of objects.
 * Each object has:
 * .method  -> a compiled method call
 * .pattern -> a list describing the argument pattern
 */
function match() {
  var output = [];
  loop(this.body, function (each) {
    if (each.type !== 'Method') {
      throw new Error('Match can only take method calls. Line ' + this.pos + '.');
    }
    output.push({
      "method"  : each.compile(),
      "pattern" : first(each.body).body
    });
  });
  return output;
}

/*
 * Compiles named pattern match functions
 */
function patternMatchDefinition() {
  var name    = first(this.body).compile(),
      methods = first(rest(this.body)).compile(),
      begin   = '// Define a closure to house the ' + name + ' pattern match function...\n';

  /*
   * Define callable methods...
   */
  begin += (name + ' = (function () {\n\n');
  begin += ('  // Store each possible method in the closure...\n');
  begin += ('  var ');
  loop(methods, function (each, index) {
    if (index !== 0) {
      begin += ', ';
    }
    begin += ('_method_' + (index + 1));
  });
  begin += (';\n');
  loop(methods, function (each, index) {
    begin += ('  _method_' + (index + 1) + ' = ' + each.method + ';\n');
  });
  begin += '\n';
  begin += ('  // Return the ' + name + ' function that will be callable to the user...\n');
  begin += ('  return function ' + name + '() {\n');

  /*
   * Build the callable function that matches patterns...
   */
  loop(methods, function (each, index) {
    begin += ('\n    // Test pattern ' + (index + 1) + '...\n');
    if (index === 0) {
      begin += '    if (';
    } else {
      begin += '    } else if (';
    }

    begin += ('arguments.length === ' + each.pattern.length);
    loop(each.pattern, function (item, i) {
      var compiled = item.compile();
      if (!identifier.test(compiled)) {
        begin += (' && arguments[' + i + '] === ' + compiled);
      }
    });

    begin += (') {\n');
    begin += ('      return _method_' + (index + 1) + '.apply(null, arguments);\n');

    if (index === this.length - 1) {
      begin += '    }\n';
    }
  });

  /*
   * Finish off the function construction...
   */
  begin += ('  };\n\n');
  begin += ('}())');
  
  this.scope.push(name);
  return begin;
}

/*
 * Creates an assignment expression and adds variable
 * names to parent scope.
 */
function variable() {
  var begin = '',
      vars  = [],
      vals  = [],
      that  = this,
      dot   = new RegExp(/\./),
      that  = this;

  loop(this.body, function (each, index) {
    if (index % 2 === 0) {
      if (each.type !== 'Value' || !identifier.test(each.val) || dot.test(each.val)) {
        throw new Error('Bad variable assignment. Line ' + that.pos + '.');
      }
      vars.push(each);
    } else {
      vals.push(each);
    }
  });
  loop(vars, function (each, index) {
    var compiled = each.compile();
    begin += (compiled + ' = ' + (vals[index] ? vals[index].compile() : 'undefined') + ';\n');
    that.scope.push(compiled);
  });
  return begin;
}

/*
 * Compiles a 'do' call into 
 */
function block() {
  var front = '(function () { ',
      begin = '';
  loop(this.body, function (each, index) {
    if (index === this.length - 1 && each.type !== 'Variable' && each.type !== 'Reassignment') {
      begin += 'return ';
    } else {
      begin += '';
    }
    begin += (each.compile());
    if (last(begin) !== '}' || each.type === 'Variable' || each.type === 'Reassignment') {
      begin += ';';
    }
    begin += ' ';
  });
  front = writeVars(front, this.scope);
  return front.replace(/\n/g, ' ') + begin + '}())';
}

/*
 * Forms code that exports from a module.
 */
function exportCall() {
  var build = '// Export module code...\n  (function () {\n'
  if (this.body.length < 1 || this.body.length > 2) {
    throw new Error('The export function takes only 1 or 2 arguments. Line ' + this.pos + '.');
  }
  if (this.body.length === 1) {
    build += ('    var _export = ' + this.body[0].compile() + ', _moduleName = "heathen";\n\n');
  } else {
    build += ('    var _export = ' + this.body[1].compile() + ', _moduleName = ' + this.body[0].compile() + ';\n\n');
  }
  build += ('    // AMD\n');
  build += ('    if (_HN_global.define && typeof _HN_global.define === "function" && _HN_global.define.amd) {\n');
  build += ('      _HN_global.define(_moduleName, [], _export);\n\n');
  build += ('    // Node\n');
  build += ('    } else if (module && module.exports) {\n');
  build += ('      module.exports = _export;\n\n');
  build += ('    // Browser\n');
  build += ('    } else {\n');
  build += ('      _HN_global[_moduleName] = _export;\n');
  build += ('    }\n');

  build += '  }())';
  return build;
}

/*
 * Forms code the requires code into a module.
 */
function requireCall() {
  var begin = '';
  if (this.args.length > 1) {
    throw new Error('The require function can only take 1 arguments. Line ' + this.pos + '.');
  }
  begin += (this.fn + '(' + this.args[0].compile() + ')');
  library.push('require');
  return begin;
}

/*
 * Finds a value in an array.
 */
function findInScope(val, scope) {
  var found = false;
  loop(scope, function (each) {
    if (each === val) {
      found = true;
    }
  });
  return found;
}

/*
 * Defines a basic reassignment.
 */
function basicSetter() {
  var compiled;
  if (this.body.length !== 2) {
    throw new Error('The set function must take 2 arguments. Line ' + this.pos + '.');
  }
  compiled = this.body[0].compile();
  if (!findInScope(compiled, this.scope)) {
    throw new Error('Nice try.  No global variables allowed. Line ' + this.pos + '.');
  }
  if (/\./.test(compiled)) {
    throw new Error('Map keys must be set using the setKey function. Line ' + this.pos + '.');
  }
  return compiled + ' = ' + this.body[1].compile();
}

/*
 * Redefines a key in a map.
 */
function keySetter() {
  var compiled;
  if (this.body.length !== 3) {
    throw new Error('The setKey function must take 3 arguments. Line ' + this.pos + '.');
  }
  compiled = this.body[0].compile();
  if (compiled === '_HN_global') {
    throw new Error('Nice try.  No global variables allowed. Line ' + this.pos + '.');
  }
  return compiled + '[' + this.body[1].compile() + '] = ' + this.body[2].compile();
}

/*
 * Deletes a key in a map.
 */
function keyDeleter() {
  var compiled;
  if (this.body.length !== 2) {
    throw new Error('The setKey function must take 2 arguments. Line ' + this.pos + '.');
  }
  compiled = this.body[0].compile();
  if (compiled === '_HN_global') {
    throw new Error('Nice try.  No touching global variables. Line ' + this.pos + '.');
  }
  return '(delete ' + compiled + '[' + this.body[1].compile() + ']' + ')';
}

/*
 * Determines which kind of reassignment to write.
 */
function reassignment() {
  if (this.fnName === 'set') {
    return basicSetter.call(this);
  } else if (this.fnName === 'setKey') {
    return keySetter.call(this);
  } else if (this.fnName === 'unsetKey') {
    return keyDeleter.call(this);
  }
}

/*
 * How to compile a user's class
 * function InitializerName () { ... }
 * HN.classes.create(InitializerName, { ... })
 */
function userClass() {
  var newBody = [],
      len     = this.hash.body.length,
      name    = this.name.compile(),
      extend  = (this.extend ? this.extend.compile() : null),
      upCase  = new RegExp(/^[A-Z]/),
      func    = new RegExp(/^\s*function\s*/),
      begin   = '',
      initializer,
      i;

  //console.log(this);

  if (!len) {
    throw new Error('Sorry but creating an empty class is sort of pointless. Line ' + this.pos + '.');
  }
  if (!upCase.test(name)) {
    throw new Error('Class names must begin with an uppercase letter. Line ' + this.pos + '.');
  }

  /*
   * Grab the initializer out of the class body.
   */
  for (i = 0; i < len; i += 1) {
    if (this.hash.body[i].val === 'initializer') {
      initializer = this.hash.body[i + 1];
      i += 1;
    } else {
      newBody.push(this.hash.body[i]);
    }
  }
  this.hash.body = newBody;

  begin += ('function ' + name + initializer.compile().replace(func, '') + '\n');
  begin += ('HN.classes.' + (extend ? 'extend' : 'create') + '(');
  begin += (name + ', ' + (extend ? extend + ', ' : '') + this.hash.compile() + ')');

  library.push('classes');
  return begin;
}

/*
 * Fixes variables in strings.
 */
function parseString(str) {
  var marker = new RegExp(/\#\{([^\}]+)\}/g),
      quote  = str[0];
  return str.replace(marker, quote + ' + $1 + ' + quote)
            .replace(/\n\s*/g, ' ');
}

/*
 * Parse multi-line strings
 */
function parseMultiString(str) {
  var marker = new RegExp(/\#\{([^\}]+)\}/g),
      quote  = str[0];
  return str.replace(marker, '" + $1 + "')
            .replace(/^\"\"\"(\n*)/, '"')
            .replace(/(\n*)\"\"\"/, '"')
            .replace(/\n/g, '\\n');
}

/*
 * Parse multi-line regexes
 */
function parseMultiRex(rex) {
  return rex.replace(/^\/\/\//, '/')
            .replace(/\/\/\/([gim]*)?$/, '/' + '$1')
            .replace(/(^|[^\\])\;[^\n\r\t]*/g, '$1')
            .replace(/\s*/g, '');
}

/*
 * Drops multiline strings and multiline regexes back into the code.
 */
function populateMultis(code, strings, regexes) {
  var marker = new RegExp(/\`(multistring|multiregex)\_(\d+)\`/),
      match  = code.match(marker),
      isString,
      front,
      back;

  if (match && match.index > -1) {
    front    = code.slice(0, match.index);
    back     = code.slice(match.index + match[0].length);
    isString = match[0].slice(6)[0] === 's';
    if (isString) {
      return front + parseMultiString(strings[match[2]]) + populateMultis(back, strings, regexes);
    } else {
      return front + parseMultiRex(regexes[match[2]]) + populateMultis(back, strings, regexes);
    }
  }
  return code;
}

/*
 * Drops strings and regexes back into the code.
 */
function populateStrReg(code, strings, regexes) {
  var marker = new RegExp(/\`(string|regex)\_(\d+)\`/),
      match  = code.match(marker),
      isString,
      front,
      back;

  if (match && match.index > -1) {
    front    = code.slice(0, match.index);
    back     = code.slice(match.index + match[0].length);
    isString = match[0].slice(1)[0] === 's';
    if (isString) {
      return front + parseString(strings[match[2]]) + populateStrReg(back, strings, regexes);
    } else {
      return front + regexes[match[2]] + populateStrReg(back, strings, regexes);
    }
  }
  return populateMultis(code, strings, regexes);
}

/*
 * How to create
 */
function writeLibs() {
  var i, atomList = [], begin = '  /*\n   * Library code...\n   */\n';
  begin += '  HN = _HN_global.HN || {};\n';
  begin += '  HN.atoms = HN.atoms || {};\n\n';
  loop(library, function (each) {
    var stringified = libs[each].toString();
    begin += ('  HN.' + each + ' = HN.' + each + ' || (' + stringified + '());\n');
  });
  begin += '\n';

  /*
   * Get an ordered list of unique atoms.
   */
  for (i in atoms) {
    if (Object.prototype.hasOwnProperty.call(atoms, i)) {
      atomList.push(i);
    }
  }
  if (atomList.length) {
    begin += 'HN.registerModuleAtoms(';
    loop(atomList, function (each, index) {
      if (index !== 0) {
        begin += ', ';
      }
      begin += ('"' + each + '"');
    });
    begin += ');\n';
  }
  return begin + '\n  /*\n   * Begin user-defined code...\n   */\n\n';
}

/*
 * Calls .compile() for every item in the parse tree.
 * Puts the compiled code together.
 */
function program() {
  var frontWrap = '',
      backWrap  = '\n}(this));\n',
      begin     = '',
      varStr,
      libStr;

  this.vars.push('HN');

  frontWrap += ('/*\n');
  frontWrap += (' * Code generated with Heathen ' + version + '.\n');
  frontWrap += (' * https://github.com/jgnewman/heathen\n');
  frontWrap += (' */\n\n');

  frontWrap += ('(function (_HN_global) {\n\n');

  loop(this.parseTree, function (each, index) {
    begin += ('  ' + each.compile());
    if (last(begin) !== '}' || each.type === 'Variable' || each.type === 'Reassignment') {
      begin += ';\n';
    }
    begin += '\n';
  });

  /*
   * Replace strings' and regexes' placeholders and spit the sucker
   * out.
   */
  varStr = populateStrReg(writeVars('', this.vars, true), this.strings, this.regexes) + '\n';
  libStr = writeLibs(library);
  begin  = populateStrReg(begin.replace(/\;(\s*\;)*/g, ';'), this.strings, this.regexes);

  /*
   * Add library code to the module;
   */

  return frontWrap + varStr + libStr + begin + backWrap;
}


module.exports = {
  "library"                : library,
  "version"                : version,
  "List"                   : list,
  "Hash"                   : hash,
  "Lazy"                   : lazy,
  "Flag"                   : flag,
  "Value"                  : value,
  "Operator"               : operator,
  "FunctionDefinition"     : functionDefinition,
  "PatternMatchDefinition" : patternMatchDefinition,
  "Condition"              : condition,
  "Variable"               : variable,
  "Reassignment"           : reassignment,
  "Method"                 : method,
  "Block"                  : block,
  "Match"                  : match,
  "FunctionCall"           : functionCall,
  "ComplexCall"            : complexCall,
  "Export"                 : exportCall,
  "Require"                : requireCall,
  "UserClass"              : userClass,
  "Program"                : program
};
