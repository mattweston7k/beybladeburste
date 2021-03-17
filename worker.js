self.addEventListener('install', ev => ev.waitUntil(
    (async () => (await caches.open('cache')).addAll(['/include/head.html','/parts/include/bg.svg','https://ajax.googleapis.com/ajax/libs/jquery/3.5.0/jquery.min.js']))()
));
self.addEventListener('activate', ev => ev.waitUntil(clients.claim()));

const justUpdated = (url, cache) => {
    const cachedDate = Date.parse(cache.headers.get('date'));
    return (
        /brochure\.html$/.test(url) && Date.parse('2021/03/17 11:05:00') >= cachedDate ||
        /common\.js$/.test(url) && Date.parse('2021/03/15 12:10:00') >= cachedDate ||
        /parts\/$/.test(url) && Date.parse('2021/03/15 12:10:00') >= cachedDate ||
        /(typography|products)\.css$/.test(url) && Date.parse('2021/03/14 15:00:00') >= cachedDate ||
        /\.(css|js)$/.test(url) && (new Date).setDate((new Date).getDate() - 7) >= cachedDate ||
        /io\/$/.test(url) && (new Date).setDate((new Date).getDate() - 14) >= cachedDate ||
        (new Date).setMonth((new Date).getMonth() - 1) >= cachedDate || false);
}
const internal = url => /beybladeburst\.github\.io$/.test(new URL(url).host);
const append = url => internal(url) && !/\?/.test(url) && /(ttf|woff2?|js|json|css)$/.test(url) ? `${url}?${Math.random()}` : url;
const noCacheNow = url => /^\/(products\/launchers\.html|favicon.ico)?$/.test(new URL(url).pathname);

const classify = {
    update: url => [/\.json/].some(file => file.test(new URL(url).pathname)),
    volatile: url => [/(js|json|css)$/].some(file => file.test(new URL(url).pathname)),
}

self.addEventListener('fetch', ev => ev.respondWith(
    (async () => {
        const {url} = ev.request;
        if (classify.update(url))
            return addHead(await goFetch(url, false));

        const c = await caches.match(url, classify.volatile(url) ? null : {ignoreSearch: true});
        if (classify.volatile(url))
            return await addHead(await goFetch(url, internal(url), c));

        return await addHead(c && !justUpdated(url, c) ? c : await goFetch(url, internal(url) && !noCacheNow(url), c));
    })()
));
const goFetch = async (url, cacheable, cache) =>
    await fetch(new Request(url, {mode: 'no-cors'})) // append(url)
        .then(async res => {
            if (res.status != 200) return res;
            if (/\/parts\/.*?\.png$/.test(url)) 
                (await caches.open('parts')).add(url, res.clone());
            else if (cacheable) 
                (await caches.open('cache')).add(url.replace(/[#?].*$/, ''), res.clone());
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
const head = async () => code = await (await caches.match('/include/head.html').catch(() => ''))?.text() || '';