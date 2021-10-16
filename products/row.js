class AbsPart {
    constructor(sym, fusion = false) {
        [this.sym, this.fusion] = [sym, fusion];
    }
    code(part = this.sym + '.' + this.constructor.name.toLowerCase(), symCode = this.symCode, fusion = this.fusion) {
        const mode = part.match(/\+[^.′ ]+/)?.[0];
        mode ? symCode = symCode.replace(mode, '') + `<sub>${mode.replace(/\+(?=[sh])/, '')}</sub>` : '';
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
            return super.code(`${sym}.layer7b`, `<s>&lt;</s>&nbsp;${sym}`, false);
        if (this.system == 'SP')
            return super.code(`${sym}.layer6r`, `<s>=</s>${sym[0]}`, false);
        if (this.system == 'GT')
            return super.code(`${sym}.layer5b`, `<s>&gt;</s>&nbsp;&nbsp;${sym}`, false);
    }
    motif(sym) {
        if (sym == '/')
            return this.none();
        if (this.system == 'DB')
            return super.code(`${sym}.layer7c`, '<s>&lt;</s>' + sym.replace('2', '<sup>2</sup>'), false);
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
        this.system = /^\d+$/.test(key) ? 'DB' : /^\d[A-Z]$/.test(key) || /2$/.test(motif) ? 'SP' : 'GT';
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
        this.symCode = (lowerFusion ? '&nbsp;' : '') + sym.replace(/\+′$/, '<sup>+</sup>′').replace('′', '<s>#</s><i>′</i>') + (sym == '∞' ? '&nbsp;' : '');
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
        this.no = no;
        let [layer, disk, driver] = abbr.split(' ');
        if (disk && !driver) // lower fusion
            [layer, disk, driver] = [new Layer(layer), new Disk('/'), new Driver(disk, true)];
        else if (disk == '/' && driver != '/') // upper fusion
            [layer, disk, driver] = [new Layer(layer, true), new Disk(layer == 'nL' ? '_' : '/'), new Driver(driver)];
        else
            [layer, disk, driver] = [new Layer(layer), new Disk(disk), new Driver(driver)];

        this.tr.innerHTML = this.numberCode(place) + layer.code() + (driver.fusion ? driver.code() + driver.none(true) : disk.code() + driver.code());
        this.attribute({
            'class': type,
            'data-no': no.split('.')[0],
            'data-abbr': abbr,
            'data-more': append?.more || append?.mode || '',
        }).append(append).rare();
        Q(place || 'tbody').appendChild(this.tr);
    }
    numberCode(place, no = this.no.split('.')[0]) {
        return `<td data-url='${Product.image(no)}'>` + no.replace(/^B-(\d\d)$/, 'B-<s>0</s>&nbsp;$1').replace(/(^BBG-\d+)/, place ? '$1' : 'wbba');
    }
    append(append) {
        if (!append) return this;
        let {chip, more} = append;
        if (chip)
            this.any('layer6c', 'layer').beforeEnd(`<img src=chips.svg#${chip}>`);
        more = more?.split('.');
        if (more && !/[FSVL]$/.test(more[0]))
            for (const td of this.any(more[1], 'layer').next2()) 
                td.beforeEnd(`<b>${more[0].replace(/^([^+])/, '+$1')}</b>`);
        return this;
    }
    attribute(attr) {
        for (const a in attr) if (attr[a]) this.tr.setAttribute(a, attr[a]);
        this.tr.hidden = !Row.show;
        this.no == Table.limit ? Row.show = false : null;
        return this;
    }
    rare(no = parseInt(this.no.split('-')[1])) {
        if ([100, 117, 129].includes(no))
            this.any('layer').style.color = 'black';
        else if ([139, 140.1, 142, 144, 145.1, 145.2, 146.1, 148, 149.1, 149.2, 150, 151.1, 153.1, 153.2, 154, 155, 156.1, 157].includes(no))
            this.tr.classList.add('GT');
        else if (no >= 159) {
            let x = Row.rareColors[no];
            if (x) return no >= 187 ? 
                this.all('layer7b', 'layer7c', 'driver').forEach(td => td.style.color = x) : 
                this.any('layer6s', 'disk').style.color = x;
            x = Row.reducedRate[`${no}`.split('.')[0]];
            if (x) return this.tr.setAttribute('data-extra', x);
        }
    }
    any(...tds) {return this.tr.querySelector(tds.map(td => `td[data-part$=${td}]`));}
    all(...tds) {return this.tr.querySelectorAll(tds.map(td => `td[data-part$=${td}]`));}
}
Row.rareColors = [
    [[159, 172, 179], 'rgb(210,190,0)'],
    [[160, 177], 'dodgerblue'],
    [[161, 163, 187], 'red'],
    [[167], 'lightseagreen'],
    [[168, 171.2, 175], 'rgb(174,91,215)'],
    [[169], 'deeppink'],
    [[171.1], 'deepskyblue'],
].reduce((obj, [nos, color]) => ({...obj, ...nos.reduce((obj, no) => ({...obj, [no]: color}), {}) }), {});
Row.reducedRate = [
    [[170], '03 04'],
    [[173, 176], '07 08'],
    [[181, 186], '03']
].reduce((obj, [nos, extra]) => ({...obj, ...nos.reduce((obj, no) => ({...obj, [no]: extra}), {}) }), {});
Row.show = true;

