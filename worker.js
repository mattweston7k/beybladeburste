const justUpdated = (url, cache) => {
    const cachedDate = new Date(cache.headers.get('date')).getTime();
    return (
        /(Mincho-chi\.ttf)$/.test(url) && new Date('2020-10-14').getTime() >= cachedDate ||
        /\.(css|js)$/.test(url) && (new Date).setDate((new Date).getDate() - 7) >= cachedDate ||
        (new Date).setMonth((new Date).getMonth() - 2) >= cachedDate || false);
}
const internal = url => /beybladeburst\.github\.io$/.test(new URL(url).host);
const append = url => internal(url) && !/\?/.test(url) && /(ttf|woff2?|js|json|css)$/.test(url) ? `${url}?${Math.random()}` : url;

const classify = {
    update: url => [/\.json/].some(file => file.test(new URL(url).pathname)),
    volatile: url => [/(js|json|css)$/, /^\/(index\.html)?$/].some(file => file.test(new URL(url).pathname)),
}

self.addEventListener('install', ev => ev.waitUntil(
    (async () => (await caches.open('cache')).addAll(['/include/head.html','/parts/include/bg.svg']))()
));
self.addEventListener('fetch', ev => ev.respondWith(
    (async () => {
        const {url} = ev.request;
        const c = await caches.match(url, classify.volatile(url) ? null : {ignoreSearch: true});
        if (classify.update(url))
            return addHead(await goFetch(url, false));
        if (classify.volatile(url))
            try {return await addHead(await goFetch(url, true))} catch (e) {return await addHead(c)}

        return await addHead(c && !justUpdated(url, c) ? c : await goFetch(url, true));
    })()
));
const goFetch = async (url, cacheable) => {
    const res = await fetch(new Request(append(url), {mode: 'no-cors'}));
    if (cacheable)
        (await caches.open('cache')).add(url.replace(/[#?].*$/, ''), res.clone());
    return res;
}

let code;
const addHead = async res => {
    if (!(res.headers.get("content-type")||'').includes("text/html"))
        return res;
    return new Response((code ? code : await head()) + await res.text(), {
        status: res.status,
        statusText: res.statusText,
        headers: res.headers
    });
}
const head = async () => code = await (await caches.match('/include/head.html')).text();