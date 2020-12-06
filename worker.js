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

]))));
self.addEventListener('fetch', ev => ev.respondWith(
    caches.open('cache').then(cache => {
        const {url} = ev.request;
        return cache.match(ev.request, {ignoreSearch: true}).then(async c =>
            addHead(c && internal(url) && !justUpdated(url, c) ? c : await goFetch(ev.request))
        );
    })
));

function caching(cache, url, response) {
    //if (response.ok && response.status == '200' && internal(url))
        //cache.put(url.replace(/\?[.\d]*$/, '').replace(/i=.d$/).replace(/#.*?$/, ''), response.clone());
    return response;
}

async function goFetch(req) {
    return await fetch(req.url + (!/\?/.test(req.url) && forceUpdate(req.url)? '?' + Math.random() : ''), {mode: 'cors'});
}
async function addHead(res) {
    if (!(res.headers.get("content-type")||'').includes("text/html"))
        return res;
    return new Response(await head() + await res.text(), {
        status: res.status,
        statusText: res.statusText,
        headers: res.headers
    });
}
let code;
async function head() {
    return code ? code : new Promise(resolve => {
        const open = indexedDB.open('db', 1);
        const quit = () => {
            open.result.close();
            indexedDB.deleteDatabase('db');
            resolve('');
        };
        open.onupgradeneeded = quit;
        open.onsuccess = () => {
            try {
                const query = open.result.transaction('html').objectStore('html').get('head');
                open.result.close();
                query.onsuccess = () => resolve(code = query.result || '');
            } catch (e) {
                quit();
            }
        }
    })
}