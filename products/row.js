class Part {
    constructor(sym, fusion = false) {
        [this.sym, this.fusion, this.single] = [sym, fusion, false];
    }
    code(part = this.sym+'.'+this.constructor.name.toLowerCase(), symCode = this.symCode, fusion = this.fusion) {
        if (this.sym == '/')
            return this.none();
        return `<td data-part='${part}'>${symCode}<td${this.colspan} class=left><td${this.colspan} class='right${fusion ? ' fusion' : ''}'>`;
    }
    none(hidden) {return `<td><s>${hidden ? this.sym : 'ꕕ'}</s><td${this.colspan}><td${this.colspan} class='right'>`};
    get colspan() {return this.single ? ' colspan' : '';}
}

class Layer extends Part {
    constructor(sym, upperFusion) {
        super(sym, upperFusion);
        this.symCode = sym == 'Sr' ? '<s>s</s>&nbsp;Sr' : sym.replace(/^([A-ZαβΩ][^αγ]?)$/, '&nbsp;$1');
    }
    baseORring(sym) {
        if (sym == '/')
            return this.none();
        if (this.system == 'GT')
            return super.code(`${sym}.layer5b`, `<s>&gt;</s>&nbsp;&nbsp;${sym}`, false);
        if (this.system == 'SP')
            return super.code(`${sym}.layer6r`, `<s>&lt;</s>${sym[0]}`, false);
    }
    chip(sym) {
        if (sym == '/')
            return this.none();
        if (this.system == 'GT')
            return super.code(`${sym}.layer5c`, '<s>&gt;</s>' + sym.replace('Δ','D'), sym == 'Δ');
        if (this.system == 'SP')
            return super.code(`${sym}.layer6c`, '<s>&lt;</s>' + sym.replace('2', '<sup>2</sup>'), false);
    }
    weightORchassis(sym) {
        if (this.system == 'GT') {
            const code = {'/': '<s>¬龘</s>', '!': '<s>¬</s>🚫'}[sym];
            return `<td${code ? '' : ` data-part='${sym}.layer5w'`}>${code || `<s>¬</s>${sym}`}`;
        }
        if (this.system == 'SP') {
            const code = {'!': '🚫'}[sym];
            return `<td${this.fusion ? ' class=fusion' : ''}${code ? '' : ` data-part='${sym}.layer6s'`}>${code || sym}`;
        }
    }
    code() {
        const [body, chip, key] = this.sym.split('.');
        if (!key) {
            this.single = true;
            return super.code();
        }
        this.system = /\d[A-Z]/.test(key) || /2$/.test(chip) ? 'SP' : 'GT';
        return this.baseORring(body) + this.chip(chip) + this.weightORchassis(key);
    }
}
class Disk extends Part {
    constructor(sym) {
        super(sym);                                 // sort 0                            alphabet disk
        this.symCode = sym.replace(/^([0α]′?.)$/, '<s>-</s>$1').replace(/^([^\d_|(α′)]+)$/, '$1&nbsp;').replace('′', '<i>′</i>');
    }
}
class Driver extends Part {
    constructor(sym, lowerFusion) {
        super(sym, lowerFusion);
        this.symCode = (lowerFusion ? '&nbsp;' : '') + sym.replace('′', '<s>#</s><i>′</i>').replace(/(\+.)/, `<sub>$1</sub>`) + (sym == '∞' ? '&nbsp;' : '');
    }
}

