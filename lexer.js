/*
 * Name: lexer.js
 * Description: Lex code into S Expressions
 */


var whiteSpace = new RegExp(/\s/),
    opener     = new RegExp(/\(\[\{/),
    closer     = new RegExp(/\)\]\}/),
    rexEnder   = new RegExp(/\/[gim]*/),
    mrexEnder  = new RegExp(/\/\/\/[gim]*/),
    strings    = {},
    regexes    = {};


/*
 * A functional .map alternative.  Allows you to:
 * - exclude an item from the new list by returning comp.exclude
 * - kill the iteration early by returning comp.kill
 * - manually move the iteration forward more spaces by
 *   returning comp.skip(number, valueToReturn)
 */
function comp(data, fun) {
  var l = data.length, i, val, result = [];
  for (i = 0; i < data.length; i += 1) {
    val = fun.call(data, data[i], i);
    if (val === comp.kill) {
      return result;
    } else if (val.check === comp.check) {
      i += val.num;
      result.push(val.val);
    } else if (val !== comp.exclude) {
      result.push(val);
    }
  }
  return result;
}
comp.exclude = {};
comp.kill = {};
comp.check = {};
comp.skip = function (num, val) {
  return {
    "num"   : num,
    "val"   : val,
    "check" : comp.check
  };
};

/*
 * Removes all syntax sugar and returns pure S expressions.
 */
