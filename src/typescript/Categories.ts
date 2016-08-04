/// <reference path="_References.ts" />

"use strict";

module frnk.UI.Charts {
    export class Categories {
        public format: string;
        public title: string;
        public length: number;

        private _items: string[];

        constructor(chart: Chart) {
            this.format = chart.settings.getValue("categories.format");
            this._items = this._setCategories(chart.settings.getValue("categories.labels"));
            this.length = this._items.length;
        }

        public getItem(i: number): string {
            return this._items[i];
        }

        public getLabels(): string[] {
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
}