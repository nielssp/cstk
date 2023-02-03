import { createElement, bind, mount, bindList, Property, Show, For, Style, zipWith, ref, ariaBool, Deref, Unwrap, Context } from "../src";
import { Menu, Action, MenuBar } from "../src/widgets/index";
import { TextControl, Field, IntControl } from "../src/form";
import { _, _n } from "../src/i18n";

import './classic-stylesheets/layout.css';
import './classic-stylesheets/themes/win9x/theme.css';
import './classic-stylesheets/themes/win9x/skins/95.css';

const text = new TextControl('');
const n = bind(0);
const a = new TextControl('2');
const b = new TextControl('3');
const c = zipWith([a, b], (a, b) => parseInt(a) + parseInt(b));

const showCounter = bind(true);

const tasks = bindList<string>(['Buy milk']);
const task = new TextControl('');

const selection = ref<number>();

function addTask(e: Event) {
    e.preventDefault();
    tasks.push(task.value);
    task.value = '';
}

function insertTask(e: Event) {
    e.preventDefault();
    if (selection.value != undefined) {
        tasks.insert(selection.value, task.value);
    } else {
        tasks.insert(0, task.value);
    }
    task.value = '';
}

function removeTask() {
    if (selection.value != undefined) {
        tasks.remove(selection.value);
        if (tasks.length.value) {
            selection.value = Math.max(0, selection.value - 1);
        } else {
            selection.value = undefined;
        }
    }
}

function moveTaskUp() {
    if (selection.value != undefined && selection.value > 0) {
        const removed = tasks.remove(selection.value);
        if (removed) {
            tasks.insert(selection.value - 1, removed);
            selection.value--;
        }
    }
}

function moveTaskDown() {
    if (selection.value != undefined && selection.value < tasks.items.length - 1) {
        const removed = tasks.remove(selection.value);
        if (removed) {
            tasks.insert(selection.value + 1, removed);
            selection.value++;
        }
    }
}

function Counter(_props: {}, context: Context): JSX.Element {
    const count = bind(0);
    const interval = setInterval(() => {
        count.value++;
        console.log(`The count is ${count.value}`);
    }, 1000);
    context.onDestroy(() => clearInterval(interval));
    return <div>The count is {count}</div>;
}

function TemperatureConverter() {
    const celcius = new IntControl(5);
    const fahrenheit = new IntControl(celcius.bimap(
        c => Math.floor(c * 9 / 5 + 32),
        f => Math.floor((f - 32) * 5 / 9),
    ));
    return <div class='stack-row spacing align-center'>
        <Field control={celcius}>
            <input type='text'/>
            <label>Celcius =</label>
        </Field>
        <Field control={fahrenheit}>
            <input type='text'/>
            <label>Fahrenheit</label>
        </Field>
    </div>;
}

function TemperatureConverter2() {
    const celcius = new TextControl('5');
    const fahrenheit = new TextControl(celcius.bimap(
        c => String(parseFloat(c) * 9 / 5 + 32),
        f => String((parseFloat(f) - 32) * 5 / 9),
    ));
    return <div class='stack-row spacing align-center'>
        <Field control={celcius}>
            <input type='text'/>
            <label>Celcius =</label>
        </Field>
        <Field control={fahrenheit}>
            <input type='text'/>
            <label>Fahrenheit</label>
        </Field>
    </div>;
}

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
    <div class="lowered">
        <div style={{backgroundColor: '#008', height: '20px', width: n.map(n => `${n}px`)}}></div>
    </div>
    <Show when={n.map(n => n > 10)}>
        <div>
            Clicked more than 10 times
        </div>
    </Show>
    <div class='stack-row align-center'>
        <Field control={a}>
            <input type='text'/>
        </Field>
        +
        <Field control={b}>
            <input type='text'/>
        </Field>
        = {c}
    </div>
    <div class='stack-row spacing align-center'>
        <button onClick={() => {showCounter.value = !showCounter.value;}}>
            {showCounter.map(x => x ? 'Hide counter' : 'Show counter')}
        </button>
        <Show when={showCounter}>
            <Show when={showCounter}>
                <Counter/>
            </Show>
        </Show>
    </div>
    <h2>Todo list</h2>
    <div class='stack-row align-center spacing'>
        <div>{_n('{n} task', '{n} tasks', {n: tasks.length})}</div>
        <button disabled={selection.undefined} onClick={removeTask}>Remove</button>
        <button disabled={selection.undefined} onClick={moveTaskUp}>Up</button>
        <button disabled={selection.undefined} onClick={moveTaskDown}>Down</button>
    </div>
    <div class='list' role='listbox'>
        <For each={tasks}>
            {(task, index) => (
                <div role='option' tabIndex={0} aria-selected={ariaBool(index.eq(selection))}
                    onClick={() => selection.value = index.value}>
                    {index.map(i => i + 1)}: {task}
                </div>
            )}
        </For>
    </div>
    <form class='stack-row spacing align-center' onSubmit={addTask}>
        <Field control={task}>
            <label>Add task</label>
            <input type='text'/>
        </Field>
        <button type='submit' disabled={task.not}>Add</button>
        <button onClick={insertTask} disabled={task.not}>Insert</button>
    </form>
    <h2>Temperature converter</h2>
    <TemperatureConverter/>
    <TemperatureConverter2/>
    <MenuBar menu={menu}/>
</div>;

mount(document.body, component);

