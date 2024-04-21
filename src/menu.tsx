// CSTK
// Copyright (c) 2022 Niels Sonnich Poulsen (http://nielssp.dk)
// Licensed under the MIT license. See the LICENSE file or
// http://opensource.org/licenses/MIT for more information.

import { Context, cell, Cell } from "cytoplasmic";

export type MenuItem = {
    type: 'action',
    action: Action,
    mnemonic?: string,
} | {
    type: 'submenu',
    submenu: Menu,
    mnemonic?: string,
} | {
    type: 'separator',
    mnemonic?: string,
};

function getMnemonic(label: string): string|undefined {
    const m = label.match(/&(.)/);
    if (m) {
        return m[1].toLowerCase();
    }
    return undefined;
}

export class Menu {
    items: MenuItem[] = [];
    mnemonic?: string;

    constructor(
        public label: string = '',
    ) {
        this.mnemonic = getMnemonic(label);
    }

    addSubmenu(label: string) {
        const submenu = new Menu(label);
        this.items.push({type: 'submenu', submenu, mnemonic: submenu.mnemonic});
        return submenu;
    }

    addSeparator() {
        this.items.push({type: 'separator'});
        return this;
    }

    add(actionOrSubmenu: Action|Menu) {
        if (actionOrSubmenu instanceof Action) {
            this.items.push({type: 'action', action: actionOrSubmenu, mnemonic: actionOrSubmenu.mnemonic});
        } else {
            this.items.push({type: 'submenu', submenu: actionOrSubmenu, mnemonic: actionOrSubmenu.mnemonic});
        }
        return this;
    }
}

export interface ActionProps {
    onClick?: () => void,
}

export class Action {
    mnemonic?: string;

    constructor(
        public label: string,
        public props: ActionProps = {},
    ) {
        this.mnemonic = getMnemonic(label);
    }
}

function addLabel(item: HTMLElement, label: string) {
    const splits = label.split(/&/, 2);
    item.textContent = splits[0];
    if (splits.length > 1 && splits[1]) {
        const u = document.createElement('u');
        u.textContent = splits[1][0];
        item.appendChild(u);
        item.appendChild(document.createTextNode(splits[1].substr(1)));
    }
}

interface ParentMenu {
    isActive: () => boolean;
    next: () => void;
    previous: () => void;
    close: () => void;
}

interface Submenu {
    open(focusFirst: boolean): void;
    isOpen(): boolean;
    close(): void;
    items: MenuListItem[];
}

interface MenuListItem {
    listItem: HTMLElement;
    item: MenuItem;
    activate: () => void;
    submenu?: Submenu;
}

