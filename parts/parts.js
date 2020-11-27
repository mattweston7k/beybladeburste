const Q = (el, func) => func ? document.querySelectorAll(el).forEach(func) : document.querySelector(el);
const Parts = {
    group: window.location.search.substring(1).split('&').map(q => q.split('=')).find(([p, v]) => p == 'g')?.[1],
    detach({sym, comp, ...part}) {
        return {...part, names: part.names?.can ? {can: part.names.can} : {}};
    },
    attach([sym, comp], part) {
        [part.names.eng, part.names.chi, part.names.jap] = names[comp]?.[sym] || ['', '', ''];
        return {...part, sym: sym, comp: comp};
    },
    load() {
        Parts.before();
        DB.getParts(Parts.group, Parts.after);
    },
    before() {
        Tools.filter(Parts.group);
        Tools.ruler(Parts.group);
        // Tools.magnify();
    },
    after(info) {
        info ? Q('details article').innerHTML = info : Q('details').hidden = true;
        console.log(document.querySelectorAll('a[id]:not([id^="+"]):not(.none)').length)
        //Q('main h5').innerHTML = '　';
        Parts.target();
        //Parts.count();
    },
    count() {
        if (document.querySelectorAll('.catalog>a').length < 28)
            Q('label[for=fixed]').remove();
        Q('nav .parts data').value = document.querySelectorAll('a[id]:not([id^="+"]):not(.none)').length;
        if (/^(driver3|dash)$/.test(Parts.group))
            Q('nav .parts data').setAttribute('data-extra', '+4');
    },
    target() {
        let target = window.location.hash.substring(1);
        if (target) {
            Q(`a[id='${decodeURI(target)}']`).scrollIntoView({behavior: 'smooth'});
            Q(`a[id='${decodeURI(target)}']`).classList.add('target');
        }
    },
    types: {A: 'Attack', B: 'Balance', D: 'Defense', S: 'Stamina'},
    fusion: false
}
customElements.define('weight-scale', class extends HTMLElement {
    constructor() {
        super();
        this.shadow = this.attachShadow({mode: 'open'});
        this.shadow.innerHTML = '<link rel="stylesheet" href="ruler.css"><input type="checkbox" id="show"><label for="show"></label><section></section>';
    }

    connectedCallback() {
        const [min, max, group, scale] = ['min', 'max', 'group', 'scale'].map(a => this.getAttribute(a));
        this.classList.add(group == 'remake' ? 'layer' : group == 'other' ? 'driver' : group.replace(/\d.?$/, ''));
        this.scale = Function('w', 'return ' + scale);
        for (let w = parseInt(min); w <= parseInt(max); w++)
            this.shadow.querySelector('section').appendChild(this.cell(w, w == parseInt(max)));
    }

    cell(w, last) {
        const div = document.createElement('div');
        div.setAttribute('scale', w);
        div.innerHTML = w + (last ? `` : `<span>${this.scale(w).toFixed(1)}</span>`);
        if (Parts.fusion && !last)
            div.querySelector('span').setAttribute('fusion', (this.scale(w) + 30).toFixed(1));
        return div;
    }
});
const Tools = {
    filter(group) {

    },
    magnify() {
        const slider = () => {
            const slider = Q("input[type='range']");
            slider.value = cookie.magBar || 1;
            Q("main section").style.fontSize = slider.value + "em";
            slider.oninput = function () {
                Q("main section").style.fontSize = this.value + "em";
                setCookie();
            };
        }
        const buttons = () => {
            const level = 3;
            Q('nav').insertAdjacentHTML('beforebegin', [...Array(level).keys()].map(i => `<input type='radio' name='mag' id='mag${i + 1}'>`).join('') +
                "<input type='checkbox' id='fixed'>");
            Q('input[name=mag]', input => input.onchange = setCookie);
            Q('#' + (cookie.magBut || 'mag2')).checked = true;
            Q('nav .mag').insertAdjacentHTML('beforeend', [...Array(level).keys()].map(i => `<label for='mag${i + 1}'></label>`).join(''));
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
            case ('other'):
            case ('driver1'):
            case ('driver2'):
            case ('driver4'):
                [max, min, scale] = [10, 0, 'w/2+5.4'];
                break;
        }
        Q('main').insertAdjacentHTML('afterend', `<weight-scale min='${min}' max='${max}' scale='${scale}' group='${group}'/>`);
    }
}
Parts.group ? Parts.load() : null;
