/// <reference path="_References.ts" />

"use strict";

module frnk.UI.Charts {

    export class SVGColumn extends SVGShape {
        protected chart: XYChart;

        public height: (d: any, i: number, serie: number) => number;
        public width: (d: any, i: number, serie: number) => number;
        public x: (d: any, i: number, serie: number) => number;
        public y: (d: any, i: number, serie: number) => number;

        constructor(svg: D3.Selection, chart: XYChart, serie: number) {
            super(svg, chart, serie);

            this.chart = chart;
            this.height = null;
            this.width = null;
            this.x = null;
            this.y = null;
        }

        public draw(data: any): void {
            var svgSerie = this.svg.append("g")
                .attr("id", "serie-" + this.serie)
                .selectAll("rect")
                .data(data)
                .enter();

            // draw column
            var svgColumn = svgSerie.append("rect")
                .attr({
                    "class": "column",
                    "fill": ColorPalette.color(this.serie),
                    "height": 0,
                    "stroke": ColorPalette.color(this.serie),
                    "stroke-width": "1px",
                    "width": (d: any, i: number): number => { return this.width(d, i, this.serie); },
                    "x": (d: any, i: number): number => { return this.x(d, i, this.serie); },
                    "y": (d: any, i: number): number => {
                        if (d.y < 0) {
                            var index = this.chart.getAxisByName(AxisType.Y, this.chart.series.items[this.serie].axis);
                            return this.chart.axes[index].scale(0);
                        }
                        else {
                            return (this.height(d, i, this.serie) + this.y(d, i, this.serie));
                        }
                    }
                });

            // add animation
            var duration = this.chart.options.series.animate === true ? 600 : 0;
            var count = 0;
            svgColumn
                .each((): void => {
                    count++; // count number of bars
                })
                .transition()
                .duration(duration)
                .attr({
                    "height": (d: any, i: number): number => { return this.height(d, i, this.serie); },
                    "y": (d: any, i: number): number => { return this.y(d, i, this.serie); }
                })
                .each("end", (): void => {
                    count--;
                    if (this.chart.options.series.labels.visible === true && !count) { // only draw labels after all transitions ended
                        this.drawLabels();
                    }
                });

            // draw tooltip
            this.chart.tooltip.draw(svgColumn, this.serie);
        }

        public drawLabels(): void {
            super.drawLabels();
            d3.selectAll("g#serie-" + this.serie).selectAll("rect")
                .each((d: any, i: number): void  => {
                    var rotation = 0;
                    var x = this.x(d, i, this.serie);
                    var y = this.y(d, i, this.serie);
                    var dx = 0;
                    var dy = 0;

                    if (this.chart.options.series.labels.rotate === true) {
                        rotation = -90;
                    }

                    if (rotation != 0) {
                        dx = -this.height(d, i, this.serie) / 2;
                        dy = this.width(d, i, this.serie) / 2;
                    }
                    else {
                        dx = this.width(d, i, this.serie) / 2;
                        dy = this.height(d, i, this.serie) / 2;
                    }

                    this.svgLabels.append("text")
                        .text(d3.format(this.chart.series.items[this.serie].format)(d.y))
                        .style("text-anchor", "middle")
                        .attr({
                            "alignment-baseline": "central",
                            "class": "label",
                            "fill": "#fff",
                            "transform": "translate(" + x + ", " + y + ") rotate(" + rotation + ")",
                            "dx": dx,
                            "dy": dy
                        });
                });
        }
    }
}