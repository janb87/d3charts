﻿/// <reference path="./typings/d3/d3.d.ts" />
"use strict";

module frnk.UI.Charts {
    export interface IArea {
        height: number;
        width: number;
        svg: D3.Selection;
    }

    export class Settings {
        public settings: string;

        constructor(settings: any) {
            this.settings = settings;
        }

        public getValue(propStr: string, defaultValue?: string): any {
            var parts = propStr.split(".");
            var cur = this.settings;
            for (var i = 0; i < parts.length; i++) {
                if (!cur[parts[i]]) {
                    console.log(">> WARN: " + propStr + " not set in settings");
                    if (defaultValue) {
                        console.log(">> WARN: " + propStr + " defaulted to '" + defaultValue + "'");
                        return defaultValue;
                    }
                    return "";
                }
                cur = cur[parts[i]];
            }
            return cur;
        }
    }

    export class PlotOptions {
        public innerPadding: number;
        public outerPadding: number;

        private _chart: Chart;

        constructor(chart: Chart) {
            this._chart = chart;

            this.innerPadding = Number(chart.settings.getValue("plotOptions.general.innerPadding", "0.5"));
            this.outerPadding = Number(chart.settings.getValue("plotOptions.general.outerPadding", "0"));
        }
    }

    export class Canvas implements IArea {
        public height: number;
        public legend: LegendArea;
        public plotArea: PlotArea;
        public svg: D3.Selection;
        public title: TitleArea;
        public width: number;

        private _chart: Chart;

        constructor(chart: Chart) {
            this._chart = chart;
            this.height = Number(chart.settings.getValue("canvas.height", "200"));
            this.width = Number(chart.settings.getValue("canvas.width", "200"));

            // update canvas size
            this.updateCanvasSize();

            // draw areas
            this.title = new TitleArea(chart, this);
            this.legend = new LegendArea(chart, this);
            this.plotArea = new PlotArea(chart, this);
        }

        public draw(): void {
            // update canvas size
            this.updateCanvasSize();

            // draw chart area
            this.svg = d3.select(this._chart.selector)
                .append("svg")
                .attr("width", this.width)
                .attr("height", this.height);

            // draw title area
            this.title.draw();

            // draw legend area
            this.legend.draw();

            // draw plot area
            this.plotArea.draw();
        }

        public updateCanvasSize(): void {
            var container = d3.select(this._chart.selector);
            var width = Number(container.style("width").substring(0, container.style("width").length - 2));
            var height = Number(container.style("height").substring(0, container.style("height").length - 2));
            this.width = width == 0 ? this.width : width;
            this.height =  height == 0 ? this.height : height;
        }
    }

    export class TitleArea implements IArea {
        public align: string;
        public height: number;
        public subTitle: string;
        public svg: D3.Selection;
        public text: string;
        public width: number;

        private _chart: Chart;

        constructor(chart: Chart, canvas: Canvas) {
            this._chart = chart;

            this.align = chart.settings.getValue("title.align", "center");
            this.height = Number(chart.settings.getValue("title.height", "50"));
            this.subTitle = chart.settings.getValue("title.subTitle");
            this.text = chart.settings.getValue("title.text");
        }

        public draw(): void {
            // initialize
            this.width = this._chart.canvas.width;

            // get text
            this.svg = this._chart.canvas.svg.append("g")
                .attr("class", "title")
                .attr("width", this.width)
                .attr("height", this.height)
                .attr("transform", "translate(0,0)");

            var svgTitle = this.svg.append("text")
                .text(this.text);

            // calculate alignment
            var svgText: any = this.svg.node();
            var textBox = svgText.getBBox();
            var x;
            switch (this.align) {
                case "left":
                    x = 0;
                    break;
                case "center":
                    x = (this.width - textBox.width) / 2;
                    break;
                case "right":
                    x = this.width - textBox.width;
                    break;
            }

            var y = (this.height + textBox.height) / 2;

            // set title position
            svgTitle
                .attr("x", function (): number { return x; })
                .attr("y", function (): number { return y; });

            // draw line
            this.svg.append("line")
                .attr("class", "sep")
                .attr("x1", 0)
                .attr("y1", this.height)
                .attr("x2", this.width)
                .attr("y2", this.height);
        }
    }

    export class PlotArea implements IArea {
        public height: number;
        public width: number;
        public svg: D3.Selection;
        public padding: number;

        private _canvas: Canvas;
        private _chart: Chart;

        constructor(chart: Chart, canvas: Canvas) {
            this._chart = chart;
            this._canvas = canvas;

            this.padding = this._chart.settings.getValue("canvas.padding", "20");
            this.height = this._canvas.height - this._canvas.title.height - this.padding * 2;
            this.width = this._canvas.width - this.padding * 2 - this._canvas.legend.width;
        }

        public draw(): void {
            // initialize
            this.height = this._canvas.height - this._canvas.title.height - this.padding * 2;
            this.width = this._canvas.width - this.padding * 2 - this._canvas.legend.width;

            // draw plot area
            this.svg = this._chart.canvas.svg.append("g")
                .attr("class", "plotarea")
                .attr("transform", "translate(" + this._chart.canvas.plotArea.padding + "," + (this._chart.canvas.title.height + this._chart.canvas.plotArea.padding) + ")");
        }
    }

    export class LegendArea implements IArea {
        public height: number;
        public position: string;
        public title: string;
        public svg: D3.Selection;
        public width: number;

        private _chart: Chart;
        private _canvas: Canvas;

        constructor(chart: Chart, canvas: Canvas) {
            this._chart = chart;
            this._canvas = canvas;

            this.height = Number(chart.settings.getValue("legend.height", "0"));
            this.position = chart.settings.getValue("legend.position", "right");
            this.title = chart.settings.getValue("legend.title", "Categories");
            this.width = Number(chart.settings.getValue("legend.width", "0"));
        }

