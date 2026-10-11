import test from 'node:test';
import assert from 'node:assert/strict';
import {productSchema} from '../lib/product-schema.mjs';
const product={id:'AF-TEST',name:'Vestido negro',category:'Vestidos',audience:'Mujer',price:1500,salePrice:1200,sizes:['S','M'],images:['/api/images/12345678-1234-1234-1234-123456789abc.jpg','/api/images/12345678-1234-1234-1234-123456789abd.png'],description:'Vestido de prueba',status:'Disponible',featured:false};
test('women, men and unisex products preserve offers and image order',()=>{
 for(const audience of ['Mujer','Hombre','Unisex']){const result=productSchema.parse({...product,audience,images:[...product.images].reverse()});assert.equal(result.audience,audience);assert.equal(result.salePrice,1200);assert.deepEqual(result.images,[...product.images].reverse());}
});
test('older products and removing an offer remain compatible',()=>{
 const {salePrice,...old}=product;assert.equal(productSchema.parse(old).salePrice,undefined);assert.equal(productSchema.parse({...product,salePrice:null}).salePrice,null);
});
test('rejects invalid discounts, precision, duplicate images and unsupported audiences',()=>{
 for(const salePrice of [0,-1,1500,1600,NaN,Infinity,1200.001])assert.equal(productSchema.safeParse({...product,salePrice}).success,false);
 assert.equal(productSchema.safeParse({...product,images:[product.images[0],product.images[0]]}).success,false);
 assert.equal(productSchema.safeParse({...product,audience:'Otro'}).success,false);
 assert.equal(productSchema.safeParse({...product,salePrice:1199.99}).success,true);
});
