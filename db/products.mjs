export async function saveProduct(db, product) {
 const statements=[
  db.provider==='neon'
   ? {text:'INSERT INTO products (id,data,created_at) VALUES ($1,$2,$3) ON CONFLICT(id) DO UPDATE SET data=excluded.data',values:[product.id,JSON.stringify(product),Date.now()]}
   : {text:'INSERT INTO products (id,data) VALUES ($1,$2) ON CONFLICT(id) DO UPDATE SET data=excluded.data',values:[product.id,JSON.stringify(product)]},
  {text:"INSERT INTO settings (key,value) VALUES ('initialized','1') ON CONFLICT(key) DO NOTHING"},
 ];
 if(db.provider==='neon'){
  statements.push({text:'DELETE FROM product_images WHERE product_id=$1',values:[product.id]});
  product.images.forEach((url,position)=>statements.push({text:'INSERT INTO product_images (product_id,position,object_key) VALUES ($1,$2,$3)',values:[product.id,position,url.replace('/api/images/','')]}));
 }
 await db.transaction(statements);
}
export async function deleteProduct(db,id){
 await db.transaction([
  {text:'DELETE FROM products WHERE id=$1',values:[id]},
  {text:"INSERT INTO settings (key,value) VALUES ('initialized','1') ON CONFLICT(key) DO NOTHING"},
 ]);
}