function lex(code) {
  var counter  = 0,
      newlines = 1,
      buildStr = '',
      buildRex = '',
      newCount,
      output,
      inRex,
      inStr,
      inCom,
      inPar;

  /*
   * Loop over each character in the raw code
   */
  output = comp(code, function (char, index) {
    var nextChar = this[index + 1],
        charx2   = this[index + 2],
        prevChar = this[index - 1],
        charm2   = this[index - 2];

    /*
     * What to do if we're not in the middle of a string, comment, or regular expression
     */
    if (!inRex && !inStr && !inCom) {
      switch (char) {

        /*
         * ; Begin a comment
         */
        case ';':
          inCom = (nextChar === '*') ? 'multi' : 'single';
          return comp.exclude;

        /*
         * " Begin a double quote string or multi line string.
         * Begin storing the string so we don't have to deal with it when we parse.
         */
        case '"':
          newCount = (counter += 1);

          if (nextChar === '"' && charx2 === '"') {
            inStr = 'multi';
            strings[newCount] = '';
            strings[newCount] += '"""';
            return comp.skip(2, '`multistring_' + newCount + '`');

          } else {
            inStr = 'double';
            strings[newCount] = '';
            strings[newCount] += char;
            return '`string_' + newCount + '`';
          }

        /*
         * ' Begin a single quote string.
         * Begin storing the string so we don't have to deal with it when we parse.
         */
        case "'":
          newCount = (counter += 1);
          inStr = 'single';
          strings[newCount] = '';
          strings[newCount] += char;
          return '`string_' + newCount + '`';

        /*
         * / Begin a regex
         */
        case '/':
          newCount = (counter += 1);

          if ((whiteSpace.test(prevChar) || opener.test(prevChar)) && (!whiteSpace.test(nextChar) && nextChar !== '/')) {
            inRex = 'basic';
            regexes[newCount] = '';
            regexes[newCount] += char;
            return '`regex_' + newCount + '`';
          
          } else if (nextChar === '/' && charx2 === '/') {
            inRex = 'multi';
            regexes[newCount] = '';
            regexes[newCount] += '///';
            return comp.skip(2, '`multiregex_' + newCount + '`');
          
          } else {
            return char;
          }

        /*
         * { Remove hash map sugar
         */
        case '{':
          return '( hash ';
        case '}':
          return ' )';

        /*
         * [ Remove list sugar
         */
        case '[':
          return '( list ';
        case ']':
          return ' )';

        /*
         * | Remove param list sugar
         */
        case '|':
          if (!inPar) {
            inPar = true;
            return '( param ';
          } else {
            inPar = false;
            return ' )';
          }

        /*
         * ( Put whitespace around parens
         */
        case '(':
          return '( ';
        case ')':
          return ' )';

        /*
         * \n Track new lines
         */
        case '\n':
          return char + '`line_' + (newlines += 1) + '` ';

        /*
         * Lazify values
         */
        case ':':
          return '`lazy` ';

        /*
         * Return the character in the default case
         */
        default:
          return char;
      }

    /*
     * What to do if we ARE in the middle of a string, comment, or regular expression
     */
    } else {

      /*
       * If we're inside a comment
       */
      if (inCom) {
        switch (char) {

          /*
           * If we hit a new line, track that.
           */
          case '\n':
            if (inCom === 'single') {
              inCom = false;
            }
            return char + '`line_' + (newlines += 1) + '` ';

          /*
           * If we're in a mutli comment and we hit a *;, end the comment.
           */
          case ';':
            if (inCom === 'multi' && prevChar === '*') {
              inCom = false;
            }
            return comp.exclude;

          /*
           * Default behavior is to ignore the character.
           */
          default:
            return comp.exclude;
        }

      /*
       * If we're inside a string
       */
      } else if (inStr) {
        switch (char) {

          /*
           * ' End single quote strings.
           */
          case "'":
            if (inStr === 'single') {
              strings[newCount] += char;
              inStr = false;
            }
            return comp.exclude;

          /*
           * " End double quote and multi line strings.
           */
          case '"':
            if (inStr === 'double') {
              inStr = false;
            } else if (inStr === 'multi' && prevChar === '"' && charm2 === '"' && nextChar !== '"') {
              inStr = false;
            }
            strings[newCount] += char;
            return comp.exclude;

          /*
           * Default behavior is to continue building the current string
           * in the storage place and ignore the character in the output.
           */
          default:
            strings[newCount] += char;
            return comp.exclude;
        }
      
      /*
       * If we're inside a regex
       */
      } else if (inRex) {
        switch (char) {

          case '/':
            if (inRex === 'basic') {

              /*
               * If we're in a basic regex, we can end the expression
               * if we hit /(SPACE or CLOSER)
               */
              if (whiteSpace.test(nextChar) || closer.test(nextChar)) {
                regexes[newCount] += char;
                inRex = false;
                return comp.exclude;
              } else {
                return comp.exclude;
              }

            } else {

              /*
               * If we're in a multi line regex, we can end the expression
               * if we hit ///(SPACE or CLOSER)
               */
              if (prevChar === '/' && charm2 === '/' && (whiteSpace.test(nextChar) || closer.test(nextChar))) {
                regexes[newCount] += char;
                inRex = false;
                return comp.exclude;
              } else {
                return comp.exclude;
              }
            }

          case '\n':
            return char + '`line_' + (newlines += 1) + '` ';

          default:

            /*
             * How to end a regex if we have flags on the end.
             */
            if (char === 'g' || char === 'i' || char === 'm') {
              if (inRex === 'basic') {
                if ((whiteSpace.test(nextChar) || (closer.test(nextChar) && whiteSpace.test(charx2))) 
                    && rexEnder.test(this.slice(0, index))) {
                  regexes[newCount] += char;
                  inRex = false;
                  return comp.exclude;
                } else {
                  regexes[newCount] += char;
                  return comp.exclude;
                }
              
              } else {
                if ((whiteSpace.test(nextChar) || (closer.test(nextChar) && whiteSpace.test(charx2)))
                    && mrexEnder.test(this.slice(0, index))) {
                  regexes[newCount] += char;
                  inRex = false;
                  return comp.exclude;
                } else {
                  regexes[newCount] += char;
                  return comp.exclude;
                }
              }

            /*
             * Default behavior is to continue building the current expression
             * in the storage place and ignore the character in the output.
             */
            } else {
              regexes[newCount] += char;
              return comp.exclude;
            }
        }

      }

    }
  }).join('');

  return {
    "code"    : output,
    "strings" : strings,
    "regexes" : regexes
  };
}

/*
 * Specify functionality to be exported...
 */
module.exports = {
  "lex" : lex
};

