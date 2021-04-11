const Search = {
    esc: string => string ? string.replace(/\s/g, '').replace(/[’'ʼ´ˊ]/g, '′').replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : undefined,
    read(where) {
        if (where == 'free') 
            return this.inputs = this.esc(Q('input[name=free]').value);
        this.inputs = [...where == 'form' ? new FormData(Q('form')) : new URLSearchParams(location.search)]
                    .filter(([k, v]) => k.length > 1 && v !== '')
                    .reduce((inputs, [comp, sym]) => ({...inputs, [comp]: this.esc(decodeURIComponent(sym)).split('/')}), {});
        return Object.keys(this.inputs).length > 0;
    },
    go() {
        this.dash = this.high = this.metal = false;
        this.regex = [], this.more = [], this.mode = '';
        for (const w of ['free', 'form', 'query'])
            if (this.read(w)) 
                return this.process(w).buildRegex(w == 'form').find();
    },
    process(where) {
        if (where == 'free') {
            let input = this.inputs;
            [this.dash, this.high, this.metal] = [/′$/, /high|ハイ|高位/i, /metal|メタル|金屬/i].map(regex => regex.test(input));
            [, input, this.mode] = input.match(/^([^ +]*?)(\\\+.+)?$/);
            
            const match = (sym, name, input) => new RegExp(`^${input}$`, 'i').test(sym) ||
            (/^[0-9A-zαβΩΔ]{1,2}(′|\\\+)?$/.test(input) ? false : name.some(n => new RegExp(input, 'i').test(n)));
            this.inputs = {};
            if (input == '′')
                this.inputs.driver = ['[A-zαβΩ]+'];
            else if (/^[\dα′]+[A-Zα_]$/i.test(input))
                this.inputs.layer6s = this.inputs.disk = [input.toUpperCase()];
            else 
                for (const comp in names) {
                    if (comp == 'driver' && !this.mode) input = input.replace('′', '');
                    if (!input && !this.mode) continue;
                    this.inputs[comp] = Object.entries(names[comp]).filter(([sym, name]) => match(sym, name, input || this.mode)).map(([sym]) => this.esc(sym));
                }
        }
        if (where == 'form') {
            const processors = {
                layer5c: input => /^d$/i.test(input) ? ['D', 'Δ'] : /^a$/i.test(input) ? ['A', 'Ɐ'] : input,
                disk: input => input.replace(/([A-z])/, l => l.toUpperCase()),
            };
            for (const comp in this.inputs)
                this.inputs[comp] = this.inputs[comp].map(sym => processors[comp]?.(sym) || sym).flat();
        }
        return this;
    },
    buildRegex(i = false) {
        this.more = Object.entries(this.inputs).map(([comp, syms]) => syms.map(sym => `${sym.replace('\\+', '+')}.${comp}`)).flat();
        for (const comp in this.inputs) {
            this.inputs[comp] = this.inputs[comp].map(sym => /^\\+/.test(sym) ? `[^ .]+${sym}` : `${sym}${this.mode?.toUpperCase() || ''}`).filter(sym => sym);
            if (this.inputs[comp].length === 0) delete this.inputs[comp];
        }
        if (Object.keys(this.inputs).length === 0)
            this.regex.push(new RegExp(this.mode || '__', 'i'));

        let t = this.inputs;
        i = i ? 'iu' : 'u';
        if (t.layer7b)
            this.regex.push(new RegExp('^(' + t.layer7b.join('|') + ')\\..+\\.\\d (.+ )?.+?$', i));
        if (t.layer7c)
            this.regex.push(new RegExp('^.+\\.(' + t.layer7c.join('|') + ')\\.\\d (.+ )?.+?$', i));
        if (t.layer6r)
            this.regex.push(new RegExp('^(' + t.layer6r.join('|') + ')(\\+.+)?.?\\..+\\.(\\w|!(?=\\s\\p{sc=Han}))+ (.+ )?.+?$', i));
        if (t.layer6c)
            this.regex.push(new RegExp('^.+\\.(' + t.layer6c.join('|') + ')\\.(\\w|!(?=\\s\\p{sc=Han}))+ (.+ )?.+?$', i));
        if (t.layer5b)
            this.regex.push(new RegExp('^(' + t.layer5b.join('|') + ')\\..+\\.\\W (.+ )?.+?$', i));
        if (t.layer5c)
            this.regex.push(new RegExp('^.+\\.(' + t.layer5c.join('|') + ')\\.\\W (.+ )?.+?$', i));
        if (t.layer5w || t.layer6s || t.layer7a)
            this.regex.push(new RegExp('^.+\\..+\\.(' + [...t.layer5w || [], ...t.layer6s || [], ...t.layer7a || []].join('|') + ') (.+ )?.+?$', i));
        if (t.layer)
            this.regex.push(new RegExp('^(' + t.layer.join('|') + ') (.+ )?.+?$', i));
        if (t.disk)
            this.regex.push(new RegExp('^.+? (' + t.disk.join('|') + ')[^a-z]? .+?$'));
        if (t.frame)
            this.regex.push(new RegExp('^.+? [^A-Za-z]+(' + t.frame.join('|') + ') .+?$', i));
        if (t.driver) 
            this.regex.push(new RegExp('^.+? (.+ )?[MH]?(' + t.driver.map(d => /^\\\+/.test(d) ? '.*?' + d : d).join('|') + ')′' + (this.dash ? '' : '?') + '(\\+.?)?$', i));
        if (this.metal) 
            this.regex.push(new RegExp('^.+? (.+ )?M[A-ZαβΩ].?$', i));
        if (this.high)
            this.regex.push(new RegExp('^.+? (.+ )?H[A-ZαβΩ].?$', i));
        return this;
    },
    find() {
        if ([...this.regex, ...this.more].length === 0)
            return;
        Q('tbody tr', tr => {
            const [no, abbr, more] = ['no', 'abbr', 'more'].map(a => tr.getAttribute(`data-${a}`));
            tr.hidden = !(this.regex.some(regex => regex.test(abbr)) || this.more.includes(more) || no.match(/\d+/)[0] == this.free ||
                (/(-|wbba)/i.test(this.free) ? new RegExp(this.free.replace(/wbba/i, 'bbg'), 'i').test(no) : false));
        });
        this.state(true);
        return true;
    },
    state(searching) {
        Q('caption').classList[searching ? 'add' : 'remove']('searching');
        Q('#BBG+section').style.display = searching ? 'none' : 'flex';
        Q('.prod button').disabled = !searching;
        Q('html, body', el => el.scrollTop = searching ? Q('table').offsetTop : 0);
        Q('nav data').value = searching ? count('tbody tr:not([hidden])') : '';
        Q('input[type=text]', searching ? input => input.blur() : input => input.value = '');
    },
    autofill(comp, sym) {
        this.state(false);
        Q(/layer7/.test(comp) ? '#DB' : /layer6/.test(comp) ? '#SP' : '#GT').click();
        Q(`input[name=${comp}]`).value = sym;
        this.go();
    }
};