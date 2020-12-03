const Q = (el, func) => func ? document.querySelectorAll(el).forEach(func) : document.querySelector(el);
const L = func => window.addEventListener('DOMContentLoaded', func);
const count = el => document.querySelectorAll(el).length;
const query = window.location.search.substring(1).split('&').map(q => q.split('=')).reduce((obj, [p, v]) => ({...obj, [p]: v}), {});
const groups = [
    ['remake', 'layer6s', 'layer6r', 'layer6c', 'layer5b', 'layer5c', 'layer5w', 'layer5', 'layer4', 'layer3', 'layer2', 'layer1'],
    ['disk3', 'disk2', 'frame', 'disk1'],
    ['dash', 'high', 'driver4', 'driver3', 'driver2', 'driver1']
];
let Parts = {
    detach({sym, comp, ...part}) {
        ['stat', 'desc'].forEach(p => !`${part[p]}`.replace(/,/g, '') ? delete part[p] : null);
        return {...part, names: part.names?.can ? {can: part.names.can} : {}};
    },
    attach([sym, comp], part) {
        [part.names.eng, part.names.chi, part.names.jap] = names[comp]?.[sym.replace('′', '')] || ['', '', ''];
        return {...part, sym: sym, comp: comp};
    },
    group: groups.flat().filter(g => Object.keys(query).includes(g))[0]
};

const cookie = {
    get get() {return document.cookie.split(/;\s?/).map(c => c.split('=')).reduce((obj, [k, v]) => ({...obj, [k]: v}), {});},
    set: (key, value) => document.cookie = `${key}=${value}; max-age=22222222; path=/`,
    getHistory: item => JSON.parse(cookie.get.history)[item],
    setHistory: item => {
        if (/^(layer6|disk[34]|high|dash|product|name)/.test(item))
            cookie.set('history', JSON.stringify({...JSON.parse(cookie.get.history || '{}'), [item]: new Date().getTime() / 1000}));
    },
    setOptions: () => {
        cookie.set('mode', Q('html').classList.contains('day') ? 'day' : '');
        Q('input[type=range]') ? cookie.set('magBar', Q('input[type=range]').value) : null;
        Q('[name=mag]:checked') ? cookie.set('magBut', Q('[name=mag]:checked').id) : null;
    },
    notification: notify => document.cookie = `notify=${notify}; path=/`,
};
(() => {
    const pages = (cookie.get.notify || '').split(',');
    const gs = pages.filter(g => groups.flat().includes(g));
    if (/^\/(index.html)?$/.test(window.location.pathname)) {
        pages.includes('products') ? L(() => Q('a[href^="products/"]').classList.add('notify')) : null;
        gs.length > 0 ? L(() => Q('a[href="parts/"]').classList.add('notify')) : null;
    } else if (/^\/parts\/(index.html)?$/.test(window.location.pathname))
        L(() => gs.forEach(g => Q(`a[href='?${g}']`).classList.add('notify')));
    else if (Parts.group || /^\/products\/(index.html)?$/.test(window.location.pathname))
        cookie.notification(pages.filter(p => p != (Parts.group || 'products')));

    if (cookie.get.mode == 'day') {
        Q('html').classList.add('day');
        L(() => Q('#day') ? Q('#day').checked = true : null);
    } else
        L(() => Q('#day') ? Q('#day').checked = false : null);
})();

const twilight = () => {
    Q('html').classList.toggle('day');
    let [from, to] = ['day', 'night'];
    if (Q('html').classList.contains('day'))
        [from, to] = [to, from];
    Q('.catalog>a object', obj => obj.data = obj.data.replace(from, to));
    cookie.setOptions();
};

