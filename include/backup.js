class Nav extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({mode: 'open'}).innerHTML = `
        <link rel=stylesheet href=/include/common.css>
        <ul class=link><slot name=link></slot></ul>` +
            (Parts.group ? this.part : /^\/products\/(index.html)?$/.test(window.location.pathname) ? this.prod : '') +
            this.menu;
    }
    connectedCallback() {
        const icons = {'/': '', '/products/': '', '/prize/': '', '../': ''};
        for (const a of this.querySelectorAll('a')) {
            const href = a.getAttribute('href');
            if (icons[href])
                a.setAttribute('data-icon', icons[href]);
            else if (href == '/parts/')
                a.innerHTML = '<img src=/parts/include/parts.svg#whole alt=parts>';
            else if (/^\?/.test(href))
                a.innerHTML = /^\?(layer|remake)/.test(href) ?
                    `<img src=/img/system-${href.substring(1).replace(/^layer5$/, 'layer5m').replace(/(\d)[^m]$/, '$1')}.png alt=${href.substring(1)}>` :
                    href[2].toUpperCase() + href.substring(2).replace(/(\d)$/, ' $1')
        }
    }
    get menu() {
        return `<ul class=menu>
        <li><input type=checkbox id=day onchange=twilight()><label for=day class=toggle data-icon=></label></li>
        <li><label onclick=window.scrollTo(0,0) data-icon=></label><label onclick=window.scrollTo(0,document.body.scrollHeight) data-icon=></label></li></ul>`
    }
    get prod() {
        return `<ul class=prod>
        <li data-icon=><span>自由檢索<br>Free search</span><input type=text name=free placeholder=巨神/valkyrie></li>
        <li><data value></data><span>結果<br>results</span><button data-icon= onclick=Table.reset() disabled>重設 Reset</button></li></ul>`
    }
    get part() {
        let i;
        const gs = groups.find(gs => (i = gs.indexOf(Parts.group)) >= 0);
        const next = gs[++i % gs.length];
        this.innerHTML = `<a slot=link href=/parts/></a>` + `<a slot=link href=?${next}${title[next] ? ` title=${title[next]}` : ''}></a>`;
        return `<ul class=part>
        <li><data value></data><label for=fixed class=toggle></label></li>    
        <li class=mag><input type=range min=0.55 max=1.45 value step=0.05></li></ul>`;
    }
}
customElements.define('nav-bar', Nav);