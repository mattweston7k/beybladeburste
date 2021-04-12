const Search = {
    esc: string => string ? string.replace(/\s/g, '').replace(/[’'ʼ´ˊ]/g, '′').replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : undefined,
    modify: input => input.match(/^([^ +]*?)(\\\+.*)?$/),
    match: (comp, input, namesAlso = false) => 
        Object.keys(names[comp]).filter(sym => 
            new RegExp(`^${input}$`, 'i').test(sym) || 
            namesAlso && !/^[0-9A-zαβΩΔ]{1,2}(′|\\\+)?$/.test(input) && names[comp][sym].some(n => new RegExp(input, 'i').test(n))
        ).map(sym => Search.esc(sym)),
    disambiguate: comp => ({
        layer5c: input => /^d$/i.test(input) ? ['D', 'Δ'] : /^a$/i.test(input) ? ['A', 'Ɐ'] : Search.match('layer5c', input),
        disk: input => /^\d+[a-z_]$/.test(input) ? input.replace(/([a-z])/, l => l.toUpperCase()) : Search.match('disk', input),
        driver: input => {
            let [, prefix, driver, dash] = input.match(/^([HM])?([^′]+)?(′)?.*$/i);
            [prefix, driver, dash] = [(prefix || '').toUpperCase(), (driver || '').toLowerCase(), dash || ''];
            return Object.keys(names.driver).map(sym => Search.esc(
                sym == prefix + driver ? sym + dash : // Mr M 
                sym == driver[0]?.toUpperCase() + driver.slice(1) ? prefix + sym + dash // R MA
                : '')).filter(sym => sym);
        }
    })[comp],

    go() {
        this.regex = [], this.more = [], this.prefix = [];
        this.mode = this.freeInput = '';
        for (const w of ['free', 'form', 'query'])
            if (this.read(w)) 
                return this.process(w).buildRegex().find();
    },
    read(where) {
        if (where == 'free') 
            return this.freeInput = this.esc(Q('input[name=free]').value);
        this.inputs = [...where == 'form' ? new FormData(Q('form')) : new URLSearchParams(window.location.search)]
                    .filter(([k, v]) => k.length > 1 && v !== '')
                    .reduce((inputs, [comp, sym]) => ({...inputs, [comp]: this.esc(decodeURIComponent(sym)).split('/')}), {});
        return Object.keys(this.inputs).length > 0;
    },
    free() {
        let input = this.freeInput;
        [, input, this.mode] = this.modify(input);
        const terms = {H: /high|ハイ|高位/i, M: /metal|メタル|金屬/i};
        this.prefix = ['H', 'M'].filter(p => terms[p].test(input));
        input = ['H', 'M'].reduce((s, p) => s.replace(terms[p], ''), input);

        this.inputs = {};
        if (input == '′' || this.prefix.length > 0)
            return this.inputs.driver = [(this.prefix.length > 0 ? `[${this.prefix.join('')}][A-ZαβΩ].*` : '[^ ]+') + (input == '′' ? '′' : '')];
        for (const comp in names)
            this.inputs[comp] = [this.disambiguate(comp)?.(input), this.match(comp, input || this.mode, true)].flat().filter(s => s);
    },
    form() {
        for (const comp in this.inputs) 
            this.inputs[comp] = this.inputs[comp].map(input => {
                [, input, this.mode] = this.modify(input);
                return this.disambiguate(comp)?.(input) || this.match(comp, input || this.mode);
            }).flat().filter(s => s);
    },
    process(where) {
        this[where]?.();
        for (const comp in this.inputs) {
            this.inputs[comp].forEach(s => this.more.push(`${s.replace('\\+', '+')}.${comp}`));
            this.inputs[comp] = this.inputs[comp].map(sym => 
                /^\\+/.test(sym) ? `[^ .]+${sym}` : 
                this.mode ? `${sym}(${this.mode.toUpperCase()}|${this.mode.toLowerCase()})`
                : sym);
            if (this.inputs[comp].length === 0) 
                delete this.inputs[comp];
        }
        return this;
    },
    buildRegex() {
        if (Object.keys(this.inputs).length === 0)
            this.regex.push(new RegExp(this.mode || '__', 'i'));
        let t = this.inputs;
        if (t.layer7b)
            this.regex.push(new RegExp('^(' + t.layer7b.join('|') + ')\\..+\\.\\d (.+ )?.+?$', 'u'));
        if (t.layer7c)
            this.regex.push(new RegExp('^.+\\.(' + t.layer7c.join('|') + ')\\.\\d (.+ )?.+?$', 'u'));
        if (t.layer6r)
            this.regex.push(new RegExp('^(' + t.layer6r.join('|') + ')(\\+.+)?.?\\..+\\.(\\w|!(?=\\s\\p{sc=Han}))+ (.+ )?.+?$', 'u'));
        if (t.layer6c)
            this.regex.push(new RegExp('^.+\\.(' + t.layer6c.join('|') + ')\\.(\\w|!(?=\\s\\p{sc=Han}))+ (.+ )?.+?$', 'u'));
        if (t.layer5b)
            this.regex.push(new RegExp('^(' + t.layer5b.join('|') + ')\\..+\\.\\W (.+ )?.+?$', 'u'));
        if (t.layer5c)
            this.regex.push(new RegExp('^.+\\.(' + t.layer5c.join('|') + ')\\.\\W (.+ )?.+?$', 'u'));
        if (t.layer5w || t.layer6s || t.layer7a)
            this.regex.push(new RegExp('^.+\\..+\\.(' + [...t.layer5w || [], ...t.layer6s || [], ...t.layer7a || []].join('|') + ') (.+ )?.+?$', 'u'));
        if (t.layer)
            this.regex.push(new RegExp('^(' + t.layer.join('|') + ') (.+ )?.+?$', 'u'));
        if (t.disk)
            this.regex.push(new RegExp('^.+? (' + t.disk.join('|') + ')[^a-z]? .+?$'));
        if (t.frame)
            this.regex.push(new RegExp('^.+? [^A-Za-z]+(' + t.frame.join('|') + ') .+?$', 'u'));
        if (t.driver) 
            this.regex.push(new RegExp('^.+? (.+ )?[MH]?(' + t.driver.join('|') + ')′?(\\+[^ ]?)?$', 'u'));
        return this;
    },
    find() {
        if ([...this.regex, ...this.more].length === 0)
            return;
        Q('tbody tr', tr => {
            const [no, abbr, more] = ['no', 'abbr', 'more'].map(a => tr.getAttribute(`data-${a}`));
            tr.hidden = !(this.regex.some(regex => regex.test(abbr)) || this.more.includes(more) || no.match(/\d+/)[0] == this.freeInput ||
                (/(-|wbba)/i.test(this.freeInput) ? new RegExp(this.freeInput.replace(/wbba/i, 'bbg'), 'i').test(no) : false));
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