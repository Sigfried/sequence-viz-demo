'use strict()';
describe('Lifeflow with doodads', function() {
    beforeEach(function() {
        var eventNodeWidth = 2 * 1000 * 60 * 60 * 24; // ends up in miliseconds!
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
        self.edata = evtData()
                .entityIdProp('id')
                .eventNameProp('event')
                .startDateProp('date')
        self.timelines = self.edata.makeTimelines(data);
        self.timelines.timelineUnit('day');
        self.startRecs = self.timelines
                            .pluck('records')
                            .map(_.first);
        self.nodeTree = lifeflowData()
                .eventNameProp('event')
                .eventNodeWidth(eventNodeWidth)
                .timelines(self.timelines)
                (startRecs, 'noflatten');
        self.nodeList = self.nodeTree.flattenTree();
    });
    describe('Lifeflow', function() {
        it('should make a chart!', function() {
            var container = d3.select('body')
                            .append('div')
                                .style('height','100%')
                            .append('svg')
            expect(container).toBeDefined();
            var chart = lifeflowChart()
                .eventNodeWidth(100000000)
                .height(window.innerHeight - 120)
                .width(window.innerWidth - 100)
            container
                    .datum(self.nodeList)
                    .call(chart)
            var extras = lifeflowExtras();
            //chart.dispatch.on('lifeflowMouseover', extras.nodeTooltip);
            chart.dispatch.on("lifeflowMouseover",
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
    });
});
