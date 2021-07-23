navigator.serviceWorker.register('/worker.js').then(async () => {
    const html = await (await caches.match('/include/head.html') || await fetch('/include/head.html')).text();
    if (!document.querySelector('head meta')) document.head.insertAdjacentHTML('afterbegin', html);
});

const Q = (el, func) => func ? document.querySelectorAll(el).forEach(func) : document.querySelector(el);
const L = func => window.addEventListener('DOMContentLoaded', func);
const count = el => document.querySelectorAll(el).length;
const query = window.location.search.substring(1).split('&').map(q => q.split('=')).reduce((obj, [p, v]) => ({...obj, [p]: v}), {});
const groups = [
    ['layer7a', 'layer7b', 'layer7c'], ['layer6s', 'layer6r', 'LB', 'layer6c'], ['layer5b', 'layer5c', 'layer5w'],
    ['layer5', 'remake', 'layer4', 'layer3', 'layer2', 'layer1'],
    ['disk3', 'disk2', 'frame', 'disk1'],
    ['metal', 'dash', 'high', 'driver4', 'driver3', 'driver2', 'driver1'], ['other']
];
const Cookie = {
    get get() {return document.cookie.split(/;\s?/).map(c => c.split('=')).reduce((obj, [k, v]) => ({...obj, [k]: v}), {});},
    set: (key, value) => document.cookie = `${key}=${value}; max-age=22222222; path=/`,
    getHistory: item => JSON.parse(Cookie.get.history || '{}')[item],
    setHistory: (item, updating) => updating || /^(layer7|disk[34]|driver[34]|high|dash|metal|product|remake|name)/.test(item) ?
        Cookie.set('history', JSON.stringify( {...JSON.parse(Cookie.get.history || '{}'), [item]: Math.round(new Date() / 1000)} )) : null,
    setOptions: () => {
        Cookie.set('mode', Q('html').classList.contains('day') ? 'day' : '');
        Cookie.set('magBar', Q('input[type=range]')?.value || '');
        Cookie.set('magBut', Q('input[name=mag]:checked')?.id || '');
    },
    notification: notify => document.cookie = `notify=${notify}; path=/`,
};
let Parts = {group: '/parts/' == window.location.pathname ? groups.flat().filter(g => Object.keys(query).includes(g))[0] : null};

