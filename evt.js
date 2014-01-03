nv.models.evt = function() {

  //============================================================
  // Public Variables with Default Settings
  //------------------------------------------------------------

  var margin = {top: 0, right: 0, bottom: 0, left: 0}
    , idField = null
    , evtNameField = null
    , eventNames = null
    , evtOrder = null
    , startDateField = null
    , endDateField = null
    , defaultDuration = null
    , width = 960
    , height = 500
    , id = Math.floor(Math.random() * 10000) //Create semi-unique ID in case user doesn't select one
    , x = d3.time.scale()
    , y = d3.scale.ordinal()
    , getX = function(d) { return d.x }
    , getY = function(d) { return d.y }
    , forceX = [0] // 0 is forced by default.. this makes sense for the majority of bar graphs... user can always do chart.forceX([]) to remove
    , color = nv.utils.defaultColor()
    , barColor = null // adding the ability to set the color for each rather than the whole group
    , disabled // used in conjunction with barColor to communicate from multiBarHorizontalChart what series are disabled
    , showValues = false
    , valuePadding = 60
    , valueFormat = d3.format(',.2f')
    , delay = 1200
    , xDomain
    , yDomain
    , dispatch = d3.dispatch('chartClick', 'elementClick', 'elementDblClick', 'elementMouseover', 'elementMouseout')
    , controlsData
    , alignBy
    ;
  //============================================================
  var firstTime = true;
  function chart(selection) {
    selection.each(function(data) {
        var availableWidth = width - margin.left - margin.right,
            availableHeight = height - margin.top - margin.bottom,
            container = d3.select(this);
        //------------------------------------------------------------
            // should just use a group function:
        var enabledEventNames = _.filter(chart.eventNames(),function(d){return !d.disabled});
        var disabledEventNames = _.filter(chart.eventNames(),function(d){return d.disabled});
        _.each(data, function(d) {
            d.displayRecs = _.filter(d.records, function(r,i) {
                r.recIdx = i;
                return enabledEventNames.rawValues().indexOf(r[chart.evtNameField()]) !== -1;
            });
            _.each(
                d.displayRecs.sort(function(a,b) { return a.startDate - b.startDate}), 
                function(r, i) 
                { 
                    if (i < d.displayRecs.length - 1) {
                        r.endDate = d.displayRecs[i+1].startDate
                    } else {
                        r.endDate = null;
                    }
                    r.days = r.days || r.oldDays;
                });
            d.hideRecs = _.filter(d.records, function(r) {
                return disabledEventNames.rawValues().indexOf(r[chart.evtNameField()]) !== -1;
            });
            _.each(d.hideRecs, function(r, i) { 
                r.endDate = r.startDate 
                r.oldDays = r.days;
                r.days = 0;
            })
            d.startDate = d3.min(_(d.displayRecs).pluck('startDate')); 
            d.endDate = d3.max(_(d.displayRecs).pluck('endDate'));
        })
        // Setup Scales
        if (firstTime) {
            firstTime = false;
            x.domain([
                d3.min(_(data).pluck('startDate')), 
                d3.max(_(data).pluck('endDate')), 
            ]);
        }
        var fmt = d3.format('013d');
        if (chart.alignBy()) {
            console.log('alignBy ' + chart.alignBy());
            _.each(data, function(d) {
                var evtName = chart.evtNameField();
                if (chart.alignBy() === 'Start') {
                    d.sortVal = fmt(d.days);
                    d.alignDayIdx = 0;
                    d.alignRecIdx = 0;
                    return;
                }
                if (chart.alignBy() === 'End') {
                    d.sortVal = fmt(d.days);
                    d.alignDayIdx = d.days;
                    d.alignRecIdx = d.records.length - 1;
                    return;
                }
                var idx = _(d.records).pluck(evtName).indexOf(chart.alignBy().valueOf());
                d.sortVal = d.sortVal ? ('.'+d.sortVal) : '';
                if (idx > -1) {
                    d.alignDayIdx = d.records[idx].dayIdx;
                    d.sortVal = fmt(d.records[idx].days) + d.sortVal;
                    d.alignRecIdx = idx;
                } else {
                    //d.alignDayIdx = null;
                    d.alignDayIdx = 0;
                    d.sortVal = 0 + d.sortVal;
                    d.alignRecIdx = 0;
                }
            })
            data.sort(function(a,b) { 
                return d3.descending(a.sortVal,b.sortVal);
            });
            x = d3.scale.linear()
                    .range([0, availableWidth])
                    .domain([
                        -d3.max(_(data).pluck('alignDayIdx')),
                        d3.max(_(data).map(function(d) {
                            return d.days - d.alignDayIdx
                        })) ]);
        } else {
            x = d3.time.scale()
                    .range([0, availableWidth])
                    .domain([
                        d3.min(_(data).pluck('startDate')), 
                        d3.max(_(data).pluck('endDate')), 
                    ]);
            _.each(data, function(d) {
                d.sortVal = d.sortVal ? ('.'+d.sortVal) : '';
                d.sortVal = fmt(d.startDate) + d.sortVal;
            });
            data.sort(function(a,b) { 
                return d3.ascending(a.sortVal,b.sortVal);
            });
        }
        y.domain(data.rawValues());
        x.range([0, availableWidth]);
        y.rangeBands([0, availableHeight], .1);
        chart.xScale(x);
        //------------------------------------------------------------
        // Setup containers and skeleton of chart
        var wrap = d3.select(this).selectAll('g.nv-wrap.nv-multibarHorizontal')
                    .data([data]);

        var wrapEnter = wrap.enter().append('g').attr('class', 'nvd3 nv-wrap nv-multibarHorizontal');
        var gEnter = wrapEnter.append('g');
        var g = wrap.select('g');
        gEnter.append('g').attr('class', 'nv-groups');
        wrap.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
        // only allowing for a single group. took code from nvd3 multibarHorizontal
        // which would have multiple groups here i guess
        var lines = wrap.select('.nv-groups').selectAll('.nv-group')
            .data(data, function(d) { 
                return d.valueOf() })
            .order()
        var something = lines.enter().append('g')
            .style('stroke-opacity', 1e-6)
            .style('fill-opacity', 1e-6);
        lines
            .attr('class', function(d,i) { return 'nv-group nv-series-' + i })
            .classed('hover', function(d) { return d.hover })
            .style('fill', function(d,i){ return color(d, i) })
            .style('stroke', function(d,i){ return color(d, i) })
            .transition()
            //.delay(function(d, i) { return i * 200; })
            //.duration(function(d,i) { return 200})
            .delay(1000)
            .duration(2000)
            .attr('transform', function(d, i) {
                var yVal = y(d.valueOf());
                return 'translate(' + 0 + ',' + yVal + ')' 
            })
        d3.transition(lines)
            .style('stroke-opacity', 1)
            .style('fill-opacity', .75);

            /*
        d3.selectAll('g.nv-legendWrap.evt-chart')
            .selectAll('g.nv-series.disabled')
        _.chain(chart.eventNames())
            .filter(function(d) { return d.disabled })
            .each(function(d) { 
                //console.log(d.key) 
                lines.selectAll('[evt-name="'+d.key+'"]')
                    .select('rect')
                    .transition().duration(500).attr('width', 0)
                        //.remove();
            })
        */
        //if (junk++ > 1) return;
        var bars = lines.selectAll('g.nv-bar')
            .data(
                function(d) { return d.records }
                , function(d) { return d[chart.evtNameField()] }
                )

        var barsEnter = bars.enter().append('g')
            .attr('class','nv-bar')
            //.attr('transform', 'translate(0,0)')
            //.attr('transform', function(d,i,j) {
                //return 'translate(' + x(d.startDate) + ',' + y(d[chart.idField()]) + ')' });

        barsEnter.append('rect')
            //.attr('width', 0)
            .attr('height', y.rangeBand())
            .attr('evt-name', function(d,i) { return d[chart.evtNameField()] })
            .style('fill', function(d) { return chart.color()(d[chart.evtNameField()]) })

        barsEnter.append('text');

        /*
        if (showValues) {
            bars.select('text')
                .attr('text-anchor', function(d,i) { return getY(d,i) < 0 ? 'end' : 'start' })
                .attr('y', y.rangeBand() / (data.length * 2))
                .attr('dy', '.32em')
                .text(function(d,i) { return d.days })
            d3.transition(bars)
                //.delay(function(d,i) { return i * delay / data[0].values.length })
                .select('text')
                .attr('dy','.7em')
                .attr('x', function(d,i) { return getX(d,i) < 0 ? -4 : x(getX(d,i)) - x(0) + 4 })
        } else {
            //bars.selectAll('text').remove();
            bars.selectAll('text').text('');
        }
        */

        //d3.transition(bars).select('rect')
        /*
        bars
            .transition()
            .delay(function(d, i) { return i * 1250; })
            .duration(function(d,i) { return 500 * i })
            .attr('transform', function(d,i,j) {
                var xVal = d3.select(this).attr('xVal') || 0;
                return 'translate(' + xVal + ',0)'
            });
            */
        bars
            .transition()
            //.delay(2000)
            //.delay(function(d, i) { return i / data.length * 2250; })
            //.delay(function(d, i) { return i * 1250; })
            //.duration(function(d,i) { return 500 * i })
            .duration(1000)
            .attr('transform', function(d,i,j) {
                var yVal = y(d[chart.idField()]);
                if (chart.alignBy()) {
                    //var daysOffset = d.dayIdx - this.parentElement.__data__.alignDayIdx;
                    var slice = this.parentElement.__data__.records
                            .slice(
                                Math.min(d.recIdx,this.parentElement.__data__.alignRecIdx),
                                Math.max(d.recIdx,this.parentElement.__data__.alignRecIdx)
                                );
                    var daysOffset = d3.sum(_(slice).pluck('days')) *
                            d3.ascending(d.recIdx,this.parentElement.__data__.alignRecIdx);
                    var xVal = x(daysOffset);
                } else {
                    var xVal = x(d.startDate);
                }
                d3.select(this).attr('xVal',xVal);
                return 'translate(' + xVal + ',0)'
            })
        .select('rect')
            //.transition().duration(1000)
            //.attr('height', y.rangeBand() / data.length )
            .attr('width', function(d,i) {
                if (disabledEventNames.rawValues().indexOf(d[chart.evtNameField()]) > -1) {
                    return 0;
                }
                if (chart.alignBy()) {
                    return Math.max(6, x(d.days) - x(0))
                } else {
                    if (d.endDate === null) {
                        return 6;
                    } else {
                        return x(d.endDate) - x(d.startDate);
                    }
                }
            });
        bars.exit().transition().delay(1000).remove();
        bars
            .on('mouseover', function(d,i) { //TODO: figure out why j works above, but not here
                d3.select(this).classed('hover', true);
                dispatch.elementMouseover({
                value: getY(d,i),
                point: d,
                series: data[d.series],
                pos: [ 
                        x(getX(d,i)),
                        y(getY(d,i)) + (y.rangeBand() * d.series + .5 / data.length) 
                    ],
                pointIndex: i,
                seriesIndex: d.series,
                e: d3.event
                });
            })
            .on('mouseout', function(d,i) {
                d3.select(this).classed('hover', false);
                dispatch.elementMouseout({
                value: getY(d,i),
                point: d,
                series: data[d.series],
                pointIndex: i,
                seriesIndex: d.series,
                e: d3.event
                });
            })
            .on('click', function(d,i) {
                dispatch.elementClick({
                value: getY(d,i),
                point: d,
                series: data[d.series],
                pos: [
                        x(getX(d,i)),
                        y(getY(d,i)) + (y.rangeBand() * d.series + .5 / data.length) 
                    ],  // TODO: Figure out why the value appears to be shifted
                pointIndex: i,
                seriesIndex: d.series,
                e: d3.event
                });
                d3.event.stopPropagation();
            })
            .on('dblclick', function(d,i) {
                dispatch.elementDblClick({
                value: getY(d,i),
                point: d,
                series: data[d.series],
                pos: [
                        x(getX(d,i)),
                        y(getY(d,i)) + (y.rangeBand() * d.series + .5 / data.length) 
                    ],
                pointIndex: i,
                seriesIndex: d.series,
                e: d3.event
                });
                d3.event.stopPropagation();
            });


    });

    return chart;
  }


  //============================================================
  // Expose Public Variables
  //------------------------------------------------------------

  chart.dispatch = dispatch;

  chart.idField = function(_) {
    if (!arguments.length) return idField;
    idField = _;
    return chart;
  };
  chart.evtNameField = function(_) {
    if (!arguments.length) return evtNameField;
    evtNameField = _;
    return chart;
  };
  chart.evtOrder = function(_) {
    if (!arguments.length) return evtOrder;
    evtOrder = _;
    return chart;
  };
  chart.startDateField = function(_) {
    if (!arguments.length) return startDateField;
    startDateField = _;
    return chart;
  };
  chart.endDateField = function(_) {
    if (!arguments.length) return endDateField;
    endDateField = _;
    return chart;
  };
  chart.defaultDuration = function(_) {
    if (!arguments.length) return defaultDuration;
    defaultDuration = _;
    return chart;
  };
  chart.margin = function(_) {
    if (!arguments.length) return margin;
    margin.top    = typeof _.top    != 'undefined' ? _.top    : margin.top;
    margin.right  = typeof _.right  != 'undefined' ? _.right  : margin.right;
    margin.bottom = typeof _.bottom != 'undefined' ? _.bottom : margin.bottom;
    margin.left   = typeof _.left   != 'undefined' ? _.left   : margin.left;
    return chart;
  };

  chart.eventNames = function(_) {
    if (!arguments.length) return eventNames;
    eventNames = _;
    return chart;
  };
  chart.width = function(_) {
    if (!arguments.length) return width;
    width = _;
    return chart;
  };

  chart.height = function(_) {
    if (!arguments.length) return height;
    height = _;
    return chart;
  };

  chart.xScale = function(_) {
    if (!arguments.length) return x;
    x = _;
    return chart;
  };

  chart.yScale = function(_) {
    if (!arguments.length) return y;
    y = _;
    return chart;
  };

  chart.xDomain = function(_) {
    if (!arguments.length) return xDomain;
    xDomain = _;
    return chart;
  };

  chart.yDomain = function(_) {
    if (!arguments.length) return yDomain;
    yDomain = _;
    return chart;
  };

  chart.forceX = function(_) {
    if (!arguments.length) return forceX;
    forceX = _;
    return chart;
  };

  chart.color = function(_) {
    if (!arguments.length) return color;
    color = nv.utils.getColor(_);
    return chart;
  };

  chart.barColor = function(_) {
    if (!arguments.length) return barColor;
    barColor = nv.utils.getColor(_);
    return chart;
  };

  chart.disabled = function(_) {
    if (!arguments.length) return disabled;
    disabled = _;
    return chart;
  };

  chart.id = function(_) {
    if (!arguments.length) return id;
    id = _;
    return chart;
  };

  chart.delay = function(_) {
    if (!arguments.length) return delay;
    delay = _;
    return chart;
  };

  chart.showValues = function(_) {
    if (!arguments.length) return showValues;
    showValues = _;
    return chart;
  };

  chart.valueFormat= function(_) {
    if (!arguments.length) return valueFormat;
    valueFormat = _;
    return chart;
  };

  chart.valuePadding = function(_) {
    if (!arguments.length) return valuePadding;
    valuePadding = _;
    return chart;
  };

  chart.controlsData = function(_) {
    if (!arguments.length) return controlsData;
    controlsData = _;
    return chart;
  };
  chart.alignBy = function(_) {
    if (!arguments.length) return alignBy;
    alignBy = _;
    return chart;
  };
  function makeGetterSetter(obj, prop) { // might be nice
      // but lose the link to enclosed public vars
      var closureVals = {};
      obj[prop] = function(_) {
        if (!arguments.length) console.log('getting ' + prop + ': ' + closureVals[prop]);
        if (!arguments.length) return closureVals[prop];
        console.log('setting ' + prop + ': ' + _);
        closureVals[prop] = _;
        return obj;
      };
  }
  //============================================================


  return chart;
}