const nav = {
    icons: {home: '', menu: '', prod: '', prize: '', back: ''},
    hrefs: {home: '/', menu: '/parts/', prod: '/products/', prize: '/prize/', back: '../'},
    parts: '<img src="/parts/include/parts.svg#whole" alt=parts>',

    create: (links = ['home', 'prize'], texts = []) =>
        Q('nav').insertAdjacentHTML('beforeend', `
            <ul class=links>` + (Parts.group ? nav.next() : links.map((l, i) => nav.link(l, texts[i])).join('')) + `</ul>`
            + (Parts.group ? nav.part : /products\/(index.html)?$/.test(window.location.pathname ) ? nav.prod : '') + nav.menu),

    link: (h, text) => `<a href=${nav.hrefs[h] || h}${nav.icons[h] ? ` data-icon=${nav.icons[h]}` : ''}>${nav.icons[h] ? '' : text == 'parts' ? nav.parts : text}</a>`,

    next: () => {
        let [i, g] = [, Parts.group];
        const gs = groups.find(gs => (i = gs.indexOf(g)) >= 0);
        const next = gs[++i % gs.length];
        const inside = /^(layer|remake)/.test(next) ? `<img src=/img/system-${next.replace(/(\d).$/, '$1')}.png alt=${next}>` : next;
        return nav.link('menu') + `<a href=?${next}${title[next] ? ` title=${title[next]}` : ''}>${inside}</a>`;
    },

    prod: `
    <ul class=prod>
        <li data-icon=""><span>自由檢索<br>Free search</span><input type=text name=free placeholder="巨神/valkyrie">
        <li><data></data><span>結果<br>results</span><button data-icon="" onclick='Table.reset();this.disabled=true' disabled>重設 Reset</button>
    </ul>`,
    part: `
    <ul class=parts>
        <li><data></data><label for=fixed class=toggle></label></li>    
        <li class=mag><input type=range min="0.55" max="1.45" value step="0.05">
    </ul>`,
    menu: `
    <ul class=generic>
        <li>
            <input type=checkbox id=day onchange="twilight()" >
            <label for=day class=toggle data-icon=''></label>
        <li>
            <label onclick='window.scrollTo(0,0)' data-icon=''></label>
            <label onclick='window.scrollTo(0,document.body.scrollHeight)' data-icon=''></label>
    </ul>`
}

