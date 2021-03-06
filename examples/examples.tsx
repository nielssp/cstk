import { createElement, bind, mount, Hide, bindList, loop, Property } from "../src/component";
import { TextControl, Field } from "../src/form";
import { _, _n } from "../src/i18n";

import './classic-stylesheets/layout.css';
import './classic-stylesheets/themes/win9x/theme.css';
import './classic-stylesheets/themes/win9x/skins/95.css';

const text = new TextControl('');
const n = bind(0);
const a = new TextControl('2');
const b = new TextControl('3');
const c = a.flatMap(a => b.map(b => parseInt(a) + parseInt(b)));

const tasks = bindList<string>(['Buy milk']);
const task = new TextControl('');

const selection = bind<Property<string>|undefined>(undefined);

function addTask(e: Event) {
    e.preventDefault();
    tasks.push(task.value);
    task.value = '';
}

function removeTask() {
    if (selection.value != undefined) {
        const i = tasks.items.indexOf(selection.value);
        tasks.remove(i);
        if (tasks.length.value) {
            selection.value = tasks.items[Math.max(0, i - 1)];
        } else {
            selection.value = undefined;
        }
    }
}

const component = <div class='stack-column padding spacing'>
    <div class='stack-row spacing align-center'>
        <Field control={text}>
            <label>Label</label>
            <input type='text'/>
        </Field>
        <div>{_('"{text}" typed', {text})}</div>
    </div>
    <div class='stack-row spacing align-center'>
        <button onClick={() => {n.value++;}}>Button</button>
        <div>{_n('Clicked {n} time', 'Clicked {n} times', {n})}</div>
    </div>
    <Hide unless={n.map(n => n > 10)}>
        <div>
            Clicked more than 10 times
        </div>
    </Hide>
    <div class='stack-row align-center'>
        <Field control={a}>
            <input type='text'/>
        </Field>
        +
        <Field control={b}>
            <input type='text'/>
        </Field>
        =
        {c}
    </div>
    <div class='stack-row align-center spacing'>
        <div>{_n('{n} task', '{n} tasks', {n: tasks.length})}</div>
        <button disabled={selection.undefined} onClick={removeTask}>Remove</button>
    </div>
    <div class='list' role='listbox'>
        {loop(tasks, task => (
            <div role='option' tabIndex={0} aria-selected={selection.map(s => s === task ? 'true' : 'false')}
                onClick={() => selection.value = task}>
                {task}
            </div>
        ))}
    </div>
    <form class='stack-row spacing align-center' onSubmit={addTask}>
        <Field control={task}>
            <label>Add task</label>
            <input type='text'/>
        </Field>
        <button type='submit' disabled={task.not}>Add</button>
    </form>
</div>;

mount(document.body, component);
