/*
 * Code generated with Heathen 0.0.1.
 * https://github.com/jgnewman/heathen
 */

(function(_HN_global) {

    var HN, bobby;

    /*
     * Library code...
     */
    HN = _HN_global.HN || {};
    HN.atoms = HN.atoms || {};

    HN.classes = HN.classes || (function() {
        return (function() {

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
                    "parent": parentConstr,
                    "constr": constr,
                    "proto": proto,
                    "supers": supers
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
                "_getPrototype": function() {
                    return classes[this._constructor.name].proto;
                },

                /*
                 * Where:
                 * funcName - the name of the function that overwrote a super method
                 * all other arguments - arguments intended to be passed to the super method
                 *
                 * Calls the super method of funcName and passes it all the other arguments.
                 */
                "_super": function(funcName /*, further arguments */ ) {
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
                "create": function(constr, mixins) {
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
                "extend": function(constr, parentClass, mixins) {
                    extendClass(parentClass, constr, mixins);
                    return constr;
                }
            };
        }());
    }());


    /*
     * Begin user-defined code...
     */

    function Person(name) {
        this['name'] = name;
    }
    HN.classes.create(Person, {
        "getName": function() {
            return this.name;
        }
    });

    function Kid(name) {
        this['name'] = name;
    }
    HN.classes.extend(Kid, Person, {
        "getName": function() {
            console.log('here');
            return this._super('getName');
        }
    });

    bobby = new Kid('bobby');

    console.log(bobby.getName());


}(this));