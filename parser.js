/*
 * Name: parser.js
 * Description: Parses S Expressions into a tree
 */


var techs = require('./compiletechniques'),
    codeStrings,
    codeRegexes;

/*
 * Returns the first item of data.
 */
function first(data) {
  return data[0];
}

/*
 * Returns all but the first item of data.
 */
function rest(data) {
  return data.slice(1);
}

/*
 * Returns all but the last item of data.
 */
function lead(data) {
  return data.slice(0, data.length - 1);
}

/*
 * Removes whitespace from the front and back of a string.
 */
function trim(str) {
  return str.replace(/^\s*/, '').replace(/\s*$/, '');
}

/*
 * Takes a string of code and the position of a starting paren.
 * Grabs a piece of the string up through the corresponding
 * closing paren;
 */
function getList(code, start) {
  var i, len = code.length, output = '', count = 0, char;
  for (i = start; i < len; i += 1) {
    char = code[i];
    if (char === '(') {
      count += 1;
    } else if (char === ')') {
      count -= 1;
    }
    output += char;
    if (count === 0) {
      break;
    }
  }
  return output;
}

function getNextItem(code, start) {
  return code.slice(start, code.search(/\s|$/));
}

/*
 * Turns `line_4` into 4.
 */
function parseLineNo(marker) {
  return marker.match(/\d+/)[0];
}

/*
 * Turns (a b c) into: a b c
 */
function unwrap(list) {
  return trim(lead(rest(list)));
}

/*
 * Returns true if data is an array.
 */
function isArray(data) {
  return lead(Object.prototype.toString.call(data).toLowerCase().slice(8)) === 'array';
}

/*
 * Returns true if an array contains an instance
 * of something like -flag
 */
function containsFlag(arr) {
  var len = arr.length, i;
  for (i = 0; i < len; i += 1) {
    if (arr[i].length > 1 && arr[i][0] === '-') {
      return true;
    }
  }
  return false;
}

/*
 * Takes arrayified code and turns the items into parseable objects.
 */