Object.assign(HTMLTableCellElement.prototype, {
    beforeEnd(html) {this.insertAdjacentHTML('beforeEnd', html);},
    next2() {return [this.nextElementSibling, this.nextElementSibling.nextElementSibling];},
    preview() {Previewer.reset().open()[this.hasAttribute('data-url') ? 'image' : 'part'](this);},
    decompose(preview = false) {
        const sym = new PartAbbr(...this.getAttribute('data-part').split('.')).decompose();
        if (preview) sym.preview(this.parentNode.getAttribute('data-more'));
        return {...sym.prop, parts: sym.parts};
    },
    code(lang) {
        const {parts: [sym, comp], prefix, dash, core, mode} = $(this).prevAll('td[data-part]')[0].decompose();
        let name = names[comp][sym] || ['', '', ''];
        name = Part.derivedNames({eng: name[0], chi: name[1], jap: name[2]}, prefix)[lang];
        this.innerHTML = this.innerHTML.replace(/^.*?(<b>.+>)?$/, this[lang](name, comp, core) + this.append(name, dash, mode) + '$1');
        this.classList[name.length >= this.oversize[lang][comp] ? 'add' : 'remove']('small');
    },
    eng: (name, comp, core) => (core ? `${core} ` : '') + (comp == 'driver' && name.length > 13 ? name.replace(' ', '<br>') : name),
    chi: (name, comp, core) => (core ? `<u>${core} </u>` : '') + name.replace('︱', '<s>︱</s>').replace(/＋$/, '<sup>＋</sup>').replace('無限Ⅼ', '無限<sup>Ｌ</sup>'),
    jap: (name, comp, core) => (core ? `${core} ` : '') + (comp == 'driver' && name.length > 8 ? name.replace(/(アルティメット|エクステンド|メタル)/, '$1<br>') : name),
    append: (name, dash, mode) => name ? (dash ? '<i>′</i>' : '') + (/^\+(?!s[hw])/.test(mode) ? `<sub>${mode}</sub>` : '') : '',
    oversize: {
        eng: {layer7b: 10, layer6c: 10, driver: 12},
        chi: {layer7b: 6, layer7c: 6, layer6r: 6, layer6c: 6, layer5b: 6, layer5c: 6, driver: 4},
        jap: {layer7b: 6, layer7c: 6, layer6r: 6, layer6c: 6, layer5b: 6, layer5c: 6, disk: 7, frame: 6, driver: 7} //イグニッション
    }
});
class PartAbbr {
    constructor(sym, comp) {
        [this.sym, this.comp, this.prop] = [sym, comp, {}];
    }
    yield(...items) {
        this.prop = items.reduce((prop, item) => ({...prop, [item]: PartAbbr.regex[item].exec(this.sym)?.[0]}), this.prop);
        this.sym = items.reduce((sym, item) => sym.replace(PartAbbr.regex[item], ''), this.sym);
        return this;
    }
    decompose() {
        this.yield('mode').yield(...{driver: ['prefix', 'dash'], disk: ['core']}[this.comp] || []);
        this.parts = [this.sym, this.comp = this.prop.core ? 'frame' : this.comp];
        return this;
    }
    preview(more) {
        this.parts = [this.parts.join('.'), 
            this.prop.core ? this.prop.core + '.disk' : null, 
            this.prop.mode ? this.prop.mode + '.' + this.comp : null, 
            more && more.split('.')[1].includes(this.comp) ? more : null
        ].filter(p => p && p[0] != '_');
    }
}
PartAbbr.regex = {
    prefix: /^[HM](?=[^′a-z])/,
    dash: /′(?:\+.)?$/,
    core: /[\dα′_]+(?=[A-Zα_])/,
    mode: /\+[^.′ ]+/
};
const Previewer = {
    reset() {
        Q('.catalog>*', el => el.remove());
        Q('label[for=popup]').removeAttribute('title');
        Q('label[for=popup] img', img => img.src = '');
        return this;
    },
    open() {
        Q('#popup').checked = true;
        return this;
    },
    image(td) {
        let [href, parent] = [td.getAttribute('data-url'), td.parentNode];
        Q('label[for=popup] img').src = href.indexOf('https') < 0 ? `https://beyblade.takaratomy.co.jp/category/img/products/${href}.png` : href;
        if (!parent.classList.contains('RB')) 
            return;
        Q('label[for=popup] img:nth-of-type(2)').src = `/img/RB/${parent.getAttribute('data-no')}.jpg`;
        if (parent.hasAttribute('data-extra'))
            Q('label[for=popup]').title = parent.getAttribute('data-no') >= 'B-181' ? 
                `01 機率 1/8；${parent.getAttribute('data-extra')} 機率 5/24` : 
                `01、02 機率各 1/12；${parent.getAttribute('data-extra').replace(' ', '、')} 機率各 1/6`;
    },
    part(td) {
        const {parts, dash, prefix} = (td.hasAttribute('data-part') ? td : $(td).prevAll('td[data-part]')[0]).decompose(true);
        parts.forEach(async p => {
            const part = await new Part(await DB.get('json', p), !/^\+/.test(p) && (prefix || dash)).attach(p).revise(prefix && dash);
            part.catalog();
            part.links();
        });
    }
}