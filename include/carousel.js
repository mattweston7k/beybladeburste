function Carousel(img,label) {
    const count=img.length;
    
    const inputs=()=>[...Array(count).keys()].map(i=>`<input type=radio name=pages id="p${i+1}">`).join('');
    
    const carousel=()=>`
        <section style="--amount:${count}">
            <ol>`+[...Array(count).keys()].map(i=>`<li style="--index:${i+1}"><a><img></a>`).join('')+`</ol>
            `+labels()+`
        </section>`;
    
    const labels=()=>'<menu class=carousel>'+[...Array(count).keys()].map(s=>`
        <li><label for="p${s+1}" class="Prize"><img src="${label[s]}"></label>`).join('')+'</menu>';
    
    const target=i=>{
        Q('ol').setAttribute('style','--checked:'+i);
        Q(`ol li:nth-of-type(${i}) img`).src=img[i-1];
        Q(`ol li:nth-of-type(${i}) a`).href=img[i-1];
        Q('li[is]', li=>li.removeAttribute('is'));
        Q(`li:nth-of-type(${i})`, li=>li.setAttribute('is','checked-img'));
    };
    return (()=>{
        Q('main').insertAdjacentHTML('beforeend',carousel());
        Q('nav .links').insertAdjacentHTML('afterend',labels());
        Q('body').insertAdjacentHTML('afterbegin',inputs());
        Q('input[name=pages]', (input,i)=>input.addEventListener('change',()=>target(i+1)));
        Q('#p1').click();
    })();
}