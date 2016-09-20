/// <reference path="_References.ts" />

"use strict";

module frnk.UI.Charts {
    export class StackedPercentLineChart extends StackedLineChart {

        constructor(args: ISettings, selector: string) {
            super(args, selector);
            this.stackType = StackType.Percent;
            for (var i = 0; i < this.yAxes.length; i++) {
                this.yAxes[i].format = "%";
            }
        }

        protected normalizer(d: any): number {
            return this.yAxes[0].scale.domain()[0] / d.max;
        }
    }
}