        public draw(): void {
            if (this.width != 0) {
                this.svg = this._canvas.svg.append("g")
                    .attr("class", "legend")
                    .attr("transform", "translate(" + (this._canvas.width - this.width) + "," + this._canvas.title.height + ")");

                this.drawLine(this.svg);
                this.drawTitle(this.svg);

                // add legend items
                var items = this.svg
                    .selectAll(".item")
                    .data(this._chart.series.getMatrix())
                    .enter().append("g")
                    .attr("class", "item")
                    .attr("transform", (d: any, i: any): string => {
                        return "translate(" + 22 + "," + ((i * 20) + 60) + ")";
                    });

                this.drawCheckboxes(items);
                this.drawSymbol(items);
                this.drawText(items);
            }
        }

        private drawCheckboxes(svg: D3.Selection): void {
            // add checkboxes
            svg.append("image")
                .attr("class", "checkbox")
                .attr("height", "15px")
                .attr("width", "15px")
                .attr("href", "../images/checkbox-selected.png");
        }

        private drawLine(svg: D3.Selection): void {
            // draw vertical line
            svg.append("line")
                .attr("class", "sep")
                .attr("x1", 0)
                .attr("y1", 0)
                .attr("x2", 0)
                .attr("y2", this._canvas.height - this._canvas.title.height);
        }

        private drawSymbol(svg: D3.Selection): void {
            if (this._chart instanceof frnk.UI.Charts.LineChart) {
                this.drawSymbolAsLine(svg);
            }
            else {
                this.drawSymbolAsRectangle(svg);
            }
        }

        private drawSymbolAsLine(svg: D3.Selection): void {
            svg.append("line")
                .attr("x1", 27)
                .attr("x2", 51)
                .attr("y1", 6)
                .attr("y2", 6)
                .style("stroke", (d: any, i: any): string => {
                    return this._chart.series.getColor(i);
                })
                .style("stroke-width", "2");

            svg.append("circle")
                .attr("cx", 39)
                .attr("cy", 6)
                .attr("r", 4)
                .style("fill", "#fff")
                .style("stroke", (d: any, i: any): string => {
                    return this._chart.series.getColor(i);
                })
                .style("stroke-width", "2");
        }

        private drawSymbolAsRectangle(svg: D3.Selection): void {
            svg.append("rect")
                .attr("x", 27)
                .attr("width", 24)
                .attr("height", 11)
                .style("fill", (d: any, i: any): string => {
                    return this._chart.series.getColor(i);
                });
        }

        private drawText(svg: D3.Selection): void {
            svg.append("text")
                .attr("x", 56)
                .attr("y", 9)
                .attr("dy", "0px")
                .style("text-anchor", "begin")
                .text((d: any, i: any): string => {
                    return this._chart.series.getLabel(i);
                });
        }

        private drawTitle(svg: D3.Selection): void {
            // draw horizontal line
            var svgTitle = svg.append("g")
                .attr("class", "title");

            svgTitle.append("line")
                .attr("class", "sep")
                .attr("x1", 20)
                .attr("y1", 40)
                .attr("x2", this.width - 20)
                .attr("y2", 40);

            // add legend title
            svgTitle.append("text")
                .attr("class", "title")
                .text(this.title)
                .attr("x", 22)
                .attr("y", 26);
        }
    }

    export class Categories {
        public format: string;
        public title: string;

        private _items: string[];

        constructor(chart: Chart) {
            this.format = chart.settings.getValue("categories.format");
            this._items = this._setCategories(chart.settings.getValue("categories.labels"));
        }

        public getItem(i: number): string {
            return this._items[i];
        }

        public getItems(): string[] {
            return this._items;
        }

        public getLabel(i: number): string {
            return this._items[i];
        }

        public parseFormat(value: string): any {
            if (this.format == "%s") {
                return value;
            }
            else if (this.format == "%n") {
                return value;
            }
            else {
                return d3.time.format(this.format).parse(value);
            }
        }

        private _setCategories(categories: string[]): string[] {
            var array: string[] = [];
            for (var i = 0; i < categories.length; i++) {
                array.push(categories[i]);
            }
            return array;
        }
    }

    export class Series {
        public labels: string[];
        public length: number;

        private _matrix: any[];
        private _chart: Chart;
        private _items: Serie[];

        constructor(chart: Chart) {
            this._chart = chart;
            this._items = this._setSeries(chart.settings.getValue("series"));
            this._matrix = this._setStackedMatrix();

            this.labels = this._setLabels();
            this.length = this._items.length;
        }

        public getColor(i: number): string {
            return this._items[i].getColor(i);
        }

        public getSerie(i: number): Serie {
            return this._items[i];
        }

        public getMatrixItem(i: number): any {
            return this._matrix[i];
        }

        public getMatrix(): any {
            return this._matrix;
        }

        public getLabel(i: number): string {
            return this._items[i].getName(i);
        }

        public getMaxValue(): number {
            if ((this._chart instanceof frnk.UI.Charts.StackedColumnChart
                || this._chart instanceof frnk.UI.Charts.StackedLineChart
                || this._chart instanceof frnk.UI.Charts.StackedBarChart)
                && this._items.length > 1) { // can only be stacked if you have more than 1 series defined
                return d3.max(this._matrix, function (array: number[]): number {
                    return d3.max(array, function (d: any): number {
                        return d.y0;
                    });
                });
            }
            else {
                return d3.max(this._matrix, function (array: number[]): number {
                    return d3.max(array, function (d: any): number {
                        return d.y;
                    });
                });
            }
        }

        public getMinValue(): number {
            if ((this._chart instanceof frnk.UI.Charts.StackedColumnChart
                || this._chart instanceof frnk.UI.Charts.StackedLineChart
                || this._chart instanceof frnk.UI.Charts.StackedBarChart)
                && this._items.length > 1) { // can only be stacked if you have more than 1 series defined
                return d3.min(this._matrix, function (array: number[]): number {
                    return d3.min(array, function (d: any): number {
                        return d.y0 + d.y;
                    });
                });
            }
            else {
                return d3.min(this._matrix, function (array: number[]): number {
                    return d3.min(array, function (d: any): number {
                        return d.y;
                    });
                });
            }
        }