const notify = () => {
    const pages = (Cookie.get.notify || '').split(',');
    const gs = pages.filter(g => groups.flat().includes(g));
    if ('/' == window.location.pathname) {
        if (pages.includes('products'))
            Q('a[href*="products/"]').classList.add('notify');
        if (gs.length > 0)
            Q('a[href*="parts/"]').classList.add('notify');
    } else if (Parts.group || /^\/products\/(#.+)?$/.test(window.location.pathname))
        Cookie.notification(pages.filter(p => p != (Parts.group || 'products')));
    else if ('/parts/' == window.location.pathname)
        gs.forEach(g => Q(`main a[href='?${g}']`).classList.add('notify'));
}
L(() => {
    document.title += ' ｜ 戰鬥陀螺 爆烈世代 ￭ 爆旋陀螺 擊爆戰魂 ￭ ベイブレードバースト';
    notify();
    if (Cookie.get.mode) Q('html').classList.add(Cookie.get.mode);
    setTimeout(() => Q('#day') ? Q('#day').checked = Cookie.get.mode == 'day' : null);
});

let names;
const DB = {
    db: null,
    tran(...args) {
        (DB._tran = DB.db.transaction(...args)).oncomplete = () => DB._tran = null;
    },
    remove: (error = ev => console.log(ev)) =>
        new Promise(res => {
            if (DB.db) DB.db.close();
            const del = indexedDB.deleteDatabase('db');
            del.onsuccess = ev => res(ev.target.readyState);
            del.onerror = del.onblocked = error;
        }),
    get indicator() {return Q('db-status');},
    init(open) {
        DB.indicator.init();
        for (const store of ['html', 'json', 'order']) open.result.createObjectStore(store);
        open.transaction.objectStore('json').createIndex('group', 'group');
        return open.transaction;
    },
    async open(handler) {
        if (DB.db) return handler();
        if (!window.indexedDB) return names = names || await (await fetch('/update/names.json')).json();
        if (!await new Promise(res => {
            const open = indexedDB.open('db', 1);
            let firstTime = false;
            open.onupgradeneeded = () => {
                firstTime = true;
                DB.init(open).oncomplete = () => DB.cache(handler);
            }
            open.onsuccess = () => {
                DB.db = open.result;
                DB.db.onerror = ev => DB.indicator.error(ev);
                res(firstTime);
            }
            open.onerror = ev => DB.indicator.error(ev);
        })) return '/' == window.location.pathname ? DB.check(handler) : handler ? handler() : null;
    },
    check(handler) {
        fetch(`/update/-time.json?${Math.random()}`).then(r => r.json())
        .catch(() => DB.indicator.setAttribute('status', 'offline')).then(async j => {
            const updates = [], notify = [];
            for (const [item, [time, major]] of Object.entries(j)) {
                const oldUser = new Date(time) / 1000 > Cookie.getHistory(item);
                if (oldUser || !Cookie.getHistory(item))
                    item == 'products' ? DB.indicator.prod() : updates.push(item);
                if (major && (oldUser || !Cookie.getHistory(item) && new Date - new Date(time) < 7*24*3600*1000))
                    notify.push(item);
            }
            if (notify.length > 0)
                Cookie.notification(notify);
            if (updates.length > 0) {
                DB.indicator.init(true);
                return DB.cache(handler, updates, true);
            }
            return handler ? handler() : null;
        }).catch();
    },
    async cache(handler, update = groups.flat(), updating = false) {
        DB.indicator.total = update.length;
        names = names || await DB.getNames() || {};
        for (const [prom, group] of await DB.fetch(update)) {
            const {info, parts} = await prom || {};
            if (!info && !parts) continue;
            DB.tran(['json', 'order', 'html'], 'readwrite');
            info ? DB.put('html', [group, info]) : DB.del('html', group);
            if (group != 'other') DB.put('order', [group, parts.map(part => part?.sym || part)]);
            for (const part of parts.filter(part => part && typeof part == 'object')) {
                if (part.names)
                    names[part.comp] = {...names[part.comp] || {}, [part.sym]: ['eng', 'chi', 'jap'].map(l => part.names[l])};
                DB.put('json', [`${part.sym}.${part.comp}`, new Part(part).detach()]);
            }
            DB.indicator.update();
            Cookie.setHistory(group, updating);
        }
        DB.put('json', ['names', names]);
        notify();
        handler ? handler() : null;
    },
    fetch: update => Promise.all(update.map(g => fetch(`/update/${g}.json`).then(r => r.status == 200 ? [r.json(), g] : null))),

    put: (store, [key, value]) => (DB._tran || DB.db.transaction(store, 'readwrite')).objectStore(store).put(value, key),
    
    del: (store, key) => (DB._tran || DB.db.transaction(store, 'readwrite')).objectStore(store).delete(key),

    query: (store, key) => (DB._tran || DB.db.transaction(store)).objectStore(store).get(key),

    get: (store, key) => DB.open(async () => await new Promise(res => DB.query(store, key).onsuccess = ev => res(ev.target.result))),

    getNames: async () => await DB.get('json', 'names'),

    getParts: (group, callback = (...content) => console.log(content)) =>
        DB.open(async () => {
            DB.tran(['json', 'order', 'html']);
            names = names || await DB.getNames();
            let parts = await DB.get('order', group);
            if (Part.derived.includes(group)) {
                parts = parts.map(async sym =>
                    new Part(await DB.get('json', `${sym.replace('′', '')}.driver`), group).attach(`${sym}.driver`).revise()
                );
                return callback(await Promise.all(parts), await DB.get('html', group));
            }
            (DB._tran || DB.db.transaction('json')).objectStore('json').index('group').openCursor(group).onsuccess = async ({target: {result}}) => {
                if (!result) return callback(parts, await DB.get('html', group));
                const part = await new Part(result.value).attach(result.primaryKey).revise();
                if (parts.includes(part.sym)) parts[parts.indexOf(part.sym)] = part;
                result.continue();
            }
        })
}
const twilight = () => {
    Q('html').classList.toggle('day');
    const p = Q('html').classList.contains('day') ? ['night', 'day'] : ['day', 'night'];
    Q('object', obj => obj.data = obj.data.replace(...p));
    Cookie.setOptions();
};

class nav {
    constructor(links = ['home', 'prize'], texts = []) {
        nav.ul('link', links, texts);
        Parts.group ? nav.ul('part') : '/products/' == window.location.pathname ? nav.ul('prod') : null;
        nav.ul('menu');
    }
    static ul(menu, ...p) {
        const ul = document.createElement('ul');
        ul.innerHTML = menu == 'link' ? nav[menu](...p) : nav[menu];
        ul.classList.add(menu);
        Q('nav').appendChild(ul);
    }
    static link(links, texts) {
        return Parts.group ? nav.next() : nav.href(links[0], texts[0]) + nav.href(links[1], texts[1]);
    }
    static href(l, t) { 
        return `<a href=${nav.hrefs[l] || l}` + (nav.icons[l] ? ` data-icon=${nav.icons[l]}></a>` : `>${t == 'parts' ? nav.parts : t}</a>`);
    }
    static next() {
        let i;
        const gs = groups.find(gs => (i = gs.indexOf(Parts.group)) >= 0);
        const next = gs[++i % gs.length];
        const inside = /^(layer|remake|LB)/.test(next) ? nav.system(next) : next[0].toUpperCase() + next.substring(1).replace(/(\d)$/, ' $1');
        return nav.href('menu') + `<a href=?${next} title=${Q(`a[href='?${next}']`)?.title || ''}>${inside}</a>`;
    }
    static comp(group) {
        return group.replace(/^layer5$/, 'layer5m').replace('LB', 'layer6').replace(/(\d)[^m]$/, '$1');
    }
    static system(group) {
        return `<img src=/img/system-${nav.comp(group)}.png>`;
    }
}
nav.icons = {home: '', menu: '', prod: '', prize: '', back: ''};
nav.hrefs = {home: '/', menu: '/parts/', prod: '/products/', prize: '/prize/', back: '../'};
nav.parts = '<img src=/parts/include/parts.svg#whole>';
nav.prod = `
    <li data-icon=><span>自由檢索<br>Free search</span><input type=text name=free placeholder=巨神/valkyrie></li>
    <li><data value></data><span>結果<br>results</span><button data-icon= onclick=Table.reset() disabled>重設 Reset</button></li>`;
nav.part = `
    <li><data value></data><label for=fixed class=toggle></label></li>    
    <li class=mag><input type=range min=0.55 max=1.45 value step=0.05></li>`;
nav.menu = `
    <li><input type=checkbox id=day onchange=twilight()><label for=day class=toggle data-icon=''></label></li>
    <li><label onclick=window.scrollTo(0,0) data-icon=></label><label onclick=window.scrollTo(0,document.body.scrollHeight) data-icon=></label></li>`;

class Indicator extends HTMLElement {
    constructor() {
        super();
        this.progress = 0;
        this.attachShadow({mode: 'open'}).innerHTML = `
        <style>
            :host(:not([progress]):not([status])) {display:none;}
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
                color:white;font-size:1rem;font-family:sans-serif;
                margin:0;
                width:5rem;
            }
            :host::before {
                font-size:5rem;color:transparent;
                content:'';font-family:'Font Awesome 5 Free';
            }
            :host([status=offline])::before {
                content:'';
            }
        </style>
        <p></p>`;
    }
    connectedCallback() {
        DB.open(Parts.group ? Parts.load : null);
    }
    attributeChangedCallback(attr, o, n) {
        if (attr == 'progress')
            this.style.setProperty('--p', 40 - 225 / 100 * parseInt(this.getAttribute('progress')) + '%');
        else if (attr == 'status') {
            this.style.setProperty('--c', {success: 'lime', error: 'deeppink', offline: 'deeppink'}[n]);
            n == 'offline' ? this.show('離線') : null;
        }
    }
    init(update = false) {
        this.show(update ? '更新中' : '首次訪問 預備中⋯⋯');
        this.setAttribute('progress', 0);
    }
    update() {
        this.setAttribute('progress', this.progress++ / this.total * 100);
        if (this.progress != this.total) return;
        this.setAttribute('status', 'success');
        this.show('更新成功');
    }
    error(error) {
        if (this.getAttribute('status') == 'offline') return;
        this.setAttribute('status', 'error');
        this.show(error.target?.errorCode || error);
    }
    show(message) {this.shadowRoot.querySelector('p').innerHTML = message;}
    prod() {Q('a[href="products/"]').href += '#update';}
}
Indicator.observedAttributes = ['progress', 'status'];
customElements.define('db-status', Indicator);
