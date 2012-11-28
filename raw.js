/*
 * Code generated with Heathen 0.0.1.
 * https://github.com/jgnewman/heathen
 */

(function(_HN_global) {

    var HN;

    /*
     * Library code...
     */
    HN = _HN_global.HN || {};
    HN.atoms = HN.atoms || {};

    HN.methodChain = HN.methodChain || (function() {
        return function() {
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
    }());


    /*
     * Begin user-defined code...
     */
    $(function() {
        return (function() {
            return HN.methodChain(function() {
                return $('#box');
            }, function() {
                return this.fadeOut('fast');
            });
        }());
    });


}(this));