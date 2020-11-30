const Q = (el, func) => func ? document.querySelectorAll(el).forEach(func) : document.querySelector(el);
const L = func => window.addEventListener('DOMContentLoaded', func);
const cookie = document.cookie.split(/;\s?/).map(c => c.split('=')).reduce((obj, [k, v]) => ({...obj, [k]: v}), {});
const query = window.location.search.substring(1).split('&').map(q => q.split('=')).reduce((obj, [p, v]) => ({...obj, [p]: v}), {});
const groups = [
    ['remake', 'layer6s', 'layer6r', 'layer6c', 'layer5b', 'layer5c', 'layer5w', 'layer5', 'layer4', 'layer3', 'layer2', 'layer1'],
    ['disk3', 'disk2', 'frame', 'disk1'],
    ['dash', 'high', 'driver4', 'driver3', 'driver2', 'driver1']];

if (cookie.mode == 'day') {
    Q('html').classList.add('day');
    L(() => Q('#day') ? Q('#day').checked = true : null);
} else
    L(() => Q('#day') ? Q('#day').checked = false : null);

const setCookie = () => {
    document.cookie = `mode=${Q('html').classList.contains('day') ? 'day' : ''};max-age=22222222;path=/`;
    Q('input[type=range]') ? document.cookie = `magBar=${Q('input[type=range]').value};max-age=22222222;path=/` : null;
    Q('[name=mag]:checked') ? document.cookie = `magBut=${Q('[name=mag]:checked').id};max-age=22222222;path=/` : null;
};
const twilight = () => {
    Q('html').classList.toggle('day');
    let [from, to] = ['day', 'night'];
    if (Q('html').classList.contains('day'))
        [from, to] = [to, from];
    Q('.catalog>a', a => a.style.backgroundImage = a.style.backgroundImage.replace(from, to));
    setCookie();
};

const nav = {
    icons: {home: '', menu: '', prod: '', prize: '', back: ''},
    hrefs: {home: '/', menu: '/parts/', prod: '/products/', prize: '/prize/', back: '../'},
    parts: '<img src="/parts/include/parts.svg#whole" alt=parts>',

    create: (links = ['home', 'prize'], texts = []) =>
        Q('nav').insertAdjacentHTML('beforeend', `
            <ul class=links>` + (Parts.group ? nav.next() : links.map((l, i) => nav.link(l, texts[i])).join('')) + `</ul>`
            + (Parts.group ? nav.part : /products/.test(window.location) ? nav.prod : '') + nav.menu),

    link: (h, text) => `<a href=${nav.hrefs[h] || h}${nav.icons[h] ? ` data-icon=${nav.icons[h]}` : ''}>${nav.icons[h] ? '' : text == 'parts' ? nav.parts : text}</a>`,

    next: () => {
        let [i, g] = [, Parts.group];
        const gs = groups.find(gs => (i = gs.indexOf(g)) >= 0);
        const inside = /^(layer|remake)/.test(g) ? `<img src=/img/system-${g.replace(/(\d).$/, '$1')}.png>` : g;
        return nav.link('menu') + `<a href=?${gs[++i % gs.length]}${title[g] ? ` title=${title[g]}` : ''}>${inside}</a>`;
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
    del() {
        indexedDB.deleteDatabase('db');
        console.log('Deleted')
    },
    init(open) {
        DBview.init();
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
            return firstTime || !handler ? null : handler();
        }
    },
    cache(handler) {
        fetch('/update/names.json').then(r => r.json()).then(j => DB.put('json', ['names', j]));
        DB.fetch().then(res => {
            const tran = DB.db.transaction(['json', 'order', 'html'], 'readwrite');
            res.forEach(([json, group]) => {
                if (!json) return;
                const {info, parts} = json;
                info ? DB.put('html', [group, info], tran) : null;
                DB.put('order', [group, parts.map(part => part?.sym || part)], tran);
                parts.filter(part => part && typeof part == 'object').forEach(part =>
                    DB.put('json', [`${part.sym}.${part.comp}`, Parts.detach(part)], tran));
                // if (group == 'layer5')
                //     tran.objectStore('html').put(Q('.catalog>a:not([id])').outerHTML, group);
                DBview.update();
                console.log(group + ' cached');
            });
        }).then(handler);
    },
    fetch() {
        return Promise.all(groups.flat().map(g => fetch(`/update/${g}.json`).then(r => r.status === 200 ? [r.json(), g] : null)));
    },
    put(store, [key, value], tran) {
        (tran || DB.db.transaction(store, 'readwrite')).objectStore(store).put(value, key);
    },
    get(store, key, tran, callback = ev => console.log(ev.target.result)) {
        const handler = () => (tran || DB.db.transaction(store)).objectStore(store).get(key);
        return DB.open(handler);
    },
    getNames(tran) {
        const handler = () => DB.get('json', 'names', tran).onsuccess = ev => names = ev.target.result;
        DB.open(handler);
    },
    getParts(group, callback = reqs => reqs.map(req => req.onsuccess = () => console.log(req.result))) {
        const handler = () => {
            const tran = DB.db.transaction(['json', 'order', 'html']);
            if (!names)
                DB.getNames(tran);
            const parts = {};
            tran.objectStore('json').index('group').openCursor(group).onsuccess = ev => {
                const cursor = ev.target.result;
                if (!cursor)
                    return Promise.all([['order', group], ['html', group]].map(p => DB.get(...p, tran))).then(reqs => callback(reqs, parts));
                const [sym, comp] = cursor.primaryKey.split('.');
                parts[sym] = Parts.attach([sym, comp], cursor.value);
                cursor.continue();
            }
        }
        return DB.open(handler);
    }
}
const DBview = {
    get progress() {
        return document.querySelector('progress');
    },
    init() {
        document.body.insertAdjacentHTML('beforeend', '<progress value=0></progress>');
        DBview.progress.hidden = false;
        DBview.progress.max = groups.length + 1;
    },
    update() {
        DBview.progress.value++;
    }
}
