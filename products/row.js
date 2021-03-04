class AbsPart {
    constructor(sym, fusion = false) {
        [this.sym, this.fusion] = [sym, fusion];
    }
    code(part = this.sym+'.'+this.constructor.name.toLowerCase(), symCode = this.symCode, fusion = this.fusion) {
        return this.sym == '/' ? this.none() :
            `<td data-part='${part}'>${symCode}<td class=left><td class='right${fusion ? ' fusion' : ''}'>`;
    }
    none(hidden) {
        return `<td><s>${hidden ? this.sym : 'ꕕ'}</s><td><td class='right'>`
    };
}

class Layer extends AbsPart {
    constructor(sym, upperFusion) {
        super(sym, upperFusion);
        this.symCode = sym == 'Sr' ? '<s>s</s>&nbsp;Sr' : sym.replace(/^([A-ZαβΩ][^αγ]?)$/, '&nbsp;$1');
    }
    main(sym) {
        if (sym == '/')
            return this.none();
        if (this.system == 'DB')
            return super.code(`${sym}.layer7b`, `<s>&lt;</s>&nbsp;&nbsp;${sym}`, false);
        if (this.system == 'SP')
            return super.code(`${sym}.layer6r`, `<s>=</s>${sym[0]}`, false);
        if (this.system == 'GT')
            return super.code(`${sym}.layer5b`, `<s>&gt;</s>&nbsp;${sym}&nbsp;`, false);
    }
    motif(sym) {
        if (sym == '/')
            return this.none();
        if (this.system == 'DB')
            return super.code(`${sym}.layer7c`, '<s>&lt;</s>' + sym, false);
        if (this.system == 'SP')
            return super.code(`${sym}.layer6c`, '<s>=</s>' + sym.replace('2', '<sup>2</sup>'), false);
        if (this.system == 'GT')
            return super.code(`${sym}.layer5c`, '<s>&gt;</s>' + sym.replace('Δ','D'), sym == 'Δ');
    }
    key(sym) {
        if (this.system == 'DB')
            return `<td data-part='${sym}.layer7a'><s>.</s>${sym}`;
        if (this.system == 'SP') {
            const code = {'!': '🚫'}[sym];
            return `<td${this.fusion ? ' class=fusion' : ''}${code ? '' : ` data-part='${sym}.layer6s'`}>${code || sym}`;
        }
        if (this.system == 'GT') {
            const code = {'/': '<s>¬龘</s>', '!': '<s>¬</s>🚫'}[sym];
            return `<td${code ? '' : ` data-part='${sym}.layer5w'`}>${code || `<s>¬</s>${sym}`}`;
        }
    }
    code() {
        const [main, motif, key] = this.sym.split('.');
        if (!key)
            return super.code();
        this.system = /^\d+$/.test(key) ? 'DB' : /\d[A-Z]/.test(key) || /2$/.test(motif) ? 'SP' : 'GT';
        return this.main(main) + this.motif(motif) + this.key(key);
    }
}
class Disk extends AbsPart {
    constructor(sym) {
        super(sym);                                 // sort 0                            alphabet disk
        this.symCode = sym.replace(/^([0α]′?.)$/, '<s>-</s>$1').replace(/^([^\d_|(α′)]+)$/, '$1&nbsp;').replace('′', '<i>′</i>');
    }
}
class Driver extends AbsPart {
    constructor(sym, lowerFusion) {
        super(sym, lowerFusion);
        this.symCode = (lowerFusion ? '&nbsp;' : '') + sym.replace('′', '<s>#</s><i>′</i>').replace(/(\+.)/, `<sub>$1</sub>`) + (sym == '∞' ? '&nbsp;' : '');
    }
}

