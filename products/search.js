const Search = {
    regex: [],
    reset() {
        this.precise = this.entered;
        this.free = this.esc(Q('input[name=free]').value);
        this.regex = [];
        this.dash = this.high = false;
        this.more = '';
    },
    autofill(comp, sym) {
        Q(/layer5/.test(comp) ? '#GT' : '#sparking').click();
        Q(`input[name=${comp}]`).value = sym;
        Search.read('form');
    },
    esc: string => string ? string.replace(/\s/g, '').replace(/[’'ʼ´ˊ]/g, '′').replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : undefined,
    get entered() {
        return [...document.querySelectorAll('form input[type=text]')]
            .filter(input => input.value !== '')
            .reduce((inputs, input) => ({...inputs, [input.name]: this.esc(input.value)}), {});
    },
    get clicked() {
        return window.location.search.substring(1).split('&').map(q => q.split('='))
            .filter(([p, v]) => p.length > 1)
            .reduce((inputs, [comp, sym]) => ({...inputs, [comp]: this.esc(decodeURIComponent(sym))}), {});
    },
    search: {
        clicked() {
            const target = Search.clicked;
            for (let [comp, sym] of Object.entries(target))
                comp == 'more' ? Search.more = sym : target[comp] = [sym];
            Search.buildRegex(target);
        },
        free() {
            if (/^\\+/.test(Search.free))
                return Search.more = Search.free;

            Search.dash = /′/.test(Search.free) || /[^\d]′/.test(Search.free);
            Search.high = /high/i.test(Search.free);
            const test = (sym, name, comp) => new RegExp(`^${Search.free}$`, 'i').test(sym) ||
                (/^[0-9A-zαβΩΔ]{1,2}(′|\\\+)?$/.test(Search.free) ? false : name.some(n => new RegExp(Search.free, 'i').test(n)));

            let target = {};
            for (let [comp, list] of Object.entries(names)) {
                if (comp == 'driver')
                    Search.free = Search.free.replace(/(high|′)/i, '');
                target[comp] = [...target[comp] || [], Search.free.replace(/([A-z])/g, l => l.toUpperCase()) || '[A-zαβΩ]+'];
                if (Search.free)
                    for (let [sym, name] of Object.entries(list))
                        if (test(sym, name, comp))
                            target[comp].push(sym.replace('+', '\\+'));
            }
            if (/[\dα′]+[A-Zα_]/i.test(Search.free))
                target.layer6s = target.disk = [Search.free.replace(/([A-z])/, l => l.toUpperCase())];
            Search.buildRegex(target);
        },
        precise() {
            let target = {};
            for (let [comp, input] of Object.entries(Search.precise))
                if (comp == 'layer5c')
                    target.layer5c = /^d$/i.test(input) ? ['D', 'Δ'] : /^a$/i.test(input) ? ['A', 'Ɐ'] : [input];
                else if (comp == 'disk')
                    target.disk = [input.replace(/([A-z])/, l => l.toUpperCase())];
                else
                    comp == 'more' ? Search.more = input : target[comp] = [input];
            Search.buildRegex(target, true);
        }
    },
    buildRegex(target, i = false) {
        i = i ? 'iu' : 'u';
        if (target.layer5b)
            this.regex.push(new RegExp('^(' + target.layer5b.join('|') + ')\\..+\\.\\W (.+ )?.+?$', i));
        if (target.layer6r)
            this.regex.push(new RegExp('^(' + target.layer6r.join('|') + ').?\\..+\\.(\\w|!(?=\\s\\p{sc=Han}))+ (.+ )?.+?$', i));
        if (target.layer5c)
            this.regex.push(new RegExp('^.+\\.(' + target.layer5c.join('|') + ')\\.\\W (.+ )?.+?$', i));
        if (target.layer6c)
            this.regex.push(new RegExp('^.+\\.(' + target.layer6c.join('|') + ')\\.(\\w|!(?=\\s\\p{sc=Han}))+ (.+ )?.+?$', i));
        if (target.layer5w || target.layer6s)
            this.regex.push(new RegExp('^.+\\..+\\.(' + [...target.layer5w || [], ...target.layer6s || []].join('|') + ') (.+ )?.+?$', i));
        if (target.layer)
            this.regex.push(new RegExp('^(' + target.layer.join('|') + ') (.+ )?.+?$', i));
        if (target.disk)
            this.regex.push(new RegExp('^.+? (' + target.disk.join('|') + ')[^a-z]? .+?$'));
        if (target.frame)
            this.regex.push(new RegExp('^.+? [^A-Za-z]+(' + target.frame.join('|') + ') .+?$', i));
        if (target.driver) {
            target.driver = target.driver.map(d => /^\\\+/.test(d) ? ('.*?' + d) : ('(H(?![ny]))' + (Search.high ? '' : '?') + d));
            this.regex.push(new RegExp('^.+? (.+ )?(' + target.driver.join('|') + ')′' + (this.dash ? '' : '?') + '(\\+.?)?$', i));
        }
    },
    read() {
        this.reset();
        if (Object.keys(this.precise).length === 0 && !this.free)
            return;
        Object.keys(this.precise).length > 0 ? this.search.precise() : this.search.free();
        Q('form').reset();
        Q('input[type=text]').blur();
        setTimeout(Search.find);
    },
    find() {
        Q('tbody tr', tr => tr.hidden = !Search.match(tr));
        Search.result();
        Q('html, body', el => el.scrollTop = Q('table').offsetTop);
    },
    match(tr) {
        const no = tr.getAttribute('data-no');
        return this.regex.some(regex => regex.test(tr.getAttribute('data-abbr'))) || no.match(/\d+/)[0] == this.free ||
            this.more && new RegExp(this.more.replace('\\+', ''), 'i').test(tr.getAttribute('data-more')) ||
            (/(-|wbba)/i.test(this.free) ? new RegExp(this.free.replace(/wbba/i, 'bbg'), 'i').test(no) : false);
    },
    result() {
        Q('.prod button').disabled = false;
        Q('nav data').value = document.querySelectorAll('tbody tr:not([hidden])').length;
        Q('caption').classList.add('searching');
    },
};