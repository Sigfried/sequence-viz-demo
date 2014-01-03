nv.models.evtChart = function () {
    //============================================================
    // Public Variables with Default Settings
    //------------------------------------------------------------
    var evt = nv.models.evt(),
        xAxis = nv.models.axis(),
        yAxis = nv.models.axis(),
        legendHeight = 27,
        hideLegend = nv.models.legend()
            .height(legendHeight)
            .updateState(false)
            .key(function(d) { return d.valueOf() })
            .label('Hide'),
        alignLegend = nv.models.legend().height(legendHeight)
            .updateState(false)
            .radioButtonMode(true)
            .label('Align/Sort')
            .key(function(d) { return d.valueOf() })
        , alignChoices
            ;
    var margin = {
            top: 80,
            right: 20,
            bottom: 50,
            left: 60
        }
        , width = null
        , height = null
        , eventNames
        , entities
        , showLegend = true
        , stacked = false
        /*
        , tooltips = true
        , tooltip = function(key, x, y, e, graph) {
            return '<h3>' + key + ' - ' + x + '</h3>' +
                '<p>' +  y + '</p>'
        }
        */
        , state = {
            stacked: stacked
        }
        , defaultState = null
        , noData = 'No Data Available.'
        , dispatch = d3.dispatch( // 'tooltipShow', 'tooltipHide', 
            'stateChange', 'changeState');
    ;
    yAxis
        .orient('left')
        .tickPadding(5)
        .highlightZero(false)
        .showMaxMin(false)
    //.tickFormat(function(d) { return d })
    ;
    //============================================================


    //============================================================
    // Private Variables
    //------------------------------------------------------------

    /*
    var showTooltip = function(e, offsetElement) {
        var left = e.pos[0] + ( offsetElement.offsetLeft || 0 ),
            top = e.pos[1] + ( offsetElement.offsetTop || 0),
            x = xAxis.tickFormat()(evt.x()(e.point, e.pointIndex)),
            y = yAxis.tickFormat()(evt.y()(e.point, e.pointIndex)),
            content = tooltip(e.series.key, x, y, e, chart);

        nv.tooltip.show([left, top], content, e.value < 0 ? 'e' : 'w', null, offsetElement);
    };
    */
    var svgHead, svgChart, svgFoot;
    //============================================================
    var rangeLower = new Date('01/01/1980');
    var rangeUpper = new Date('01/01/2030');
    var enddateStuff = _.once(function (data) {
        data.forEach(function (d) {
            d.endDate = new Date(d[chart.endDateField()]);
            if (!(d.endDate > rangeLower && d.endDate < rangeUpper)) {
                d.endDate = null;
            }
        });
    })

    function chart(selection) {
        selection.each(function (data) {
            var container = d3.select(this),
                that = this;

            var availableWidth = (width || parseInt(container.style('width')) || 960) - margin.left - margin.right,
                availableHeight = (height || parseInt(container.style('height')) || 400) - margin.top - margin.bottom;
            width = availableWidth + margin.left + margin.right;
            height = availableHeight + margin.top + margin.bottom;

            if (!data || !data.length) {
                var noDataText = container.selectAll('.nv-noData').data([noData]);
                noDataText.enter().append('p')
                    .attr('class', 'nvd3 nv-noData')
                    .style('text-align', 'center')
                    .style('top', '200px')
                    .text(function (d) {
                        return d
                    });
                return chart;
            } else {
                container.selectAll('.nv-noData').remove();
            }
            eventNames = chart.eventNames();
            if (!eventNames) {
                enddateStuff(data);
                eventNames = _.supergroup(data, chart.evtNameField())
                    .sort(function (a, b) {
                        return chart.evtOrder().indexOf(a.valueOf()) -
                            chart.evtOrder().indexOf(b.valueOf())
                    });
                console.log('creating alignChoices');
                alignChoices = [new String('Start'),new String('End')]
                        .concat(eventNames.map(function(d) { 
                            return new String(d.valueOf())}));
                _.each(alignChoices, function(d) { d.disabled = true });
                chart.eventNames(eventNames);
                // need way to make color scale for arbitrary
                // number of colors
                var evtColor = d3.scale.category20()
                    .domain(eventNames.rawValues().concat(['Start','End']));
                    //.domain(eventNames.rawValues().concat(['Start','End']));
                chart.color(evtColor);
                hideLegend.color(evtColor);
                alignLegend.color(evtColor);

                entities = _.supergroup(data, chart.idField());
                var rangeLower = new Date('01/01/1980');  // FIX!!!!
                var rangeUpper = new Date('01/01/2030');
                var oneDay = 1000 * 60 * 60 * 24;
                _(entities).each(function (d) {
                    _.each(d.records, function (r, i) {
                        r.startDate = new Date(r[chart.startDateField()]);
                        if (!(r.startDate > rangeLower && r.startDate < rangeUpper)) {
                            //console.log('invalid start date');
                            throw new Error('invalid start date');
                        }
                        if (!(r.endDate > rangeLower && r.endDate < rangeUpper)) {
                            r.endDate = null;
                            r.days = 1;
                        } else {
                            r.days = Math.round((r.endDate - r.startDate) / oneDay) || 1
                        }
                    })
                    d.records.sort(function (a, b) {
                        return a.startDate - b.startDate;
                    })
                    _.each(d.records, function (r, i) {
                        r.dayIdx = Math.round((r.startDate - d.records[0].startDate) / oneDay);
                    })
                    d.startDate = d.records[0].startDate;
                    d.endDate = d3.max(_(d.records).pluck('endDate'));
                    d.days = d.records[d.records.length - 1].dayIdx + 1; // days for last rec is always 1
                });
                entities = entities.sort(function (a, b) {
                    return a.startDate - b.startDate;
                });
            }
            //------------------------------------------------------------
            // Setup containers and skeleton of chart
            container.selectAll('svg.svg-head')
                .data([eventNames]).enter()
                .append('svg').attr('class', 'svg-head')
            //.attr('width', availableWidth)
            .attr('height', margin.top)
            var svgHead = container.select('svg.svg-head');

            var svgChart = container.selectAll('svg.svg-chart').data([entities])
            var gEnter = svgChart.enter()
                            .append('div')
                                //.style('width', availableWidth)
                                .style('height', availableHeight)
                                .style('overflow-y', 'scroll')
                            .append('svg').attr('class', 'svg-chart')
                                //.attr('width', availableWidth)
                                .attr('height', entities.length * 12)
                            .append('g').attr('class', 'nvd3 nv-wrap nv-evt-chart')
            gEnter.append('g').attr('class', 'nv-y nv-axis');
            gEnter.append('g').attr('class', 'nv-barsWrap');
            svgChart = svgChart.select('g.nv-evt-chart')
                        .attr('transform', 'translate(' + margin.left + ',0)');

            var svgFoot = container.selectAll('svg.svg-foot')
                            .data([eventNames])
            svgFoot.enter()
                .append('svg')
                    .attr('class', 'svg-foot')
                    //.attr('width', availableWidth)
                    .attr('height', margin.bottom)
                .append('g')
                    .attr('transform', 'translate(' + margin.left + ',0)')
                    .attr('class', 'nv-x nv-axis');
            svgFoot = container.select('svg.svg-foot>g')

            //chart.update = function() { container.transition().call(chart) };
            chart.update = function () {
                container.call(chart)
            };
            chart.svgChart = this;

            //set state.disabled
            /*
            state.disabled = data.map(function(d) { return !!d.disabled });

            if (!defaultState) {
                var key;
                defaultState = {};
                for (key in state) {
                if (state[key] instanceof Array)
                    defaultState[key] = state[key].slice(0);
                else
                    defaultState[key] = state[key];
                }
            }
            */
            // Legend
            hideLegend.width(availableWidth);
            alignLegend.width(availableWidth);
            /*
            if (evt.barColor())
                data.forEach(function(series,i) {
                //series.color = d3.rgb('#ccc').darker(i * 1.5).toString();
                })
            */

            var gHead = svgHead.selectAll('g').data(['stub']).enter().append('g')
                .each(function (d) {
                    var head = d3.select(this);
                    head.append('g')
                        .attr('class', 'nv-legendWrap evt-chart hide-legend')
                    head.append('g')
                        .attr('class', 'nv-legendWrap evt-chart align-legend')
                        .attr('transform', 'translate(0,' + legendHeight + ')')
                });
            gHead.selectAll('g.nv-series')
                .attr('evt-name', function (d) {
                    return d.valueOf()
                })

            svgHead.selectAll('g.hide-legend')
                .data([eventNames])
                .call(hideLegend);
            svgHead.select('g.align-legend')
                .data([alignChoices])
                .call(alignLegend);

            /*
            if ( margin.top != legend.height()) {
                margin.top = legend.height();
                availableHeight = (height || parseInt(svgHead.style('height')) || 400)
                                    - margin.top - margin.bottom;
            }
            gHead.select('.nv-legendWrap')
                .attr('transform', 'translate(0' + 
                    ',' + (-margin.top) +')');
            */

            hideLegend.dispatch.on('legendClick', function (e, i) {
                e.disabled = !e.disabled;
                chart.update();
            });

            hideLegend.dispatch.on('legendDblclick', function (d) {
                //Double clicking should always enable current series, and disable all others.
                data.forEach(function (d) { // broken
                    d.disabled = true;
                });
                d.disabled = false;

                //state.disabled = data.map(function(d) { return !!d.disabled });
                dispatch.stateChange(state);
                chart.update();
            });
            alignLegend.dispatch.on('legendClick', function (d) {
                if (!!d.disabled) {
                    alignChoices.forEach(function (d) {
                        d.disabled = true;
                    });
                    chart.alignBy(d.valueOf());
                    d.disabled = false;
                } else {
                    d.disabled = true;
                    chart.alignBy(false);
                }
                chart.update();
            });

            //------------------------------------------------------------
            // Setup Axes
            yAxis
                .scale(evt.yScale())
                .ticks(entities.length * 12 / 24)
                .tickSize(-availableWidth, 0);
            xAxis
                .orient('bottom')
                .scale(evt.xScale())
                .ticks(availableWidth / 100)
                .tickSize(-entities.length * 12, 0)
                .tickFormat(d3.time.format('%Y'));
            //------------------------------------------------------------
            // Main Chart Component(s)

            evt
                .disabled(data.map(function (series) {
                    return series.disabled
                })) // commented out with no apparent effect
            .width(availableWidth)
                .height(entities.length * 12)
            //.color(data.map(function(d,i) { return d.color || chart.color()(d, i); }) .filter(function(d,i) { return !data[i].disabled }))
            d3.transition(svgChart).call(evt);

            xAxis.scale(evt.xScale())
            if (chart.alignBy()) {
                xAxis.tickFormat(d3.format('5,'));
            } else {
                xAxis.tickFormat(d3.time.format('%Y'));
            }


            d3.transition()
                .duration(2000)
                .each(function() {
                    svgChart.select('.nv-y.nv-axis')
                    .call(yAxis);
                });
            var yTicks = svgHead.select('.nv-y.nv-axis').selectAll('g');
            yTicks
                .selectAll('line, text')
                .style('opacity', 1)

            svgFoot.select('.nv-x.nv-axis')
                .attr('transform', 'translate(0,' + entities.length * 12 + ')');
            d3.transition(svgFoot)
                .call(xAxis);

            //------------------------------------------------------------



            //============================================================
            // Event Handling/Dispatching (in chart's scope)
            //------------------------------------------------------------
            /*
            dispatch.on('tooltipShow', function(e) {
                if (tooltips) showTooltip(e, that.parentNode);
            });
            */

            // Update chart from a state object passed to event handler
            /*
            dispatch.on('changeState', function(e) {

                if (typeof e.disabled !== 'undefined') {
                data.forEach(function(series,i) {
                    series.disabled = e.disabled[i];
                });

                state.disabled = e.disabled;
                }

                if (typeof e.stacked !== 'undefined') {
                evt.stacked(e.stacked);
                state.stacked = e.stacked;
                }

                selection.call(chart);
            });
            */
            //============================================================


        });

        return chart;
    }


        //============================================================
        // Event Handling/Dispatching (out of chart's scope)
        //------------------------------------------------------------

        /*
        evt.dispatch.on('elementMouseover.tooltip', function(e) {
            e.pos = [e.pos[0] +  margin.left, e.pos[1] + margin.top];
            dispatch.tooltipShow(e);
        });

        evt.dispatch.on('elementMouseout.tooltip', function(e) {
            dispatch.tooltipHide(e);
        });
        dispatch.on('tooltipHide', function() {
            if (tooltips) nv.tooltip.cleanup();
        });
        */
    //============================================================
    // Expose Public Variables
    //------------------------------------------------------------

    // expose chart's sub-components
    chart.dispatch = dispatch;
    chart.evt = evt;
    //chart.legend = legend;
    chart.yAxis = yAxis;

    d3.rebind(chart, evt, 'clipEdge', 'id', 'delay', 'showValues', 'valueFormat', 'barColor', 'idField', 'evtNameField', 'evtOrder', 'startDateField', 'endDateField', 'defaultDuration', 'color', 'eventNames', 'alignBy');
    chart.margin = function (_) {
        if (!arguments.length) return margin;
        margin.top = typeof _.top != 'undefined' ? _.top : margin.top;
        margin.right = typeof _.right != 'undefined' ? _.right : margin.right;
        margin.bottom = typeof _.bottom != 'undefined' ? _.bottom : margin.bottom;
        margin.left = typeof _.left != 'undefined' ? _.left : margin.left;
        return chart;
    };

    chart.width = function (_) {
        if (!arguments.length) return width;
        width = _;
        return chart;
    };

    chart.height = function (_) {
        if (!arguments.length) return height;
        height = _;
        return chart;
    };

    chart.showLegend = function (_) {
        if (!arguments.length) return showLegend;
        showLegend = _;
        return chart;
    };

        /*
    chart.tooltip = function(_) {
        if (!arguments.length) return tooltip;
        tooltip = _;
        return chart;
    };

    chart.tooltips = function(_) {
        if (!arguments.length) return tooltips;
        tooltips = _;
        return chart;
    };

    chart.tooltipContent = function(_) {
        if (!arguments.length) return tooltip;
        tooltip = _;
        return chart;
    };
    */

    chart.state = function (_) {
        if (!arguments.length) return state;
        state = _;
        return chart;
    };

    chart.defaultState = function (_) {
        if (!arguments.length) return defaultState;
        defaultState = _;
        return chart;
    };

    chart.noData = function (_) {
        if (!arguments.length) return noData;
        noData = _;
        return chart;
    };

    //============================================================


    return chart;
}