        private _getMappedMatrix(): any[] {
            var matrix = [];
            for (var serie = 0; serie < this._items.length; serie++) {
                matrix.push(this._items[serie].getValues());
            }

            var mappedMatrix = matrix.map(function (data: any, i: number): any[] {
                var t = matrix[i];
                return t.map(function (d: any, j: number): any {
                    return { y: d, y0: 0, size: 0, perc: 0 };
                });
            });

            return mappedMatrix;
        }

        private _setStackedMatrix(): any[] {
            var matrix = this._getMappedMatrix();

            var transposedMatrix = this._transposeMatrix(matrix);

            transposedMatrix.forEach(function (m: any): any {
                var posBase = 0, negBase = 0, sum = 0;

                m.forEach(function (k: any): any {
                    sum = sum + Math.abs(k.y);
                });

                m.forEach(function (k: any): any {
                    k.perc = k.y / sum; // calculate percentage of this value across the different series
                    k.max = sum;
                    k.size = Math.abs(k.y);
                    if (k.y < 0) {
                        k.y0 = negBase;
                        negBase -= k.size;
                    }
                    else {
                        k.y0 = posBase = posBase + k.size;
                    }
                });
            });

            return this._transposeMatrix(transposedMatrix);
        }

        private _setLabels(): string[] {
            var names: string[] = [];
            for (var i = 0; i < this._items.length; i++) {
                names.push(this._items[i].getName(i));
            }
            return names;
        }

        private _setSeries(series: any): Serie[] {
            var array: Serie[] = [];
            for (var i = 0; i < series.length; i++) {
                array.push(new Serie(series[i]));
            }
            return array;
        }

        private _transposeMatrix(a: any): any {
            return Object.keys(a[0]).map(
                function (c: any): any {
                    return a.map(function (r: any): any { return r[c]; });
                });
        }
    }

    export class Serie {
        public max: number;
        public min: number;
        public sum: number;

        private _color: string;
        private _fillColor: string;
        private _data: number[];
        private _name: string;

        constructor(serie: any) {
            this._color = serie.color;
            this._fillColor = serie.fillColor;
            this._data = serie.data;
            this._name = serie.name;

            this.max = d3.max(this._data);
            this.min = d3.min(this._data);
            this.sum = d3.sum(this._data);
        }

        public getColor(i?: number): string {
            //TODO - fallback in case bigger than 20 series
            if (this._color != null) {
                return this._color;
            }
            return ColorPalette.getColor(i);
        }

        public getFillColor(i?: number): string {
            //TODO - fallback in case bigger than 20 series
            if (this._fillColor != null) {
                return this._fillColor;
            }
            return ColorPalette.getFillColor(i);
        }

        public getName(i: number): string {
            if (this._name != null) {
                return this._name;
            }
            return "Serie " + (i + 1);
        }

        public getValues(): number[] {
            return this._data;
        }
    }

    export class Axis {
        public axis: D3.Svg.Axis;
        public hasTickmarks: boolean;
        public innerTicksize: number;
        public outerTicksize: number;
        public orient: string;
        public scale: any;
        public svgAxis: D3.Selection;
        public svgGrid: D3.Selection;
        public svgTitle: D3.Selection;
        public svgZeroLine: D3.Selection;
        public ticks: number;
        public title: string;
        public x: number;
        public y: number;

        protected _chart: Chart;

        private _gridlineType: GridLineType;
        private _scaleType: ScaleType;

        constructor(args: any, chart: Chart) {
            this.axis = null;
            this.hasTickmarks = true;
            this.innerTicksize = this.getInnerTicksize(chart);
            this.outerTicksize = this.getOuterTicksize(chart);
            this.orient = null;
            this.scale = null;
            this.svgAxis = null;
            this.svgGrid = null;
            this.svgTitle = null;
            this.svgZeroLine = null;
            this.ticks = null;
            this.title = null;
            this.x = null;
            this.y = null;

            this._chart = chart;
            this._gridlineType = GridLineType.None;
        }

        public setScaleType(value: ScaleType): void {
            this._scaleType = value;
        }

        public getGridlineType(): GridLineType {
            return this._gridlineType;
        }

        public isOrdinalScale(): boolean {
            if (this._scaleType === ScaleType.Ordinal) {
                return true;
            }
            return false;
        }

        public isLinearScale(): boolean {
            if (this._scaleType === ScaleType.Linear) {
                return true;
            }
            return false;
        }

        public isTimeScale(): boolean {
            if (this._scaleType === ScaleType.Time) {
                return true;
            }
            return false;
        }

        public draw(chart: Chart): void {
            // initialize
            this.innerTicksize = this.getInnerTicksize(chart);
            this.outerTicksize = this.getOuterTicksize(chart);
            this.scale = this.getScale(chart);
            this.ticks = this.getTicks(chart);
            this.x = this.getXCoordinate(chart);
            this.y = this.getYCoordinate(chart);

            // create d3 axis
            this.axis = d3.svg.axis()
                .scale(this.scale)
                .orient(this.orient)
                .ticks(this.ticks);

            // draw tick marks
            if (!this.hasTickmarks) {
                this.axis.tickSize(0);
                this.axis.tickPadding(12);
            }

            // draw axis
            this.svgAxis = chart.canvas.plotArea.svg.append("g")
                .attr("class", "axis")
                .attr("transform", "translate(" + this.x + "," + this.y + ")")
                .append("g")
                .attr("class", "ticks")
                .call(this.axis);

            this.drawGridlines(chart, this.axis);
            if (this.isDataAxis() && chart.series.getMinValue() < 0) {
                this.drawZeroLine(chart, this.svgAxis);
            }
            this.rotateLabels(chart, this.svgAxis);
            this.drawTitle(chart, this.svgAxis);
        }

        public drawGridlines(chart: Chart, axis: D3.Svg.Axis): void {
            this.svgGrid = this.svgAxis.append("g")
                .attr("class", "grid");

            switch (this.getGridlineType()) {
                case GridLineType.Major:
                    this.svgGrid.call(axis
                        .tickSize(this.innerTicksize, this.outerTicksize)
                        .tickFormat((d: any): string => { return ""; }) // return no label for the grid lines
                    );
                    break;
                case GridLineType.Minor:
                    // TODO
                    break;
                default:
                    // Do nothing
                    break;
            }
        }

