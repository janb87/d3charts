/// <reference path="_References.ts" />

"use strict";

module frnk.UI.Charts {

    export class StackedPercentBarChart extends StackedBarChart {

        constructor(selector: string, data: IData, options?: IOptions) {
            super(selector, data, options);
            this.stackType = StackType.Percent;
            for (var i = 0; i < this.axes.length; i++) {
                if (this.axes[i] instanceof XAxis) {
                    this.axes[i].labels.format = "%";
                }
            }
        }

        public getWidth(d: any, i: number, serie: number): any {
            var index = this.getAxisByName(AxisType.X, this.series.items[serie].axis);
            var axis = this.axes[index];

            return Math.abs((axis.scale(1) - axis.scale(0)) * d.perc);
        }

        public getXScale(axis: Axis): any {
            var min = this.series.getMinValue(name);

            var start = this.canvas.plotArea.axisSize.left;
            var end =  this.canvas.plotArea.axisSize.left + this.canvas.plotArea.width;

            axis.setScaleType(ScaleType.Linear);
            return d3.scale.linear()
                .domain([min < 0 ? -1 : 0, 1])
                .range([start, end]);
        }

        public normalizer(d: any, serie: number): number {
            var index = this.getAxisByName(AxisType.X, this.series.items[serie].axis);
            var axis = this.axes[index];

            return axis.scale.domain()[1] / d.max;
        }
    }
}