Part.prototype.catalog = function() {
    let {comp, group, sym, type, generation, attr, deck, names, stat, desc} = this;
    const bg = {
        hue: {
            layer: /^\+/.test(sym) ? 80 : !deck ? 140 : 185,
            disk: 230,
            frame: 230,
            driver: deck ? 275 : !/^\+/.test(sym) ? 320 : 5
        }[comp.match(/layer|disk|driver|frame/)[0]],
        set heaviness(classes) {
            bg.heavy = ['fusion', 'light', 'grams'].find(c => classes.includes(c)) || (classes.length > 0 ? '' : null);
        },
        get url() {
            const query = ['hue', 'heavy'].filter(p => bg[p] !== null).map(p => `${p}=${bg[p]}`).join('&');
            const mode = Q('html').classList.contains('day') ? 'day' : 'night';
            return `/parts/include/bg.svg?${mode}&${query}` + (type ? `#${type}${stat?.length || 5}` : ``);
        },
    }
    const weight = {
        levels: w => typeof w == 'string' ?
            ({driver: [14, 10], layer5b: [99, 23, 21], layer5c: [99, 14]}[comp] || []) :
            (/layer[45]$/.test(group) || deck && comp == 'driver' ? [8, 0, 0] : deck ? [10, 5, 3] : [18, 10, 8]),
        bucketing: w => weight.classes = [
            deck || /^[IM]$/.test(sym) && comp == 'layer5b' ? 'fusion' : '',
            typeof w == 'string' ? 'grams' : '',
            sym == '幻' || sym == 'L' && comp == 'layer5b' ? 'light' : ['heavy-x', 'heavy-s', 'heavy'][weight.levels(w).findIndex(l => w >= l)]
        ].filter(c => c),
    }
    const code = {
        get symbol() {
            let code = sym
                .replace(/^([dlr]α).$/, '$1')
                .replace(/^([DG][A-Z]|∞)([A-Z].?)$/, '$1<sup>$2</sup>')
                .replace(/^(.{2,}?)([2+])$/, '$1<sup>$2</sup>')
                .replace(/^\+(?=s[wh]|BA)/, '');
            if (sym == 'sΩ')
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
                jap: !names.jap && names.can ? sym : names.jap || '',
                chi: /^(dash|high)$/.test(group) ? '' : (names.chi || '').replace(/[｜︱].*/, ''),
                can: /^(dash|high)$/.test(group) ? '' : names.can || ''
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
        get content() {
            const code = `<figure class='${(attr || []).join(' ')}' style='background:url(/parts/${comp}/${sym.replace(/^\+/, '⨁')}.png)'></figure>`;
            if (!stat || /^(dash|high)$/.test(group)) return code;
            const terms = ['攻擊力', '防禦力', '持久力', typeof stat[3] == 'string' && stat.length == 5 ? '重量' : '重　量', '機動力', '擊爆力'];
            if (typeof stat[3] == 'string')
                stat[3] = stat[3].replace(/克$/, '<small>克</small>');
            return code + `
            <dl class='stat-${stat.length} ${weight.classes.join(' ')}'>` +
                stat.map((s, i) => s === null ? '' : `<div><dt>${terms[i]}<dd>${s}</div>`).join('') + `
            </dl>`;
        }
    }
    const anchor = attr => {
        const part = document.createElement('a');
        const descF = group => ({
            dash: `內藏強化彈簧的【${sym.replace('′', '')}】driver。`,
            high: `高度增加的【${sym.replace(/^H/, '')}】driver。`
        })[group] || desc || '';
        part.innerHTML = `
            <object data='${bg.url}'></object>` + (group ? `
            <div class='info'>` + code.symbol + code.name + `</div>
            <div class='content'>` + code.content + `</div>
            <p class='desc'>` + descF(group) + `</p>` : ``);
        for (const [a, v] of Object.entries(attr)) if (v) part[a] = v;
        return part;
    }

    if (sym == null)
        return Q('.catalog').appendChild(anchor({classList: 'none'}));

    deck ? Parts.fusion = deck : null;
    let classes = [comp, group, type, generation, sym == 9 ? 'none' : ''].filter(c => c);
    if (!/^(dash|high)$/.test(group) && (/(メタル|プラス)/.test(names.jap) || names.jap?.length >= 10))
        classes.push('long');

    bg.heaviness = weight.bucketing(stat?.[3]);

    return Q('.catalog').appendChild(anchor({
        id: comp == 'driver' ? sym.replace('′', '') : sym,
        href: /(9|pP|[lrd]αe|BA)/.test(sym) ? '' : `/products/?${/^\+/.test(sym) ? 'more' : comp}=${encodeURIComponent(sym)}`,
        classList: classes.join(' ')
    }));
}