function createMenuItems(
    container: HTMLElement,
    menu: Menu,
    orientation: 'horizontal'|'vertical',
    context: Context,
    root?: ParentMenu,
): MenuListItem[] {
    const arrowKeys = orientation === 'horizontal'
      ? ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp']
      : ['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft'];
    const listItems: MenuListItem[] = [];
    const isActive = () => {
        return !!listItems.find(item => item.submenu?.isOpen());
    };
    let itemCounter = 0;
    for (const item of menu.items) {
        const listItem = document.createElement('li');
        container.appendChild(listItem);
        if (item.type === 'separator') {
            listItem.setAttribute('role', 'separator');
            continue;
        }
        const i = itemCounter++;
        let submenu: Submenu|undefined;
        listItem.setAttribute('role', 'menuitem');
        listItem.setAttribute('tabindex', i == 0 ? '0' : '-1');
        const next = () => {
            listItem.setAttribute('tabindex', '-1');
            let nextItem: MenuListItem;
            if (i < listItems.length - 1) {
                nextItem = listItems[i + 1];
            } else {
                nextItem = listItems[0];
            }
            nextItem.listItem.setAttribute('tabindex', '0');
            nextItem.listItem.focus();
            if (submenu?.isOpen()) {
                submenu.close();
                nextItem.submenu?.open(true);
            }
        };
        const previous = () => {
            if (submenu?.isOpen() && root) {
                submenu.close();
                listItem.setAttribute('tabindex', '0');
                listItem.focus();
            } else {
                listItem.setAttribute('tabindex', '-1');
                let previousItem: MenuListItem;
                if (i > 0) {
                    previousItem = listItems[i - 1];
                } else {
                    previousItem = listItems[listItems.length - 1];
                }
                previousItem.listItem.setAttribute('tabindex', '0');
                previousItem.listItem.focus();
                if (submenu?.isOpen()) {
                    submenu.close();
                    previousItem.submenu?.open(true);
                }
            }
        }
        const close = () => {
            if (submenu?.isOpen()) {
                submenu.close();
                listItem.setAttribute('tabindex', '0');
                listItem.focus();
            }
        };
        switch (item.type) {
            case 'action':
                addLabel(listItem, item.action.label);
                break;
            case 'submenu':
                listItem.setAttribute('aria-haspopup', 'true');
                addLabel(listItem, item.submenu.label);
                submenu = createMenuButton(listItem, item.submenu, orientation, context, {
                    isActive: root?.isActive || isActive,
                    next: root?.next || next,
                    previous,
                    close,
                });
                break;
        }
        const activate = () => {
            if (submenu) {
                listItems.forEach(item => item.submenu !== submenu && item.submenu?.close());
                submenu.open(true);
            } else if (item.type === 'action') {
                if (item.action.props.onClick) {
                    item.action.props.onClick();
                }
            }
        };
        const onKeydown = (e: KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === 'Space') {
                e.preventDefault();
                e.stopPropagation();
                activate();
            } else if (e.key === arrowKeys[0]) {
                e.preventDefault();
                e.stopPropagation();
                next();
            } else if (e.key === arrowKeys[1]) {
                e.preventDefault();
                e.stopPropagation();
                previous();
            } else if (e.key === arrowKeys[2]) {
                e.preventDefault();
                if (submenu) {
                    e.stopPropagation();
                    listItems.forEach(item => item.submenu !== submenu && item.submenu?.close());
                    submenu.open(true);
                } else {
                    root?.next();
                }
            } else if (e.key === arrowKeys[3]) {
                e.preventDefault();
                if (submenu && submenu.isOpen()) {
                    submenu.close();
                    listItem.focus();
                } else {
                    root?.previous();
                }
            }
        };
        const onClick = (e: MouseEvent) => {
            if (submenu) {
                e.stopPropagation();
                if (submenu.isOpen()) {
                    if (orientation === 'horizontal') {
                        submenu.close();
                    }
                } else {
                    listItems.forEach(item => item.submenu !== submenu && item.submenu?.close());
                    submenu.open(false);
                }
            } else if (item.type === 'action') {
                if (item.action.props.onClick) {
                    item.action.props.onClick();
                }
            }
        };
        let submenuTimeout: number|undefined;
        const onMouseenter = (e: MouseEvent) => {
            if (submenu) {
                if (root?.isActive() || (!root && isActive())) {
                    if (orientation === 'horizontal') {
                        listItems.forEach(item => item.submenu !== submenu && item.submenu?.close());
                        submenu.open(false);
                    } else {
                        if (submenuTimeout) {
                            clearTimeout(submenuTimeout);
                        }
                        submenuTimeout = window.setTimeout(() => {
                            listItems.forEach(item => item.submenu !== submenu && item.submenu?.close());
                            submenu?.open(false);
                        }, 200);
                    }
                }
            } else {
                if (submenuTimeout) {
                    clearTimeout(submenuTimeout);
                }
                submenuTimeout = window.setTimeout(() => {
                    listItems.forEach(item => item.submenu !== submenu && item.submenu?.close());
                }, 200);
            }
        };
        const onMouseleave = () => {
            if (submenuTimeout) {
                clearTimeout(submenuTimeout);
            }
        };
        listItem.addEventListener('keydown', onKeydown);
        listItem.addEventListener('click', onClick);
        listItem.addEventListener('mouseenter', onMouseenter);
        listItem.addEventListener('mouseleave', onMouseleave);
        context.onDestroy(() => {
            listItem.removeEventListener('keydown', onKeydown);
            listItem.removeEventListener('click', onClick);
            listItem.removeEventListener('mouseenter', onMouseenter);
            listItem.removeEventListener('mouseleave', onMouseleave);
        });
        listItems.push({listItem, item, activate, submenu});
    }
    const onKeydown = (e: KeyboardEvent) => {
        if (!e.shiftKey && !e.ctrlKey) {
            if (!e.altKey && e.key === 'Escape') {
                if (root) {
                    e.stopPropagation();
                    e.preventDefault();
                    root.close();
                    return;
                }
            }
            const key = e.key.toLowerCase();
            const item = listItems.find(item => item.item.mnemonic === key);
            if (item) {
                e.stopPropagation();
                e.preventDefault();
                item.activate();
            }
        }
    };
    container.addEventListener('keydown', onKeydown);
    context.onDestroy(() => {
        container.removeEventListener('keydown', onKeydown);
    });
    return listItems;
}

function createMenuButton(
    button: HTMLElement,
    menu: Menu,
    orientation: 'horizontal'|'vertical',
    context: Context,
    root?: ParentMenu,
): Submenu {
    const list = document.createElement('ul');
    list.setAttribute('role', 'menu');
    list.style.position = 'absolute';
    const items = createMenuItems(list, menu, 'vertical', context, root);
    const close = () => {
        items.forEach(item => item.submenu?.close());
        if (list.parentElement) {
            list.parentElement.removeChild(list);
        }
    };
    const isOpen = () => !!list.parentElement;
    const open = (focusFirst: boolean) => {
        if (!list.parentElement) {
            const rect = button.getBoundingClientRect();
            if (orientation === 'horizontal') {
                list.style.top = `${rect.top + rect.height}px`;
                list.style.left = `${rect.left}px`;
            } else {
                list.style.top = `${rect.top}px`;
                list.style.left = `${rect.left + rect.width}px`;
            }
            document.body.appendChild(list);
        }
        if (focusFirst && list.children.length) {
            (list.children[0] as any).focus();
        }
    };
    return {
        open,
        isOpen,
        close,
        items,
    };
}

export function MenuBar(props: {
    menu: Menu|Cell<Menu>,
}, context: Context) {
    const menu = cell(props.menu);
    const list = document.createElement('ul');
    list.setAttribute('role', 'menubar');
    let items: MenuListItem[] = [];
    context.onDestroy(menu.getAndObserve(menu => {
        items.forEach(item => item.submenu?.close());
        items = createMenuItems(list, menu, 'horizontal', context);
    }));
    const onClick = () => {
        items.forEach(item => item.submenu?.close());
    };
    const onKeydown = (e: KeyboardEvent) => {
        if (e.altKey && !e.shiftKey && !e.ctrlKey) {
            const key = e.key.toLowerCase();
            const item = items.find(item => item.item.mnemonic === key);
            console.log(key, item);
            if (item) {
                e.preventDefault();
                item.activate();
            }
        }
    };
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKeydown);
    context.onDestroy(() => {
        document.removeEventListener('click', onClick);
        document.removeEventListener('keydown', onKeydown);
    });
    return () => list;
}
