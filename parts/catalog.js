function Catalog(part) {
    let {comp, group, sym, type, generation, attr, deck, names, stat, desc} = part;
    this.bg = {
        heavy: deck ? 'fusion' : null,
        set heaviness(classes) {
            if (this.heavy !== null) return;
            this.heavy = classes.includes('light') ? 'light' : classes.includes('grams') ? 'grams' : '';
        },
        get url() {
            const query = [['hue', this.hue], ['heavy', this.heavy]].filter(([p, v]) => v !== null);
            const mode = Q('html').classList.contains('day') ? 'day' : 'night'
            return `/parts/require/${mode}.svg?` + query.map(q => q.join('=')).join('&') + (type ? `#${type + (stat?.length || 5)}` : ``)
        },
        get hue() {
            return {
                layer: /^\+/.test(sym) ? 80 : !deck ? 140 : 185,
                disk: 230,
                frame: 230,
                driver: deck ? 275 : !/^\+/.test(sym) ? 320 : 5
            }[comp.match(/layer|disk|driver|frame/)[0]]
        },
    }
    this.weight = {
        classes: [deck ? 'fusion' : '', typeof stat?.[3] == 'string' ? 'grams' : ''],
        classify() {
            if (!stat) return;
            return this.classes = [...this.classes, sym == '幻' ? 'light' : this.bucket(stat[3])].filter(c => c);
        },
        bucket(weight) {
            const levels = typeof weight == 'string' ?
                ({driver: [14, 10], layer5b: [99, 23, 21], layer5c: [99, 14]}[comp] || []) :
                (/layer[45]$/.test(group) || deck && comp == 'driver' ? [8, 0, 0] : deck ? [10, 5, 3] : [18, 10, 8]);
            return ['heavy-x', 'heavy-s', 'heavy'][levels.findIndex(l => weight >= l)] || '';
        }
    }
    this.code = {
        get symbol() {
            let code = sym
                .replace(/^([dlr]α).$/, '$1')
                .replace(/^([DG][A-Z]|∞)([A-Z].?)$/, '$1<sup>$2</sup>')
                .replace(/^(.{2,}?)(2|\+)$/, '$1<sup>$2</sup>')
                .replace(/^\+(?=s[wh])/, '');
            if (sym == 'BA')
                code = '';
            else if (sym == 'sΩ')
                code = "Ω";
            else if (comp == 'layer5c' && sym == 'Δ')
                code = "D";
            else if (comp == 'layer6r' && sym[0] != '+')
                code = code[0];
            const cl = code.match(/^[^′<]+/)[0].length == 1 ? sym.charCodeAt(0) > 18000 ? 'kanji' : 'single' : '';
            return `<div class='symbol'><h2${cl ? ` class='${cl}'` : ``}>${code}</h2></div>`;
        },
        get name() {
            if (!names) return '';
            names = {
                eng: comp == 'layer6s' ? `${sym[0]}-${Parts.types[sym[1]]}` : names.eng || '',
                chi: /^(dash|high)$/.test(group) ? '' : (names.chi || '').replace(/[｜︱].*/, ''),
                jap: !names.jap && names.can ? sym : names.jap || '',
                can: names.can || ''
            }
            if (group == 'high')
                [names.eng, names.jap] = ['High ' + names.eng, 'ハイ' + names.jap];
            if (/^(dash|high)$/.test(group) && /′$/.test(sym))
                [names.eng, names.jap] = [names.eng + ' <sup>dash</sup>', names.jap + 'ダッシュ'];

            let len, code;
            if (comp == 'layer' || classes.includes('long') || /^(dash|high)$/.test(group)) {
                len = (names.jap + names.chi).replace(/\s/g, '').length - 15;
                code = `
                <div class='top'>
                    <h4 class='can'>${names.can}</h4>
                    <h3 class='eng'>${names.eng}</h3>
                </div>
                <div class='bottom'${len > 0 ? ` style='--space:${len * .045}'` : ''}>
                    <h3 class='jap'>${names.jap}</h3>
                    <h3 class='chi'>${names.chi}</h3>
                </div>`;
            } else {
                len = names.jap.length + (names.chi ? names.chi.length + 2 : 0) + names.eng.length / 2 - (names.eng.match(/[IJfijlt]/g) || []).length / 4 - 13.25;
                code = `
                <div class='left'${len > 0 ? ` style='--space:${Math.min(len, 2)}'` : ''}>
                    <h4 class='can'>${names.can}</h4>
                    <h3 class='jap'>${names.jap}</h3>
                </div>
                <div class='right'${len > 0 ? ` style='--space:${Math.min(len, 2)}'` : ''}>
                    <h3 class='eng'>${names.eng}</h3>
                    <h3 class='chi'>${names.chi}</h3>
                </div>`;
            }
            return `<div class='name'>${code}</div>`;
        },
        content(classes) {
            const code = `<figure class='${(attr || []).join(' ')}' style='background:url("/parts/${comp}/${sym.replace(/^\+/, '⨁')}.png")'></figure>`;
            if (!stat)
                return code;
            const terms = ['攻擊力', '防禦力', '持久力', classes.includes('grams') && stat.length == 5 ? '重量' : '重　量', '機動力', '擊爆力'];
            if (typeof stat[3] == 'string')
                stat[3] = stat[3].replace(/克$/, '<small>克</small>');
            return code + `
            <dl class='stat-${stat.length} ${classes.join(' ')}'>` +
                stat.map((s, i) => s === null ? '' : `<div><dt>${terms[i]}<dd>${s}</div>`).join('') + `
            </dl>`;
        }
    }
    const element = attr => {
        const part = document.createElement('a');
        const descF = group => ({
            dash: `內藏強化彈簧的【${sym.replace('′', '')}】driver。`,
            high: `高度增加的【${sym.replace(/^H/, '')}】driver。`
        })[group] || desc || '';
        part.innerHTML = `
            <img src='${this.bg.url}'>` + (attr.rel ? `
            <div class='info'>` + this.code.symbol + this.code.name + `</div>
            <div class='content'>` + this.code.content(this.weight.classes) + `</div>
            <div class='desc'>` + descF(group) + `</div>` : ``);
        Object.entries(attr).forEach(([a, v]) => v ? part[a] = v : null);
        return part;
    }

    if (sym == null)
        return Q('.catalog').appendChild(element({classList: 'none'}));
    if (deck)
        Parts.fusion = true;

    let classes = [comp, type, generation, sym == 9 ? 'none' : ''].filter(c => c);
    if (!/^(dash|high)$/.test(group) && (/(メタル|プラス)/.test(names.jap) || names.jap?.length >= 10))
        classes.push('long');

    this.bg.heaviness = this.weight.classify(this.bg) || [];

    return Q('.catalog').appendChild(element({
        id: comp == 'driver' ? sym.replace('′', '') : sym,
        href: /(9|pP|[lrd]αe)/.test(sym) ? '' : `/products/?${/^\+/.test(sym) ? 'more' : comp}=` + encodeURIComponent(sym),
        rel: group,
        classList: classes.join(' ')
    }));
}
const any = prefix =>
    caches.open('cache').then(c => c.match(new Request('/parts/require/typography.css'))).then(r => r.text()).catch(() =>
        fetch('/parts/require/typography.css').then(r => r.text())).then(css => Q('head').insertAdjacentHTML('beforeend', '<style>' + css.replace(/-webkit-any/g, prefix) + '</style>'));
try {
    document.querySelector(':-webkit-any(#A)')
} catch (e) {
    try {
        document.querySelector(':is(#A)');
        any('is');
    } catch (e) {
        try {
            document.querySelector(':matches(#A)');
            any('matches');
        } catch (e) {
            try {
                document.querySelector(':-moz-any(#A)');
                any('-moz-any');
            } catch (e) {
            }
        }
    }
}
