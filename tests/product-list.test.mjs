import test from 'node:test';
import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';
import {readFile} from 'node:fs/promises';
import {listOptions,productList,sampleList} from '../lib/product-list.mjs';
const options=query=>listOptions(new URLSearchParams(query));
test('Neon pagination limits rows, applies filters before paging and reports global metadata',async()=>{
 const pg=new PGlite(),queries=[];
 const db={query:async(text,values=[])=>{queries.push(text);return (await pg.query(text,values)).rows;}};
 try{
  await pg.exec(await readFile('postgres/0000_cooing_shard.sql','utf8'));
  const products=Array.from({length:31},(_,index)=>{const n=index+1;return {id:`AF-${String(n).padStart(3,'0')}`,name:`Producto ${n}`,category:n%2?'Polos':'Vestidos',audience:n%2?'Hombre':'Mujer',price:100+n,salePrice:n===30?50:null,sizes:[n%3?'S':'L'],images:['/api/images/a.jpg','/api/images/b.jpg'],status:n===31?'Oculto':'Disponible',featured:n<=2,description:''};});
  for(const [index,product] of products.entries())await pg.query('INSERT INTO products (id,data,created_at) VALUES ($1,$2,$3)',[product.id,JSON.stringify(product),index]);
  const first=await productList(db,options(''));
  assert.equal(first.products.length,12);assert.equal(first.pagination.total,30);assert.equal(first.pagination.pages,3);
  assert.deepEqual([...first.facets.sizes].sort(),['L','S']);assert(first.facets.audiences.includes('Mujer'));
  const second=await productList(db,options('page=2')),last=await productList(db,options('page=999'));
  assert.equal(second.products.length,12);assert(!second.products.some(p=>first.products.some(q=>p.id===q.id)));
  assert.equal(last.products.length,6);assert.equal(last.pagination.page,3);
  assert.equal((await productList(db,options('sort=low'))).products[0].id,'AF-030');
  const filtered=await productList(db,options('search=producto+30&audience=Mujer&category=Vestidos&maxPrice=60&size=L'));
  assert.equal(filtered.pagination.total,1);assert.equal(filtered.products[0].id,'AF-030');
  assert.equal((await productList(db,options('ids='))).pagination.total,0);
  assert.equal((await productList(db,options('ids=AF-030,AF-031'))).pagination.total,1);
  assert.equal((await productList(db,options("search=' OR 1=1 --"))).pagination.total,0);
  const admin=await productList(db,options('search=Producto+31'),true);
  assert.equal(admin.products[0].status,'Oculto');assert.equal(admin.stats.total,31);assert.equal(admin.stats.available,30);assert.equal(admin.stats.images,62);
  assert(queries.filter(query=>query.startsWith('SELECT data')).every(query=>query.includes('LIMIT')&&query.includes('OFFSET')));
  const fallback=sampleList(products,options('audience=Mujer&maxPrice=60'));
  assert.equal(fallback.products[0].id,'AF-030');assert.equal(fallback.pagination.total,1);
  await pg.query("DELETE FROM products WHERE id>'AF-024'");
  const afterDelete=await productList(db,options('page=3'),true);assert.equal(afterDelete.pagination.page,2);assert.equal(afterDelete.products.length,12);
 }finally{await pg.close();}
});
test('rejects unsupported pagination, filter lengths and sorting values',()=>{
 for(const query of ['page=0','page=-1','page=1.5','page=100001','sort=sql','maxPrice=no','audience=unknown','search='+('a'.repeat(121))])assert.throws(()=>options(query));
 assert.equal(options('page=2').page,2);
});