        public drawTitle(chart: Chart, svg: D3.Selection): void {
            //TODO - Make position of title optional
            this.svgTitle = svg.append("text")
                .text(this.title)
                .attr("class", "title");
        }

        public drawZeroLine(chart: Chart, svg: D3.Selection): void {
            this.svgZeroLine = this.svgGrid.append("g")
                .attr("class", "zero-line")
                .append("line");
        }

        public getInnerTicksize(chart: Chart): any {
            // child classes are responsible for implementing this method
        }

        public getOuterTicksize(chart: Chart): any {
            // child classes are responsible for implementing this method
        }

        public getScale(chart: Chart): any {
            // child classes are responsible for implementing this method
        }

        public getTicks(chart: Chart): any {
            // child classes are responsible for implementing this method
        }

        public getXCoordinate(chart: Chart): any {
            // child classes are responsible for implementing this method
        }

        public getYCoordinate(chart: Chart): any {
            // child classes are responsible for implementing this method
        }

        public isDataAxis(): any {
            // child classes are responsible for implementing this method
        }

        public rotateLabels(chart: Chart, svg: D3.Selection): void {
            // child classes are responsible for implementing this method
        }

        protected _setGridlineType(type: string): void {
            switch (type.toUpperCase()) {
                case "MAJOR":
                    this._gridlineType = GridLineType.Major;
                    break;
                case "MINOR":
                    this._gridlineType = GridLineType.Minor;
                    break;
                default:
                    this._gridlineType = GridLineType.None;
                    break;
            }
        }
    }

    export class XAxis extends Axis {

        private _textRotation: string;

        constructor(args: any, chart: Chart) {
            super(args, chart);
            this.orient = chart.settings.getValue("xAxis.orient", "bottom");
            this.hasTickmarks = chart.settings.getValue("xAxis.hasTickmarks").toUpperCase() == "YES" ? true : false;
            this.title = chart.settings.getValue("xAxis.title.text");
            this._textRotation = chart.settings.getValue("xAxis.labels.rotate", "0");
            this._setGridlineType(chart.settings.getValue("xAxis.gridlines"));
        }

        public drawTitle(chart: Chart, svg: D3.Selection): void {
            super.drawTitle(chart, svg);

            var anchor = "end";
            var x = chart.canvas.plotArea.width;
            var y = this.orient == "bottom" ? 30 : -30; // TODO: title needs to be positioned under labels but depends on size of labels

            this.svgTitle
                .attr("text-anchor", anchor)
                .attr("transform", "translate(" + x + "," + y + ")");
        }

        public drawZeroLine(chart: Chart, svg: D3.Selection): void {
            super.drawZeroLine(chart, svg);
            this.svgZeroLine
                .attr("x1", this.scale(0))
                .attr("x2", this.scale(0))
                .attr("y1", 0)
                .attr("y2", this.orient == "bottom" ? -chart.canvas.plotArea.height : chart.canvas.plotArea.height);
        }

        public getInnerTicksize(chart: Chart): number {
            return -chart.canvas.plotArea.height;
        }

        public getOuterTicksize(chart: Chart): number {
            return -chart.canvas.plotArea.height;
        }

        public getScale(chart: Chart): any {
            if (this._chart instanceof frnk.UI.Charts.StackedPercentBarChart) {
                this.setScaleType(ScaleType.Linear);
                var lowerScale = chart.series.getMinValue() < 0 ? -1 : 0;

                // return scale
                return d3.scale.linear()
                    .domain([lowerScale, 1])
                    .range([0, chart.canvas.plotArea.width]);
            }
            else if (this._chart instanceof frnk.UI.Charts.LineChart || this._chart instanceof frnk.UI.Charts.ColumnChart) {
                if (chart.categories.format == "%s") {
                    this.setScaleType(ScaleType.Ordinal);
                    return d3.scale.ordinal()
                        .domain(chart.categories.getItems())
                        .rangeBands([0, chart.canvas.plotArea.width], chart.plotOptions.innerPadding, chart.plotOptions.outerPadding);
                }
                else {
                    this.setScaleType(ScaleType.Time);
                    return d3.time.scale()
                        .domain(d3.extent(chart.categories.getItems(), (d: any): Date => {
                            return d3.time.format(chart.categories.format).parse(d);
                        }))
                        .nice() // adds additional ticks to add some whitespace
                        .range([0, chart.canvas.plotArea.width]);
                }
            }
            else {
                this.setScaleType(ScaleType.Linear);
                return d3.scale.linear()
                    .domain([chart.series.getMinValue() < 0 ? chart.series.getMinValue() : 0, chart.series.getMaxValue()])
                    .nice() // adds additional ticks to add some whitespace
                    .range([0, chart.canvas.plotArea.width]);
            }
        }

        public getTicks(chart: Chart): number {
            return Number(chart.settings.getValue("xAxis.ticks", String(Math.max(chart.canvas.plotArea.width / 50, 2))));
        }

        public getXCoordinate(chart: Chart): number {
            return 0;
        }

        public getYCoordinate(chart: Chart): number {
            return this.orient == "bottom" ? chart.canvas.plotArea.height : 0;
        }

        public isDataAxis(): boolean {
            if (this._chart instanceof frnk.UI.Charts.LineChart || this._chart instanceof frnk.UI.Charts.ColumnChart) {
                return false;
            }
            return true;
        }

        public rotateLabels(chart: Chart, svg: D3.Selection): void {
            // rotate labels
            var textAnchorAttr = this.orient == "bottom" ? "end" : "begin";
            var translateAttr = this.orient == "bottom" ? "translate(-8 4)" : "translate(8 -4)";

            if (this._textRotation != "0") {
                svg.selectAll("text")
                    .style("text-anchor", textAnchorAttr)
                    .attr("transform", translateAttr + " rotate(" + this._textRotation + ")");
            }
        }

    }

