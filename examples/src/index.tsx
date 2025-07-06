import { createElement, mount, _, _n } from 'cytoplasmic';
import { Menu, Action, MenuBar, DataGrid, numberColumn } from "../../src";

import './index.css';
import 'classic-stylesheets/layout.css';
import 'classic-stylesheets/themes/win9x/theme.css';
import 'classic-stylesheets/themes/win9x/skins/95.css';


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

interface Country {
    country: string;
    population: number;
    area: number;
    medianAge: number;
}

const countries: Country[] = `Germany 	84075075	348560	45
France 	66650804	547557	42
Italy 	59146260	294140	48
Spain 	47889958	498800	46
Poland 	38140910	306230	42
Romania 	18908650	230170	43
Netherlands 	18346819	33720	41
Belgium 	11758603	30280	42
Sweden 	10656633	410340	40
Czechia 	10609239	77240	44
Portugal 	10411834	91590	47
Greece 	9938844	128900	47
Hungary 	9632287	90530	44
Austria 	9113574	82409	44
Bulgaria 	6714560	108560	45
Denmark 	6002507	42430	41
Finland 	5623329	303890	43
Slovakia 	5474881	48088	42
Ireland 	5308039	68890	39
Croatia 	3848160	55960	45
Lithuania 	2830144	62674	42
Slovenia 	2117072	20140	45
Latvia 	1853559	62200	44
Cyprus 	1370754	9240	39
Estonia 	1344232	42390	43
Luxembourg 	680453	2590	39
Malta 	545405	320	41`.split('\n')
    .map(row => {
    const cells = row.split('\t');
    return {
        country: cells[0].trim(),
        population: +cells[1],
        area: +cells[2],
        medianAge: +cells[3],
    };
});

const numberFormat = new Intl.NumberFormat();

const component = <div class='flex-column padding gap'>
    <MenuBar menu={menu}/>
    <DataGrid source={countries} columns={[
        {
            label: 'Name',
            display: row => <strong>{row.props.country}</strong>,
            compare: (a, b) => a.country.localeCompare(b.country),
            defaultSort: 'ascending',
        },
        numberColumn<Country>('Population', row => row.population, n => numberFormat.format(n)),
        numberColumn<Country>('Area', row => row.area, n => `${numberFormat.format(n)} km²`),
        numberColumn<Country>('Median age', row => row.medianAge, n => numberFormat.format(n)),
    ]}/>
</div>;

mount(document.body, component);

