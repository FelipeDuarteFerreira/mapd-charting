/**
 * `dc.baseMixin` is an abstract functional object representing a basic `dc` chart object
 * for all chart and widget implementations. Methods from the {@link #dc.baseMixin dc.baseMixin} are inherited
 * and available on all chart implementations in the `dc` library.
 * @name baseMixin
 * @memberof dc
 * @mixin
 * @param {Object} _chart
 * @return {dc.baseMixin}
 */
dc.baseMixin = function (_chart) {
    _chart.__dcFlag__ = dc.utils.uniqueId();

    var _dimension;
    var _group;

/* OVERRIDE ---------------------------------------------------------------- */
    _chart.dataCache = null;
/* ------------------------------------------------------------------------- */

    var _anchor;
    var _root;
    var _svg;
    var _isChild;

/* OVERRIDE ---------------------------------------------------------------- */
    var _popup;
    var _redrawBrushFlag = false;
    var _isTargeting = false;
    var _colorByExpr = null;
    var _legendLock = null;
    var _legendUnlock = null;
    var _legendInputChange = null;
/* ------------------------------------------------------------------------- */

    var _minWidth = 200;
    var _defaultWidth = function (element) {
        var width = element && element.getBoundingClientRect && element.getBoundingClientRect().width;
        return (width && width > _minWidth) ? width : _minWidth;
    };
    var _width = _defaultWidth;

    var _minHeight = 200;
    var _defaultHeight = function (element) {
        var height = element && element.getBoundingClientRect && element.getBoundingClientRect().height;
        return (height && height > _minHeight) ? height : _minHeight;
    };
    var _height = _defaultHeight;

/* OVERRIDE ---------------------------------------------------------------- */
    var _multipleKeysAccessor = function(d) {
        var filteredKeys = [];
        for (var key in d) {
            if (d.hasOwnProperty(key) && key.indexOf('key') > -1) {
                filteredKeys.push(d[key]);
            }
        }
        if (filteredKeys.length === 1)
            filteredKeys = filteredKeys[0];
        return filteredKeys;
    }

    _chart.multipleKeysLabelAccessor = function(d){
        if ( _chart.dimension().value().length === 1) {
            return d['key0'];
        }
        var keysStr = '';
        var i = 1;
        for (var key in d) {
            if (d.hasOwnProperty(key) && key.indexOf('key') > -1) {
                keysStr += (i > 1 ? ' / ' : '') + d[key];
            }
            i++;
        }
        return keysStr;
    };

    _chart.multipleKeysAccessor = function (_) {
        if (!arguments.length) {
            return _multipleKeysAccessor;
        }
        _multipleKeysAccessor = _;
        return _chart;
    };


    var _redrawBrushFlag = false;
    var _keyAccessor = _multipleKeysAccessor;
    var _label = _chart.multipleKeysLabelAccessor;
    var _ordering = dc.pluck('key0');
    var _measureLabelsOn = false;


/* ------------------------------------------------------------------------- */

    var _valueAccessor = dc.pluck('val');
    var _orderSort;

    var _renderLabel = false;

    var _title = function (d) {
        return _chart.keyAccessor()(d) + ': ' + _chart.valueAccessor()(d);
    };
    var _renderTitle = true;
    var _controlsUseVisibility = true;

/* OVERRIDE ---------------------------------------------------------------- */
    var _transitionDuration = 500;
/* ------------------------------------------------------------------------- */

    var _filterPrinter = dc.printers.filters;

    var _mandatoryAttributes = ['dimension', 'group'];

    var _chartGroup = dc.constants.DEFAULT_CHART_GROUP;

    var _listeners = d3.dispatch(
        'preRender',
        'postRender',
        'preRedraw',
        'postRedraw',
        'filtered',
        'zoomed',
        'renderlet',
        'pretransition');

    var _legend;
    var _commitHandler;

/* OVERRIDE ---------------------------------------------------------------- */
    var _legendContinuous;

    _chart._colorLegend = null;

    var _topQueryCallback = null;
    var queryId = 0;
    var _registerQuery = function(callback) {
        var stackEmpty = _topQueryCallback == null;
        // need to check if max query?
        _topQueryCallback = callback;
        if (stackEmpty)
            _topQueryCallback.func();
    }

    var _popQueryStack = function(id) {
        if (_topQueryCallback != null && id == _topQueryCallback.id)
            _topQueryCallback = null;
        else
            _topQueryCallback.func();
    }

    var _startNextQuery = function() {
        _topQueryCallback.func();
        //var callback = _firstQueryCallback;
        //callback();
    }

    // override for count chart
    _chart.isCountChart = function() { return false; }
/* ------------------------------------------------------------------------- */

    var _filters = [];
    var _areFiltersInverse = false;
    _chart.filtersInverse = function() {
        return _areFiltersInverse;
    }

    var _filterCount = 0;



/* OVERRIDE ---------------------------------------------------------------- */
    var _softFilterClear = false;
/* ------------------------------------------------------------------------- */

    var _filterHandler = function (dimension, filters) {

/* OVERRIDE ---------------------------------------------------------------- */
        // bail out if we are at crossfilter level - i.e. for data count
        if (dimension.type == 'crossfilter') {
          return filters;
        }
/* ------------------------------------------------------------------------- */

        if (filters.length === 0) {

/* OVERRIDE ---------------------------------------------------------------- */
            dimension.filterAll(_softFilterClear);
        } else {
            if (_chart.hasOwnProperty('rangeFocused')) {
              dimension.filterMulti(filters, _chart.rangeFocused(), _areFiltersInverse);
            }
            else {
              dimension.filterMulti(filters, undefined, _areFiltersInverse);
            }
        }
/* ------------------------------------------------------------------------- */
        return filters;
    };

    var _data = function (group) {

/* OVERRIDE ---------------------------------------------------------------- */
        if (_chart.dataCache != null)
            return _chart.dataCache;
/* ------------------------------------------------------------------------- */

        return group.all();
    };

/* OVERRIDE ---------------------------------------------------------------- */
    var _dataAsync = function(group, callback) {
        group.allAsync(callback);
    };
/* ------------------------------------------------------------------------- */

    /**
     * Set or get the height attribute of a chart. The height is applied to the SVGElement generated by
     * the chart when rendered (or re-rendered). If a value is given, then it will be used to calculate
     * the new height and the chart returned for method chaining.  The value can either be a numeric, a
     * function, or falsy. If no value is specified then the value of the current height attribute will
     * be returned.
     *
     * By default, without an explicit height being given, the chart will select the width of its
     * anchor element. If that isn't possible it defaults to 200 (provided by the
     * {@link #dc.baseMixin+minHeight minHeight} property). Setting the value falsy will return
     * the chart to the default behavior.
     * @name height
     * @memberof dc.baseMixin
     * @instance
     * @see {@link #dc.baseMixin+minHeight minHeight}
     * @example
     * // Default height
     * chart.height(function (element) {
     *     var height = element && element.getBoundingClientRect && element.getBoundingClientRect().height;
     *     return (height && height > chart.minHeight()) ? height : chart.minHeight();
     * });
     *
     * chart.height(250); // Set the chart's height to 250px;
     * chart.height(function(anchor) { return doSomethingWith(anchor); }); // set the chart's height with a function
     * chart.height(null); // reset the height to the default auto calculation
     * @param {Number|Function} [height]
     * @return {Number}
     * @return {dc.baseMixin}
     */
    _chart.height = function (height) {
        if (!arguments.length) {
            return _height(_root.node());
        }

        _height = d3.functor(height || _defaultHeight);
        return _chart;
    };

    /**
     * Set or get the width attribute of a chart.
     * @name width
     * @memberof dc.baseMixin
     * @instance
     * @see {@link #dc.baseMixin+height height}
     * @see {@link #dc.baseMixin+minWidth minWidth}
     * @example
     * // Default width
     * chart.width(function (element) {
     *     var width = element && element.getBoundingClientRect && element.getBoundingClientRect().width;
     *     return (width && width > chart.minWidth()) ? width : chart.minWidth();
     * });
     * @param {Number|Function} [width]
     * @return {Number}
     * @return {dc.baseMixin}
     */
    _chart.width = function (width) {
        if (!arguments.length) {
            return _width(_root.node());
        }
        _width = d3.functor(width || _defaultWidth);
        return _chart;
    };

/* OVERRIDE ---------------------------------------------------------------- */
    _chart.accent = function(){}; //no-op
    _chart.unAccent = function(){}; //no-op
/* ------------------------------------------------------------------------- */

    /**
     * Set or get the minimum width attribute of a chart. This only has effect when used with the default
     * {@link #dc.baseMixin+width width} function.
     * @name minWidth
     * @memberof dc.baseMixin
     * @instance
     * @see {@link #dc.baseMixin+width width}
     * @param {Number} [minWidth=200]
     * @return {Number}
     * @return {dc.baseMixin}
     */
    _chart.minWidth = function (minWidth) {
        if (!arguments.length) {
            return _minWidth;
        }
        _minWidth = minWidth;
        return _chart;
    };

    /**
     * Set or get the minimum height attribute of a chart. This only has effect when used with the default
     * {@link #dc.baseMixin+height height} function.
     * @name minHeight
     * @memberof dc.baseMixin
     * @instance
     * @see {@link #dc.baseMixin+height height}
     * @param {Number} [minHeight=200]
     * @return {Number}
     * @return {dc.baseMixin}
     */
    _chart.minHeight = function (minHeight) {
        if (!arguments.length) {
            return _minHeight;
        }
        _minHeight = minHeight;
        return _chart;
    };

    /**
     * **mandatory**
     *
     * Set or get the dimension attribute of a chart. In `dc`, a dimension can be any valid [crossfilter
     * dimension](https://github.com/square/crossfilter/wiki/API-Reference#wiki-dimension).
     *
     * If a value is given, then it will be used as the new dimension. If no value is specified then
     * the current dimension will be returned.
     * @name dimension
     * @memberof dc.baseMixin
     * @instance
     * @see {@link https://github.com/square/crossfilter/wiki/API-Reference#dimension crossfilter.dimension}
     * @example
     * var index = crossfilter([]);
     * var dimension = index.dimension(dc.pluck('key'));
     * chart.dimension(dimension);
     * @param {crossfilter.dimension} [dimension]
     * @return {crossfilter.dimension}
     * @return {dc.baseMixin}
     */
    _chart.dimension = function (dimension) {
        if (!arguments.length) {
            return _dimension;
        }
        _dimension = dimension;
        _chart.expireCache();
        return _chart;
    };

    /**
     * Set the data callback or retrieve the chart's data set. The data callback is passed the chart's
     * group and by default will return
     * {@link https://github.com/square/crossfilter/wiki/API-Reference#group_all group.all}.
     * This behavior may be modified to, for instance, return only the top 5 groups.
     * @name data
     * @memberof dc.baseMixin
     * @instance
     * @example
     * // Default data function
     * chart.data(function (group) { return group.all(); });
     *
     * chart.data(function (group) { return group.top(5); });
     * @param {Function} [callback]
     * @return {*}
     * @return {dc.baseMixin}
     */
    _chart.data = function (callback) {
        if (!arguments.length) {
            return _data.call(_chart, _group);
        }
        _data = d3.functor(callback);
        _chart.expireCache();
        return _chart;
    };

/* OVERRIDE ---------------------------------------------------------------- */
    _chart.dataAsync = function (callback) {
        _dataAsync.call(_chart, _group, callback);
    }

    _chart.setDataAsync = function(callback) {
        _dataAsync = callback;
        _chart.expireCache();
        return _chart;
    }
/* ------------------------------------------------------------------------- */

    /**
     * **mandatory**
     *
     * Set or get the group attribute of a chart. In `dc` a group is a
     * {@link https://github.com/square/crossfilter/wiki/API-Reference#group-map-reduce crossfilter group}.
     * Usually the group should be created from the particular dimension associated with the same chart. If a value is
     * given, then it will be used as the new group.
     *
     * If no value specified then the current group will be returned.
     * If `name` is specified then it will be used to generate legend label.
     * @name group
     * @memberof dc.baseMixin
     * @instance
     * @see {@link https://github.com/square/crossfilter/wiki/API-Reference#group-map-reduce crossfilter.group}
     * @example
     * var index = crossfilter([]);
     * var dimension = index.dimension(dc.pluck('key'));
     * chart.dimension(dimension);
     * chart.group(dimension.group(crossfilter.reduceSum()));
     * @param {crossfilter.group} [group]
     * @param {String} [name]
     * @return {crossfilter.group}
     * @return {dc.baseMixin}
     */
    _chart.group = function (group, name) {
        if (!arguments.length) {
            return _group;
        }
        _group = group;
        _chart._groupName = name;
        _chart.expireCache();
        return _chart;
    };

    /**
     * Get or set an accessor to order ordinal dimensions.  This uses
     * {@link https://github.com/square/crossfilter/wiki/API-Reference#quicksort_by crossfilter.quicksort.by} as the
     * sort.
     * @name ordering
     * @memberof dc.baseMixin
     * @instance
     * @see {@link https://github.com/square/crossfilter/wiki/API-Reference#quicksort_by crossfilter.quicksort.by}
     * @example
     * // Default ordering accessor
     * _chart.ordering(dc.pluck('key'));
     * @param {Function} [orderFunction]
     * @return {Function}
     * @return {dc.baseMixin}
     */
/* OVERRIDE ---------------------------------------------------------------- */
    // _chart.ordering = function (orderFunction) {
    //     if (!arguments.length) {
    //         return _ordering;
    //     }
    //     _ordering = orderFunction;
    //     _orderSort = crossfilter.quicksort.by(_ordering);
    //     _chart.expireCache();
    //     return _chart;
    // };
/* ------------------------------------------------------------------------- */


    _chart._computeOrderedGroups = function (data) {
        var dataCopy = data.slice(0);

/* OVERRIDE ---------------------------------------------------------------- */
        // if (dataCopy.length <= 1) {
        //     return dataCopy;
        // }
        //
        // if (!_orderSort) {
        //     _orderSort = crossfilter.quicksort.by(_ordering);
        // }
        //
        // return _orderSort(dataCopy, 0, dataCopy.length);
/* ------------------------------------------------------------------------- */
        return dataCopy;
    };

    /**
     * Clear all filters associated with this chart
     *
     * The same can be achieved by calling {@link #dc.baseMixin+filter chart.filter(null)}.
     * @name filterAll
     * @memberof dc.baseMixin
     * @instance
     * @return {dc.baseMixin}
     */
/* OVERRIDE ---------------------------------------------------------------- */
    _chart.filterAll = function (softFilterClear) {

        if (softFilterClear != undefined && softFilterClear == true) {
          _softFilterClear = true;
        } else {
          _softFilterClear = false;
        }

        return _chart.filter(null);
    };
/* ------------------------------------------------------------------------- */

    /**
     * Execute d3 single selection in the chart's scope using the given selector and return the d3
     * selection.
     *
     * This function is **not chainable** since it does not return a chart instance; however the d3
     * selection result can be chained to d3 function calls.
     * @name select
     * @memberof dc.baseMixin
     * @instance
     * @see {@link https://github.com/mbostock/d3/wiki/Selections d3.selection}
     * @example
     * // Similar to:
     * d3.select('#chart-id').select(selector);
     * @return {d3.selection}
     */
    _chart.select = function (s) {
        return _root.select(s);
    };

    /**
     * Execute in scope d3 selectAll using the given selector and return d3 selection result.
     *
     * This function is **not chainable** since it does not return a chart instance; however the d3
     * selection result can be chained to d3 function calls.
     * @name selectAll
     * @memberof dc.baseMixin
     * @instance
     * @see {@link https://github.com/mbostock/d3/wiki/Selections d3.selection}
     * @example
     * // Similar to:
     * d3.select('#chart-id').selectAll(selector);
     * @return {d3.selection}
     */
    _chart.selectAll = function (s) {
        return _root ? _root.selectAll(s) : null;
    };

    /**
     * Set the root SVGElement to either be an existing chart's root; or any valid [d3 single
     * selector](https://github.com/mbostock/d3/wiki/Selections#selecting-elements) specifying a dom
     * block element such as a div; or a dom element or d3 selection. Optionally registers the chart
     * within the chartGroup. This class is called internally on chart initialization, but be called
     * again to relocate the chart. However, it will orphan any previously created SVGElements.
     * @name anchor
     * @memberof dc.baseMixin
     * @instance
     * @param {anchorChart|anchorSelector|anchorNode} [parent]
     * @param {String} [chartGroup]
     * @return {String|node|d3.selection}
     * @return {dc.baseMixin}
     */
    _chart.anchor = function (parent, chartGroup) {
        if (!arguments.length) {
            return _anchor;
        }
        if (dc.instanceOfChart(parent)) {
            _anchor = parent.anchor();
            _root = parent.root();
            _isChild = true;
        } else if (parent) {
            if (parent.select && parent.classed) { // detect d3 selection
                _anchor = parent.node();
            } else {
                _anchor = parent;
            }
            _root = d3.select(_anchor);
            _root.classed(dc.constants.CHART_CLASS, true);
            dc.registerChart(_chart, chartGroup);
            _isChild = false;
        } else {
            throw new dc.errors.BadArgumentException('parent must be defined');
        }
        _chartGroup = chartGroup;
        return _chart;
    };

    /**
     * Returns the DOM id for the chart's anchored location.
     * @name anchorName
     * @memberof dc.baseMixin
     * @instance
     * @return {String}
     */
    _chart.anchorName = function () {
        var a = _chart.anchor();
        if (a && a.id) {
            return a.id;
        }
        if (a && a.replace) {
            return a.replace('#', '');
        }
        return 'dc-chart' + _chart.chartID();
    };

    /**
     * Returns the root element where a chart resides. Usually it will be the parent div element where
     * the SVGElement was created. You can also pass in a new root element however this is usually handled by
     * dc internally. Resetting the root element on a chart outside of dc internals may have
     * unexpected consequences.
     * @name root
     * @memberof dc.baseMixin
     * @instance
     * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement HTMLElement}
     * @param {HTMLElement} [rootElement]
     * @return {HTMLElement}
     * @return {dc.baseMixin}
     */
    _chart.root = function (rootElement) {
        if (!arguments.length) {
            return _root;
        }
        _root = rootElement;
        return _chart;
    };

    /**
     * Returns the top SVGElement for this specific chart. You can also pass in a new SVGElement,
     * however this is usually handled by dc internally. Resetting the SVGElement on a chart outside
     * of dc internals may have unexpected consequences.
     * @name svg
     * @memberof dc.baseMixin
     * @instance
     * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/SVGElement SVGElement}
     * @param {SVGElement|d3.selection} [svgElement]
     * @return {SVGElement|d3.selection}
     * @return {dc.baseMixin}
     */
    _chart.svg = function (svgElement) {
        if (!arguments.length) {
            return _svg;
        }
        _svg = svgElement;
        return _chart;
    };

    /**
     * Remove the chart's SVGElements from the dom and recreate the container SVGElement.
     * @name resetSvg
     * @memberof dc.baseMixin
     * @instance
     * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/SVGElement SVGElement}
     * @return {SVGElement}
     */
    _chart.resetSvg = function () {

/* OVERRIDE ---------------------------------------------------------------- */
        _chart.root().html('');
/* ------------------------------------------------------------------------- */

        return _chart.generateSvg();
    };

    function sizeSvg () {
        if (_svg) {
            _svg
                .attr('width', _chart.width())
                .attr('height', _chart.height());
        }
    }

    _chart.generateSvg = function() {

/* OVERRIDE ---------------------------------------------------------------- */
        _svg = _chart
          .root()
          .append('div')
          .attr('class', 'svg-wrapper')
          .append('svg');
/* ------------------------------------------------------------------------- */

        sizeSvg();
        return _svg;
    }

/* OVERRIDE ---------------------------------------------------------------- */
    function sizeRoot () {
        if (_root) {
            _root
                .style('height', _chart.height()+'px')
                .style('width', _chart.width()+'px');
        }
    }

    _chart.popup = function (popupElement) {
        if (!arguments.length) {
            return _popup;
        }
        _popup = popupElement;
        return _chart;
    };

    _chart.generatePopup = function () {
        _chart.select('.chart-popup').remove();

        _popup = _chart.root().append('div').attr('class', 'chart-popup');

        _popup.append('div').attr('class', 'chart-popup-box');

        return _popup;
    }

    _chart.popupCoordinates = function (coords) {
        var isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

        if (!isFirefox || d3.selectAll('.react-grid-item.cssTransforms').empty()) {
            return coords;
        }

        var rootRect = _chart.root().node().getBoundingClientRect();
        return [coords[0] - rootRect.x, coords[1] - rootRect.y - window.pageYOffset + 100];
    };

    _chart.measureLabelsOn = function (val) {
        if (!arguments.length) {
            return _measureLabelsOn;
        }
        _measureLabelsOn = val;
        return _chart;
    };

    _chart.isTargeting = function (isTargeting) {
        if (!arguments.length) {
            return _isTargeting;
        }
        _isTargeting = isTargeting;
        return _chart;
    };

    _chart.colorByExpr = function (colorByExpr) {
        if (!arguments.length) {
            return _colorByExpr;
        }
        _colorByExpr = colorByExpr;
        return _chart;
    };
/* ------------------------------------------------------------------------- */

    /**
     * Set or get the filter printer function. The filter printer function is used to generate human
     * friendly text for filter value(s) associated with the chart instance. By default dc charts use a
     * default filter printer `dc.printers.filter` that provides simple printing support for both
     * single value and ranged filters.
     * @name filterPrinter
     * @memberof dc.baseMixin
     * @instance
     * @param {Function} [filterPrinterFunction=dc.printers.filter]
     * @return {Function}
     * @return {dc.baseMixin}
     */
    _chart.filterPrinter = function (filterPrinterFunction) {
        if (!arguments.length) {
            return _filterPrinter;
        }
        _filterPrinter = filterPrinterFunction;
        return _chart;
    };

    /**
     * If set, use the `visibility` attribute instead of the `display` attribute for showing/hiding
     * chart reset and filter controls, for less disruption to the layout.
     * @name controlsUseVisibility
     * @memberof dc.baseMixin
     * @instance
     * @param {Boolean} [controlsUseVisibility=false]
     * @return {Boolean}
     * @return {dc.baseMixin}
     **/
    _chart.controlsUseVisibility = function (_) {
        if (!arguments.length) {
            return _controlsUseVisibility;
        }
        _controlsUseVisibility = _;
        return _chart;
    };

    /**
     * Turn on optional control elements within the root element. dc currently supports the
     * following html control elements.
     * * root.selectAll('.reset') - elements are turned on if the chart has an active filter. This type
     * of control element is usually used to store a reset link to allow user to reset filter on a
     * certain chart. This element will be turned off automatically if the filter is cleared.
     * * root.selectAll('.filter') elements are turned on if the chart has an active filter. The text
     * content of this element is then replaced with the current filter value using the filter printer
     * function. This type of element will be turned off automatically if the filter is cleared.
     * @name turnOnControls
     * @memberof dc.baseMixin
     * @instance
     * @return {dc.baseMixin}
     */
    _chart.turnOnControls = function () {
        if (_root) {
            var attribute = _chart.controlsUseVisibility() ? 'visibility' : 'display';
            _chart.selectAll('.reset').style(attribute, null);
            _chart.selectAll('.filter').text(_filterPrinter(_chart.filters())).style(attribute, null);
        }
        return _chart;
    };

    /**
     * Turn off optional control elements within the root element.
     * @name turnOffControls
     * @memberof dc.baseMixin
     * @see {@link #dc.baseMixin+turnOnControls turnOnControls}
     * @instance
     * @return {dc.baseMixin}
     */
    _chart.turnOffControls = function () {
        if (_root) {
            var attribute = _chart.controlsUseVisibility() ? 'visibility' : 'display';
            var value = _chart.controlsUseVisibility() ? 'hidden' : 'none';
            _chart.selectAll('.reset').style(attribute, value);
            _chart.selectAll('.filter').style(attribute, value).text(_chart.filter());
        }
        return _chart;
    };

    /**
     * Set or get the animation transition duration (in milliseconds) for this chart instance.
     * @name transitionDuration
     * @memberof dc.baseMixin
     * @instance
     * @param {Number} [duration=750]
     * @return {Number}
     * @return {dc.baseMixin}
     */
    _chart.transitionDuration = function (duration) {
        if (!arguments.length) {

/* OVERRIDE ---------------------------------------------------------------- */
            return dc._globalTransitionDuration != null ? dc._globalTransitionDuration : _transitionDuration;
/* ------------------------------------------------------------------------- */

        }
        _transitionDuration = duration;
        return _chart;
    };

    _chart._mandatoryAttributes = function (_) {
        if (!arguments.length) {
            return _mandatoryAttributes;
        }
        _mandatoryAttributes = _;
        return _chart;
    };

    function checkForMandatoryAttributes (a) {
        if (!_chart[a] || !_chart[a]()) {
            throw new dc.errors.InvalidStateException('Mandatory attribute chart.' + a +
                ' is missing on chart[#' + _chart.anchorName() + ']');
        }
    }

    /**
     * Async wrapper of render. Callback is invoked after render.
     * @name renderAsyncWithQueryGroup
     * @memberof dc.baseMixin
     * @instance
     * @param {Number} [queryGroupId]
     * @param {Number} [queryCount]
     * @param {Function} [callback]
     */
    _chart.renderAsyncWithQueryGroup = function(queryGroupId, queryCount, callback) {
        if (dc._refreshDisabled) return;
        if (_chart.hasOwnProperty('setSample')) {
            _chart.setSample();
        }
        var id = queryId++;
        var renderCallback = function(error, data) {
            if (error) {
                callback(error)
            } else {
                _chart.render(id, queryGroupId, queryCount, data, callback);
            }
        }
        _chart.dataAsync(renderCallback);
    };

    /**
     * Invokes renderAsyncWithQueryGroup and passes it the callback argument.
     * Leaves queryGroupId and queryCount arguments as null.
     * @name renderAsync
     * @memberof dc.baseMixin
     * @instance
     * @param {Function} [callback]
     */
    _chart.renderAsync = function(callback) {
        _chart.renderAsyncWithQueryGroup(null, null, callback)
    };

    /**
     * Invoking this method will force the chart to re-render everything from scratch. Generally it
     * should only be used to render the chart for the first time on the page or if you want to make
     * sure everything is redrawn from scratch instead of relying on the default incremental redrawing
     * behaviour.
     * @name render
     * @memberof dc.baseMixin
     * @instance
     * @param {Number} [id]
     * @param {Number} [queryGroupId]
     * @param {Number} [queryCount]
     * @param {Function} [callback]
     * @param {Any} [data]
     * @return {dc.baseMixin}
     */
    _chart.render = function (id, queryGroupId, queryCount, data, callback) {
        if (dc._refreshDisabled) return;
        _chart.dataCache = typeof data !== 'undefined' && data !== null ? data : null

        sizeRoot();

        _listeners.preRender(_chart);

        if (_mandatoryAttributes) {
            _mandatoryAttributes.forEach(checkForMandatoryAttributes);
        }

        var renderError;
        try {
            var result = _chart._doRender(data);
        }
        catch (err) {
            renderError = err;
            console.error(err);
        }

        if (_legend && _chart.colors().domain) {
            _legend.render();
        }

        if (_chart._colorLegend) {
            _chart._colorLegend.render();
        }

        _chart.generatePopup();

        _chart._activateRenderlets('postRender');

        if (typeof queryGroupId !== 'undefined' && queryGroupId !== null) {
            if (++dc._renderCount == queryCount) {
                if (dc._logging) {
                    var endTime = new Date();
                    var elapsed = endTime - dc._startRenderTime;
                    console.log("Render elapsed: " + elapsed + " ms");
                }
                dc._renderCount = 0;
                dc._globalTransitionDuration = null; // reset to null if was brush
                var stackEmpty = dc._renderIdStack == null || dc._renderIdStack == queryGroupId;
                dc._renderIdStack = null;
                if (!stackEmpty) {
                   dc.renderAll(null, callback);
                }
            }
        }

        callback && callback(renderError, result || _chart)
        return result;
    };

    _chart._activateRenderlets = function (event) {
        _listeners.pretransition(_chart);
        if (_chart.transitionDuration() > 0 && _svg) {
            _svg.transition().duration(_chart.transitionDuration())
                .each('end', function () {
                    _listeners.renderlet(_chart);
                    if (event) {
                        _listeners[event](_chart);
                    }
                });
        } else {
            _listeners.renderlet(_chart);
            if (event) {
                _listeners[event](_chart);
            }
        }
    };

    /**
     * Async wrapper of redraw. Callback is invoked after redraw.
     * @name redrawAsyncWithQueryGroup
     * @memberof dc.baseMixin
     * @instance
     * @param {Number} [queryGroupId]
     * @param {Number} [queryCount]
     * @param {Function} [callback]
     */
    _chart.redrawAsyncWithQueryGroup = function (queryGroupId, queryCount, callback) {
        if (dc._refreshDisabled) return;

        if (_chart.hasOwnProperty('setSample')) {
            _chart.setSample();
        }
        var id = queryId++;
        var redrawCallback = function(error, data) {
            if (error) {
                callback(error)
            } else {
                _chart.redraw(id, queryGroupId, queryCount, data, callback);
            }
        }
        _chart.dataAsync(redrawCallback);
    };

    /**
     * Invokes redrawAsyncWithQueryGroup and passes it the callback argument.
     * Leaves queryGroupId and queryCount arguments as null.
     * @name redrawAsync
     * @memberof dc.baseMixin
     * @instance
     * @param {Function} [callback]
     */
    _chart.redrawAsync = function (callback) {
        _chart.redrawAsyncWithQueryGroup(null, null, callback)
    };

    /**
     * Calling redraw will cause the chart to re-render data changes incrementally. If there is no
     * change in the underlying data dimension then calling this method will have no effect on the
     * chart. Most chart interaction in dc will automatically trigger this method through internal
     * events (in particular {@link #dc.redrawAll dc.redrawAll}; therefore, you only need to
     * manually invoke this function if data is manipulated outside of dc's control (for example if
     * data is loaded in the background using
     * {@link https://github.com/square/crossfilter/wiki/API-Reference#crossfilter_add crossfilter.add}.
     * @name redraw
     * @memberof dc.baseMixin
     * @instance
     * @param {Number} [id]
     * @param {Number} [queryGroupId]
     * @param {Number} [queryCount]
     * @param {Function} [callback]
     * @param {Any} [data]
     * @return {dc.baseMixin}
     */
    _chart.redraw = function (id, queryGroupId, queryCount, data, callback) {
        if (dc._refreshDisabled) return;
        _chart.dataCache = typeof data !== 'undefined' && data !== null ? data : null

        sizeSvg();
        _listeners.preRedraw(_chart);

        var redrawError;
        try {
            var result = _chart._doRedraw(data);
        }
        catch (err) {
            redrawError = err;
            console.error(err);
        }

        if (_legend && _chart.colors().domain) {
            _legend.render();
        }

        if (_chart._colorLegend) {
            _chart._colorLegend.render();
        }

        _chart._activateRenderlets('postRedraw');

        if (typeof queryGroupId !== 'undefined' && queryGroupId !== null) {
            if (++dc._redrawCount == queryCount) {
                if (dc._logging) {
                    var endTime = new Date();
                    var elapsed = endTime - dc._startRedrawTime;
                    console.log("Redraw elapsed: " + elapsed + " ms");
                }
                dc._redrawCount = 0;
                dc._globalTransitionDuration = null; // reset to null if was brush
                var stackEmpty = dc._redrawIdStack == null || dc._redrawIdStack == queryGroupId;
                dc._redrawIdStack = null;

                if (callback) {
                    callback(redrawError, result || _chart);
                    return result
                } else if (!stackEmpty) {
                    dc.redrawAll(null, callback);
                }
            }
        }

        callback && callback(redrawError, result || _chart);
        return result;
    };



    /**
     * Gets/sets the commit handler. If the chart has a commit handler, the handler will be called when
     * the chart's filters have changed, in order to send the filter data asynchronously to a server.
     *
     * Unlike other functions in dc.js, the commit handler is asynchronous. It takes two arguments:
     * a flag indicating whether this is a render (true) or a redraw (false), and a callback to be
     * triggered once the commit is filtered. The callback has the standard node.js continuation signature
     * with error first and result second.
     * @name commitHandler
     * @memberof dc.baseMixin
     * @instance
     * @return {dc.baseMixin}
     */
    _chart.commitHandler = function (commitHandler) {
        if (!arguments.length) {
            return _commitHandler;
        }
        _commitHandler = commitHandler;
        return _chart;
    };

    /**
     * Redraws all charts in the same group as this chart, typically in reaction to a filter
     * change. If the chart has a {@link dc.baseMixin.commitFilter commitHandler}, it will
     * be executed and waited for.
     * @name redrawGroup
     * @memberof dc.baseMixin
     * @instance
     * @return {dc.baseMixin}
     */
    _chart.redrawGroup = function (callback) {
        if (_commitHandler) {
            _commitHandler(false, function (error, result) {
                if (error) {
                    console.log(error);
                    callback && callback(error)
                } else {
                    dc.redrawAll(_chart.chartGroup(), callback);
                }
            });
        } else {
            dc.redrawAll(_chart.chartGroup(), callback);
        }
        return _chart;
    };

    /**
     * Renders all charts in the same group as this chart. If the chart has a
     * {@link dc.baseMixin.commitFilter commitHandler}, it will be executed and waited for
     * @name renderGroup
     * @memberof dc.baseMixin
     * @instance
     * @return {dc.baseMixin}
     */
    _chart.renderGroup = function (callback) {
        if (_commitHandler) {
            _commitHandler(false, function (error, result) {
                if (error) {
                    console.log(error);
                    callback && callback(error)
                } else {
                    dc.renderAll(_chart.chartGroup(), callback);
                }
            });
        } else {
            dc.renderAll(_chart.chartGroup(), callback);
        }
        return _chart;
    };

    _chart._invokeFilteredListener = function (f, i) {
        if (f !== undefined) {
            _listeners.filtered(_chart, f, i);
        }
    };

    _chart._invokeZoomedListener = function () {
        _listeners.zoomed(_chart);
    };

    var _hasFilterHandler = function (filters, filter) {
        if (filter === null || typeof(filter) === 'undefined') {
            return filters.length > 0;
        }

        return filters.some(function (f) {
            return filter <= f && filter >= f;
        });
    };

    /**
     * Set or get the has filter handler. The has filter handler is a function that checks to see if
     * the chart's current filters include a specific filter.  Using a custom has filter handler allows
     * you to change the way filters are checked for and replaced.
     * @name hasFilterHandler
     * @memberof dc.baseMixin
     * @instance
     * @example
     * // default has filter handler
     * chart.hasFilterHandler(function (filters, filter) {
     *     if (filter === null || typeof(filter) === 'undefined') {
     *         return filters.length > 0;
     *     }
     *     return filters.some(function (f) {
     *         return filter <= f && filter >= f;
     *     });
     * });
     *
     * // custom filter handler (no-op)
     * chart.hasFilterHandler(function(filters, filter) {
     *     return false;
     * });
     * @param {Function} [hasFilterHandler]
     * @return {Function}
     * @return {dc.baseMixin}
     */
    _chart.hasFilterHandler = function (hasFilterHandler) {
        if (!arguments.length) {
            return _hasFilterHandler;
        }
        _hasFilterHandler = hasFilterHandler;
        return _chart;
    };

    /**
     * Check whether any active filter or a specific filter is associated with particular chart instance.
     * This function is **not chainable**.
     * @name hasFilter
     * @memberof dc.baseMixin
     * @instance
     * @see {@link #dc.baseMixin+hasFilterHandler hasFilterHandler}
     * @param {*} [filter]
     * @return {Boolean}
     */
    _chart.hasFilter = function (filter) {
        return _hasFilterHandler(_filters, filter);
    };

    var _removeFilterHandler = function (filters, filter) {
        for (var i = 0; i < filters.length; i++) {
            if (filters[i] <= filter && filters[i] >= filter) {
                filters.splice(i, 1);
                break;
            }
        }
        return filters;
    };

    /**
     * Set or get the remove filter handler. The remove filter handler is a function that removes a
     * filter from the chart's current filters. Using a custom remove filter handler allows you to
     * change how filters are removed or perform additional work when removing a filter, e.g. when
     * using a filter server other than crossfilter.
     *
     * Any changes should modify the `filters` array argument and return that array.
     * @name removeFilterHandler
     * @memberof dc.baseMixin
     * @instance
     * @example
     * // default remove filter handler
     * chart.removeFilterHandler(function (filters, filter) {
     *     for (var i = 0; i < filters.length; i++) {
     *         if (filters[i] <= filter && filters[i] >= filter) {
     *             filters.splice(i, 1);
     *             break;
     *         }
     *     }
     *     return filters;
     * });
     *
     * // custom filter handler (no-op)
     * chart.removeFilterHandler(function(filters, filter) {
     *     return filters;
     * });
     * @param {Function} [removeFilterHandler]
     * @return {Function}
     * @return {dc.baseMixin}
     */
    _chart.removeFilterHandler = function (removeFilterHandler) {
        if (!arguments.length) {
            return _removeFilterHandler;
        }
        _removeFilterHandler = removeFilterHandler;
        return _chart;
    };

    var _addFilterHandler = function (filters, filter) {
        filters.push(filter);
        return filters;
    };

    /**
     * Set or get the add filter handler. The add filter handler is a function that adds a filter to
     * the chart's filter list. Using a custom add filter handler allows you to change the way filters
     * are added or perform additional work when adding a filter, e.g. when using a filter server other
     * than crossfilter.
     *
     * Any changes should modify the `filters` array argument and return that array.
     * @name addFilterHandler
     * @memberof dc.baseMixin
     * @instance
     * @example
     * // default add filter handler
     * chart.addFilterHandler(function (filters, filter) {
     *     filters.push(filter);
     *     return filters;
     * });
     *
     * // custom filter handler (no-op)
     * chart.addFilterHandler(function(filters, filter) {
     *     return filters;
     * });
     * @param {Function} [addFilterHandler]
     * @return {Function}
     * @return {dc.baseMixin}
     */
    _chart.addFilterHandler = function (addFilterHandler) {
        if (!arguments.length) {
            return _addFilterHandler;
        }
        _addFilterHandler = addFilterHandler;
        return _chart;
    };

    var _resetFilterHandler = function (filters) {
        return [];
    };

    /**
     * Set or get the reset filter handler. The reset filter handler is a function that resets the
     * chart's filter list by returning a new list. Using a custom reset filter handler allows you to
     * change the way filters are reset, or perform additional work when resetting the filters,
     * e.g. when using a filter server other than crossfilter.
     *
     * This function should return an array.
     * @name resetFilterHandler
     * @memberof dc.baseMixin
     * @instance
     * @example
     * // default remove filter handler
     * function (filters) {
     *     return [];
     * }
     *
     * // custom filter handler (no-op)
     * chart.resetFilterHandler(function(filters) {
     *     return filters;
     * });
     * @param {Function} [resetFilterHandler]
     * @return {dc.baseMixin}
     */
    _chart.resetFilterHandler = function (resetFilterHandler) {
        if (!arguments.length) {
            return _resetFilterHandler;
        }
        _resetFilterHandler = resetFilterHandler;
        return _chart;
    };

    function applyFilters () {
        if (_chart.dimension() && _chart.dimension().filter) {
            var fs = _filterHandler(_chart.dimension(), _filters);
            _filters = fs ? fs : _filters;
        }
    }

    _chart.replaceFilter = function (_) {
        _filters = [];
        _chart.filter(_);
    };

    /**
     * Filter the chart by the given value or return the current filter if the input parameter is missing.
     * If the passed filter is not currently in the chart's filters, it is added to the filters by the
     * {@link #dc.baseMixin+addFilterHandler addFilterHandler}.  If a filter exists already within the chart's
     * filters, it will be removed by the {@link #dc.baseMixin+removeFilterHandler removeFilterHandler}.  If
     * a `null` value was passed at the filter, this denotes that the filters should be reset, and is performed
     * by the {@link #dc.baseMixin+resetFilterHandler resetFilterHandler}.
     *
     * Once the filters array has been updated, the filters are applied to the crossfilter.dimension, using the
     * {@link #dc.baseMixin+filterHandler filterHandler}.
     * @name filter
     * @memberof dc.baseMixin
     * @instance
     * @see {@link #dc.baseMixin+addFilterHandler addFilterHandler}
     * @see {@link #dc.baseMixin+removeFilterHandler removeFilterHandler}
     * @see {@link #dc.baseMixin+resetFilterHandler resetFilterHandler}
     * @see {@link #dc.baseMixin+filterHandler filterHandler}
     * @example
     * // filter by a single string
     * chart.filter('Sunday');
     * // filter by a single age
     * chart.filter(18);
     * @param {*} [filter]
     * @return {dc.baseMixin}
     */
    _chart.filter = function (filter, isFilterInverse) {
        if (!arguments.length) {
            return _filters.length > 0 ? _filters[0] : null;
        }
        isFilterInverse = typeof isFilterInverse === 'undefined' ? false : isFilterInverse;
        if (isFilterInverse !== _areFiltersInverse) {
            _filters = _resetFilterHandler(_filters);
            _areFiltersInverse = isFilterInverse;
        }
        if (filter instanceof Array && filter[0] instanceof Array && !filter.isFiltered) {
            filter[0].forEach(function (d) {
                if (_chart.hasFilter(d)) {
                    _removeFilterHandler(_filters, d);
                } else {
                    _addFilterHandler(_filters, d);
                }
            });
        } else if (filter === null) {
            _filters = _resetFilterHandler(_filters);
        } else {
            if (_chart.hasFilter(filter)) {
                _removeFilterHandler(_filters, filter);
            } else {
                _addFilterHandler(_filters, filter);
            }
        }
        applyFilters();
        _chart._invokeFilteredListener(filter, isFilterInverse);

        if (_root !== null && _chart.hasFilter()) {
            _chart.turnOnControls();
        } else {
            _chart.turnOffControls();
        }

        return _chart;
    };

    /**
     * Returns all current filters. This method does not perform defensive cloning of the internal
     * filter array before returning, therefore any modification of the returned array will effect the
     * chart's internal filter storage.
     * @name filters
     * @memberof dc.baseMixin
     * @instance
     * @return {Array<*>}
     */
    _chart.filters = function () {
        return _filters;
    };

/* OVERRIDE ---------------------------------------------------------------- */
    _chart.accentSelected = function(e) {
        d3.select(e).classed(dc.constants.ACCENT_CLASS, true);
    }

    _chart.unAccentSelected = function(e) {
        d3.select(e).classed(dc.constants.ACCENT_CLASS, false);
    }
/* ------------------------------------------------------------------------- */

    _chart.highlightSelected = function (e) {
        d3.select(e).classed(dc.constants.SELECTED_CLASS, true);
        d3.select(e).classed(dc.constants.DESELECTED_CLASS, false);
    };

    _chart.fadeDeselected = function (e) {
        d3.select(e).classed(dc.constants.SELECTED_CLASS, false);
        d3.select(e).classed(dc.constants.DESELECTED_CLASS, true);
    };

    _chart.resetHighlight = function (e) {
        d3.select(e).classed(dc.constants.SELECTED_CLASS, false);
        d3.select(e).classed(dc.constants.DESELECTED_CLASS, false);
    };

    /**
     * This function is passed to d3 as the onClick handler for each chart. The default behavior is to
     * filter on the clicked datum (passed to the callback) and redraw the chart group.
     * @name onClick
     * @memberof dc.baseMixin
     * @instance
     * @param {*} datum
     */
    _chart.onClick = function (datum) {
        var filter = _chart.keyAccessor()(datum);
        _chart.handleFilterClick(d3.event, filter)
    };

    /**
     * Set or get the filter handler. The filter handler is a function that performs the filter action
     * on a specific dimension. Using a custom filter handler allows you to perform additional logic
     * before or after filtering.
     * @name filterHandler
     * @memberof dc.baseMixin
     * @instance
     * @see {@link https://github.com/square/crossfilter/wiki/API-Reference#dimension_filter crossfilter.dimension.filter}
     * @example
     * // default filter handler
     * chart.filterHandler(function (dimension, filters) {
     *     dimension.filter(null);
     *     if (filters.length === 0) {
     *         dimension.filter(null);
     *     } else {
     *         dimension.filterFunction(function (d) {
     *             for (var i = 0; i < filters.length; i++) {
     *                 var filter = filters[i];
     *                 if (filter.isFiltered && filter.isFiltered(d)) {
     *                     return true;
     *                 } else if (filter <= d && filter >= d) {
     *                     return true;
     *                 }
     *             }
     *             return false;
     *         });
     *     }
     *     return filters;
     * });
     *
     * // custom filter handler
     * chart.filterHandler(function(dimension, filter){
     *     var newFilter = filter + 10;
     *     dimension.filter(newFilter);
     *     return newFilter; // set the actual filter value to the new value
     * });
     * @param {Function} [filterHandler]
     * @return {Function}
     * @return {dc.baseMixin}
     */
    _chart.filterHandler = function (filterHandler) {
        if (!arguments.length) {
            return _filterHandler;
        }
        _filterHandler = filterHandler;
        return _chart;
    };

    // abstract function stub
    _chart._doRender = function () {
        // do nothing in base, should be overridden by sub-function
        return _chart;
    };

    _chart._doRedraw = function () {
        // do nothing in base, should be overridden by sub-function
        return _chart;
    };

    _chart.legendables = function () {
        // do nothing in base, should be overridden by sub-function
        return [];
    };

/* OVERRIDE -----------------------------------------------------------------*/
    _chart.legendablesContinuous = function () {

        var legends = [];
        var colorDomain = _chart.colors().domain();
        var colorDomainSize = colorDomain[1] - colorDomain[0];
        var colorRange = _chart.colors().range();
        var numColors = colorRange.length;
        var commafy = d3.format(',');

        for (var c = 0; c < numColors; c++) {
          var startRange = (c/numColors)*colorDomainSize + colorDomain[0];

            if (_isTargeting) {
                startRange = '%' + (parseFloat(startRange) * 100.0).toFixed(2);
            }
            else if (_colorByExpr === 'count(*)') {
                startRange = parseInt(startRange);
            }
            else {
                startRange = parseFloat(startRange).toFixed(2);
                startRange = (startRange >= 1000 ? Math.round(startRange) : startRange);
            }

            legends.push({color: colorRange[c], value: isNaN(startRange) ? startRange : commafy(startRange) });
        }

        return legends;
    }

    _chart.legendLock = function(_) {
      if (!arguments.length) {
        return _legendLock;
      }
      _legendLock = _;
      return _chart;
    }

    _chart.legendUnlock = function(_) {
      if (!arguments.length) {
        return _legendUnlock;
      }
      _legendUnlock = _;
      return _chart;
    }

    _chart.legendInputChange = function(_) {
      if (!arguments.length) {
        return _legendInputChange;
      }
      _legendInputChange = _;
      return _chart;
    }

/* ------------------------------------------------------------------------- */

    _chart.legendHighlight = function () {
        // do nothing in base, should be overridden by sub-function
    };

    _chart.legendReset = function () {
        // do nothing in base, should be overridden by sub-function
    };

    _chart.legendToggle = function () {
        // do nothing in base, should be overriden by sub-function
    };

    _chart.isLegendableHidden = function () {
        // do nothing in base, should be overridden by sub-function
        return false;
    };

    /**
     * Set or get the key accessor function. The key accessor function is used to retrieve the key
     * value from the crossfilter group. Key values are used differently in different charts, for
     * example keys correspond to slices in a pie chart and x axis positions in a grid coordinate chart.
     * @name keyAccessor
     * @memberof dc.baseMixin
     * @instance
     * @example
     * // default key accessor
     * chart.keyAccessor(function(d) { return d.key; });
     * // custom key accessor for a multi-value crossfilter reduction
     * chart.keyAccessor(function(p) { return p.value.absGain; });
     * @param {Function} [keyAccessor]
     * @return {Function}
     * @return {dc.baseMixin}
     */
    _chart.keyAccessor = function (keyAccessor) {
        if (!arguments.length) {
            return _keyAccessor;
        }
        _keyAccessor = keyAccessor;
        return _chart;
    };

    /**
     * Set or get the value accessor function. The value accessor function is used to retrieve the
     * value from the crossfilter group. Group values are used differently in different charts, for
     * example values correspond to slice sizes in a pie chart and y axis positions in a grid
     * coordinate chart.
     * @name valueAccessor
     * @memberof dc.baseMixin
     * @instance
     * @example
     * // default value accessor
     * chart.valueAccessor(function(d) { return d.value; });
     * // custom value accessor for a multi-value crossfilter reduction
     * chart.valueAccessor(function(p) { return p.value.percentageGain; });
     * @param {Function} [valueAccessor]
     * @return {Function}
     * @return {dc.baseMixin}
     */
    _chart.valueAccessor = function (valueAccessor) {
        if (!arguments.length) {
            return _valueAccessor;
        }
        _valueAccessor = valueAccessor;
        return _chart;
    };

    /**
     * Set or get the label function. The chart class will use this function to render labels for each
     * child element in the chart, e.g. slices in a pie chart or bubbles in a bubble chart. Not every
     * chart supports the label function, for example line chart does not use this function
     * at all. By default, enables labels; pass false for the second parameter if this is not desired.
     * @name label
     * @memberof dc.baseMixin
     * @instance
     * @example
     * // default label function just return the key
     * chart.label(function(d) { return d.key; });
     * // label function has access to the standard d3 data binding and can get quite complicated
     * chart.label(function(d) { return d.data.key + '(' + Math.floor(d.data.value / all.value() * 100) + '%)'; });
     * @param {Function} [labelFunction]
     * @param {Boolean} [enableLabels=true]
     * @return {Function}
     * @return {dc.baseMixin}
     */
    _chart.label = function (labelFunction, enableLabels) {
        if (!arguments.length) {
            return _label;
        }
        _label = labelFunction;
        if ((enableLabels === undefined) || enableLabels) {
            _renderLabel = true;
        }
        return _chart;
    };

    /**
     * Turn on/off label rendering
     * @name renderLabel
     * @memberof dc.baseMixin
     * @instance
     * @param {Boolean} [renderLabel=false]
     * @return {Boolean}
     * @return {dc.baseMixin}
     */
    _chart.renderLabel = function (renderLabel) {
        if (!arguments.length) {
            return _renderLabel;
        }
        _renderLabel = renderLabel;
        return _chart;
    };

    /**
     * Set or get the title function. The chart class will use this function to render the SVGElement title
     * (usually interpreted by browser as tooltips) for each child element in the chart, e.g. a slice
     * in a pie chart or a bubble in a bubble chart. Almost every chart supports the title function;
     * however in grid coordinate charts you need to turn off the brush in order to see titles, because
     * otherwise the brush layer will block tooltip triggering.
     * @name title
     * @memberof dc.baseMixin
     * @instance
     * @example
     * // default title function just return the key
     * chart.title(function(d) { return d.key + ': ' + d.value; });
     * // title function has access to the standard d3 data binding and can get quite complicated
     * chart.title(function(p) {
     *    return p.key.getFullYear()
     *        + '\n'
     *        + 'Index Gain: ' + numberFormat(p.value.absGain) + '\n'
     *        + 'Index Gain in Percentage: ' + numberFormat(p.value.percentageGain) + '%\n'
     *        + 'Fluctuation / Index Ratio: ' + numberFormat(p.value.fluctuationPercentage) + '%';
     * });
     * @param {Function} [titleFunction]
     * @return {Function}
     * @return {dc.baseMixin}
     */
    _chart.title = function (titleFunction) {
        if (!arguments.length) {
            return _title;
        }
        _title = titleFunction;
        return _chart;
    };

    /**
     * Turn on/off title rendering, or return the state of the render title flag if no arguments are
     * given.
     * @name renderTitle
     * @memberof dc.baseMixin
     * @instance
     * @param {Boolean} [renderTitle=true]
     * @return {Boolean}
     * @return {dc.baseMixin}
     */
    _chart.renderTitle = function (renderTitle) {
        if (!arguments.length) {
            return _renderTitle;
        }
        _renderTitle = renderTitle;
        return _chart;
    };

    /**
     * A renderlet is similar to an event listener on rendering event. Multiple renderlets can be added
     * to an individual chart.  Each time a chart is rerendered or redrawn the renderlets are invoked
     * right after the chart finishes its transitions, giving you a way to modify the SVGElements.
     * Renderlet functions take the chart instance as the only input parameter and you can
     * use the dc API or use raw d3 to achieve pretty much any effect.
     *
     * Use {@link #dc.baseMixin+on on} with a 'renderlet' prefix.
     * Generates a random key for the renderlet, which makes it hard to remove.
     * @name renderlet
     * @memberof dc.baseMixin
     * @instance
     * @deprecated
     * @example
     * // do this instead of .renderlet(function(chart) { ... })
     * chart.on("renderlet", function(chart){
     *     // mix of dc API and d3 manipulation
     *     chart.select('g.y').style('display', 'none');
     *     // its a closure so you can also access other chart variable available in the closure scope
     *     moveChart.filter(chart.filter());
     * });
     * @param {Function} renderletFunction
     * @return {dc.baseMixin}
     */
    _chart.renderlet = dc.logger.deprecate(function (renderletFunction) {
        _chart.on('renderlet.' + dc.utils.uniqueId(), renderletFunction);
        return _chart;
    }, 'chart.renderlet has been deprecated.  Please use chart.on("renderlet.<renderletKey>", renderletFunction)');

    /**
     * Get or set the chart group to which this chart belongs. Chart groups are rendered or redrawn
     * together since it is expected they share the same underlying crossfilter data set.
     * @name chartGroup
     * @memberof dc.baseMixin
     * @instance
     * @param {String} [chartGroup]
     * @return {String}
     * @return {dc.baseMixin}
     */
    _chart.chartGroup = function (chartGroup) {
        if (!arguments.length) {
            return _chartGroup;
        }
        if (!_isChild) {
            dc.deregisterChart(_chart, _chartGroup);
        }
        _chartGroup = chartGroup;
        if (!_isChild) {
            dc.registerChart(_chart, _chartGroup);
        }
        return _chart;
    };

    /**
     * Expire the internal chart cache. dc charts cache some data internally on a per chart basis to
     * speed up rendering and avoid unnecessary calculation; however it might be useful to clear the
     * cache if you have changed state which will affect rendering.  For example if you invoke the
     * {@link https://github.com/square/crossfilter/wiki/API-Reference#crossfilter_add crossfilter.add}
     * function or reset group or dimension after rendering it is a good idea to
     * clear the cache to make sure charts are rendered properly.
     * @name expireCache
     * @memberof dc.baseMixin
     * @instance
     * @return {dc.baseMixin}
     */
    _chart.expireCache = function () {
        // do nothing in base, should be overridden by sub-function
        return _chart;
    };

    /**
     * Attach a dc.legend widget to this chart. The legend widget will automatically draw legend labels
     * based on the color setting and names associated with each group.
     * @name legend
     * @memberof dc.baseMixin
     * @instance
     * @example
     * chart.legend(dc.legend().x(400).y(10).itemHeight(13).gap(5))
     * @param {dc.legend} [legend]
     * @return {dc.legend}
     * @return {dc.baseMixin}
     */
    _chart.legend = function (legend) {
        if (!arguments.length) {
            return _legend;
        }
        _legend = legend;

        if (_legend) {
            _legend.parent(_chart);
        }

        return _chart;
    };

/* OVERRIDE -----------------------------------------------------------------*/
    _chart.legendContinuous = function (legendContinuous) {
        if (!arguments.length) {
            return _legendContinuous;
        }
        _legendContinuous = legendContinuous;
        _legendContinuous.parent(_chart);
        return _chart;
    };
/* --------------------------------------------------------------------------*/

    /**
     * Returns the internal numeric ID of the chart.
     * @name chartID
     * @memberof dc.baseMixin
     * @instance
     * @return {String}
     */
    _chart.chartID = function () {
        return _chart.__dcFlag__;
    };

    /**
     * Set chart options using a configuration object. Each key in the object will cause the method of
     * the same name to be called with the value to set that attribute for the chart.
     * @name options
     * @memberof dc.baseMixin
     * @instance
     * @example
     * chart.options({dimension: myDimension, group: myGroup});
     * @param {{}} opts
     * @return {dc.baseMixin}
     */
    _chart.options = function (opts) {
        var applyOptions = [
            'anchor',
            'group',
            'xAxisLabel',
            'yAxisLabel',
            'stack',
            'title',
            'point',
            'getColor',
            'overlayGeoJson'
        ];

        for (var o in opts) {
            if (typeof(_chart[o]) === 'function') {
                if (opts[o] instanceof Array && applyOptions.indexOf(o) !== -1) {
                    _chart[o].apply(_chart, opts[o]);
                } else {
                    _chart[o].call(_chart, opts[o]);
                }
            } else {
                dc.logger.debug('Not a valid option setter name: ' + o);
            }
        }
        return _chart;
    };

    /**
     * All dc chart instance supports the following listeners.
     * Supports the following events:
     * * `renderlet` - This listener function will be invoked after transitions after redraw and render. Replaces the
     * deprecated {@link #dc.baseMixin+renderlet renderlet} method.
     * * `pretransition` - Like `.on('renderlet', ...)` but the event is fired before transitions start.
     * * `preRender` - This listener function will be invoked before chart rendering.
     * * `postRender` - This listener function will be invoked after chart finish rendering including
     * all renderlets' logic.
     * * `preRedraw` - This listener function will be invoked before chart redrawing.
     * * `postRedraw` - This listener function will be invoked after chart finish redrawing
     * including all renderlets' logic.
     * * `filtered` - This listener function will be invoked after a filter is applied, added or removed.
     * * `zoomed` - This listener function will be invoked after a zoom is triggered.
     * @name on
     * @memberof dc.baseMixin
     * @instance
     * @see {@link https://github.com/mbostock/d3/wiki/Internals#dispatch_on d3.dispatch.on}
     * @example
     * .on('renderlet', function(chart, filter){...})
     * .on('pretransition', function(chart, filter){...})
     * .on('preRender', function(chart){...})
     * .on('postRender', function(chart){...})
     * .on('preRedraw', function(chart){...})
     * .on('postRedraw', function(chart){...})
     * .on('filtered', function(chart, filter){...})
     * .on('zoomed', function(chart, filter){...})
     * @param {String} event
     * @param {Function} listener
     * @return {dc.baseMixin}
     */
    _chart.on = function (event, listener) {
        _listeners.on(event, listener);
        return _chart;
    };

    _chart.debounce = function (func, wait, immediate) {
      var timeout;

      return function() {
        var context = this, args = arguments;
        var later = function() {
          timeout = null;
          if (!immediate) func.apply(context, args);
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
      };
    }

    /**
     * Filters chart on click. Determines if filter is inverse and passes
     * that information to _chart.filter. Calls _chart.redrawGroup at the end.
     * @name handleFilterClick
     * @memberof dc.baseMixin
     * @instance
     * @example
     * chart.handleFilterClick(d3.event, filter);
     * @param {d3.event} event
     * @param {dc filter} filter
     * @return {dc.baseMixin}
     */
    _chart.handleFilterClick = function (event, filter) {
        var isInverseFilter = event.metaKey || event.ctrlKey
        dc.events.trigger(function () {
            _chart.filter(filter, isInverseFilter);
            _chart.redrawGroup();
        });
    }

    return _chart;
};
/******************************************************************************
 * END OVERRIDE: dc.baseMixin                                                 *
 * ***************************************************************************/
