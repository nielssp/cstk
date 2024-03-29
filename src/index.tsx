// CSTK
// Copyright (c) 2022 Niels Sonnich Poulsen (http://nielssp.dk)
// Licensed under the MIT license. See the LICENSE file or
// http://opensource.org/licenses/MIT for more information.

import { Context } from './context';
import { IntrinsicElementsHTML } from './types';

export * from './emitter';
export * from './property';
export * from './component';
export * from './context';
export * from './list';
export * from './i18n';
export * from './form';
export * from './injector';
export * from './router';
export * from './util';

declare global {
    namespace JSX {
        type Element = (context: Context) => Node|Node[];

        interface ElementAttributesProperty {
            props: unknown;
        }
        interface ElementChildrenAttribute {
            children: unknown;
        }

        type IntrinsicElements = IntrinsicElementsHTML;
    }
}
