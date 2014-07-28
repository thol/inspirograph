/// <reference path='definitions/references.d.ts' />
var _this = this;
var Spirograph;
(function (Spirograph) {
    'use strict';

    var x = d3.scale.linear().domain([0, Spirograph.canvasWidth]).range([0, Spirograph.canvasWidth]);

    var y = d3.scale.linear().domain([0, Spirograph.canvasHeight]).range([Spirograph.canvasHeight, 0]);

    var canvas = d3.select("body").append("canvas").attr({
        id: 'spirograph-canvas',
        width: Spirograph.canvasWidth,
        height: Spirograph.canvasHeight
    });

    //.call(d3.behavior.zoom().x(x).y(y).scaleExtent([.2, 8]).on("zoom", zoom))
    //.on('mousedown.zoom', null)
    var ctx = canvas.node().getContext('2d');
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    function zoom() {
        console.log(d3.event.scale);
        $(canvas.node()).css({
            transform: 'scale(' + d3.event.scale + ',' + d3.event.scale + ')'
        });
    }

    var svgRootElement = d3.select("body").append("svg").attr({
        width: Spirograph.svgWidth,
        height: Spirograph.svgHeight,
        id: 'spirograph-svg'
    });

    var svgContainer = svgRootElement.call(d3.behavior.zoom().scaleExtent([.2, 8]).center([Spirograph.svgWidth / 2, Spirograph.svgHeight / 2]).on('zoom', function () {
        svgContainer.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");

        zoom();
    })).on('mousedown.zoom', null).append('g');

    var gearOptions = (new Spirograph.Shapes.GearOptionsFactory(1)).create(64);
    var ringGearOptions = (new Spirograph.Shapes.RingGearOptionsFactory(1)).create(144, 96);
    var fixedGearOptions = (new Spirograph.Shapes.GearOptionsFactory(1)).create(24);

    var beamOptions = {
        endCapsToothCount: 20,
        toothHeight: 10,
        totalToothCount: 150
    };

    var fixedGear = svgContainer.append('g').attr('class', 'gear fixed color-changing').attr("transform", "translate(" + Spirograph.getSvgCenterX() + "," + Spirograph.getSvgCenterY() + ")").datum(fixedGearOptions).append("path").attr("d", Spirograph.Shapes.Gear);

    var beam = svgContainer.append('g').attr('class', 'gear beam fixed color-changing').attr("transform", "translate(" + Spirograph.getSvgCenterX() + "," + Spirograph.getSvgCenterY() + ")").datum(beamOptions).append("path").attr("d", Spirograph.Shapes.Beam);

    var ringGear = svgContainer.append("g").attr("class", "gear ring-gear fixed color-changing").attr("transform", "translate(" + Spirograph.getSvgCenterX() + "," + Spirograph.getSvgCenterY() + ")").datum(ringGearOptions).append("path").attr("d", Spirograph.Shapes.RingGear);

    var gear = svgContainer.append("g").attr("class", "gear color-changing").datum(gearOptions);

    gear.append("path").attr("d", Spirograph.Shapes.Gear);

    Spirograph.EventAggregator.publish('colorSelected', 255, 0, 0, .4, 'foreground');

    $('#hide-gears-button').mousedown(function () {
        gear.style('visibility', 'hidden');
        ringGear.style('visibility', 'hidden');
    }).mouseup(function () {
        gear.style('visibility', 'visible');
        ringGear.style('visibility', 'visible');
    });

    ringGear.style('visibility', 'hidden');

    //beam.style('visibility', 'hidden');
    fixedGear.style('visibility', 'hidden');

    var allHoleOptions = (new Spirograph.Shapes.GearHoleGenerator()).generate(gearOptions);
    var holeOptions;
    allHoleOptions.forEach(function (hole, index) {
        var holeObject = gear.append('path').attr('class', 'gear-hole').datum(hole).attr('d', Spirograph.Shapes.GearHole);

        holeObject.on('click', function () {
            d3.selectAll('.selected').classed('selected', false);
            holeObject.classed('selected', true);

            holeOptions = hole;

            initializeGearAndPen(false);
        });

        if (index === 0) {
            holeObject.on('click')(null, null);
        }
    });

    var previousTransformInfo = null;

    //var rotater = new Shapes.RingGearRotater(ringGearOptions);
    var rotater = new Spirograph.Shapes.BeamRotater(beamOptions);

    //var rotater = new Shapes.GearRotater(fixedGearOptions);
    console.log(JSON.stringify(rotater.rotate(gearOptions, 0, holeOptions)));

    var lastMouseAngle = null;
    var rotationOffset = 0;

    var svgContainerMouseMove = function (d, i) {
        var mouseCoords = Spirograph.Utility.toStandardCoords({ x: d3.mouse(svgRootElement.node())[0], y: d3.mouse(svgRootElement.node())[1] }, { x: Spirograph.svgWidth, y: Spirograph.svgHeight });
        var mouseAngle = Spirograph.Utility.toDegrees(Math.atan2(mouseCoords.y, mouseCoords.x));

        if (lastMouseAngle != null) {
            if (lastMouseAngle < -90 && mouseAngle > 90) {
                rotationOffset--;
            } else if (lastMouseAngle > 90 && mouseAngle < -90) {
                rotationOffset++;
            }
        }

        lastMouseAngle = mouseAngle;
        mouseAngle += (rotationOffset * 360);

        var transformInfo = rotater.rotate(gearOptions, mouseAngle, holeOptions);

        //$('#output').html('<p>Mouse angle: ' + mouseAngle + '</p><p>Gear angle: ' + transformInfo.angle + '</p>');
        gear.attr("transform", "translate(" + transformInfo.x + "," + transformInfo.y + ") rotate(" + transformInfo.angle + ")");

        var previousCanvasPenCoords = Spirograph.Utility.svgToCanvasCoords({ x: previousTransformInfo.penX, y: previousTransformInfo.penY });
        var currentCanvasPenCoords = Spirograph.Utility.svgToCanvasCoords({ x: transformInfo.penX, y: transformInfo.penY });

        if (previousTransformInfo !== null) {
            ctx.beginPath();
            ctx.moveTo(previousCanvasPenCoords.x, previousCanvasPenCoords.y);
            ctx.lineTo(currentCanvasPenCoords.x, currentCanvasPenCoords.y);
            ctx.stroke();
            ctx.closePath();
        }

        previousTransformInfo = transformInfo;
    };

    gear.on("mousedown", function (d, i) {
        gear.classed('dragging', true);

        svgRootElement.on("mousemove", svgContainerMouseMove);

        svgRootElement.on("mouseup", function () {
            svgRootElement.on("mousemove", null);
            gear.classed('dragging', false);
        });
    });

    function initializeGearAndPen(resetGear) {
        if (typeof resetGear === "undefined") { resetGear = true; }
        //previousTransformInfo = rotater.rotate(gearOptions, 0, holeOptions);
        previousTransformInfo = null;

        if (resetGear) {
            previousTransformInfo = rotater.rotate(gearOptions, 0, holeOptions);
            gear.attr("transform", "translate(" + previousTransformInfo.x + "," + previousTransformInfo.y + ") rotate(" + previousTransformInfo.angle + ")");
        }
    }

    initializeGearAndPen();

    Spirograph.Interaction.KeyboardShortcutManager.add(39 /* RightArrow */, function () {
        // add shortcut here
    });

    Spirograph.EventAggregator.subscribe('gearSelected', function (gearSize, fixedOrRotating) {
        //alert(fixedOrRotating + ": " + gearSize.toString());
        //gearOptions = (new Shapes.GearOptionsFactory()).create(gearSize);
        console.log(fixedOrRotating + ' gear selected: ' + gearSize);
    });
})(Spirograph || (Spirograph = {}));

// download canvas as image functionality... not fully working yet
document.getElementById('download-link').addEventListener('click', function () {
    var link = _this;
    var data = document.getElementById('spirograph-canvas').toDataURL();
    _this.download = 'spirograph.png';
    window.location.href = data;
}, false);

var myCallback = function () {
    alert('escape was pushed!!');
};
//# sourceMappingURL=app.js.map