let names;
const DB = {
    db: null,
    del: () => indexedDB.deleteDatabase('db'),
    get indicator() {return Q('db-status');},
    init(open) {
        DB.indicator.init();
        ['html', 'json', 'order'].forEach(store => open.result.createObjectStore(store));
        open.transaction.objectStore('json').createIndex('group', 'group');
        return open.transaction;
    },
    open(handler) {
        if (DB.db) return handler();
        let firstTime = false;
        const open = indexedDB.open('db', 1);
        open.onupgradeneeded = () => {
            firstTime = true;
            DB.init(open).oncomplete = () => DB.cache(handler);
        }
        open.onsuccess = () => {
            DB.db = open.result;
            DB.db.onerror = ev => DB.indicator.error(ev);
            if (firstTime)
                return;
            return /^\/(index.html)?$/.test(window.location.pathname) ? DB.check(handler) : handler ? handler() : null;
        }
        open.onerror = ev => DB.indicator.error(ev);
    },
    check(handler) {
        fetch('/update/-time.json').then(r => r.json()).then(j => {
            const updates = [], notify = [];
            Object.entries(j).forEach(([item, [time, major]]) => {
                if (new Date(time).getTime() / 1000 > cookie.getHistory(item)) {
                    item == 'products' ? DB.indicator.prod() : updates.push(item);
                    major ? notify.push(item) : null;
                }
            });
            if (updates.length > 0) {
                DB.indicator.init(true);
                cookie.notification(notify);
                return DB.cache(handler, updates);
            }
            return handler ? handler() : null;
        }).catch(er => DB.indicator.error(er));
    },
    cache(handler, update = [...groups.flat(), 'names']) {
        DB.indicator.total = update.length;
        DB.fetch(update).then(res =>
            res.forEach(([r, group]) =>
                r.then(json => {
                    if (!json) return;
                    if (group == 'names') {
                        DB.put('json', ['names', json]);
                        names = json;
                    } else {
                        const {info, parts} = json;
                        const tran = DB.db.transaction(['json', 'order', 'html'], 'readwrite');
                        info ? DB.put('html', [group, info], tran) : null;
                        DB.put('order', [group, parts.map(part => part?.sym || part)], tran);
                        parts.filter(part => part && typeof part == 'object').forEach(part =>
                            DB.put('json', [`${part.sym}.${part.comp}`, Parts.detach(part)], tran));
                    }
                    // if (group == 'layer5')
                    //     tran.objectStore('html').put(Q('.catalog>a:not([id])').outerHTML, group);
                    DB.indicator.update();
                    cookie.setHistory(group);
                })
            )
        ).catch(er => DB.indicator.error(er)).then(handler);
    },
    fetch: update => Promise.all(update.map(g => fetch(`/update/${g}.json`).then(r => r.status === 200 ? [r.json(), g] : null))),

    put: (store, [key, value], tran) => (tran || DB.db.transaction(store, 'readwrite')).objectStore(store).put(value, key),

    query: (store, key, tran) => (tran || DB.db.transaction(store)).objectStore(store).get(key),

    get: (store, key, tran, callback = ev => console.log(ev.target.result)) => DB.open(() => DB.query(store, key, tran).onsuccess = callback),

    getNames: tran => DB.open(() => DB.query('json', 'names', tran).onsuccess = ev => names = ev.target.result),

    getParts(group, callback = reqs => reqs.map(req => req.onsuccess = () => console.log(req.result))) {
        const handler = () => {
            const tran = DB.db.transaction(['json', 'order', 'html']);
            if (!names)
                DB.getNames(tran);
            const parts = {};
            tran.objectStore('json').index('group').openCursor(group).onsuccess = ev => {
                const cursor = ev.target.result;
                if (!cursor)
                    return Promise.all([['order', group], ['html', group]].map(p => DB.query(...p, tran))).then(reqs => callback(reqs, parts));
                const [sym, comp] = cursor.primaryKey.split('.');
                parts[sym] = Parts.attach([sym, comp], cursor.value);
                cursor.continue();
            }
        }
        return DB.open(handler);
    }
}
class Indicator extends HTMLElement {
    constructor() {
        super();
        this.progress = 0;
        this.attachShadow({mode: 'open'}).innerHTML = `
        <style>
            :host([hidden]) {display:none;}
            :host-context(body) {margin:5em 0 0 0;}
            :host-context(main) {margin:0 0 .5em 0;}
            :host-context(menu) {
                margin:0;
                position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
            }
            :host {
                position:relative;
                background:radial-gradient(circle at center var(--p),hsla(0,0%,100%,.2) 70%, var(--on) 70%);
                background-clip:text;
                -webkit-background-clip:text;
                display:inline-block;min-height:5rem;
            }
            :host([style*='--c']) {
                background:var(--c);
                background-clip:text;
                -webkit-background-clip:text;
            }
            p {
                position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);
                color:white;font-size:1rem;font-family:Sans-Serif;
                margin:0;
                background:hsla(0,0%,0%,.2);                
                width:5rem;
            }
            :host::before {
                font-size:5rem;color:transparent;
                content:'';font-family:'Font Awesome 5 Free';
            }
        </style>
        <p></p>`;
    }
    connectedCallback() {
        this.hidden = true;
        DB.open(Parts.group ? Parts.load : null);
    }
    static observedAttributes = ['progress', 'status'];
    attributeChangedCallback(attr, o, n) {
        if (attr == 'progress')
            this.style.setProperty('--p', 40 - 225 / 100 * parseInt(this.getAttribute('progress')) + '%');
        else if (attr == 'status')
            this.style.setProperty('--c', {success: 'chartreuse', error: 'red'}[n]);
    }
    init(update = false) {
        this.hidden = false;
        this.links = document.querySelectorAll('a[href="parts/"],a[href="products/"]');
        this.links.forEach(a => {
            a.title = a.href;
            a.removeAttribute('href');
        });
        this.shadowRoot.querySelector('p').innerHTML = update ? '更新中' : '首次訪問 預備中⋯⋯';
        this.setAttribute('progress', 0);
    }
    update() {
        this.progress++;
        this.setAttribute('progress', this.progress / this.total * 100);
        if (this.progress == this.total) {
            this.links.forEach(a => a.href = a.title);
            this.setAttribute('status', 'success');
            this.shadowRoot.querySelector('p').innerHTML = '更新成功';
        }
    }
    error(p) {
        this.hidden = false;
        this.setAttribute('status', 'error');
        this.shadowRoot.querySelector('p').innerHTML = /^\/(index\.html)?$/.test(window.location.pathname) ?
            p.target?.errorCode || p || '不支援' : '請先前往首頁';
    }
    prod = () => Q('a[href="products/"]').href += '#update';
}
customElements.define('db-status', Indicator);
