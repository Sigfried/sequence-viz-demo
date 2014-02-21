'use strict()';
var seqViz = require('sequence-viz');
var _ = seqViz.supergroup;
var evtData = seqViz.evtData;
//var moment = require('moment');
//var seqVizSpec = require('sequence-viz/test/sequence-viz-spec.js');

describe('Timelines with doodads', function() {
    var bucket = {};
    beforeEach(function(done) {
        bucket.eventNodeWidth = 10;  // pixels now
        // need to do eventNodeWidth in pixels, not time units!!!!!
        var alignmentLineWidth = 1 * 1000 * 60 * 60 * 24;
        var data = [
                    {id:"1", event:"A", date:"1/1/1950"},
                    {id:"1", event:"B", date:"3/2/1950"},
                    {id:"1", event:"B", date:"3/12/1950"},
                    {id:"2", event:"A", date:"1/1/1960"},
                    {id:"2", event:"B", date:"1/16/1960"},
                    {id:"2", event:"C", date:"3/31/1960"},
                    {id:"2", event:"B", date:"6/29/1960"},
                    {id:"3", event:"B", date:"1/1/1970"},
                    {id:"3", event:"A", date:"1/11/1970"},
                    {id:"3", event:"B", date:"5/11/1970"},
                    {id:"3", event:"B", date:"6/10/1970"}
                    ];
        var eventOrder = ['A','B','C'];
        bucket.edata = evtData()
                .entityIdProp('id')
                .eventNameProp('event')
                .startDateProp('date')
        bucket.timelines = bucket.edata.makeTimelines(data);
        bucket.timelines.timelineUnit('day');
        bucket.startRecs = _(bucket.timelines)
                            .pluck('records')
                            .map(_.first).value();
        d3.select('body')
            .selectAll('div.timelines-test')
            .data(['stub'])
            .enter().append('div')
                .attr('class', 'timelines-test')
                .style('height','100%')
            .append('svg')
        bucket.container = d3.select('div.timelines-test>svg');
        bucket.done = done;
        makeChart(bucket);
    });
    describe('all scenarios', function() {
        it('should make a chart!', function() {
            expect(bucket.chart).toBeDefined();
        });
        it('should have some g.evet-nodes', function() {
            var nodes = bucket.container
                .selectAll('g.event-node>rect');
            expect(nodes.size()).toBeGreaterThan(0);
        });
        var nvd3_describe = (testPage === 'nvd3') ? describe : xdescribe;
        nvd3_describe('with nvd3', function() {
            it('should show a tooltip', function() {
                var e = document.createEvent('UIEvents');
                e.initUIEvent('mouseover', true, true );
                var nodes = bucket.container
                    .selectAll('g.event-node>rect');
                nodes.node().dispatchEvent(e);
                expect(d3.selectAll('div.nvtooltip').size())
                    .toBe(1);
            });
            it('should hide the tooltip', function() {
                var e = document.createEvent('UIEvents');
                e.initUIEvent('mouseout', true, true );
                var nodes = bucket.container
                    .selectAll('g.event-node>rect');
                nodes.node().dispatchEvent(e);
                expect(d3.selectAll('div.nvtooltip').size())
                    .toBe(0);
            });
        });
    });

});
