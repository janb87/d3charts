/// <reference path="_References.ts" />

"use strict";

module frnk.UI.Charts {
    export class Serie {
        public enabled: boolean;
        public format: string;
        public name: string;
        public marker: string;
        public max: number;
        public min: number;
        public suffix: string;
        public sum: number;
        public type: string;

        private _chart: Chart;
        private _data: number[];

        constructor(chart: Chart, serie: any) {
            this._chart = chart;
            this._data = serie.data;

            this.enabled = true;
            this.format = serie.format;
            this.name = serie.name;
            this.marker = this._setMarkerType(serie);
            this.max = d3.max(this._data);
            this.min = d3.min(this._data);
            this.suffix = serie.suffix;
            this.sum = d3.sum(this._data);
            this.type = serie.type;
        }

        public getName(i: number): string {
            if (this.name != null) {
                return this.name;
            }
            return "Serie " + (i + 1);
        }

        public getValues(): number[] {
            return this._data;
        }

        private _setMarkerType(serie: any): string {
            if (serie.marker != undefined) {
                return serie.marker;
            }
            else if (this._chart.settings.linechart.markers.type != undefined) {
                return this._chart.settings.linechart.markers.type;
            }
            else {
                return "circle";
            }
        }
    }
}