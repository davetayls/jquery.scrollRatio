/**
* @author Dave Taylor
* @url http://the-taylors.org
*/
/*global window */
(function ($) {

    var $window = $(window),
        windowHeight = 768, //$window.height(),
        windowHalfHeight = windowHeight / 2,

        EVENTS = {
            POSITION_CHANGED: 'onPositionChanged'
        },
        MOVEMENTS = {
            POSITION: 'pos',
            BACKGROUND: 'bg'
        },
        DEFAULT_SETTINGS = {
            ratio: 1,
            movement: MOVEMENTS.POSITION,
            nudgedTop: null
        };


    /* Object holding original */
    var OriginalValues = function ($element) {
        this.bgLeft = parseInt($element.css('background-position-x'), 10);
        this.bgTop = parseInt($element.css('background-position-y'), 10);
        this.top = $element.position().top;
        this.offsetTop = $element.offset().top;
        this.beginScrollTop = this.offsetTop - windowHeight < 0 ? 0 : this.offsetTop - windowHeight;
    };

    /* positioning helpers */
    var getPositionAtScroll = function (top, scrollOffset, ratio) {
        return top + (scrollOffset * (ratio - 1));
    };
    // nudge so it scrolls in to correct place
    var getNudgedTop = function (offsetTop, beginScrollTop, top, ratio) {
        var newTop,
            topAtCenter = getPositionAtScroll(top, windowHalfHeight, ratio),
            amountScrolledAtCenter = top - topAtCenter;

        newTop = offsetTop < windowHeight ? top : top + amountScrolledAtCenter;
        return newTop;
    };

    /* element positioning */
    var rePosition = function () {
        var scrollTop = $window.scrollTop();
        $.scrollRatio.positionChanged(scrollTop);
    };
    var setBackgroundPosition = function ($element, originalBgLeft, originalBgTop, scrollOffset, ratio) {
        var backgroundTop = getPositionAtScroll(originalBgTop, scrollOffset, ratio);
        $element.css({ 'background-position': originalBgLeft + 'px ' + backgroundTop + 'px' });
    };
    var setAbsPosition = function ($element, top, scrollOffset, ratio) {
        var newTop = getPositionAtScroll(top, scrollOffset, ratio);
        $element.css({ top: newTop });
    };
    var setPosition = function ($element, elementSettings, scrollTop) {
        var offsetScrollTop;

        // we don't want to start scrolling until we're near
        if (scrollTop < elementSettings.original.beginScrollTop) { return; }

        // get the amount of scroll relative to where we want to start scrolling from
        offsetScrollTop = scrollTop - elementSettings.original.beginScrollTop;

        if (elementSettings.movement === MOVEMENTS.BACKGROUND) {
            setBackgroundPosition($element, elementSettings.original.bgLeft, elementSettings.original.bgTop, offsetScrollTop, elementSettings.ratio);
        } else {
            setAbsPosition($element, elementSettings.nudgedTop, offsetScrollTop, elementSettings.ratio);
        }
    };


    /* set global static properties */
    var scrollRatio = $.scrollRatio = {

        /*  bind a function or trigger the positionChanged event
        which is triggered on each scroll with the calculated properties */
        positionChanged: function (fn) {
            if (typeof fn === 'function') {
                $(scrollRatio).bind(EVENTS.POSITION_CHANGED, fn);
            } else {
                $(scrollRatio).trigger(EVENTS.POSITION_CHANGED, [arguments[0]]);
            }
        }
    };

    // set calculated nudged top values so item scrolls to desired location at correct point
    var calculateNudgedTop = function ($elem, thisSettings) {
        if (thisSettings.movement === MOVEMENTS.BACKGROUND) {
            thisSettings.nudgedTop = thisSettings.nudgedTop || getNudgedTop(thisSettings.original.offsetTop, thisSettings.original.beginScrollTop, thisSettings.original.bgTop, thisSettings.ratio);
            $elem.css({ 'background-position': thisSettings.original.bgLeft + ' ' + thisSettings.nudgedTop + 'px' });
        } else {
            thisSettings.nudgedTop = thisSettings.nudgedTop || getNudgedTop(thisSettings.original.offsetTop, thisSettings.original.beginScrollTop, thisSettings.original.top, thisSettings.ratio);
            $elem.css({ top: thisSettings.nudgedTop });
        }
    };
    var recalculate = function ($items) {
        window.log(this, ['recalculate', $window.height()]);
        $items.each(function () {
            var $this = $(this),
                thisSettings = $this.data('settings');
            calculateNudgedTop($this, thisSettings);
            $.scrollRatio.positionChanged($window.scrollTop());
        });
    };

    /*
    Plugin declaration and function
    -----------------------------------------------------------------------------*/
    $.fn.scrollRatio = function (options) {

        var settings = $.extend({}, DEFAULT_SETTINGS, options);

        var $self = this;

        $self.each(function () {
            var $this = $(this),

            // customise settings
                thisData = $this.data('scrollratio'),
                thisSettings = typeof thisData === 'number' ? $.extend({}, settings, { ratio: thisData }) : $.extend({}, settings, thisData);

            thisSettings.original = new OriginalValues($this); // orginial positioning
            calculateNudgedTop($this, thisSettings);

            // attach listener to positionChanged event
            $.scrollRatio.positionChanged(function (ev, scrollTop) { setPosition($this, thisSettings, scrollTop); });

            $this.data('settings', thisSettings);
        });

        // start listening to scrolling events on the main window
        $window.scroll(rePosition);
        $.scrollRatio.positionChanged($window.scrollTop());
    };

} (window.jQuery));