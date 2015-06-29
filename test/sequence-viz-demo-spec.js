'use strict()';

var d3 = require('d3');
//var nv = require('nvd3');
var nv = require('nvd3');
var seqViz = require('sequence-viz');
var _ = require('supergroup');
var moment = require('moment');
var evtData = seqViz.evtData;
//var lifeflowData = require('../sequence-viz/lifeflowData');
//var lifeflow = require('../sequence-viz/lifeflow.js');
var seqVizSpec = require('sequence-viz/test/sequence-viz-spec.js');

describe('Lifeflow with doodads', function() {
    var bucket = {};
    beforeEach(function(done) {
        bucket.eventNodeWidth = 10;  // pixels now
        // need to do eventNodeWidth in pixels, not time units!!!!!
        var alignmentLineWidth = 1 * 1000 * 60 * 60 * 24;
        var csv =   "id,event,date\n" +
                    "1,A,1/1/1950\n" +
                    "1,B,3/2/1950\n" +
                    "1,B,3/12/1950\n" +
                    "2,A,1/1/1960\n" +
                    "2,B,1/16/1960\n" +
                    "2,C,3/31/1960\n" +
                    "2,B,6/29/1960\n" +
                    "3,B,1/1/1970\n" +
                    "3,A,1/11/1970\n" +
                    "3,B,5/11/1970\n" +
                    "3,B,6/10/1970\n";
        var data = d3.csv.parse(csv);
        var eventOrder = ['A','B','C'];
        bucket.edata = evtData()
                .entityIdProp('id')
                .eventNameProp('event')
                .startDateProp('date')
        bucket.timelines = bucket.edata.makeTimelines(data);
        bucket.timelines.timelineUnit('day');
        bucket.startRecs = bucket.timelines
                            .pluck('records')
                            .map(_.first);
        bucket.nodeTree = lifeflowData()
                .eventNameProp('event')
                .timelines(bucket.timelines)
                (bucket.startRecs, 'noflatten');
        bucket.nodeList = bucket.nodeTree.flattenTree();
        d3.select('body')
            .selectAll('div.lifeflow-test')
            .data(['stub'])
            .enter().append('div')
                .attr('class', 'lifeflow-test')
                .style('height','100%')
            .append('svg')
        bucket.container = d3.select('div.lifeflow-test>svg');
        bucket.done = done;
        makeChart(bucket);
        return;
        self.chart = lifeflowChart()
            .eventNodeWidth(100000000)
            .height(window.innerHeight - 120)
            .width(window.innerWidth - 100)
        self.container
                .datum(self.nodeList)
                .call(self.chart)
        var extras = lifeflowExtras();
        //chart.dispatch.on('lifeflowMouseover', extras.nodeTooltip);
        self.chart.dispatch.on("lifeflowMouseover",
            function(lfChart, domNode, lfnode, i) {
                var gNode = domNode.parentNode; // event is on the rect now
                extras.showEvtDistribution(lfChart, gNode,
                    lfnode, i);
                //extras.nodeTooltip(lfChart, gNode, lfnode, i);
                extras.nodeDumpTooltip(lfChart, gNode, lfnode, i);
            });
        extras.dispatch.on('distNodeMouseover', extras.distNodeTooltip);
            //function(chrt, domNode, lfNode, i) { alert(d); };
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