    export class YAxis extends Axis {
        constructor(args: any, chart: Chart) {
            super(args, chart);
            this.orient = chart.settings.getValue("yAxis.orient", "left");
            this.hasTickmarks = chart.settings.getValue("yAxis.hasTickmarks").toUpperCase() == "YES" ? true : false;
            this.title = chart.settings.getValue("yAxis.title.text");
            this._setGridlineType(chart.settings.getValue("yAxis.gridlines"));
        }

        public drawTitle(chart: Chart, svg: D3.Selection): void {
            super.drawTitle(chart, svg);

            var anchor = this.orient == "left" ? "begin" : "end";
            var x = 0;
            var y = -30;

            this.svgTitle
                .attr("text-anchor", anchor)
                .attr("transform", "translate(" + x + "," + y + ")");
        }

        public drawZeroLine(chart: Chart, svg: D3.Selection): void {
            super.drawZeroLine(chart, svg);
            this.svgZeroLine
                .attr("x1", 0)
                .attr("x2", this.orient == "left" ? chart.canvas.plotArea.width : -chart.canvas.plotArea.width)
                .attr("y1", this.scale(0))
                .attr("y2", this.scale(0));
        }

        public getInnerTicksize(chart: Chart): number {
            return -chart.canvas.plotArea.width;
        }

        public getOuterTicksize(chart: Chart): number {
            return -chart.canvas.plotArea.width;
        }

        public getScale(chart: Chart): any {
            if (this._chart instanceof frnk.UI.Charts.StackedPercentColumnChart ||
                this._chart instanceof frnk.UI.Charts.StackedPercentLineChart) {
                this.setScaleType(ScaleType.Linear);
                var lowerScale = chart.series.getMinValue() < 0 ? -1 : 0;
                return d3.scale.linear()
                    .domain([1, lowerScale])
                    .range([0, chart.canvas.plotArea.height]);
            }
            else if (this._chart instanceof frnk.UI.Charts.BarChart) {
                if (chart.categories.format == "%s") {
                    this.setScaleType(ScaleType.Ordinal);
                    return d3.scale.ordinal()
                        .domain(chart.categories.getItems())
                        .rangeRoundBands([0, chart.canvas.plotArea.height], chart.plotOptions.innerPadding, chart.plotOptions.outerPadding);
                }
                else {
                    this.setScaleType(ScaleType.Time);
                    return d3.time.scale()
                        .domain(d3.extent(chart.categories.getItems(), (d: any): Date => {
                            return d3.time.format(chart.categories.format).parse(d);
                        }).reverse())
                        .nice() // adds additional ticks to add some whitespace
                        .range([chart.series.getMinValue(), chart.canvas.plotArea.height]);

                }
            }
            else {
                this.setScaleType(ScaleType.Linear);
                return d3.scale.linear()
                    .domain([chart.series.getMaxValue(), chart.series.getMinValue() < 0 ? chart.series.getMinValue() : 0])
                    .nice() // adds additional ticks to add some whitespace
                    .range([0, chart.canvas.plotArea.height]);
            }
        }

        public getTicks(chart: Chart): number {
            return Number(chart.settings.getValue("yAxis.ticks", String(Math.max(chart.canvas.plotArea.height / 50, 2))));
        }

        public getXCoordinate(chart: Chart): number {
            return this.orient == "left" ? 0 : chart.canvas.plotArea.width;
        }

        public getYCoordinate(chart: Chart): number {
            return 0;
        }

        public isDataAxis(): boolean {
            if (this._chart instanceof frnk.UI.Charts.ColumnChart || this._chart instanceof frnk.UI.Charts.LineChart) {
                return true;
            }
            return false;
        }

        public rotateLabels(chart: Chart, svg: D3.Selection): void {

        }
    }

    export class Chart {
        public canvas: Canvas;
        public categories: Categories;
        public plotOptions: PlotOptions;
        public series: Series;
        public settings: Settings;
        public selector: string;

        constructor(args: any, selector: string) {
            this.selector = selector;

            // Selector cannot be found
            try {
                if (d3.select(this.selector).empty()) {
                    throw Error(">> ERR: Selector '" + this.selector + "' not available");
                }
            }
            catch (e) {
                console.log(e.message);
            }

            this.settings = new Settings(args);

            this.canvas = new Canvas(this);
            this.plotOptions = new PlotOptions(this);
            this.categories = new Categories(this); // this.settings.getValue("categories");
            this.series = new Series(this);

            // update size and add EventListener
            this.canvas.updateCanvasSize();
            d3.select(window).on("resize", (): void => {
                d3.select(this.selector).selectAll("*").remove();
                this.draw();
            });
        }

        public draw(): void {
            this.canvas.draw();
        }
    }

    export class XYChart extends Chart {
        public xAxis: XAxis;
        public yAxis: YAxis;

        constructor(args: any, selector: string) {
            super(args, selector);
            this.xAxis = new XAxis(args, this);
            this.yAxis = new YAxis(args, this);
        }

        public draw(): void {
            super.draw();
            this.xAxis.draw(this);
            this.yAxis.draw(this);
        }
    }

    export class LineChart extends XYChart {
        public showMarkers: boolean;
        public interpolation: string;
        public fillArea: boolean;

        constructor(args: any, selector: string) {
            super(args, selector);
            this.showMarkers = this.settings.getValue("linechart.showMarkers").toUpperCase() == "YES" ? true : false;
            this.interpolation = this.settings.getValue("linechart.interpolation", "linear");
            this.fillArea = this.settings.getValue("linechart.fillArea").toUpperCase() == "YES" ? true : false;
        }

