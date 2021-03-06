const Search = {
    esc: string => string ? string.replace(/\s/g, '').replace(/[’'ʼ´ˊ]/g, '′').replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : undefined,
    get entered() {
        return [...document.querySelectorAll('form input[type=text]')]
            .filter(input => input.value !== '')
            .reduce((inputs, {name, value}) => ({...inputs, [name]: this.esc(value)}), {});
    },
    get clicked() {
        return window.location.search.substring(1).split('&').map(q => q.split('='))
            .filter(([p, v]) => p.length > 1)
            .reduce((inputs, [comp, sym]) => ({...inputs, [comp]: this.esc(decodeURIComponent(sym))}), {});
    },
    get free() {
        return this.esc(Q('input[name=free]').value);
    },
    go() {
        this.dash = this.high = this.metal = false;
        this.regex = [];

        let inputs = this.free;
        if (inputs)
            this.buildRegex(this.byFree(inputs));
        else
            if (Object.keys(inputs = this.entered).length > 0)
                this.buildRegex(this.byEntered(inputs), true);
            else
                if (Object.keys(inputs = this.clicked).length > 0)
                    this.buildRegex(this.byClicked(inputs));
        gtag('event', 'search', typeof inputs == 'string' ? {'free': inputs} : inputs);
        if (this.regex.length > 0 || this.more) {
            this.find();
            return true;
        }
    },
    byClicked(inputs) {
        this.more = inputs.more || '';
        return Object.entries(inputs).reduce((targets, [comp, sym]) => ({...targets, [comp]: [sym]}), {});
    },
    byEntered(inputs) {
        this.more = inputs.more || '';
        const processors = {
            layer5c: input => /^d$/i.test(input) ? ['D', 'Δ'] : /^a$/i.test(input) ? ['A', 'Ɐ'] : [input],
            disk: input => [input.replace(/([A-z])/, l => l.toUpperCase())]
        };
        return Object.entries(inputs).reduce((targets, [comp, sym]) => ({...targets, [comp]: processors[comp]?.(sym) || [sym]}), {});
    },
    byFree(input) {
        if (/^\\+/.test(input))
            return this.more = input;

        [this.dash, this.high, this.metal] = [/′$/, /high|ハイ|高位/i, /metal|メタル|金屬/i].map(regex => regex.test(input));
        const match = (sym, name) => new RegExp(`^${input}$`, 'i').test(sym) ||
            (/^[0-9A-zαβΩΔ]{1,2}(′|\\\+)?$/.test(input) ? false : name.some(n => new RegExp(input, 'i').test(n)));

        let target = {};
        if (/[\dα′]+[A-Zα_]/i.test(input))
            target.layer6s = target.disk = [input.toUpperCase()];
        else for (let [comp, list] of Object.entries(names)) {
            input = comp == 'driver' ? input.replace('′', '') : input;
            if (input.length <= 3) 
                target[comp] = [input.toUpperCase() || '[A-zαβΩ]+'];
            if (!input) continue;
            for (let [sym, name] of Object.entries(list))
                if (match(sym, name)) 
                    target[comp] = [...target[comp] || [], sym.replace('+', '\\+')];
        }
        return target;
    },
    buildRegex(target, i = false) {
        i = i ? 'iu' : 'u';
        if (target.layer7b)
            this.regex.push(new RegExp('^(' + target.layer7b.join('|') + ')\\..+\\.\\d (.+ )?.+?$', i));
        if (target.layer7c)
            this.regex.push(new RegExp('^.+\\.(' + target.layer7c.join('|') + ')\\.\\d (.+ )?.+?$', i));
        if (target.layer6r)
            this.regex.push(new RegExp('^(' + target.layer6r.join('|') + ').?\\..+\\.(\\w|!(?=\\s\\p{sc=Han}))+ (.+ )?.+?$', i));
        if (target.layer6c)
            this.regex.push(new RegExp('^.+\\.(' + target.layer6c.join('|') + ')\\.(\\w|!(?=\\s\\p{sc=Han}))+ (.+ )?.+?$', i));
        if (target.layer5b)
            this.regex.push(new RegExp('^(' + target.layer5b.join('|') + ')\\..+\\.\\W (.+ )?.+?$', i));
        if (target.layer5c)
            this.regex.push(new RegExp('^.+\\.(' + target.layer5c.join('|') + ')\\.\\W (.+ )?.+?$', i));
        if (target.layer5w || target.layer6s || target.layer7a)
            this.regex.push(new RegExp('^.+\\..+\\.(' + [...target.layer5w || [], ...target.layer6s || [], ...target.layer7a || []].join('|') + ') (.+ )?.+?$', i));
        if (target.layer)
            this.regex.push(new RegExp('^(' + target.layer.join('|') + ') (.+ )?.+?$', i));
        if (target.disk)
            this.regex.push(new RegExp('^.+? (' + target.disk.join('|') + ')[^a-z]? .+?$'));
        if (target.frame)
            this.regex.push(new RegExp('^.+? [^A-Za-z]+(' + target.frame.join('|') + ') .+?$', i));
        if (target.driver) 
            this.regex.push(new RegExp('^.+? (.+ )?[MH]?(' + target.driver.map(d => /^\\\+/.test(d) ? ('.*?' + d) : d).join('|') + ')′' + (this.dash ? '' : '?') + '(\\+.?)?$', i));
        if (this.metal) 
            this.regex.push(new RegExp('^.+? (.+ )?M[A-ZαβΩ].?$', i));
        if (this.high)
            this.regex.push(new RegExp('^.+? (.+ )?H[A-ZαβΩ].?$', i));
    },
    find() {
        Q('tbody tr', tr => {
            const [no, abbr, more] = ['no', 'abbr', 'more'].map(a => tr.getAttribute(`data-${a}`));
            tr.hidden = !(this.regex.some(regex => regex.test(abbr)) || no.match(/\d+/)[0] == this.free ||
                this.more && new RegExp(this.more.replace('\\+', ''), 'i').test(more) ||
                (/(-|wbba)/i.test(this.free) ? new RegExp(this.free.replace(/wbba/i, 'bbg'), 'i').test(no) : false));
        });
        this.state(true);
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