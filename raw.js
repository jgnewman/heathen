/*
 * Code generated with Heathen 0.0.1.
 * https://github.com/jgnewman/heathen
 */

(function(_HN_global) {

    var HN, x, result;

    /*
     * Library code...
     */
    HN = _HN_global.HN || {};
    HN.atoms = HN.atoms || {};

    HN.chart = HN.chart || (function() {
        function chart(config, fn) {
            /*
             * Calls fn once per each iteration as specified by config
             * where config is a collection, a range, or a function returning
             * a truthy/falsy value.
             *
             * Builds a new array.
             */
            var accum = {},
                len, val, i;

            /*
             * If config is a function:
             */
            if (typeof config === 'function') {
                len = config();
                while (len) {
                    val = fn.call(config, len);
                    if (val === chart.die) {
                        break;
                    }
                    if (val !== chart.exclude) {
                        accum[val[0]] = val[1];
                    }
                    len = config();
                }
                return accum;

                /*
                 * If config is an array:
                 */
            } else if (Object.prototype.toString.call(config) === '[object Array]') {
                len = config.length;
                for (i = 0; i < len; i += 1) {
                    val = fn.call(config, config[i], i);
                    if (val === chart.die) {
                        break;
                    }
                    if (val !== chart.exclude) {
                        accum[val[0]] = val[1];
                    }
                }
                return accum;

                /*
                 * If config is any other kind of object:
                 */
            } else if (typeof config === 'object') {
                for (i in config) {
                    if (Object.prototype.hasOwnProperty.call(config, i)) {
                        val = fn.call(config, config[i], i);
                        if (val === chart.die) {
                            break;
                        }
                        if (val !== chart.exclude) {
                            accum[val[0]] = val[1];
                        }
                    }
                }
                return accum;

            } else {
                throw new Error('You can not use chart to iterate over an object like ' + config + '.');
            }

        }
        chart.exclude = {};
        chart.die = {};
        return chart;
    }());


    /*
     * Begin user-defined code...
     */

    x = 0;

    result = HN.chart([1, 2, 3, 4, 5], function(val, key) {
        console.log(val, key);
        return [('key' + val), (val * 10)];
    });

    console.log(result);


}(this));