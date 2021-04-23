Parts = {
    ...Parts,
    load() {
        Parts.before();
        if (window.indexedDB)
            DB.getParts(Parts.group, (order, info) => {
                for (const part of order) (part || new Part(Parts.group)).catalog();
                Parts.after(info);
            });
        else Parts.live();
    },
    async live() {
        const {info, parts} = await (await fetch(`/update/${Parts.group}.json`)).json();
        for (const part of parts) new Part(part || Parts.group).catalog();
        Parts.after(info);
    },
    before() {
        document.title = document.title.replace(/^.*?(?= ｜ )/, Parts.titles[Parts.group] || Parts.titles[Parts.group.replace(/\d$/, '')]);
        Tools.magnify();
    },
    after(info) {
        Q('details article').innerHTML = info;
        Q('details').hidden = !info;
        Q('main h5').innerHTML = '　';
        Parts.target();
        Parts.count();
        Tools.ruler(Parts.group); //Parts.fusion
        Tools.filter(Parts.group);
        new Promise(res => res(Q(':is(#A)'))).catch(() => {
            Q(':-webkit-any(#A)');
            Parts.any('-webkit-any');
        }).catch(() => {
            Q(':matches(#A)');
            Parts.any('matches');
        });
    },
    count() {
        if (count('.catalog>a') < 28) Q('label[for=fixed]').remove();
        Q('nav .part data').value = Parts.group == 'LB' ?
            count('a[id].layer6r') + '⬌' + count('a[id].disk') :
            count('a[id]:not([id^="+"]):not(.none)');
        if (/^(driver3|dash)$/.test(Parts.group)) Q('nav .part data').setAttribute('data-extra', '+4');
    },
    target() {
        let target = window.location.hash.substring(1);
        Q(`a[id='${decodeURI(target)}']`)?.scrollIntoView({behavior: 'smooth'});
        Q(`a[id='${decodeURI(target)}']`)?.classList.add('target');
    },
    any(prefix) {
        const css = '/parts/include/typography.css';
        caches.match(css).then(r => r.text()).catch(() => fetch(css).then(r => r.text()))
            .then(style => Q('head').insertAdjacentHTML('beforeend', '<style>' + style.replace(/is(?=\()/g, prefix) + '</style>'));
    },
    types: {A: 'Attack', B: 'Balance', D: 'Defense', S: 'Stamina'},
    fusion: false,
    titles: {remake: '〔復刻〕攻擊環 結晶輪盤 Remake Layer', LB:'〔超王 限界突破〕刃輪 戰輪 Ring & 金屬 鋼鐵 輪盤 Disk',
        layer7a: '〔DB〕裝甲 戰甲 Armor', layer7b: '〔DB〕刀環 戰刃 Blade', layer7c: '〔DB〕核心 Core',
        layer6s: '〔超王〕重心盤 底盤 Chassis', layer6c: '〔超王〕紋章 Chip', layer6r: '〔超王〕刃輪 戰輪 Ring',
        layer5w: '〔GT〕重心鐵 配重鐵 Weight', layer5c: '〔GT〕紋章 Chip', layer5b: '〔GT〕攻擊環底 基座 Base', layer5: '〔GT 無限之鎖〕攻擊環 Layer',
        layer4: '〔超Ｚ〕攻擊環 結晶輪盤 Layer', layer3: '〔神〕攻擊環 結晶輪盤 Layer', layer2: '攻擊環 結晶輪盤 Layer', layer1: '攻擊環 結晶輪盤 Layer',
        disk: '金屬 鋼鐵 輪盤 Disk', frame: '結晶環 戰環 Frame', 
        driver: '軸心 底盤 Driver', dash: '軸心 底盤 Driver', high: '軸心 底盤 Driver', metal: '軸心 底盤 Driver'}
}
customElements.define('weight-scale', class extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({mode: 'open'}).innerHTML =
            ['/include/common.css', 'include/ruler.css'].map(c => `<link rel=stylesheet href=${c}>`).join('')
            + '<input type=checkbox id=show><label for=show></label><div></div>';
        this.hidden = true;
    }
    connectedCallback() {
        const [min, max, group, scale] = ['min', 'max', 'group', 'scale'].map(a => this.getAttribute(a));
        this.scale = Function('w', 'return ' + scale);
        for (const el of this.shadowRoot.querySelectorAll('div, label'))
            el.classList = group == 'remake' ? 'layer' : group.replace(/\d.?$/, '');
        for (let w = parseInt(min); w <= parseInt(max); w++)
            this.shadowRoot.querySelector('div').appendChild(this.cell(w, w == parseInt(max)));
    }
    cell(w, last) {
        const data = document.createElement('data');
        data.value = w;
        if (last) return data;
        data.innerHTML = `<span>${this.scale(w).toFixed(1)}</span>`;
        if (Parts.fusion)
            data.querySelector('span').setAttribute('fusion', (this.scale(w) + 30).toFixed(1));
        else if (/^layer(5b|6r)$/.test(Parts.group))
            data.querySelector('span').setAttribute('fusion', (this.scale(w) + 10).toFixed(1));
        return data;
    }
});
const Tools = {
    filter(group) {
        const add = (type, label) => {
            Q('details').insertAdjacentHTML('afterend', `<input type=checkbox id=${type} checked>`);
            Q('.filter').insertAdjacentHTML('beforeend', `<label for=${type}><img src='../img/${label}-${type}.png' alt=${type}></label>`);
        }
        if (group == 'remake')
            for (const t of ['MFB', 'BSB']) add(t, 'series');
        else if (count('object[data*=unk]') === 0 && !/^(disk|frame)/.test(group))
            for (const t in Parts.types) add(Parts.types[t].substring(0, 3).toLowerCase(), 'type');
    },
    magnify() {
        const slider = () => {
            const slider = Q("input[type='range']");
            slider.value = Cookie.get.magBar || 1;
            Q(".catalog").style.fontSize = slider.value + "em";
            slider.oninput = ev => {
                Q(".catalog").style.fontSize = ev.target.value + "em";
                Cookie.setOptions();
            };
        }
        const buttons = () => {
            const level = 3;
            Q('nav').insertAdjacentHTML('beforebegin', [...Array(level).keys()].map(i => `<input type=radio name=mag id=mag${i+1}>`).join('') +
                "<input type=checkbox id=fixed>");
            Q('input[name=mag]', input => input.onchange = Cookie.setOptions);
            Q('#' + (Cookie.get.magBut || 'mag2')).checked = true;
            Q('nav .mag').insertAdjacentHTML('beforeend', [...Array(level).keys()].map(i => `<label for=mag${i+1}></label>`).join(''));
        }
        buttons();
        window.innerWidth > 630 ? slider() : null;
        window.onresize = () => window.innerWidth > 630 ? slider() : Q('.catalog').style.fontSize = '';
    },
    ruler(group) {
        if (Part.derived.includes(group)) return;
        let [max, min, scale] =
        [
            [/^layer(1|2|3|5[bw]|6[rs]|7[abc])$/, [10, 1, 'w+7']],
            [/^remake$/,            [19, 10, 'w+7']],
            [/^(layer4|disk[12])$/, [8, 0, 'w+17']],
            [/^(disk3|layer5|LB)$/, [15, 5, 'w+17']],
            [/^(frame|layer5c)$/,   [7, 0, 'w*0.3+2.3']],
            [/^layer6c$/,           [12, 2, 'w*0.3+2.3']],
            [/^driver.$/,           [10, 0, 'w/2+5.4']]
        ].find(s => s[0].test(group))[1];
        Q('main').insertAdjacentHTML('afterend', `<weight-scale min='${min}' max='${max}' scale='${scale}' group='${group}'></weight-scale>`);
    }
}
