import test from 'node:test';
import assert from 'node:assert/strict';
import {parseArticleMedia,thumbnailFromListing,coverCandidates,youtubeId} from '../../src/lib/news/media.ts';
const base='https://www.gaceta.unam.mx/articulo/';
const photo='https://www.gaceta.unam.mx/wp-content/uploads/2021/11/ceremonia.jpg';
test('Open Graph and lazy body candidates are preserved',()=>{
 const media=parseArticleMedia(`<head><meta property="og:image" content="${photo}"></head><article><img data-lazy-src="/wp-content/uploads/segunda.jpg" width="800" height="500"></article>`,base,'Gaceta UNAM');
 assert.equal(media.imageUrl,photo);assert.equal(media.imageCandidates?.length,2);
});
test('Body fallback ignores site logo and related stories',()=>{
 const m=parseArticleMedia(`<header><img src="/logo.jpg"></header><article><div class="entry-content"><img src="data:image/gif;base64,x" data-src="${photo}" width="900" height="500"></div><section class="related-posts"><img src="/unrelated.jpg"></section></article>`,base,'Gaceta');
 assert.equal(m.imageUrl,photo);assert.deepEqual(m.imageCandidates,[photo]);
});
test('Background and lazy listing thumbnails belong to the exact linked article',()=>{
 const html=`<a href="/otra/"><img src="/wrong.jpg"></a><a class="img-holder" href="/articulo/" style="background-image:url('${photo}')"></a>`;
 assert.equal(thumbnailFromListing(html,base,base),photo);
 assert.equal(thumbnailFromListing(`<a href="/articulo"><img data-lazy-src="${photo}"></a>`,base,base),photo);
});
test('Largest responsive image and permitted legacy HTTP photo',()=>{
 const m=parseArticleMedia('<article><img data-srcset="/small.jpg 320w, http://www.gaceta.unam.mx/large.jpg 1024w"></article>',base,'Gaceta');
 assert.equal(m.imageUrl,'https://www.gaceta.unam.mx/large.jpg');
});
test('Article JSON-LD photo, not organization logo',()=>{
 const html='<script type="application/ld+json">'+JSON.stringify({'@graph':[{'@type':'Organization',logo:photo},{'@type':'NewsArticle',url:base,image:{url:photo},datePublished:'2021-10-15T12:00:00Z'}]})+'</script>';
 assert.equal(parseArticleMedia(html,base,'Gaceta').imageUrl,photo);
});
test('YouTube links and deferred iframes expose a video thumbnail',()=>{
 const id='dQw4w9WgXcQ';
 for(const html of [`<article><a href="https://youtu.be/${id}">Video</a></article>`,`<article><iframe data-lazy-src="https://www.youtube-nocookie.com/embed/${id}"></iframe></article>`]){
 const m=parseArticleMedia(html,base,'Gaceta');assert.equal(m.youtubeId,id);assert.equal(coverCandidates(m as any)[0],`https://i.ytimg.com/vi/${id}/hqdefault.jpg`);}
});
test('No external or dangerous image schemes',()=>{
 for(const url of ['javascript:alert(1)','https://unam.mx.evil.example/image.jpg','http://localhost/image.jpg','https://user:pass@www.gaceta.unam.mx/image.jpg'])assert.equal(parseArticleMedia(`<head><meta property="og:image" content="${url}"></head>`,base,'Gaceta').imageUrl,undefined);
 assert.equal(youtubeId('https://youtube.com.evil.example/watch?v=dQw4w9WgXcQ'),null);
});
test('No arbitrary image from unrelated page chrome',()=>{
 assert.equal(parseArticleMedia('<body><nav><img src="/menu.jpg"></nav><div><img src="/sidebar.jpg"></div></body>',base,'Gaceta').imageUrl,undefined);
});
test('Malformed structured data does not discard a valid photograph',()=>{
 assert.equal(parseArticleMedia(`<script type="application/ld+json">{invalid</script><article><img src="${photo}"></article>`,base,'Gaceta').imageUrl,photo);
});