class Row {
    constructor(bey, place) {
        this.tr = document.createElement('tr');
        this.create(bey, place);
    }
    static connectedCallback(tr) {
        Row.fill(['eng', 'chi'], tr);
        for (const td of tr.querySelectorAll('td')) td.onclick = () => td.preview();
    }
    static fill(lang, tr) {
        tr.querySelectorAll('td[data-part]').forEach(td => {
            if (/layer(5w|6s|7a)$/.test(td.getAttribute('data-part')))
                return;
            const cells = td.next2();
            lang.forEach((l, i) => l ? cells[i].code(l) : null);
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

        let [layer, disk, driver] = abbr.split(' ');
        if (disk && !driver) // lower fusion
            [layer, disk, driver] = [new Layer(layer), new Disk('/'), new Driver(disk, true)];
        else if (disk == '/' && driver != '/') // upper fusion
            [layer, disk, driver] = [new Layer(layer, true), new Disk(layer == 'nL' ? '_' : '/'), new Driver(driver)];
        else
            [layer, disk, driver] = [new Layer(layer), new Disk(disk), new Driver(driver)];

        this.tr.innerHTML = `<td data-url='${Product.image(no)}'>` + no.replace(/^B-(\d\d)$/, 'B-<s>0</s>&nbsp;$1').replace(/(^BBG-\d+)/, place ? '$1' : 'wbba')
            + layer.code() + (driver.fusion ? driver.code() + driver.none(true) : disk.code() + driver.code());
        this.append(append);
        this.attribute(attr);
        Q(place || 'tbody').appendChild(this.tr);
    }
    append(append) {
        if (!append) return;
        const {mode, chip, more} = append;
        const add = (td, code) => td.insertAdjacentHTML('beforeend', code);
        if (chip)
            add(this.any('layer6c', 'layer'), `<img src=chips.svg#${chip} alt=${chip}>`);
        if (/^s[wh]$/.test(mode))
            add(this.any('layer6r'), `<sub>${mode}</sub>`);
        else if (/^\+/.test(mode))
            for (const td of this.any('driver').next2()) add(td, `<sub>${mode}</sub>`);
        else if (more)
            for (const td of this.any('layer6r', 'layer').next2()) add(td, `<b>${more}</b>`);
    }
    attribute({'data-no': no, ...attr}) {
        Object.entries({'data-no': no.split('.')[0], ...attr}).forEach(([a, v]) => v ? this.tr.setAttribute(a, v) : null);
        this.rare(parseFloat(no.split('-')[1]));
        this.tr.hidden = !Row.show;
        no == Table.limit ? Row.show = false : null;
    }
    rare(no) {
        const colors = [
            {n: [159, 172], color: 'rgb(210,190,0)'},
            {n: [160, 177], color: 'dodgerblue'},
            {n: [161, 163], color: 'red'},
            {n: [167], color: 'lightseagreen'},
            {n: [168, 171.2, 175], color: 'rgb(174,91,215)'},
            {n: [169], color: 'deeppink'},
            {n: [171.1], color: 'deepskyblue'}
        ];
        if ([100, 117, 129].includes(no))
            this.any('layer').style.color = 'black';
        else if ([139, 140.1, 142, 144, 145.1, 145.2, 146.1, 148, 149.1, 149.2, 150, 151.1, 153.1, 153.2, 154, 155, 156.1, 157].includes(no))
            this.tr.classList.add('GT');
        else if (no >= 159)
            for (const {n, color} of colors)
                if (n.includes(no))
                    return this.any('layer6s', 'disk').style.color = color;
    }
    any(...tds) {return this.tr.querySelector(tds.map(td => `td[data-part$=${td}]`).join(','));}
}
Row.show = true;
customElements.define('product-row', Row, {extends: 'tr'});

Object.assign(HTMLTableCellElement.prototype, {
    next2() {return [this.nextElementSibling, this.nextElementSibling.nextElementSibling];},
    decompose(preview = false) {
        let [sym, comp] = this.getAttribute('data-part').split('.');
        let dash, prefix, core, more, regex = {
            dash: /′(\+.)?$/,
            prefix: /^[HM](?=[^′a-z])/,
            core: /[\dα′_]+(?=[A-Zα_])/
        };
        if (comp == 'driver')
            [dash, prefix, sym] = [regex.dash.exec(sym)?.[0], regex.prefix.exec(sym)?.[0], sym.replace(regex.dash, '').replace(regex.prefix, '')];
        else if (comp == 'disk')
            [comp, core, sym] = [regex.core.test(sym) ? 'frame' : 'disk', regex.core.exec(sym)?.[0], sym.replace(regex.core, '')];
        if (preview) {
            more = this.parentNode.getAttribute('data-more');
            preview = [
                core ? [core, 'disk'] : null,
                /s[wh]/.test(more) && comp == 'layer6r' || /[ZX]/.test(more) && comp == 'driver' ? [`+${more}`, comp] : null
            ];
        }
        return {
            dash: dash, prefix: prefix, core: core,
            parts: !preview ? [sym, comp] : [...preview, [sym, comp]].filter(part => part && part[0] != '_')
        };
    },
    preview() {
        Q('.catalog>*', el => el.remove());
        Q('label[for=popup] img', img => img.src = '');
        Q('#popup').checked = true;
        if (this.hasAttribute('data-url')) {
            Row.previewing = this;
            let [href, parent] = [this.getAttribute('data-url'), this.parentNode];
            if (parent.classList.contains('RB'))
                Q('label[for=popup] img:nth-of-type(2)').src = `/img/RB/${parent.getAttribute('data-no')}.jpg`;
            return Q('label[for=popup] img').src = href.indexOf('https') < 0 ? `https://beyblade.takaratomy.co.jp/category/img/products/${href}.png` : href;
        }
        Row.previewing = this.hasAttribute('data-part') ? this : $(this).prevAll('td[data-part]')[0];
        const {parts, dash, prefix} = Row.previewing.decompose(true);
        parts.filter(p => p).forEach(async ([sym, comp]) => {
            const key = `${sym}.${comp}`;
            const part = await new Part(await DB.get('json', key), !/^\+/.test(sym) && (prefix || dash)).attach(key).revise(prefix && dash);
            part.catalog();
            part.links();
        });
    },
    code(lang) {
        const {parts: [sym, comp], prefix, dash, core} = $(this).prevAll('td[data-part]')[0].decompose();
        let name = names[comp][sym] || ['', '', ''];
        name = Part.derivedNames({eng: name[0], chi: name[1], jap: name[2]}, prefix)[lang];
        const code = {
            eng: name => (core ? `${core} ` : '') + (comp == 'driver' && name.length > 13 ? name.replace(' ', '<br>') : name),
            chi: name => (core ? `<u>${core} </u>` : '') + name.replace('︱', '<s>︱</s>').replace('無限Ⅼ', '無限<sup>Ｌ</sup>'),
            jap: name => (core ? `${core} ` : '') + (comp == 'driver' ? name.replace(/(アルティメット|エクステンド)/, '$1<br>') : name)
        }[lang](name) + (name && dash ? '<i>′</i>' : '');
        this.innerHTML = this.innerHTML.replace(/^.*?(<(sub|b)>.+>)?$/, code + '$1');

        const oversize = {eng: {layer6c: 10, driver: 12}};
        oversize.chi = {layer6r: 6, layer6c: 6, layer5b: 6, layer5c: 6, driver: 4};
        oversize.jap = {...oversize.chi, disk: 7, frame: 6, driver: 7}; //イグニッション
        this.classList[name.length >= oversize[lang][comp] ? 'add' : 'remove']('small');
    }
});
document.onkeydown = ev => {
    if (!Q('#popup').checked) return;
    ev.preventDefault();
    if (ev.key == 'ArrowRight')
        $(Row.previewing).nextAll('td[data-part]')[0]?.preview();
    else if (ev.key == 'ArrowLeft')
        $(Row.previewing).prevAll('td[data-part],td[data-url]')[0]?.preview();
    else if (/^Arrow(Up|Down)$/.test(ev.key)) {
        const sib = $(Row.previewing.parentNode)[(ev.key == 'ArrowUp' ? 'prev' : 'next') + 'All']('tr:not([hidden])')[0];
        if (Row.previewing.hasAttribute('data-url'))
            return sib?.querySelector('td[data-url]').preview();
        const comp = Row.previewing.getAttribute('data-part').split('.')[1];
        (sib?.querySelector(`td[data-part$=${comp}]`) || sib?.querySelector(`td[data-part*=${comp.replace(/\d.$/, '')}]`))?.preview();
    }
}