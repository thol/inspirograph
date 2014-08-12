﻿/// <reference path='../definitions/references.d.ts' />

module Spirograph.Interaction {
    'use strict';

    var backgroundRed = 0,
        backgroundGreen = 0,
        backgroundBlue = 0,
        backgroundAlpha = 0;

    EventAggregator.subscribe('downloadImage', (callback: () => any, downloadImage: boolean = false) => {
        var canvas = <HTMLCanvasElement> d3.select('#spirograph-canvas').node();
        $.ajax({
            type: 'POST',
            url: 'saveimage.php',
            data: {
                img: canvas.toDataURL(),
                red: backgroundRed,
                green: backgroundGreen,
                blue: backgroundBlue,
                alpha: backgroundAlpha,
                submitToGallery: !downloadImage
            },
            success: (imagename) => {
                if (callback) { callback(); }
                if (downloadImage) {
                    location.href = "getimage.php?imagename=" + imagename;
                }
            }
        });
    });

    EventAggregator.subscribe('colorSelected', (r: number, g: number, b: number, a: number, foregroundOrBackground: string) => {
        if (foregroundOrBackground === 'background') {
            backgroundRed = r;
            backgroundGreen = g;
            backgroundBlue = b;
            backgroundAlpha = a;
        }
    });
}  