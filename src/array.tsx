// CSTK
// Copyright (c) 2024 Niels Sonnich Poulsen (http://nielssp.dk)
// Licensed under the MIT license. See the LICENSE file or
// http://opensource.org/licenses/MIT for more information.

import { Cell, MutCell, cell } from './cell';
import { Emitter } from './emitter';

export interface CellIterable<TValue, TKey> {
    observe(
        insert: (index: number, item: TValue, key: TKey) => void,
        remove: (index: number) => void,
    ): () => void;
}

export class CellArray<T> implements CellIterable<Cell<T>, Cell<number>> {
    private readonly cells: MutCell<MutCell<T>[]> = cell(this.initialItems.map(item => cell(item)));
    readonly length = this.cells.map(cells => cells.length);
    readonly onInsert = new Emitter<{index: number, item: Cell<T>}>();
    readonly onRemove = new Emitter<number>();

    constructor(
        private initialItems: T[],
    ) {
    }

    get items(): MutCell<T>[] {
        return this.cells.value;
    }

    observe(
        insert: (index: number, item: Cell<T>, key: Cell<number>) => void,
        remove: (index: number) => void,
    ): () => void {
        const indices = this.cells.value.map((_, index) => cell(index));
        this.cells.value.forEach((cell, index) => insert(index, cell, indices[index]));
        const unobserveInsert = this.onInsert.observe(({index ,item}) => {
            const indexCell = cell(index);
            if (index >= indices.length) {
                indices.push(indexCell);
            } else {
                indices.splice(index, 0, indexCell);
                for (let i = index + 1; i < indices.length; i++) {
                    indices[i].value = i;
                }
            }
            insert(index, item, indexCell);
        });
        const unobserveRemove = this.onRemove.observe(index => {
            indices.splice(index, 1);
            for (let i = index; i < indices.length; i++) {
                indices[i].value = i;
            }
            remove(index);
        });
        return () => {
            unobserveInsert();
            unobserveRemove();
        };
    }

    find(predicate: (item: T, index: number) => boolean): MutCell<T> | undefined {
        return this.cells.value.find((item, index) => predicate(item.value, index));
    }

    insert(index: number, item: T): void {
        const c = cell(item);
        this.cells.update(cells => cells.splice(index, 0, c));
        this.onInsert.emit({index, item: c});
    }

    update(index: number, item: T): void {
        this.cells.value[index].value = item;
    }

    updateAll(items: T[]) {
        if (items.length < this.cells.value.length) {
            while (this.cells.value.length > items.length) {
                this.remove(this.cells.value.length - 1);
            }
        }
        for (let i = 0; i < this.cells.value.length; i++) {
            this.cells.value[i].value = items[i];
        }
        for (let i = this.cells.value.length; i < items.length; i++) {
            this.push(items[i]);
        }
    }

    push(item: T): void {
        const index = this.length.value;
        const c = cell(item);
        this.cells.value.push(c);
        this.onInsert.emit({index, item: c});
    }

    pushAll(items: T[]): void {
        items.forEach(item => this.push(item));
    }

    remove(index: number): T | undefined {
        if (index >= 0 && index < this.cells.value.length) {
            const removed = this.cells.update(cells => cells.splice(index, 1)[0]);
            this.onRemove.emit(index);
            return removed.value;
        }
    }

    removeIf(predicate: (item: T, index: number) => boolean): void {
        for (let i = 0; i < this.cells.value.length; i++) {
            if (predicate(this.cells.value[i].value, i)) {
                this.cells.update(cells => cells.splice(i, 1))
                this.onRemove.emit(i);
                i--;
            }
        }
    }

    clear(): void {
        while (this.cells.value.length) {
            this.remove(this.cells.value.length - 1);
        }
    }
}

export class CellMap<TKey, TValue> implements CellIterable<Cell<TValue>, TKey> {
    private readonly cells: MutCell<Map<TKey, MutCell<TValue>>> = cell(new Map);
    readonly size = this.cells.map(cells => cells.size);
    readonly onInsert = new Emitter<{key: TKey, value: Cell<TValue>}>();
    readonly onDelete = new Emitter<TKey>();

    get values(): Iterable<MutCell<TValue>> {
        return this.cells.value.values();
    }

    observe(
        insert: (index: number, item: Cell<TValue>, key: TKey) => void,
        remove: (index: number) => void,
    ): () => void {
        const keys: TKey[] = [];
        this.cells.value.forEach((cell, key) => {
            const index = keys.length;
            keys.push(key);
            insert(index, cell, key);
        });
        const unobserveInsert = this.onInsert.observe(({key, value}) => {
            const index = keys.length;
            keys.push(key);
            insert(index, value, key);
        });
        const unobserveRemove = this.onDelete.observe(key => {
            const index = keys.indexOf(key);
            if (index >= 0) {
                keys.splice(index, 1);
                remove(index);
            }
        });
        return () => {
            unobserveInsert();
            unobserveRemove();
        };
    }

    get(key: TKey): TValue | undefined {
        return this.cells.value.get(key)?.value;
    }

    update<T>(key: TKey, mutator: (value: TValue) => T): T | undefined {
        return this.cells.value.get(key)?.update(mutator);
    }

    set(key: TKey, value: TValue) {
        const existing = this.cells.value.get(key);
        if (existing) {
            existing.value = value;
        } else {
            const c = cell(value);
            this.cells.update(cells => cells.set(key, c));
            this.onInsert.emit({key, value: c});
        }
    }

    delete(key: TKey): boolean {
        if (this.cells.update(cells => cells.delete(key))) {
            this.onDelete.emit(key);
            return true;
        }
        return false;
    }

    clear(): void {
        this.cells.update(cells => {
            cells.forEach((_, key) => this.onDelete.emit(key));
            cells.clear();
        });
    }
}
