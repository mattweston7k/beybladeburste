self.addEventListener('install', ev => ev.waitUntil(
    (async () => (await caches.open('cache')).addAll(['/index.html','/include/head.html','/parts/include/bg.svg']))()
));
self.addEventListener('activate', event => event.waitUntil(clients.claim()));

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

self.addEventListener('fetch', ev => ev.respondWith(
    (async () => {
        const {url} = ev.request;
        if (classify.update(url))
            return addHead(await goFetch(url, false));

        const c = await caches.match(url, classify.volatile(url) ? null : {ignoreSearch: true});
        if (classify.volatile(url))
            return await addHead(await goFetch(url, true, c));

        return await addHead(c && !justUpdated(url, c) ? c : await goFetch(url, !/\/img\/bg\.jpg$/.test(url), c));
    })()
));
const goFetch = async (url, cacheable, cache) =>
    await fetch(new Request(append(url), {mode: 'no-cors'}))
        .then(async res => {
            cacheable ? (await caches.open('cache')).add(url.replace(/[#?].*$/, ''), res.clone()) : null;
            return res;
        }).catch(() => cache);

let code;
const addHead = async res => {
    if (!(res?.headers.get("content-type")||'').includes("text/html"))
        return res;
    return new Response((code || await head()) + await res.text(), {
        status: res.status,
        statusText: res.statusText,
        headers: res.headers
    });
}
const head = async () => code = await (await caches.match('/include/head.html')).text?.();