class Row {
    constructor(p, place) {
        this.tr = document.createElement('tr');
        p ? this.create(p, place) : null;
    }
    static connectedCallback(tr) {
        Row.fill(['eng', 'chi'], tr);
        tr.querySelectorAll('td').forEach(td => td.onclick = () => Cell.preview(td));
    }
    static fill(lang, tr) {
        tr.querySelectorAll('td[data-part]').forEach(td => {
            if (/layer(5w|6s)$/.test(td.getAttribute('data-part')))
                return;
            const cells = Row.next2(td);
            lang.forEach((l, i) => l ? Cell.code(l, cells[i]) : null);
        });
    }
    create([no, type, abbr, append], place) {
        const attr = {
            'class': type,
            'data-no': no,
            'data-abbr': abbr,
            'data-more': (append?.mode || append?.more || '').replace('+', '')
        };
        no = no.split('.')[0];
        no == !place && 'BBG-34' ? Row.SP = false : null;

        let [layer, disk, driver] = abbr.split(' ');
        if (disk && !driver) // lower fusion
            [layer, disk, driver] = [new Layer(layer), new Disk('/'), new Driver(disk, true)];
        else if (disk == '/' && driver != '/') // upper fusion
            [layer, disk, driver] = [new Layer(layer, true), new Disk(layer == 'nL' ? '_' : '/'), new Driver(driver)];
        else
            [layer, disk, driver] = [new Layer(layer), new Disk(disk), new Driver(driver)];

        this.tr.innerHTML = `<td data-url='${Product.image(no)}'>` + no.replace(/^B-(\d\d)$/, 'B-&nbsp;$1').replace(/(^BBG-\d+)/, place ? '$1' : 'wbba')
            + layer.code() + (driver.fusion ? driver.code() + driver.none(true) : disk.code() + driver.code());
        append ? this.append(append) : null;
        this.attribute(attr);
        document.querySelector(place || 'tbody').appendChild(this.tr);
    }
    append(append) {
        const {mode, chip, more} = append;
        const add = (td, code) => td.insertAdjacentHTML('beforeend', code);
        if (chip)
            add(this.cell(['layer6c', 'layer']), `<img src=chips.svg#${chip} alt=${chip}>`);
        if (/^s[wh]$/.test(mode))
            add(this.cell(['layer6r']), `<sub>${mode}</sub>`);
        else if (/^\+/.test(mode))
            Row.next2(this.cell(['driver'])).forEach(td => add(td, `<sub>${mode}</sub>`));
        else if (more)
            Row.next2(this.cell(['layer6r', 'layer'])).forEach(td => add(td, `<b>${more}</b>`));
    }
    attribute({'data-no': no, ...attr}) {
        Object.entries({'data-no': no.split('.')[0], ...attr}).forEach(([a, v]) => v ? this.tr.setAttribute(a, v) : null);
        this.rare(no);
        this.tr.hidden = !Row.SP && Table.limit;
    }
    rare(no) {
        if ([100, 117, 129].map(n => `B-${n}`).includes(no))
            this.cell(['layer']).style.color = 'black';
        else if ([139, 140.1, 142, 144, 145.1, 145.2, 146.1, 148, 149.1, 149.2, 150, 151.1, 153.1, 153.2, 154, 155, 156.1, 157].map(n => `B-${n}`).includes(no))
            this.tr.classList.add('GT');
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
    cell(tds) {return this.tr.querySelector(`td[data-part$=${tds[0]}]`) || this.tr.querySelector(`td[data-part$=${tds[1]}]`);}
    static next2(td) {return [td.nextElementSibling, td.nextElementSibling.nextElementSibling];}
}
Row.SP = true;
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
        Q('.catalog>*', el => el.remove());
        Q('#popup').click();
        if (td.hasAttribute('data-url')) {
            let href = td.getAttribute('data-url');
            return Q('label[for=popup] img').src = href.indexOf('https') < 0 ? `https://beyblade.takaratomy.co.jp/category/img/products/${href}.png` : href;
        }
        Q('label[for=popup] img').src = '';
        const {parts} = Cell.decompose(td.hasAttribute('data-part') ? td : $(td).prevAll('td[data-part]')[0], true);
        const links = (comp, group, sym) => {
            Q('.catalog>a:last-of-type').removeAttribute('href');
            const temp = Q('template').content.cloneNode(true);
            temp.querySelector('a[onclick]').onclick = () => Search.autofill(/^\+/.test(sym) ? 'more' : comp, sym);
            temp.querySelector('a[href]').href = `/parts/?${group}#${sym}`;
            /^(layer|remake)/.test(group) ?
                temp.querySelector('img').src = `/img/system-${group.replace(/^layer5$/, 'layer5m').replace(/(layer\d)[^m]$/, '$1')}.png` :
                temp.querySelector('img').remove();
            Q('.catalog').insertBefore(temp, Q('.catalog>a:last-of-type'));
        }
        parts.filter(p => p).forEach(([sym, comp]) =>
            DB.get('json', `${sym}.${comp}`, null, ev => {
                Catalog(Parts.attach([sym, comp], ev.target.result));
                links(comp, ev.target.result.group, sym);
            })
        );
    },
    code(lang, td) {
        const {parts: [sym, comp], high, dash, core} = Cell.decompose($(td).prevAll('td[data-part]')[0]);
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