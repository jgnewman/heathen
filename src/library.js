/*
 * Name: library.js
 * Description: Library code to possibly be included in compiled output.
 */

/*
 * Because these methods get stringified upon compilation, and some could
 * possibly be immediate closures that return objects, each exportable library
 * method should be wrapped in a function that returns its value.  Then
 * when compiled, those functions will be wrapped in invocation syntax.  This
 * way we don't end up with and instances of '[object Object]' in the compiled
 * code.
 */

module.exports = {

  "registerModuleAtoms" : function () {
    return function (/* arguments */) {
      /*
       * Add atoms to the global collection of atoms.
       * Make sure not to overwrite them with new values.
       */

      var len = arguments.length, i;
      for (i = 0; i < len; i += 1) {
        HN.atoms[arguments[i]] = HN.atoms[arguments[i]] || {};
      }
    };
  },

  "monadChain" : function () {
    return function (bind) {
      return {

        /*
         * Define the 'pass' function.
         * Where:
         * mval - the value to be passed along the monadic chain
         *      - should already be wrapped by return
         *
         * Returns an object with the method 'to' wherein you
         * can specify the functions that will become
         * members of the invocation chain.  Invoking 'to' will
         * initialize the monadic invocation chain.
         */
        "pass" : function (mval) {
          return {
            /*
             * Where:
             * arguments - functions that will be part of the monad call
             */
            "to" : function () {
              /*
               * Grab the functions and wrap our initial value from
               * .pass in the return function.
               */
              var functions = arguments,
                  output = mval,
                  len = functions.length,
                  i;
              /*
               * Loop over each argument function.  For each one,
               * bind it to output then wrap that with return.
               */
              for (i = 0; i < len; i += 1) {
                output = bind(output, functions[i]);
              }
              /*
               * Finally, return the output.
               */
              return output;
            }
          };
        }
      };
    };
  },

  "methodChain" : function () {
    return function () {
      /*
       * (&&= ($ 'selector') (fadeOut 'fast') (fadeIn 'slow'))
       * Since this is a special form, each argument needs to come in
       * wrapped in a function that returns the call.
       *
       * function () {return $('selector')}
       * function () {return this.fadeOut('fast')}
       * function () {return this.fadeIn('slow')}
       */
      var result = arguments[0](),
          len = arguments.length,
          i;
      /*
       * Make each call in the context of the last.
       */
      for (i = 1; i < len; i += 1) {
        result = arguments[i].call(result);
      }
      return result;
    };
  },

  "bashCall" : function () {
    return function (funcName, hash) {
      /*
       * Allows you to specify which arguments you are declaring with
       * bash style option flags.
       */
      var argArray = [], i;
      for (i in hash) {
        if (Object.prototype.hasOwnProperty.call(hash, i)) {
          argArray[funcName._paramPositions[i]] = hash[i];
        }
      }
      return funcName.apply(null, argArray);
    };
  },

  "require" : function () {
    return function (str) {
      /*
       * Code to bring code from outside a module into the module.
       * Note: if you are using require.js, make a 'requirejs()' call instead.
       */

      // Node
      if (_HN_global.process && _HN_global.process.title === 'node') {
        return require(str);
      
      // Browser
      } else {
        return _HN_global[str];
      }
    };
  },

  /*
   * The module for making extensible classes.
   */
  "classes" : function () {
    return (function () {

      /*
       * Create a place to make data about each user-created class accessible.
       */
      var classes = {};

      /*
       * Where:
       * obj  - any keyed object
       * prop - the name of a property that might be contained in obj
       *
       * A shortcut for the Object.prototype.hasOwnProperty check
       */
      function hasProp(obj, prop) {
        return Object.prototype.hasOwnProperty.call(obj, prop);
      }

      /*
       * Where:
       * parentConstr - a constructor function for the parent class
       * constr       - a constructor function for the class in question
       * proto        - the object serving as constr's prototype
       * supers       - an object containing references to all of the class's super methods
       *                (returned by buildProto())
       *
       * Creates a reference to the constr class in the classes object.
       * Most importantly, this creates retrievable associations between a
       * constructor, its prototype, and its supers.
       */
      function createProtoAssoc(parentConstr, constr, proto, supers) {
        classes[constr.name] = {
          "parent" : parentConstr,
          "constr" : constr,
          "proto"  : proto,
          "supers" : supers
        };
      }

      /*
       * Where:
       * parentConstr - a constructor function for the parent class
       * constr       - a constructor function for the class in question
       * proto        - an obect intended to become constr's prototype
       * supers       - an object containing references to all of the class's super methods
       *                (returned by buildProto())
       *
       * Attaches the proto object to constr as its prototype.
       * Calls createProtoAssoc() to store information about this new
       * class in the classes object.
       */
      function bindProto(parentConstr, constr, proto, supers) {
        constr.prototype = proto;
        createProtoAssoc(parentConstr, constr, proto, supers);
      }

      /*
       * Where:
       * parentProto - an object, the prototype to be copied
       * childProto  - an object, the new prototype to be populated
       * childClass  - a constructor function intended to be attached to childProto
       *
       * Copies properties from parentProto into childProto and makes
       * references to super methods.  Gives the prototype the proper
       * _constructor property. Returns an object referencing the
       * super methods.
       */
      function buildProto(parentProto, childProto, childClass) {
        var i, supers = {};

        /*
         * Iterate over the properties of the parent prototype
         */
        for (i in parentProto) {
          if (hasProp(parentProto, i)) {

            /*
             * If the property already exists in the child, the child
             * property should take precedence.  However, if the property
             * happens to be a function, then the parent property should
             * become a super method.
             */
            if (hasProp(childProto, i)) {
              if (typeof childProto[i] === 'function' && typeof parentProto[i] === 'function') {
                supers[i] = parentProto[i];
              }

            /*
             * Copy all other unique properties from the parent into the child.
             */
            } else {
              childProto[i] = parentProto[i];
            }
          }
        }

        /*
         * Properly overwrite the _constructor property.
         */
        childProto._constructor = childClass;

        /*
         * Return the supers object so it can be properly associated
         * with the new class and its prototype.
         */
        return supers;
      }

      /*
       * Where:
       * parentClass - a constructor function; the class to be extended
       * childClass  - a constructor function; intended to become a subclass of childClass
       * mixins      - an object; specific properties to be applied to the new subclass
       *
       * Causes parent > child relationship between two constructors and defines
       * prototypal properties for the child class. For example:
       *
       *     extendClass(Cat, Kitten, {
       *       "furType" : "soft",
       *       "size"    : "small"
       *     });
       */
      function extendClass(parentClass, childClass, mixins) {
        /*
         * Retrieve parentClass' prototype from the classes object
         */
        var parentProto = classes[parentClass.name].proto,

            /*
             * If we have mixins, they become the basis for childClass' prototype.
             * If we don't, we'll start with an empty object.
             */
            childProto = mixins || {},

            /*
             * Copy properties from the parent prototype into the child prototype
             * and gather up any super methods in the transaction.
             */
            supers = buildProto(parentProto, childProto, childClass);

        /*
         * Attach the new prototype to the child class and make the necessary
         * associations in the classes object.
         */
        bindProto(parentClass, childClass, childProto, supers);
      }

      /*
       * Where:
       * constr - a constructor function
       * arr    - an array to be populated with constructors of
       *          an object's inheritance lineage
       *
       * Recursively populates an array with constructor functions
       * in an object's inheritance lineage.
       */
      function calculateLineage(constr, arr) {
        /*
         * Stuff the constructor into the front of the array.
         */
        arr.unshift(constr);

        /*
         * If the constructor is a classerize class, recurse
         * using the constructor's parent as found in the
         * classes object and the array.
         */
        if (classes[constr.name]) {
          return calculateLineage(classes[constr.name].parent, arr);
        }

        /*
         * If the constructor is not a classerize class, as
         * in the case of Object, we have reached the beginning
         * of the inheritance chain and can return the array.
         */
        return arr;
      }

      /*
       * All user-created classes should be extensions of the Class
       * constructor. This will ensure that they all share some common
       * prototypal properties such as the ability to retrieve the
       * prototype object in a cross-browser compatible way, and the
       * ability to call super methods of methods.
       */
      function Class() {}

      /*
       * Bind some methods as a prototype for the Class constructor.
       * Specify that the parent of Class is Object.
       */
      bindProto(Object, Class, {

        /*
         * Returns an object's prototype. Works in all JS environments.
         */
        "_getPrototype" : function () {
          return classes[this._constructor.name].proto;
        },

        /*
         * Where:
         * funcName - the name of the function that overwrote a super method
         * all other arguments - arguments intended to be passed to the super method
         *
         * Calls the super method of funcName and passes it all the other arguments.
         */
        "_super" : function (funcName /*, further arguments */) {
          return classes[this._constructor.name].supers[funcName].apply(this, Array.prototype.slice.call(arguments, 1));
        }

      }, Object);

      return {
        /* Where:
         * mixins - an object intended to be a new class' prototype
         *
         * Creates a new class. For example:
         *
         *     function Cat(name) {
         *       this.name = name;
         *     }
         *
         *     HN.classes.create(Cat, {
         *       "playWithYarn" : function () {...},
         *       "purr"         : function () {...},
         *       "scratch"      : function () {...}
         *     });
         */
        "create" : function (constr, mixins) {
          extendClass(Class, constr, mixins);
          return constr;
        },

        /*
         * Where:
         * parentClass - a constructor function; the class to be extended
         * mixins      - an object intended to be a new subclass' prototype
         *
         * Creates a new class that extends another class.  For example:
         *
         *     function Kitten(name) {
         *       this.name = name;
         *     }
         *
         *     HN.clases.extend(Kitten, Cat, {
         *       "beCute" : function () {...},
         *       "mew"    : function () {...}
         *     });
         */
        "extend" : function (constr, parentClass, mixins) {
          extendClass(parentClass, constr, mixins);
          return constr;
        }
      };
    }());
  }

}
