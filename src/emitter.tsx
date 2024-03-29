// CSTK
// Copyright (c) 2022 Niels Sonnich Poulsen (http://nielssp.dk)
// Licensed under the MIT license. See the LICENSE file or
// http://opensource.org/licenses/MIT for more information.

export type Observer<T> = (event: T) => any;

export class Emitter<T> {
    private observers: Observer<T>[] = [];

    emit(event: T): void {
        for (let observer of this.observers) {
            if (observer(event) === false) {
                return;
            }
        }
    }

    observe(observer: Observer<T>): () => void {
        this.observers.push(observer);
        return () => this.unobserve(observer);
    }

    unobserve(observer: Observer<T>): void {
        this.observers = this.observers.filter(o => o !== observer);
    }

    next(): Promise<T> {
        return new Promise(resolve => {
            const unobserve = this.observe(x => {
                unobserve();
                resolve(x);
            });
        });
    }
}
