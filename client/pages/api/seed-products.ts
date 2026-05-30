import type { NextApiRequest, NextApiResponse } from 'next';
import { doc, setDoc, writeBatch, Timestamp } from 'firebase/firestore';
import { db } from '../../utils/firebase';

const LUXURY_CATEGORIES = [
  { slug: 'outerwear', name: 'Outerwear', description: 'Refined coats, jackets and blazers for every season.' },
  { slug: 'tops', name: 'Tops', description: 'Premium shirts, knitwear and essential tops.' },
  { slug: 'pants', name: 'Pants', description: 'Tailored trousers, denim and casual trousers.' },
  { slug: 'footwear', name: 'Footwear', description: 'Handcrafted leather shoes and premium sneakers.' },
  { slug: 'accessories', name: 'Accessories', description: 'Belts, scarves, bags and small leather goods.' },
];

const LUXURY_PRODUCTS = [
  {
    id: 'prod-cashmere-overcoat',
    name: 'Cashmere Overcoat',
    description: 'A timeless double-breasted overcoat crafted from 100% grade-A Mongolian cashmere. Expertly tailored with a structured shoulder, satin lining, and horn buttons. The pinnacle of cold-weather elegance.',
    price: 895,
    salePrice: 795,
    category: 'outerwear',
    stock: 8,
    imageUrls: [
      'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&q=80&w=800',
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: ['Camel', 'Charcoal', 'Ivory'],
    tags: ['BESTSELLER', 'CASHMERE', 'NEW'],
    rating: 4.9,
    reviewsCount: 24,
  },
  {
    id: 'prod-structured-blazer',
    name: 'Structured Wool Blazer',
    description: 'A single-breasted blazer in Italian Super 120s wool. Clean peak lapels, a slim silhouette and functional sleeve buttons define this wardrobe cornerstone. Fully canvassed for exceptional drape.',
    price: 745,
    category: 'outerwear',
    stock: 12,
    imageUrls: [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&q=80&w=800',
    ],
    sizes: ['36', '38', '40', '42', '44'],
    colors: ['Navy', 'Charcoal', 'Tan'],
    tags: ['TAILORED', 'ITALY'],
    rating: 4.8,
    reviewsCount: 15,
  },
  {
    id: 'prod-tech-down-jacket',
    name: 'Technical Down Jacket',
    description: 'Lightweight 800-fill power goose down insulation housed in a matte-finish ripstop shell. Packable design with a concealed hood and seam-sealed construction. Function meets refined minimalism.',
    price: 585,
    salePrice: 499,
    category: 'outerwear',
    stock: 18,
    imageUrls: [
      'https://images.unsplash.com/photo-1547949003-9792a18a2601?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1544022613-e87ca75a784a?auto=format&fit=crop&q=80&w=800',
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Black', 'Slate', 'Forest Green'],
    tags: ['SALE', 'PACKABLE', 'TECHNICAL'],
    rating: 4.7,
    reviewsCount: 31,
  },
  {
    id: 'prod-merino-turtleneck',
    name: 'Merino Turtleneck',
    description: 'A fine-gauge turtleneck knitted from extra-fine Merino wool. Supremely soft against the skin, naturally temperature-regulating, and effortlessly elegant. A true modern wardrobe staple.',
    price: 285,
    category: 'tops',
    stock: 25,
    imageUrls: [
      'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&q=80&w=800',
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: ['Ivory', 'Black', 'Caramel', 'Navy'],
    tags: ['MERINO', 'ESSENTIAL'],
    rating: 4.9,
    reviewsCount: 42,
  },
  {
    id: 'prod-silk-dress-shirt',
    name: 'Silk Blend Dress Shirt',
    description: 'A refined dress shirt in a silk and cotton blend. Features a spread collar, mother-of-pearl buttons, and French seams throughout. Luxuriously smooth with an effortless drape.',
    price: 195,
    category: 'tops',
    stock: 20,
    imageUrls: [
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=800',
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['White', 'Light Blue', 'Ecru'],
    tags: ['SILK', 'FORMAL'],
    rating: 4.7,
    reviewsCount: 18,
  },
  {
    id: 'prod-linen-shirt',
    name: 'Relaxed Linen Shirt',
    description: 'A breathable summer shirt in washed Belgian linen. The relaxed fit, subtle texture, and natural wrinkle give it effortless character. A versatile piece for warm-weather dressing.',
    price: 165,
    category: 'tops',
    stock: 30,
    imageUrls: [
      'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1625910513509-f42b5b5e6621?auto=format&fit=crop&q=80&w=800',
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Sand', 'White', 'Sage', 'Sky Blue'],
    tags: ['LINEN', 'SUMMER'],
    rating: 4.6,
    reviewsCount: 27,
  },
  {
    id: 'prod-wool-trousers',
    name: 'Tailored Wool Trousers',
    description: 'Slim-fit trousers in a lightweight Super 100s wool blend. A flat front, clean pleats, and a tapered leg create a silhouette that moves beautifully from boardroom to dinner.',
    price: 395,
    category: 'pants',
    stock: 15,
    imageUrls: [
      'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1594938298603-c8148c4b4b3d?auto=format&fit=crop&q=80&w=800',
    ],
    sizes: ['28', '30', '32', '34', '36', '38'],
    colors: ['Charcoal', 'Navy', 'Stone'],
    tags: ['TAILORED', 'WOOL'],
    rating: 4.8,
    reviewsCount: 19,
  },
  {
    id: 'prod-selvedge-jeans',
    name: 'Selvedge Denim Jeans',
    description: 'Raw 13.5oz Japanese selvedge denim from a heritage Osaka mill. A straight leg, clean rise and minimal branding let the superior fabric speak for itself. Will develop a unique fade over time.',
    price: 285,
    category: 'pants',
    stock: 10,
    imageUrls: [
      'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1582552938357-32b906df40cb?auto=format&fit=crop&q=80&w=800',
    ],
    sizes: ['28', '30', '32', '34', '36'],
    colors: ['Raw Indigo', 'Washed Black'],
    tags: ['JAPAN', 'RAW DENIM', 'LIMITED'],
    rating: 4.9,
    reviewsCount: 11,
  },
  {
    id: 'prod-tailored-chinos',
    name: 'Tailored Chinos',
    description: 'A contemporary take on the classic chino in a fine peached cotton twill. Slim through the thigh and tapered to the ankle, these are the definitive everyday trouser. Washes beautifully.',
    price: 225,
    category: 'pants',
    stock: 22,
    imageUrls: [
      'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1594938298603-c8148c4b4b3d?auto=format&fit=crop&q=80&w=800',
    ],
    sizes: ['28', '30', '32', '34', '36', '38'],
    colors: ['Khaki', 'Olive', 'Navy', 'Stone'],
    tags: ['ESSENTIAL', 'VERSATILE'],
    rating: 4.6,
    reviewsCount: 33,
  },
  {
    id: 'prod-chelsea-boots',
    name: 'Leather Chelsea Boots',
    description: 'Hand-welted in full-grain calfskin leather, these Chelsea boots feature an elasticated side panel, a pull-on tab and a durable leather sole with rubber heel cap. Resoleable and built to last decades.',
    price: 650,
    category: 'footwear',
    stock: 9,
    imageUrls: [
      'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800',
    ],
    sizes: ['40', '41', '42', '43', '44', '45'],
    colors: ['Black', 'Dark Tan', 'Cognac'],
    tags: ['GOODYEAR WELTED', 'CALFSKIN'],
    rating: 4.9,
    reviewsCount: 16,
  },
  {
    id: 'prod-derby-shoes',
    name: 'Suede Derby Shoes',
    description: 'Open-laced Derby shoes in a supple suede with a lightweight crepe rubber sole. The relaxed construction and muted tones make these the ideal smart-casual companion for any outfit.',
    price: 485,
    category: 'footwear',
    stock: 14,
    imageUrls: [
      'https://images.unsplash.com/photo-1549971651-2d4e5a0d9b49?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1518894781321-630e638d0742?auto=format&fit=crop&q=80&w=800',
    ],
    sizes: ['40', '41', '42', '43', '44', '45'],
    colors: ['Sand Suede', 'Tobacco Suede', 'Grey Suede'],
    tags: ['SUEDE', 'CREPE SOLE'],
    rating: 4.7,
    reviewsCount: 22,
  },
  {
    id: 'prod-white-sneakers',
    name: 'Minimal Leather Sneakers',
    description: 'A clean-lined low-profile sneaker in smooth full-grain leather. A cupsole construction, tonal laces and discreet branding make this the ultimate luxury casual shoe. Pairs with everything.',
    price: 325,
    salePrice: 275,
    category: 'footwear',
    stock: 20,
    imageUrls: [
      'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&q=80&w=800',
    ],
    sizes: ['39', '40', '41', '42', '43', '44', '45'],
    colors: ['White', 'Off-White', 'Cream'],
    tags: ['SALE', 'MINIMAL', 'EVERYDAY'],
    rating: 4.8,
    reviewsCount: 58,
  },
  {
    id: 'prod-cashmere-scarf',
    name: 'Cashmere Scarf',
    description: 'A generous-sized scarf woven from the finest grade-A cashmere. Naturally soft, lightweight and incredibly warm. Finished with hand-knotted fringe edges on both ends.',
    price: 185,
    category: 'accessories',
    stock: 35,
    imageUrls: [
      'https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&q=80&w=800',
    ],
    sizes: ['ONE SIZE'],
    colors: ['Camel', 'Ivory', 'Charcoal', 'Burgundy'],
    tags: ['CASHMERE', 'GIFT'],
    rating: 4.9,
    reviewsCount: 44,
  },
  {
    id: 'prod-leather-belt',
    name: 'Italian Leather Belt',
    description: 'A clean, minimal belt in vegetable-tanned full-grain Italian leather. The solid brass pin buckle will develop a warm patina over time, as will the leather itself. An heirloom-quality everyday essential.',
    price: 145,
    category: 'accessories',
    stock: 40,
    imageUrls: [
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1559563458-527698bf5295?auto=format&fit=crop&q=80&w=800',
    ],
    sizes: ['30', '32', '34', '36', '38', '40'],
    colors: ['Black', 'Dark Brown', 'Tan'],
    tags: ['ITALY', 'VEG-TAN', 'ESSENTIAL'],
    rating: 4.8,
    reviewsCount: 37,
  },
  {
    id: 'prod-canvas-tote',
    name: 'Premium Canvas Tote',
    description: 'A sturdy everyday tote in 18oz waxed canvas with full-grain leather handles, base and detailing. Spacious interior with an interior zip pocket and a magnetic snap closure. Built to last.',
    price: 195,
    category: 'accessories',
    stock: 16,
    imageUrls: [
      'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&q=80&w=800',
    ],
    sizes: ['ONE SIZE'],
    colors: ['Natural Canvas', 'Black Canvas', 'Olive Canvas'],
    tags: ['WAXED CANVAS', 'HANDCRAFTED'],
    rating: 4.7,
    reviewsCount: 21,
  },
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Seed categories
    const catBatch = writeBatch(db);
    for (const cat of LUXURY_CATEGORIES) {
      const ref = doc(db, 'categories', cat.slug);
      catBatch.set(ref, { ...cat, createdAt: Timestamp.now() });
    }
    await catBatch.commit();

    // Seed products in two batches (Firestore limit is 500 ops per batch)
    const prodBatch = writeBatch(db);
    for (const prod of LUXURY_PRODUCTS) {
      const ref = doc(db, 'products', prod.id);
      prodBatch.set(ref, { ...prod, createdAt: Timestamp.now() });
    }
    await prodBatch.commit();

    return res.status(200).json({
      success: true,
      message: `Successfully seeded ${LUXURY_PRODUCTS.length} products and ${LUXURY_CATEGORIES.length} categories.`,
      products: LUXURY_PRODUCTS.map(p => ({ id: p.id, name: p.name, category: p.category, price: p.price }))
    });
  } catch (error: any) {
    console.error('Seed error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
