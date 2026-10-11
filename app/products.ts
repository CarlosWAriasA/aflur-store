export type Product = { id: string; name: string; category: string; audience: string; price: number|null; salePrice?:number|null; sizes: string[]; images: string[]; description: string; status: string; featured: boolean; demo?: boolean; sourceUrl?: string; reference?: boolean };
export {categories,audiences} from '../lib/product-options.mjs';
export const onSale=(product:Product)=>typeof product.salePrice==='number'&&product.salePrice>0&&product.price!==null&&product.salePrice<product.price;
export const sellingPrice=(product:Product)=>onSale(product)?product.salePrice!:product.price;
export const discount=(product:Product)=>onSale(product)?Math.round((1-product.salePrice!/product.price!)*100):0;
// Public Instagram references: photos and visible details only. Stock, price and sizes are unconfirmed.
function instagram(id:string,name:string,category:string,photo:string,reel:string,description:string,featured=false):Product{
 return {id,name,category,audience:'Hombre',price:null,sizes:[],images:[`/products/instagram/${photo}.jpg`],description,status:'Consultar disponibilidad',featured,reference:true,sourceUrl:`https://www.instagram.com/aflurstore/reel/${reel}/`};
}
export const samples:Product[]=[
 instagram('IG-001','Polo crema con cuello burdeos','Polos','polo-crema-burdeos','Dd_xkvqxB0u','Polo de manga corta en tono crema, cuello y mangas con ribetes burdeos. Referencia publicada por Aflur Store el 2 de octubre de 2026.',true),
 instagram('IG-002','Camisa negra con bordados','Camisas','camisa-negra-bordada','Dd_wv74xzhZ','Camisa negra de manga corta con motivos bordados decorativos en el frente. Referencia publicada por Aflur Store el 2 de octubre de 2026.',true),
 instagram('IG-003','Polo crema con textura','Polos','polo-crema-textura','Dd_vdkUR_qd','Polo de manga corta en tono crema, tejido con textura y ribetes en contraste. Referencia publicada por Aflur Store el 2 de octubre de 2026.',true),
 instagram('IG-004','Camisa Paradise','Camisas','camisa-paradise','DdKc49pByV_','Camisa clara de manga corta con la palabra Paradise y un estampado tropical en la parte inferior. Referencia publicada por Aflur Store el 11 de septiembre de 2026.'),
 instagram('IG-005','Camisa con estampado artístico','Camisas','camisa-estampado-artistico','DdKbo6th-Rm','Camisa de manga corta con estampado de una escena artística y palmeras en tonos azules y tierra. Referencia publicada por Aflur Store el 11 de septiembre de 2026.'),
 instagram('IG-006','Camisa con estampado de soles','Camisas','camisa-soles','DdKa1mOhPoN','Camisa de manga corta en tonos crema y marrón con motivos de soles y flores. Referencia publicada por Aflur Store el 11 de septiembre de 2026.'),
];
export const money=(n:number|null)=>n===null?'Consultar precio':new Intl.NumberFormat('es-DO',{style:'currency',currency:'DOP',minimumFractionDigits:Number.isInteger(n)?0:2,maximumFractionDigits:2}).format(n);