        public draw(): void {
            super.draw();

            // draw areas
            // areas need to be drawn first, because the line and markers need to be drawn on top of it
            if (this.fillArea) {
                var svgAreas = this.canvas.plotArea.svg.append("g")
                    .attr("class", "areas");

                for (var i = 0; i < this.series.length; i++) {
                    var svgArea = svgAreas.append("g")
                        .attr("id", "area-" + i);

                    this.drawArea(svgArea, i);
                }
            }

            // draw lines
            var svgSeries = this.canvas.plotArea.svg.append("g")
                .attr("class", "series");
            for (var j = 0; j < this.series.length; j++) {
                var svgSerie = svgSeries.append("g")
                    .attr("id", "serie-" + j);

                // draw line
                this.drawLine(svgSerie, j);

                // draw markers
                if (this.showMarkers) {
                    var svgMarkers = this.drawMarkers(svgSerie, j);

                    // draw tooltip
                    this.drawTooltip(svgMarkers, j);
                }
            }
        }

        public drawArea(svg: D3.Selection, serie: number): D3.Selection {
            var d3Area: D3.Svg.Area;

            d3Area = d3.svg.area()
                .interpolate(this.interpolation)
                .x(this.getXCoordinate(serie))
                .y0(this.yAxis.scale(0))
                .y1(this.getYCoordinate(serie));

            var svgArea = svg.append("path")
                .attr("class", "area")
                .attr("d", d3Area(this.series.getMatrixItem(serie)))
                .style("fill", this.series.getColor(serie))
                .style("opacity", "0.2");

            return svgArea;
        }

        public drawLine(svg: D3.Selection, serie: number): D3.Selection {
            var d3Line = d3.svg.line()
                .interpolate(this.interpolation)
                .x(this.getXCoordinate(serie))
                .y(this.getYCoordinate(serie));

            var svgLine = svg.append("path")
                .attr("class", "line")
                .attr("d", d3Line(this.series.getMatrixItem(serie)))
                .attr("stroke", this.series.getColor(serie))
                .attr("stroke-width", 1)
                .attr("fill", "none");

            return svgLine;
        }

        public drawMarkers(svg: D3.Selection, serie: number): D3.Selection {
            var svgMarkers = svg.selectAll(".marker")
                .data(this.series.getMatrixItem(serie))
                .enter().append("circle")
                .attr("class", "marker")
                .attr("stroke", this.series.getColor(serie))
                .attr("stroke-width", "0")
                .attr("fill", this.series.getColor(serie))
                .attr("cx", this.getXCoordinate(serie))
                .attr("cy", this.getYCoordinate(serie))
                .attr("r", 4);

            return svgMarkers;
        }

        public drawTooltip(svg: D3.Selection, serie: number): void {
            var _this = this;
            var div = d3.select("body").append("div")
                .attr("class", "tooltip")
                .style("opacity", 0);

            svg.on("mouseover", function (d: any): void {
                div.transition()
                    .duration(200)
                    .style("opacity", .9);
                div.html(_this.settings.getValue("tooltip.title") + "<br/>"  + d.y + _this.settings.getValue("tooltip.valueSuffix"))
                    .style("left", (d3.mouse(this)[0]) + "px")
                    .style("top", (d3.mouse(this)[1]) + 175 + "px");  // TODO - hardcoded value only works in some occasions
                })
                .on("mouseout", function(d: any): void {
                    div.transition()
                        .duration(500)
                        .style("opacity", 0);
                });
        }

        public getXCoordinate(serie: number): any {
            return (d: any, i: number): number => {
                if (this.xAxis.isOrdinalScale()) {
                    return this.xAxis.scale(this.categories.parseFormat(this.categories.getItem(i))) + this.xAxis.scale.rangeBand() / 2;
                }
                else {
                    return this.xAxis.scale(this.categories.parseFormat(this.categories.getItem(i)));
                }
            };
        }

        public getYCoordinate(serie: number): any {
            return (d: any): number => {
                return this.yAxis.scale(d.y);
            };
        }
    }

    export class StackedLineChart extends LineChart {

        constructor(args: any, selector: string) {
            super(args, selector);
        }

        public drawArea(svg: D3.Selection, serie: number): D3.Selection {
            var d3Area: D3.Svg.Area;

            d3Area = d3.svg.area()
                .interpolate(this.interpolation)
                .x(this.getXCoordinate(serie))
                .y0(
                    (d: any): number => {

                        // negative values
                        if (d.y < 0) {
                            return (this.yAxis.scale(d.y0 * this.normalizer(d)));
                        }
                        // positive values
                        else {
                            return (this.yAxis.scale((d.y0 - d.y) * this.normalizer(d)));
                        }
                    })
                .y1(this.getYCoordinate(serie));

            var svgArea = svg.append("path")
                .attr("class", "area")
                .attr("d", d3Area(this.series.getMatrixItem(serie)))
                .style("fill", this.series.getColor(serie))
                .style("opacity", "0.2");

            return svgArea;
        }

        public drawTooltip(svg: D3.Selection): D3.Selection {
            return svg.append("title")
                .text(function (d: any): number {
                if (d.y < 0) {
                    return d.y + d.y0;
                }
                else {
                    return d.y0;
                }
            });
        }

        public getXCoordinate(serie: number): any {
            return (d: any, i: number): number => {
                if (this.xAxis.isOrdinalScale() || this.xAxis.isLinearScale()) {
                    return this.xAxis.scale(this.categories.parseFormat(this.categories.getItem(i))) + this.xAxis.scale.rangeBand() / 2;
                }
                else {
                    return this.xAxis.scale(this.categories.parseFormat(this.categories.getItem(i))); // for time scales
                }
            };
        }

        public getYCoordinate(serie: number): any {
            return (d: any): number => {
                // negative numbers
                if (d.y0 < 1) {
                    return this.yAxis.scale((d.y0 + d.y) * this.normalizer(d));
                }
                // positive numbers
                else {
                    return this.yAxis.scale(d.y0 * this.normalizer(d));
                }
            };
        }

        protected normalizer(d: any): number {
            return StackType.Normal;
        }
    }

    export class StackedPercentLineChart extends StackedLineChart {

        constructor(args: any, selector: string) {
            super(args, selector);
        }

        protected normalizer(d: any): number {
            return this.yAxis.scale.domain()[0] / d.max;
        }
    }

    export class ColumnChart extends XYChart {

