angular.module('ionicApp').config(function($ionicConfigProvider) {
    $ionicConfigProvider.views.transition('ios');

    $ionicConfigProvider.transitions.views.ios = function(enteringEle, leavingEle, direction, shouldAnimate) {
        //console.log('PPPP testing my animation');

        function setStyles(ele, opacity, x, boxShadowOpacity) {
            var css = {};
            css[ionic.CSS.TRANSITION_DURATION] = d.shouldAnimate ? '' : 0;
            css.opacity = opacity;
            if (boxShadowOpacity > -1) {
                css.boxShadow = '0 0 10px rgba(0,0,0,' + (d.shouldAnimate ? boxShadowOpacity * 0.45 : 0.3) + ')';
            }
            // animate over y axis
            css[ionic.CSS.TRANSFORM] = 'translate3d(0,' + x + '%,0)';
            // ORIGINAL VERSION css[ionic.CSS.TRANSFORM] = 'translate3d(' + x + '%,0,0)';
            ionic.DomUtil.cachedStyles(ele, css);
        }

        var d = {
            run: function(step) {
                if (direction == 'forward') {
                    setStyles(enteringEle, 1, (1 - step) * 99, 1 - step); // starting at 98% prevents a flicker
                    setStyles(leavingEle, (1 - 0.1 * step), step * -33, -1);

                } else if (direction == 'back') {
                    setStyles(enteringEle, (1 - 0.1 * (1 - step)), (1 - step) * -33, -1);
                    setStyles(leavingEle, 1, step * 100, 1 - step);

                } else {
                    // swap, enter, exit
                    setStyles(enteringEle, 1, 0, -1);
                    setStyles(leavingEle, 0, 0, -1);
                }
            },
            shouldAnimate: shouldAnimate && (direction == 'forward' || direction == 'back')
        };

        return d;
    };
});
