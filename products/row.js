class Row extends HTMLTableRowElement {
    constructor(p) {
        super();
        if (p)
            this.create(p);
    }
    connectedCallback() {
        setTimeout(() => this.querySelectorAll('td[data-part]').forEach(td => {
            Row.fill(td, 'eng');
            Row.fill(td, 'chi');
            td.onclick = ev => this.preview(ev.target);
        }));
    }
    preview(td) {
        console.log(td.getAttribute('data-part'));
    }
    static fill(td, lang) {
        console.log(lang);
    }
    create(p) {
        this.innerHTML = `<td data-part="${p}">${p}</td><td data-part="${p}">${p}</td>`;
    }
}
customElements.define('product-row', Row, {extends: 'tr'});

document.querySelector('tbody').appendChild(new Row('s'))
document.querySelector('tbody').appendChild(new Row());