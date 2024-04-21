/** @jsx createElement */
import { createElement, mount, _, _n } from "../src";
import { Menu, Action, MenuBar } from "../src";

const menu = new Menu();
const fileMenu = menu.addSubmenu('&File')
    .add(new Action('&Open'))
    .add(new Action('&Save', {
        onClick: () => alert('save'),
    }))
    .add(new Menu('Recent Files')
        .add(new Action('foo.txt'))
        .add(new Action('bar.txt'))
        .add(new Action('baz.txt')))
    .addSeparator()
    .add(new Action('E&xit'));
const editMenu = menu.addSubmenu('&Edit')
    .add(new Action('Cu&t'))
    .add(new Action('&Copy'))
    .add(new Action('&Paste'));
menu.add(new Action('&Help'));

const component = <div class='stack-column padding spacing'>
    <MenuBar menu={menu}/>
</div>;

mount(document.body, component);

