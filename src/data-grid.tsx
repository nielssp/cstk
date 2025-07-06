// CSTK
// Copyright (c) 2025 Niels Sonnich Poulsen (http://nielssp.dk)
// Licensed under the MIT license. See the LICENSE file or
// http://opensource.org/licenses/MIT for more information.

import { cell, Cell, computed, createElement, For, input, Input, Fragment, ref } from 'cytoplasmic';

export interface DataGridColumn<TRow> {
    label: Input<string>,
    display: (row: Cell<TRow>) => JSX.Element,
    compare?: (a: TRow, b: TRow) => number,
    defaultSort?: 'ascending' | 'descending',
    align?: 'left' | 'right' | 'center',
}

export function DataGrid<TRow>(props: {
    source: Input<TRow[]>,
    columns: DataGridColumn<TRow>[],
    onDoubleClick?: (row: Cell<TRow>) => void,
}): JSX.Element {
    const source = input(props.source);
    const columns = props.columns;

    const selection = ref<TRow>();

    const defaultSort = columns.find(c => c.defaultSort);

    const sort = cell<{
        column?: DataGridColumn<TRow>,
        direction: 'ascending' | 'descending',
    }>({column: defaultSort, direction: defaultSort?.defaultSort ?? 'ascending'});

    const sorted = computed(of => {
        const {column, direction} = of(sort);
        if (!column?.compare) {
            return of(source);
        }
        const compare = column.compare;
        return of(source).sort((a, b) => direction === 'ascending' ? compare(a, b) : -compare(a, b));
    });

    function sortBy(column: DataGridColumn<TRow>) {
        sort.update(sort => {
            sort.direction = sort.column !== column || sort.direction === 'descending' ? 'ascending' : 'descending';
            sort.column = column;
        });
    }

    return <div class="list grow" role="listbox" aria-multiselectable="true">
        <table class="detailed">
            <thead>
                <tr>
                    <For each={columns}>{column => column.compare
                        ? <th role='button' onClick={() => sortBy(column)} aria-sort={sort.map(s => s.column === column ? s.direction : 'none')} style={column.align ? `text-align: ${column.align};` : undefined}>
                            {column.label}
                        </th>
                        : <th style={column.align ? `text-align: ${column.align};` : undefined}>
                            {column.label}
                        </th>
                    }</For>
                </tr>
            </thead>
            <tbody>
                <For each={sorted}>{(row, i) =>
                    <tr role="option" aria-selected={computed(of => String(of(row) === of(selection)))} tabIndex={computed(of => of(row) === of(selection) || !of(selection) && i === 0 ? 0 : -1)} onClick={() => selection.value = row.value} onDblClick={() => props.onDoubleClick?.(row)}>
                        <For each={columns}>{column =>
                            <td style={column.align ? `text-align: ${column.align};` : undefined}>
                                {column.display(row)}
                            </td>
                        }</For>
                    </tr>
                }</For>
            </tbody>
        </table>
    </div> ;
}

export function stringColumn<TRow>(
    label: Input<string>,
    getter: (row: TRow) => string,
    locales?: Intl.LocalesArgument,
): DataGridColumn<TRow> {
    return {
        label,
        display: row => <>{row.map(getter)}</>,
        compare: (a, b) => getter(a).localeCompare(getter(b), locales),
    };
}

export function numberColumn<TRow>(
    label: Input<string>,
    getter: (row: TRow) => number,
    displayWith: (x: number) => string = String,
): DataGridColumn<TRow> {
    return {
        label,
        display: row => <>{row.map(getter).map(displayWith)}</>,
        compare: (a, b) => getter(a) - getter(b),
        align: 'right',
    };
}

export function dateColumn<TRow>(
    label: Input<string>,
    getter: (row: TRow) => Date,
    displayWith: (x: Date) => string = String,
): DataGridColumn<TRow> {
    return {
        label,
        display: row => <>{row.map(getter).map(displayWith)}</>,
        compare: (a, b) => getter(a).getTime() - getter(b).getTime(),
    };
}

