/// <reference path="_References.ts" />

"use strict";

module frnk.UI.Charts.Html {
    export function getHeight(svg: any): number {
        return svg.node().getBBox().height;
    }

    export function getWidth(svg: any): number {
        return svg.node().getBBox().width;
    }

    export function align (svg: any, width: any, alignment: string, margin: number): number {
        var x: number = 0;
        switch (alignment) {
            case "left":
                x = 0 + margin;
                break;
            case "center":
                x = (width - Html.getWidth(svg)) / 2;
                break;
            case "right":
                x = width - Html.getWidth(svg) - margin;
                break;
        }
        return x;
    }

    export function valign(svg: any, height: any, alignment: string, margin: number): number {
        var y: number = 0;
        switch (alignment) {
            case "top":
                y = 0 + margin;
                break;
            case "middle":
                y = (height - Html.getHeight(svg)) / 2;
                break;
            case "bottom":
                y = height - Html.getHeight(svg) - margin;
                break;
        }
        return y;
    }
}