        constructor(args: any, selector: string) {
            super(args, selector);
        }

        public draw(): void {
            super.draw();

            // draw chart
            var svgSeries = this.canvas.plotArea.svg.append("g")
                .attr("class", "series");

            // draw columns
            for (var j = 0; j < this.series.length; j++) {
                var svgSerie = svgSeries.append("g")
                    .attr("id", "serie-" + j)
                    .selectAll("rect")
                    .data(this.series.getMatrixItem(j))
                    .enter();

                // draw bar
                var svgBar = svgSerie.append("rect")
                    .attr({
                    "x": this.getXCoordinate(j),
                    "y": this.getYCoordinate(j),
                    "class": "bar",
                    "width": this.getWidth(j),
                    "height": this.getHeight(j),
                    "fill": this.series.getColor(j)
                });

                // draw tooltip
                svgBar.append("title")
                    .text((d: any): number => { return d.y; });

                // no value indication
                svgSerie.append("text")
                    .attr("class", "data-label")
                    .attr("x", this.getXCoordinate(j))
                    .attr("y", this.getYCoordinate(j))
                    .attr("fill", "#878787")
                    //.attr("dx", 0) // TODO - align text with middle of the bar
                    .attr("dy", -3) // TODO - align text in bar or on top of bar
                    .text(function (d: any): string {
                        if (d.y == 0) {
                            return parseFloat(d.y).toFixed(0);
                        }
                    });

                //TODO - drawing data labels should be an option, not only to indicate a zero value
            }
        }

        public getXCoordinate(serie: number): any {
            return (d: any, i: number): number => {
                var axisScale = this.categories.parseFormat(this.categories.getItem(i));
                if (this.xAxis.isOrdinalScale()) {
                    return this.xAxis.scale(axisScale) + (this.xAxis.scale.rangeBand() / this.series.length * serie);
                }
                else {
                    return this.xAxis.scale(axisScale) + (this.canvas.width / this.series.length / this.series.getMatrixItem(0).length * serie);
                }
            };
        }

        public getYCoordinate(serie: number): any {
            return (d: any): number => {
                if (d.y < 0) {
                    return this.yAxis.scale(d.y) - Math.abs(this.yAxis.scale(d.size) - this.yAxis.scale(0));
                }
                else {
                    return this.yAxis.scale(d.y);
                }
            };
        }

        public getHeight(serie: number): any {
            return (d: any): any => {
                return Math.abs(this.yAxis.scale(d.y) - this.yAxis.scale(0));
            };
        }

        public getWidth(serie: number): any {
            return (d: any): number => {
                if (this.xAxis.isOrdinalScale()) {
                    return this.xAxis.scale.rangeBand() / this.series.length;
                }
                else {
                    return this.canvas.width / this.series.length / this.series.getMatrixItem(0).length;
                }
            };
        }
    }

    export class StackedColumnChart extends ColumnChart {

        constructor(args: any, selector: string) {
            super(args, selector);
        }

        public getXCoordinate(serie: number): any {
            return (d: any, i: number): any => {
                return this.xAxis.scale(this.categories.parseFormat(this.categories.getItem(i)));
            };
        }

        public getYCoordinate(serie: number): any {
            return (d: any): any => {
                return this.yAxis.scale(d.y0 * this.normalizer(d));
            };
        }

        public getHeight(serie: number): any {
            return (d: any): any => {
                return  Math.abs(this.yAxis.scale(0) - this.yAxis.scale(d.size));
            };
        }

        public getWidth(serie: number): any {
            return (d: any): any => {
                if (this.xAxis.isOrdinalScale() || this.xAxis.isLinearScale()) {
                    return this.xAxis.scale.rangeBand();
                }
                else {
                    return this.canvas.width / this.series.length / this.series.getMatrixItem(0).length; //did it to support time scales
                }
            };
        }

        public normalizer(d: any): number {
            return StackType.Normal;
        }
    }

    export class StackedPercentColumnChart extends StackedColumnChart {

        constructor(args: any, selector: string) {
            super(args, selector);
        }

        public getHeight(serie: number): any {
            return (d: any): any => {
                return Math.abs(this.yAxis.scale(this.yAxis.scale.domain()[0] - d.perc));
            };
        }

        public normalizer(d: any): number {
            return this.yAxis.scale.domain()[0] / d.max;
        }
    }

    export class BarChart extends XYChart {

        constructor(args: any, selector: string) {
            super(args, selector);
        }

        public draw(): void {
            super.draw();

            // draw chart
            var svgSeries = this.canvas.plotArea.svg.append("g")
                .attr("class", "series");

            // draw bars
            for (var j = 0; j < this.series.length; j++) {
                var svgSerie = svgSeries.append("g")
                    .attr("id", "serie-" + j)
                    .selectAll("rect")
                    .data(this.series.getMatrixItem(j))
                    .enter();

                // draw bar
                var svgBar = svgSerie.append("rect")
                    .attr({
                        "x": this.getXCoordinate(j),
                        "y": this.getYCoordinate(j),
                        "class": "bar",
                        "width": this.getWidth(j),
                        "height": this.getHeight(j),
                        "fill": this.series.getColor(j)
                    });

                // draw tooltip
                svgBar.append("title")
                    .text((d: any): number => { return d.y; });

                // no value indication
                svgSerie.append("text")
                    .attr("class", "data-label")
                    .attr("x", this.getXCoordinate(j))
                    .attr("y", this.getYCoordinate(j))
                    .attr("fill", "#878787")
                    //.attr("dx", 0) // TODO - align text with middle of the bar
                    .attr("dy", -3) // TODO - align text in bar or on top of bar
                    .text(function (d: any): string {
                        if (d.y == 0) {
                            return parseFloat(d.y).toFixed(0);
                        }
                    });

                //TODO - drawing data labels should be an option, not only to indicate a zero value
            }
        }

        public getXCoordinate(serie: number): any {
            return (d: any): any => {
                if (d.y < 0) {
                    return this.xAxis.scale(0) - Math.abs(this.xAxis.scale(d.size) - this.xAxis.scale(0));
                }
                else {
                    return this.xAxis.scale(0);
                }
            };
        }

