class Part {
    constructor(sym, fusion = false) {
        [this.sym, this.fusion] = [sym, fusion];
    }
    code(dataPart, symCode, fusion) {
        if (this.sym == '/')
            return Part.none();
        dataPart ??= this.sym + '.' + this.constructor.name.toLowerCase();
        symCode ??= this.symCode;
        fusion ??= this.fusion;

        return `
            <td data-part='${dataPart}'>${symCode}</td>
            <td${/layer$/.test(dataPart) ? ' colspan' : ''} class='left'></td>
            <td${/layer$/.test(dataPart) ? ' colspan' : ''} class='right${fusion ? ' fusion' : ''}'></td>`;
    }
    static none = sym => `<td><s>${sym || 'ꕕ'}</s><td><td class='right'></td>`;
}

class Layer extends Part {
    constructor(sym, upperFusion) {super(sym, upperFusion);}

    none = "<td><s>ꕕ</s><td colspan><td colspan class='right'></td>";

    symCode = this.sym == 'Sr' ? '<s>s</s>&nbsp;Sr' : this.sym.replace(/^([A-ZαβΩ][^αγ]?)$/, '&nbsp;$1');

    baseORring(sym) {
        if (sym == '/')
            return this.none;
        if (this.system == 'GT')
            return super.code(`${sym}.layer5b`, `<s>&gt;</s>&nbsp;&nbsp;${sym}`, false);
        if (this.system == 'SP')
            return super.code(`${sym}.layer6r`, `<s>&lt;</s>${sym[0]}`, false);
    }
    chip(sym) {
        if (sym == '/')
            return this.none;
        if (this.system == 'GT')
            return super.code(`${sym}.layer5c`, '<s>&gt;</s>' + sym.replace('Δ','D'), sym == 'Δ');
        if (this.system == 'SP')
            return super.code(`${sym}.layer6c`, '<s>&lt;</s>' + sym.replace('2', '<sup>2</sup>'), false);
    }
    weightORchassis(sym) {
        if (this.system == 'GT') {
            const code = {'/': '<s>¬龘</s>', '!': '<s>¬</s>🚫'}[sym];
            return `<td${code ? '' : ` data-part='${sym}.layer5w'`}>${code || `<s>¬</s>${sym}`}</td>`;
        }
        if (this.system == 'SP') {
            const code = {'!': '🚫'}[sym];
            return `<td${this.fusion ? ' class=fusion' : ''}${code ? '' : ` data-part='${sym}.layer6s'`}>${code || sym}</td>`;
        }
    }
    code() {
        if (this.sym == '/')
            return Part.none();
        const [body, chip, key] = this.sym.split('.');
        if (!key)
            return super.code(`${this.sym}.layer`, this.symCode, this.sym == 'nL');

        this.system = /\d[A-Z]/.test(key) || /2$/.test(chip) ? 'SP' : 'GT';
        return this.baseORring(body) + this.chip(chip) + this.weightORchassis(key);
    }
}
class Disk extends Part {
    constructor(sym) {super(sym);}     // sort 0                     alphabet disk
    symCode = this.sym.replace(/^([0α]′?.)$/, '<s>-</s>$1').replace(/^([^\d_|(α′)]+)$/, '$1&nbsp;').replace('′', '<i>′</i>');
}
class Driver extends Part {
    constructor(sym, lowerFusion) {super(sym, lowerFusion);}
    symCode = (this.fusion ? '&nbsp;' : '') + this.sym.replace('′', '<s>#</s><i>′</i>').replace(/(\+.)/, `<sub>$1</sub>`) + (this.sym == '∞' ? '&nbsp;' : '');
}

class Row extends HTMLTableRowElement {
    constructor(p) {
        super();
        p ? this.create(p) : null;
    }
    connectedCallback = () => setTimeout(() => this.querySelectorAll('td[data-part]').forEach(td => td.onclick = () => Cell.preview(td)));

