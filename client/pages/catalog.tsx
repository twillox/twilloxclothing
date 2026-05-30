import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { Product, Category } from '../types';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function Catalog() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSize, setSelectedSize] = useState('all');
  const [priceRange, setPriceRange] = useState<number>(500);
  const [sortBy, setSortBy] = useState('newest');

  const { toggleWishlist, isInWishlist, addToCart } = useCart();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (router.isReady) {
      const { category, sort } = router.query;
      if (category && typeof category === 'string') setSelectedCategory(category);
      if (sort && typeof sort === 'string') setSortBy(sort);
    }
  }, [router.isReady, router.query]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const catRef = collection(db, 'categories');
        const catSnap = await getDocs(query(catRef, orderBy('name', 'asc')));
        const catList: Category[] = [];
        catSnap.forEach((doc) => catList.push(doc.data() as Category));
        setCategories(catList);

        const prodRef = collection(db, 'products');
        const prodSnap = await getDocs(prodRef);
        const prodList: Product[] = [];
        prodSnap.forEach((doc) => prodList.push({ id: doc.id, ...doc.data() } as Product));
        setProducts(prodList);
        setFilteredProducts(prodList);
      } catch (e) {
        console.error('Firestore loading error:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    let result = [...products];
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (p) => p.name.toLowerCase().includes(term) || p.description.toLowerCase().includes(term) || p.tags.some((t) => t.toLowerCase().includes(term))
      );
    }
    if (selectedCategory !== 'all') {
      result = result.filter((p) => {
        // Handle matching category ID or slug
        const categoryObj = categories.find(c => c.slug === selectedCategory);
        if (categoryObj) {
          return p.category === categoryObj.id || p.category === categoryObj.name || p.category === categoryObj.slug;
        }
        return p.category === selectedCategory || p.category.toLowerCase() === selectedCategory.toLowerCase();
      });
    }
    if (selectedSize !== 'all') result = result.filter((p) => p.sizes.includes(selectedSize));
    result = result.filter((p) => (p.salePrice || p.price) <= priceRange);
    
    if (sortBy === 'newest') {
      result.sort((a, b) => {
        const timeA = a.createdAt?.toMillis() || 0;
        const timeB = b.createdAt?.toMillis() || 0;
        return timeB - timeA;
      });
    }
    else if (sortBy === 'price-low') result.sort((a, b) => (a.salePrice || a.price) - (b.salePrice || b.price));
    else if (sortBy === 'price-high') result.sort((a, b) => (b.salePrice || b.price) - (a.salePrice || a.price));
    
    setFilteredProducts(result);
  }, [products, searchTerm, selectedCategory, selectedSize, priceRange, sortBy, categories]);

  const allSizes = Array.from(new Set(products.flatMap((p) => p.sizes)));

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedSize('all');
    setPriceRange(500);
    setSortBy('newest');
  };

  return (
    <>
      <Head>
        <title>ALL DIVISIONS — TWILLOX</title>
        <meta name="description" content="Shop all Twillox divisions. Outerwear, Tops, Bottoms, Footwear." />
      </Head>

      <div className="min-h-screen bg-white pt-4 pb-20 border-b-8 border-black">
        <div className="px-4 md:px-12 py-6 md:py-12 max-w-[1440px] mx-auto border-b-4 border-black mb-6">
          <h1 className="font-anton text-4xl md:text-6xl lg:text-8xl text-black mb-2 md:mb-4 uppercase leading-none">THE STASH</h1>
          <p className="font-bold text-gray-500 uppercase tracking-widest text-[10px] md:text-xs max-w-lg">
            BROWSE EVERYTHING WE GOT. NO COMPROMISES.
          </p>
        </div>

        <div className="max-w-[1440px] mx-auto px-6 md:px-12">
          {/* Dynamic Category Tabs */}
          <div className="flex flex-wrap gap-4 mb-12">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-6 py-2 border-2 transition-all cursor-pointer font-bold uppercase tracking-widest text-sm ${
                selectedCategory === 'all'
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-black border-black hover:bg-gray-100'
              }`}
            >
              ALL
            </button>
            {categories.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => setSelectedCategory(cat.slug)}
                className={`px-6 py-2 border-2 transition-all cursor-pointer font-bold uppercase tracking-widest text-sm ${
                  selectedCategory === cat.slug
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-black border-black hover:bg-gray-100'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Search + Sort + Filter bar */}
          <div className="flex flex-col gap-3 mb-8 border-b-2 border-gray-200 pb-6">
            {/* Search */}
            <div className="flex bg-white border-2 border-black group">
              <div className="px-3 flex items-center justify-center border-r-2 border-black bg-surface-dim">
                <span className="material-symbols-outlined text-gray-400 group-focus-within:text-black transition-colors">search</span>
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="SEARCH INVENTORY..."
                className="w-full bg-transparent px-3 py-3 outline-none font-bold text-[10px] md:text-xs uppercase tracking-widest placeholder:text-gray-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Sort */}
              <div className="relative border-2 border-black bg-white">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full appearance-none bg-transparent px-3 py-3 outline-none font-bold text-[10px] uppercase tracking-widest cursor-pointer"
                >
                  <option value="newest">LATEST</option>
                  <option value="price-asc">LOW → HIGH</option>
                  <option value="price-desc">HIGH → LOW</option>
                </select>
                <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-black text-[18px]">expand_more</span>
              </div>

              {/* Filters toggle */}
              <button
                onClick={() => setFiltersOpen(!filtersOpen)}
                className="border-2 border-black bg-black text-white px-3 py-3 font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">tune</span> FILTERS
              </button>
            </div>
          </div>

          {/* Expanded filter panel */}
          <AnimatePresence>
            {filtersOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mb-12"
              >
                <div className="bg-surface-dim border-2 border-black p-8 grid grid-cols-1 md:grid-cols-3 gap-10 shadow-hard">
                  {/* Size filter */}
                  <div>
                    <label className="text-sm font-bold uppercase tracking-widest text-black block mb-4">SIZING</label>
                    <div className="flex flex-wrap gap-2">
                      {['all', ...allSizes].map((size) => (
                        <button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-2 transition-all cursor-pointer ${
                            selectedSize === size
                              ? 'bg-black text-white border-black'
                              : 'bg-white border-black text-black hover:bg-gray-100'
                          }`}
                        >
                          {size === 'all' ? 'ANY' : size}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Price range */}
                  <div>
                    <div className="flex justify-between mb-4">
                      <label className="text-sm font-bold uppercase tracking-widest text-black">MAX PRICE</label>
                      <span className="text-sm font-bold text-black">${priceRange}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1000"
                      step="50"
                      value={priceRange}
                      onChange={(e) => setPriceRange(Number(e.target.value))}
                      className="w-full accent-black h-2 bg-gray-300 rounded-none appearance-none outline-none"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-2 font-bold">
                      <span>$0</span><span>$1000</span>
                    </div>
                  </div>
                  {/* Reset */}
                  <div className="flex items-end justify-end">
                    <button
                      onClick={handleResetFilters}
                      className="text-sm font-bold uppercase tracking-widest border-b-2 border-black hover:text-gray-500 hover:border-gray-500 transition-colors pb-1 cursor-pointer"
                    >
                      RESET FILTERS
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results count */}
          <div className="flex justify-between items-end border-b-2 md:border-b-4 border-black pb-3 md:pb-4 mb-6 md:mb-8 mt-6 md:mt-0 px-4 md:px-0">
                <span className="font-bold text-black uppercase tracking-widest text-[10px] md:text-sm">SHOWING {filteredProducts.length} ITEMS</span>
          </div>

          {/* Product Grid */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[4/5] bg-gray-200 mb-4 border-2 border-gray-300" />
                  <div className="h-6 bg-gray-200 w-2/3 mb-2" />
                  <div className="h-4 bg-gray-200 w-1/3" />
                </div>
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 md:gap-x-8 md:gap-y-12">
              {filteredProducts.map((product, idx) => {
                const displayPrice = product.salePrice || product.price;
                const hasSale = !!product.salePrice;
                return (
                  <motion.article
                    key={product.id}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: (idx % 4) * 0.1 }}
                    className="group flex flex-col"
                  >
                    <Link href={`/product/${product.id}`} className="block relative overflow-hidden bg-surface-dim aspect-[4/5] mb-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-hover:translate-x-[-2px] group-hover:translate-y-[-2px] group-hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
                      <img
                        src={product.imageUrls[0]}
                        alt={product.name}
                        className={`absolute inset-0 w-full h-full object-cover mix-blend-multiply transition-transform duration-700 ease-out ${product.imageUrls[1] ? 'group-hover:opacity-0' : ''}`}
                      />
                      {product.imageUrls[1] && (
                        <img
                          src={product.imageUrls[1]}
                          alt={product.name + ' detail'}
                          className="absolute inset-0 w-full h-full object-cover mix-blend-multiply opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out"
                        />
                      )}
                      
                      {/* Sale Badge */}
                      {hasSale && (
                        <div className="absolute top-4 left-4 z-10">
                          <span className="bg-[#8B0000] text-white text-[10px] font-bold px-3 py-1.5 uppercase tracking-widest border border-black">
                            SALE
                          </span>
                        </div>
                      )}

                      {/* Wishlist */}
                      <button
                        onClick={(e) => { e.preventDefault(); toggleWishlist(product.id); }}
                        className="absolute bottom-4 right-4 w-10 h-10 bg-white border-2 border-black rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-black hover:text-white cursor-pointer z-10"
                      >
                        <span
                          className="material-symbols-outlined text-[20px] font-bold"
                          style={{ fontVariationSettings: `'FILL' ${isInWishlist(product.id) ? 1 : 0}` }}
                        >favorite</span>
                      </button>
                    </Link>

                    <div className="px-1 md:px-2">
                      <h2 className="font-anton text-lg md:text-2xl uppercase text-black mb-1 truncate leading-tight">{product.name}</h2>
                      <div className="flex items-center gap-2">
                        {hasSale && <span className="text-sm text-gray-500 line-through font-bold">${product.price}</span>}
                        <span className="text-lg font-bold text-black">${displayPrice}</span>
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          ) : (
            <div className="py-24 md:py-32 text-center border-4 border-black border-dashed mx-4 md:mx-0">
              <span className="material-symbols-outlined text-[48px] md:text-[64px] text-gray-300 font-bold block mb-4 md:mb-6">search_off</span>
              <h3 className="font-anton text-3xl md:text-4xl text-black mb-3 uppercase">NO MATCHES FOUND</h3>
              <p className="text-gray-500 text-sm font-bold uppercase tracking-widest mb-8 max-w-md mx-auto">
                COULDN'T FIND ANYTHING LIKE THAT. TRY CHANGING YOUR FILTERS.
              </p>
              <button
                onClick={handleResetFilters}
                className="bg-black text-white px-8 py-4 font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors cursor-pointer border-2 border-black"
              >
                CLEAR ALL FILTERS
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
