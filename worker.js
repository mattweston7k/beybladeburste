const justUpdated = (url, cache) => {
    const cachedDate = new Date(cache.headers.get('date')).getTime();
    return (
        /(Mincho-chi\.ttf)$/.test(url) && new Date('2020-10-14').getTime() >= cachedDate ||
        /\.(css|js)$/.test(url) && (new Date).setDate((new Date).getDate() - 7) >= cachedDate ||
        (new Date).setMonth((new Date).getMonth() - 2) >= cachedDate || false);
}
const internal = url => /beybladeburst\.github\.io$/.test(new URL(url).host);
const forceUpdate = url => internal(url) && /(js|json|css)$/.test(url);

self.addEventListener('install', ev => ev.waitUntil(caches.open('cache').then(cache => cache.addAll([
    '/include/head.html'
]))));
self.addEventListener('fetch', ev => ev.respondWith(
    caches.open('cache').then(cache => {
        const {url} = ev.request;
        return cache.match(ev.request, {ignoreSearch: true}).then(async c =>
            addHead(c && internal(url) && !justUpdated(url, c) ? c : await goFetch(ev.request))
        );
    })
));
const getCache = async url => (await (await (await caches.open('cache')).match(url, {ignoreSearch: true})).text());

function caching(cache, url, response) {
    //if (response.ok && response.status == '200' && internal(url))
        //cache.put(url.replace(/\?[.\d]*$/, '').replace(/i=.d$/).replace(/#.*?$/, ''), response.clone());
    return response;
}

const goFetch = async ({url}) => await fetch(new Request(url + (!/\?/.test(url) && forceUpdate(url)? `?${Math.random()}` : ''), {mode: 'no-cors'}));

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
const head = async () => code = await getCache('/include/head.html');
    // code ? code : new Promise(resolve => {
    //     const open = indexedDB.open('db', 1);
    //     const quit = () => {
    //         open.result.close();
    //         indexedDB.deleteDatabase('db');
    //         resolve('');
    //     };
    //     open.onupgradeneeded = quit;
    //     open.onsuccess = () => {
    //         try {
    //             const query = open.result.transaction('html').objectStore('html').get('head');
    //             open.result.close();
    //             query.onsuccess = () => resolve(code = query.result || '');
    //         } catch (e) {
    //             quit();
    //         }
    //     }
    // })