        public getYCoordinate(serie: number): any {
            return (d: any, i: number): number => {
                var axisScale = this.categories.parseFormat(this.categories.getItem(i));
                var series = this.series;
                if (this.yAxis.isOrdinalScale()) {
                    return this.yAxis.scale(axisScale) + (this.yAxis.scale.rangeBand() / series.length * serie);
                }
                else {
                    return this.yAxis.scale(axisScale) + (this.canvas.width / series.length / series.getMatrixItem(0).length / series.length * serie);
                }
            };
        }

        public getHeight(serie: number): any {
            return (d: any): any => {
                if (this.yAxis.isOrdinalScale()) {
                    return Math.abs(this.yAxis.scale.rangeBand() / this.series.length);
                }
                else {
                    return Math.abs(this.canvas.width / this.series.length / this.series.getMatrixItem(0).length / this.series.length);
                }
            };
        }

        public getWidth(serie: number): any {
            return (d: any): number => {
                return Math.abs(this.xAxis.scale(d.y) - this.xAxis.scale(0));
            };
        }
    }

    export class StackedBarChart extends BarChart {

        constructor(args: any, selector: string) {
            super(args, selector);
        }

        public getXCoordinate(serie: number): any {
            return (d: any): any => {
                if (d.perc < 0) {
                    return this.xAxis.scale((d.y0 + d.y) * this.normalizer(d));
                }
                else {
                    return this.xAxis.scale((d.y0 - d.y) * this.normalizer(d));
                }
            };
        }

        public getYCoordinate(serie: number): any {
            return (d: any, i: number): any => {
                return this.yAxis.scale(this.categories.parseFormat(this.categories.getItem(i)));
            };
        }

        public getHeight(serie: number): any {
            return (d: any): any => {
                if (this.yAxis.isOrdinalScale() || this.yAxis.isLinearScale()) {
                    return this.yAxis.scale.rangeBand();
                }
                else {
                    return this.canvas.height / this.series.length / this.series.getMatrixItem(0).length;
                }
            };
        }

        public getWidth(serie: number): any {
            return (d: any): any => {
                return Math.abs(this.xAxis.scale(0) - this.xAxis.scale(d.y));
            };
        }

        public normalizer(d: any): number {
            return 1; // no normalization needed as this not 100% stacked
        }
    }

    export class StackedPercentBarChart extends StackedBarChart {

        constructor(args: any, selector: string) {
            super(args, selector);
        }

        public getXCoordinate(serie: number): any {
            return (d: any): any => {
                if (d.perc < 0) {
                    return this.xAxis.scale((d.y0 + d.y) * this.normalizer(d));
                }
                else {
                    return this.xAxis.scale((d.y0 - d.y) * this.normalizer(d));
                }
            };
        }

        public getWidth(serie: number): any {
            return (d: any): any => {
                return Math.abs((this.xAxis.scale(1) - this.xAxis.scale(0)) * d.perc);
            };
        }

        public normalizer(d: any): number {
            return this.xAxis.scale.domain()[1] / d.max;
        }
    }

    export class PieChart extends Chart {
        public innerRadius: number;

        constructor(args: any, selector: string) {
            super(args, selector);
            this.innerRadius = Number(this.settings.getValue("piechart.innerRadius", "0.9"));
        }

        public draw(): void {
            super.draw();

            var radius = Math.min(this.canvas.plotArea.width / 2, this.canvas.plotArea.height / 2);

            var serieRadius =  radius / this.series.length;
            for (var s = 0; s < this.series.length; s++) {
                var g = this.canvas.plotArea.svg.append("g")
                    .attr("transform", "translate(" + (this.canvas.plotArea.width / 2) + "," + (this.canvas.plotArea.height / 2) + ")");

                var innerRadius = (serieRadius * (s + 1)) - (serieRadius * this.innerRadius);

                var arc = d3.svg.arc()
                    .outerRadius(serieRadius * (s + 1))
                    .innerRadius(innerRadius); // inner radius = 0 => pie chart

                var pie = d3.layout.pie();

                var arcs = g.selectAll("g.slice")
                    .data(pie(this.series.getSerie(s).getValues()))
                    .enter()
                    .append("g")
                    .attr("class", "slice");

                arcs.append("path")
                    .attr("fill", (d: any, i: number): string => { return this.series.getSerie(s).getColor(i); })
                    .attr("d", arc);

                // draw tooltip
                arcs.append("title")
                    .text(function (d: any): number {
                        return d.value;
                    });
            }
        }
    }

    export enum GridLineType {
        None,
        Major,
        Minor
    }

    export enum StackType {
        None,
        Normal,
        Percent
    }

    export enum ScaleType {
        Linear,
        Ordinal,
        Time
    }
}

module frnk.UI.Charts.ColorPalette {

    export function getColor(i: number): string {
        var _colors =
            [
                "#5491F6",
                "#7AC124",
                "#FFA300",
                "#129793",
                "#F16A73",
                "#1B487F",
                "#FF6409",
                "#CC0000",
                "#8E44AD",
                "#936A4A",
                "#2C5195",
                "#4B7717",
                "#D58A02",
                "#005D5D",
                "#BD535B",
                "#123463",
                "#980101",
                "#D85402",
                "#622E79",
                "#60452F"
            ];
        return _colors[i];
    }

    export function getFillColor(i: number): string {
        var _fillColors =
            [
                "#C9DCFE",
                "#D6EEAF",
                "#FFE4AF",
                "#B6E0DE",
                "#FCD2D4",
                "#BAC8D9",
                "#FFD0B0",
                "#F1B2B1",
                "#DDC6E7",
                "#DED2C7",
                "#BFCAE0",
                "#C9D7B8",
                "#F3DDB1",
                "#B1CECE",
                "#ECCBCD",
                "#B7C2D1",
                "#E1B2B1",
                "#F4CBB1",
                "#D0BFD8",
                "#CFC7C0"
            ];
        return _fillColors[i];
    }
}