function buildTree(arr, lineNo, parentScope) {
  var tree = [],
      len = arr.length,
      curLine = lineNo || 0,
      lineMarker = new RegExp(/\`line\_\d+\`/),
      item,
      i;

  for (i = 0; i < len; i += 1) {
    item = arr[i];

    /*
     * If the item is a list, determine what kind.
     */
    if (isArray(item)) {

      /*
       * Don't accidentally consider a line marker a real item.
       * Track the line, rip the marker out of the list, and
       * try the list again.
       */
      if (lineMarker.test(first(item))) {
        curLine = parseLineNo(first(item));
        arr[i] = rest(item);
        i -= 1;

      } else {

        switch (first(item)) {

          case '+':
            tree.push(new Operator(first(item), rest(item), curLine, parentScope));
            break;

          case '-':
            tree.push(new Operator(first(item), rest(item), curLine, parentScope));
            break;

          case '*':
            tree.push(new Operator(first(item), rest(item), curLine, parentScope));
            break;

          case '/':
            tree.push(new Operator(first(item), rest(item), curLine, parentScope));
            break;

          case '++':
            tree.push(new Operator(first(item), rest(item), curLine, parentScope));
            break;

          case '--':
            tree.push(new Operator(first(item), rest(item), curLine, parentScope));
            break;

          case '%':
            tree.push(new Operator(first(item), rest(item), curLine, parentScope));
            break;

          case '+=':
            tree.push(new Operator(first(item), rest(item), curLine, parentScope));
            break;

          case '-=':
            tree.push(new Operator(first(item), rest(item), curLine, parentScope));
            break;

          case '*=':
            tree.push(new Operator(first(item), rest(item), curLine, parentScope));
            break;

          case '/=':
            tree.push(new Operator(first(item), rest(item), curLine, parentScope));
            break;

          case '%=':
            tree.push(new Operator(first(item), rest(item), curLine, parentScope));
            break;

          case '&&=':
            tree.push(new Operator(first(item), rest(item), curLine, parentScope));
            break;

          case '>>=':
            tree.push(new Operator(first(item), rest(item), curLine, parentScope));
            break;

          case '<':
            tree.push(new Operator(first(item), rest(item), curLine, parentScope));
            break;

          case '>':
            tree.push(new Operator(first(item), rest(item), curLine, parentScope));
            break;

          case '<=':
            tree.push(new Operator(first(item), rest(item), curLine, parentScope));
            break;

          case '>=':
            tree.push(new Operator(first(item), rest(item), curLine, parentScope));
            break;

          case '=':
            tree.push(new Operator(first(item), rest(item), curLine, parentScope));
            break;

          case '!=':
            tree.push(new Operator(first(item), rest(item), curLine, parentScope));
            break;

          case 'fn':
            tree.push(new FunctionDefinition(rest(item), curLine, parentScope));
            break;

          case 'if':
            tree.push(new Condition(rest(item), curLine, parentScope));
            break;

          case 'let':
            tree.push(new Variable(rest(item), curLine, parentScope));
            break;

          case 'set':
            tree.push(new Reassignment(rest(item), curLine, parentScope));
            break;

          case 'method':
            tree.push(new Method(rest(item), curLine, parentScope));
            break;

          default:
            if (containsFlag(rest(item))) {
              tree.push(new ComplexCall(first(item), rest(item), curLine, parentScope));
            } else {
              tree.push(new FunctionCall(first(item), rest(item), curLine, parentScope));
            }
            break;
        }

      }
    
    } else if (lineMarker.test(item)) {
      curLine = parseLineNo(item);

    } else {
      if (first(item) === '-' && item.length > 1) {
        tree.push(new Flag(item));
      } else {
        tree.push(new Value(item));
      }
    }
  }

  return tree;
}

/*
 * Loop over list strings and generate arrays.
 */
function parse(code, container) {
  var item;
  code = trim(code);

  if (!code) {
    return container;
  }
  
  if (first(code) === '(') {
    item = getList(code, 0);
    container.push(parse(unwrap(item), []))
    return parse(code.slice(item.length), container);
  
  } else {
    item = getNextItem(code, 0);
    container.push(item);
    return parse(code.slice(item.length), container);
  }
}

/*
 * Takes a list that may include lazy markers
 * and lazifies the appropriate values.
 */
function lazify(fromArr) {
  var len = fromArr.length,
      output = [],
      i;

  for (i = 0; i < len; i += 1) {
    if (fromArr[i].val === '`lazy`') {
      output.push(new Lazy(fromArr[i + 1]));
      i += 1;
    } else {
      output.push(fromArr[i]);
    }
  }

  return output;
}


function Lazy(obj) {
  this.val = obj;
}
Lazy.prototype = {"compile" : techs.Lazy};

function Flag(item, lineNo) {
  this.type = 'Flag';
  this.val  = item;
  this.pos  = lineNo;
}
Flag.prototype = {"compile" : techs.Flag};

function Value(item, lineNo) {
  this.type = 'Value';
  this.val  = item;
  this.pos  = lineNo;
}
Value.prototype = {"compile" : techs.Value};

function Operator(car, cdr, lineNo, parentScope) {
  this.type = 'Operator';
  this.fn   = car;
  this.args = lazify(buildTree(cdr, lineNo, parentScope));
  this.pos  = lineNo;
}
Operator.prototype = {"compile" : techs.Operator};

function PatternMatchDefinition(preLaziedBody, vars, lineNo, parentScope) {
  this.vars  = vars;
  this.scope = parentScope;
  this.type  = 'PatternMatchDefinition';
  this.body  = preLaziedBody;
  this.pos   = lineNo;
}
PatternMatchDefinition.prototype = {"compile" : techs.PatternMatchDefinition};

function FunctionDefinition(cdr, lineNo, parentScope) {
  var vars = [],
      body = lazify(buildTree(cdr, lineNo, vars, parentScope)),
      firstItem = body[0]  || {},
      secondItem = body[1] || {},
      allowedPattern = false,
      patternMatch = false;

  // Allowed patterns are as follows:
  // NAME, PARAMCALL, ...
  if (firstItem.type === 'Value' && secondItem.type === 'FunctionCall' && secondItem.fn[0].val === 'param') {
    allowedPattern = 'NameParam';
  
  // NAME, MATCHCALL, ...
  } else if (firstItem.type === 'Value' && secondItem.type === 'FunctionCall' && secondItem.fn[0].val === 'match') {
    allowedPattern = true;
    patternMatch = true;
  
  // PARAMCALL, ...
  } else if (firstItem.type === 'FunctionCall' && firstItem.fn[0].val === 'param') {
    allowedPattern = 'Param';
  }

  if (!allowedPattern) {
    throw new Error('Invalid function form. Line ' + lineNo + '.');
  }

  if (patternMatch) {
    return new PatternMatchDefinition(body, vars, lineNo);
  }

  this.vars    = vars;
  this.scope   = parentScope;
  this.type    = 'FunctionDefinition';
  this.body    = body;
  this.pattern = allowedPattern;
  this.pos     = lineNo;
}
FunctionDefinition.prototype = {"compile" : techs.FunctionDefinition};

function Condition(cdr, lineNo, parentScope) {
  this.type = 'Condition';
  this.body = lazify(buildTree(cdr, lineNo, parentScope));
  this.pos  = lineNo;
}
Condition.prototype = {"compile" : techs.Condition};

function Variable(cdr, lineNo, parentScope) {
  this.type = 'Variable';
  this.body = lazify(buildTree(cdr, lineNo, parentScope));
  this.pos  = lineNo;
}
Variable.prototype = {"compile" : techs.Variable};

function Reassignment(cdr, lineNo, parentScope) {
  this.type = 'Reassignment';
  this.body = lazify(buildTree(cdr, lineNo, parentScope));
  this.pos  = lineNo; 
}
Reassignment.prototype = {"compile" : techs.Reassignment};

function Method(cdr, lineNo, parentScope) {
  this.type = 'Method';
  this.body = lazify(buildTree(cdr, lineNo, parentScope));
  this.pos  = lineNo;
}
Method.prototype = {"compile" : techs.Method};

function FunctionCall(car, cdr, lineNo, parentScope) {
  this.type  = 'FunctionCall';
  this.scope = parentScope;
  this.fn    = lazify(buildTree([car], lineNo, parentScope));
  this.args  = lazify(buildTree(cdr, lineNo, parentScope));
  this.pos   = lineNo;
}
FunctionCall.prototype = {"compile" : techs.FunctionCall};

function ComplexCall(car, cdr, lineNo, parentScope) {
  this.type  = 'FunctionCall';
  this.scope = parentScope;
  this.fn    = lazify(buildTree([car], lineNo, parentScope));
  this.args  = lazify(buildTree(cdr, lineNo, parentScope));
  this.pos   = lineNo;
}
ComplexCall.prototype = {"compile" : techs.ComplexCall};

function Program(parseTree, scope) {
  this.vars = scope;
  this.parseTree = lazify(parseTree, null, this.vars);
}
Program.prototype = {"compile" : techs.Program};

/*
 * Specify functionality to be exported...
 */
module.exports = {
  "parse" : function (code, strings, regexes) {
    var codeList, parseTree, compiledCode, initialScope;
    codeStrings  = strings;
    codeRegexes  = regexes;
    initialScope = [];

    codeList     = parse(code, []);
    parseTree    = lazify(buildTree(codeList, null, initialScope));
    compiledCode = (new Program(parseTree, initialScope)).compile();

    return compiledCode;
  }
};

