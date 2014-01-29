'use strict()';
describe('Lifeflow with doodads', function() {
    beforeEach(function() {
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
    describe('everything', function() {
        it('should make a chart!', function() {
            expect(stuff.chart).toBeDefined();
        });
        it('should have some g.evet-nodes', function() {
            var nodes = stuff.container
                .selectAll('g.event-node>rect');
            expect(nodes.size()).toBeGreaterThan(0);
        });
    });
    false && testPage === 'nvd3' && describe('with nvd3', function() {
        beforeEach(function() {
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
            self.chart.dispatch.on("lifeflowMouseout", nv.tooltip.cleanup);
        });
        it('should show a tooltip', function() {
            var e = document.createEvent('UIEvents');
            e.initUIEvent('mouseover', true, true );
            var nodes = self.container
                .selectAll('g.event-node>rect');
            nodes.node().dispatchEvent(e);
            expect(d3.selectAll('div.nvtooltip').size())
                .toBe(1);
        });
        it('should hide the tooltip', function() {
            var e = document.createEvent('UIEvents');
            e.initUIEvent('mouseout', true, true );
            var nodes = self.container
                .selectAll('g.event-node>rect');
            nodes.node().dispatchEvent(e);
            expect(d3.selectAll('div.nvtooltip').size())
                .toBe(0);
        });
    });
});
