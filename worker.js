const justUpdated = (url, cache) => {
    const cachedDate = new Date(cache.headers.get('date')).getTime();
    return (
        /(Mincho-chi\.ttf)$/.test(url) && new Date('2020-10-14').getTime() >= cachedDate ||
        /(launchers|BH-others).php$/.test(url) && new Date('2020-11-03').getTime() >= cachedDate ||
        /(parts)\/(\?part=.+)?$/.test(url) && new Date('2020-11-07').getTime() >= cachedDate ||
        /products\/$/.test(url) && new Date('2020-11-07').getTime() >= cachedDate ||
        /\=layer6r$/.test(url) && new Date('2020-11-14').getTime() >= cachedDate ||
        /(catalog|search|row)\.js$/.test(url) && new Date('2020-11-14').getTime() >= cachedDate ||
        /(catalog|typography)\.css$/.test(url) && new Date('2020-11-14').getTime() >= cachedDate ||
        /(Menlo|Prize)/i.test(url) && new Date('2020-11-15').getTime() >= cachedDate ||
        !/(jpg|png|woff|ttf|bg\.svg)/.test(url) && new Date('2020-10-24').getTime() >= cachedDate ||
        /\.(css|js)$/.test(url) && (new Date).setDate((new Date).getDate() - 7) >= cachedDate ||
        (new Date).setMonth((new Date).getMonth() - 2) >= cachedDate || false);
}

const internal = url => new URL(url).host == 'beybladeburst.github.io';
const noCache = url => [/(inter\.php|tools|update|catalog.php\?)/, /\.com\/?(\?i\=\d)?$/, /#$/].some(regex => regex.test(url));
const appending = req => new Request(req.url + (internal(req.url) && !/\?/.test(req.url) ? '?' + Math.random() : ''), {mode: 'no-cors'});

self.addEventListener('install', ev =>
    ev.waitUntil(caches.open('cache').then(cache => cache.addAll([])))
);
self.addEventListener('fetch', ev => ev.respondWith(
    caches.open('cache').then(cache => {
        const url = ev.request.url;
        return cache.match(ev.request, {ignoreSearch: true}).then(c =>
            c && internal(url) && !noCache(url) && !justUpdated(url, c) ?
                c : addHead(ev.request)
        );
    })
));

function caching(cache, url, response) {
    //if (response.ok && response.status == '200' && internal(url) && !noCache(url))
        //cache.put(url.replace(/\?[.\d]*$/, '').replace(/i=.d$/).replace(/#.*?$/, ''), response.clone());
    return response;
}
async function addHead(req) {
    const res = await fetch(req);
    if (!(res.headers.get("content-type")||'').includes("text/html"))
        return res;
    return new Response(await head() + await res.text(), {
        status: res.status,
        statusText: res.statusText,
        headers: res.headers
    });
}
async function head() {
    return new Promise(resolve => {
        const open = indexedDB.open('db', 1);
        open.onsuccess = () => {
            const query = open.result.transaction('html').objectStore('html').get('head');
            query.onsuccess = () => resolve(query.result);
        }
    })
}