    create([no, type, abbr, append]) {
        const attr = {
            'class': type,
            'data-no': no,
            'data-abbr': abbr,
            'data-more': (append?.mode || append?.more || '').replace('+', '')
        };
        no = no.split('.')[0];
        no == 'BBG-34' ? Row.SP = false : null;

        let [layer, disk, driver] = abbr.split(' ');
        if (disk && !driver) // lower fusion
            [layer, disk, driver] = [new Layer(layer), new Disk('/'), new Driver(disk, true)];
        else if (disk == '/' && driver != '/') // upper fusion
            [layer, disk, driver] = [new Layer(layer, true), new Disk(layer == 'nL' ? '_' : '/'), new Driver(driver)];
        else
            [layer, disk, driver] = [new Layer(layer), new Disk(disk), new Driver(driver)];

        this.innerHTML = `<td data-url='${Product.image(no)}'>` + no.replace(/^B-(\d\d)$/, 'B-&nbsp;$1').replace(/^BBG-\d+/, 'wbba') + '</td>'
            + layer.code() + (driver.fusion ? driver.code() + Part.none(driver.sym) : disk.code() + driver.code());
        Row.fill(['eng', 'chi'], this);
        append ? this.append(append) : null;
        this.attribute(attr);
        document.querySelector('table').appendChild(this);
    }
    static fill(lang, tr) {
        (tr || document).querySelectorAll('td[data-part]').forEach(td => {
            let {dash, high, core, parts: [sym, comp]} = Cell.decompose(td);
            if (/^layer(5w|6s)$/.test(comp))
                return;
            const cells = Row.next2(td);
            lang.forEach((l, i) => l ? Cell.code(l, cells[i], sym, comp, core, dash, high) : null);
        });
    }
    append(append) {
        const {mode, chip, more} = append;
        const add = (td, code) => td.insertAdjacentHTML('beforeend', code);
        if (chip)
            add(this.cell(['layer6c', 'layer']), `<img src=chips.svg#${chip}>`);
        if (/^s[wh]$/.test(mode))
            add(this.cell(['layer6r']), `<sub>${mode}</sub>`);
        else if (/^\+/.test(mode))
            Row.next2(this.cell(['driver'])).forEach(td => add(td, `<sub>${mode}</sub>`));
        else if (more)
            Row.next2(this.cell(['layer6r', 'layer'])).forEach(td => add(td, `<b>${more}</b>`));
    }
    attribute({'data-no': no, ...attr}) {
        Object.entries({'data-no': no.split('.')[0], ...attr}).forEach(([a, v]) => v ? this.setAttribute(a, v) : null);
        this.rare(no);
        //this.hidden = !Row.SP && Table.limit;
    }
    rare(no) {
        if ([100, 117, 129].map(n => `B-${n}`).includes(no))
            this.cell(['layer']).style.color = 'black';
        else if ([139, 140.1, 142, 144, 145.1, 145.2, 146.1, 148, 149.1, 149.2, 150, 151.1, 153.1, 153.2, 154, 155, 156.1, 157].map(n => `B-${n}`).includes(no))
            this.classList.add('GT');
        else [
                {n: [159, 172], color: 'rgb(210,190,0)'},
                {n: [160], color: 'dodgerblue'},
                {n: [161, 163], color: 'red'},
                {n: [167], color: 'lightseagreen'},
                {n: [168, 171.2, 175], color: 'rgb(174,91,215)'},
                {n: [169], color: 'deeppink'},
                {n: [171.1], color: 'deepskyblue'}
            ].forEach(({n, color}) =>
                n.map(n => `B-${n}`).includes(no) ? this.cell(['layer6s', 'disk']).style.color = color : null);
    }
    cell = tds => this.querySelector(`td[data-part$=${tds[0]}]`) || this.querySelector(`td[data-part$=${tds[1]}]`);
    static next2 = td => [td.nextElementSibling, td.nextElementSibling.nextElementSibling];
    static SP = true;
}
customElements.define('product-row', Row, {extends: 'tr'});

const Cell = {
    decompose(td, preview = false) {
        let [sym, comp] = td.getAttribute('data-part').split('.');
        let dash, high, core, more, regex = {
            dash: /′(\+.)?$/,
            high: /^H(?=[^′a-z])/,
            core: /[\dα′_]+(?=[A-Zα_])/
        };
        if (comp == 'driver')
            [dash, high, sym] = [regex.dash.test(sym), regex.high.test(sym), sym.replace(regex.dash, '').replace(regex.high, '')];
        else if (comp == 'disk')
            [comp, core, sym] = [regex.core.test(sym) ? 'frame' : 'disk', (sym.match(regex.core) || [])[0], sym.replace(regex.core, '')];
        if (preview) {
            more = td.parentNode.getAttribute('data-more');
            preview = [
                core ? [core, 'disk'] : null,
                /s[wh]/.test(more) && comp == 'layer6r' || /[ZX]/.test(more) && comp == 'driver' ? ['+' + more, comp] : null
            ];
        }
        return {
            dash: dash, high: high, core: core,
            parts: !preview ? [sym, comp] : [[sym, comp], ...preview].filter(p => p)
        };
    },
    preview(td) {
        console.log(Cell.decompose(td, true));
    },
    code(lang, td, sym, comp, core, dash, high) {
        const i = ['eng', 'chi', 'jap'].findIndex(l => l == lang);
        const name = (high ? ['High ', '高位', 'ハイ'][i] : '') + ((names[comp][sym] || [])[i] || '');
        const code = {
            eng: name => (core ? `${core} ` : '') + (comp == 'driver' && name.length > 11 ? name.replace(' ', '<br>') : name),
            chi: name => (core ? `<u>${core} </u>` : '') + name.replace('︱', '<s>︱</s>').replace('無限Ⅼ', '無限<sup>Ｌ</sup>'),
            jap: name => (core ? `${core} ` : '') + (comp == 'driver' ? name.replace(/(アルティメット|エクステンド)/, '$1<br>') : name)
        }[lang](name) + (name && dash ? '<i>′</i>' : '');
        td.innerHTML = td.innerHTML.replace(/^.*?(<(sub|b)>.+>)?$/, code + '$1');

        const oversize = {eng: {driver: 12}};
        oversize.chi = {layer6r: 6, layer6c: 6, layer5b: 6, layer5c: 6, driver: 4};
        oversize.jap = {...oversize.chi, disk: 7, frame: 6, driver: 7}; //イグニッション
        td.classList[name.replace(' ', '').length >= oversize[lang][comp] ? 'add' : 'remove']('small');
    }
}