Parts = {
    ...Parts,
    load() {
        Parts.before();
        if (window.indexedDB)
            DB.getParts(Parts.group, (order, info, parts) => {
                for (const sym of order) Catalog(parts[sym] || sym);
                Parts.after(info);
            });
        else Parts.live();
    },
    async live() {
        const {info, parts} = await (await fetch(`/update/${Parts.group}.json`)).json();
        for (const part of parts) Catalog(part ? Parts.attach([part.sym, part.comp], part) : null);
        Parts.after(info);
    },
    before() {
        document.title = document.title.replace(/.*?(?= ｜ )/, Parts.titles[Parts.group] || Parts.titles[Parts.group.replace(/\d$/, '')]);
        Tools.magnify();
        Tools.ruler(Parts.group);
    },
    after(info) {
        Q('details article').innerHTML = info;
        Q('details').hidden = !info;
        Q('main h5').innerHTML = '　';
        Parts.target();
        Tools.filter(Parts.group);
        Parts.count();
    },
    count() {
        if (count('.catalog>a') < 28)
            Q('label[for=fixed]').remove();
        Q('nav .part data').value = count('a[id]:not([id^="+"]):not(.none)');
        if (/^(driver3|dash)$/.test(Parts.group))
            Q('nav .part data').setAttribute('data-extra', '+4');
    },
    target() {
        let target = window.location.hash.substring(1);
        if (target) {
            Q(`a[id='${decodeURI(target)}']`).scrollIntoView({behavior: 'smooth'});
            Q(`a[id='${decodeURI(target)}']`).classList.add('target');
        }
    },
    types: {A: 'Attack', B: 'Balance', D: 'Defense', S: 'Stamina'},
    fusion: false,
    titles: {remake: '［復刻］攻擊環 結晶輪盤 Remake Layer', layer6s: '［超王］重心盤 底盤 Chassis', layer6c: '［超王］紋章 Chip', layer6r: '［超王］刃輪 戰輪 Ring',
        layer5w: '［GT］重心鐵 配重鐵 Weight', layer5c: '［GT］紋章 Chip', layer5b: '［GT］攻擊環底 基座 Base', layer5: '［GT］無限之鎖 攻擊環 Layer',
        layer4: '［超Ｚ］攻擊環 結晶輪盤 Layer', layer3: '［神］攻擊環 結晶輪盤 Layer', layer2: '攻擊環 結晶輪盤 Layer', layer1: '攻擊環 結晶輪盤 Layer',
        disk: '金屬 鋼鐵 輪盤 Disk', frame: '結晶環 戰環 Frame', driver: '軸心 底盤 Driver'}
}
customElements.define('weight-scale', class extends HTMLElement {
    constructor() {
        super();
        this.shadow = this.attachShadow({mode: 'open'});
        this.shadow.innerHTML = ['/include/common.css', 'include/ruler.css'].map(c => `<link rel=stylesheet href=${c}>`).join('')
            + '<input type=checkbox id=show><label for=show></label><div></div>';
        this.hidden = true;
    }
    connectedCallback() {
        const [min, max, group, scale] = ['min', 'max', 'group', 'scale'].map(a => this.getAttribute(a));
        for (const el of this.shadow.querySelectorAll('div, label')) el.classList = group == 'remake' ? 'layer' : group.replace(/\d.?$/, '');
        this.scale = Function('w', 'return ' + scale);
        for (let w = parseInt(min); w <= parseInt(max); w++)
            this.shadow.querySelector('div').appendChild(this.cell(w, w == parseInt(max)));
    }

    cell(w, last) {
        const data = document.createElement('data');
        data.value = w;
        data.innerHTML = last ? `` : `<span>${this.scale(w).toFixed(1)}</span>`;
        if (Parts.fusion && !last)
            data.querySelector('span').setAttribute('fusion', (this.scale(w) + 30).toFixed(1));
        else if (/^layer(5b|6r)$/.test(Parts.group) && !last)
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
            for (const t of Object.values(Parts.types)) add(t.substring(0, 3).toLowerCase(), 'type');
    },
    magnify() {
        const slider = () => {
            const slider = Q("input[type='range']");
            slider.value = Cookie.get.magBar || 1;
            Q(".catalog").style.fontSize = slider.value + "em";
            slider.oninput = ({target}) => {
                Q(".catalog").style.fontSize = target.value + "em";
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
        window.resize = () => window.innerWidth > 630 ? slider() : Q('.catalog').style.fontSize = '';
    },
    ruler(group) {
        let max, min, scale;
        switch (group) {
            case ('dash'):
            case ('high'):
                return;
            case ('layer3'):
            case ('layer6s'):
                [max, min, scale] = [10, 1, 'w+7'];
                break;
            case ('remake'):
                [max, min, scale] = [19, 10, 'w+7'];
                break;
            case ('layer1'):
            case ('layer2'):
            case ('layer5b'):
            case ('layer5w'):
            case ('layer6r'):
                [max, min, scale] = [9, 0, 'w+7'];
                break;
            case ('layer4'):
            case ('disk1'):
            case ('disk2'):
                [max, min, scale] = [8, 0, 'w+17'];
                break;
            case ('disk3'):
            case ('layer5'):
                [max, min, scale] = [15, 5, 'w+17'];
                break;
            case ('frame'):
            case ('layer5c'):
                [max, min, scale] = [7, 0, 'w*0.3+2.3'];
                break;
            case ('layer6c'):
                [max, min, scale] = [12, 2, 'w*0.3+2.3'];
                break;
            case ('driver3'):
            case ('driver1'):
            case ('driver2'):
            case ('driver4'):
                [max, min, scale] = [10, 0, 'w/2+5.4'];
                break;
        }
        Q('main').insertAdjacentHTML('afterend', `<weight-scale min='${min}' max='${max}' scale='${scale}' group='${group}'/>`);
    }
}
