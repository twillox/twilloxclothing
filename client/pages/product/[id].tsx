import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  addDoc,
  Timestamp,
  updateDoc
} from 'firebase/firestore';
import { db } from '../../utils/firebase';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { Product, Review } from '../../types';
import { motion } from 'framer-motion';

const StarRating = ({ rating, interactive = false, onChange }: { rating: number; interactive?: boolean; onChange?: (r: number) => void }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((i) => (
      <span
        key={i}
        onClick={() => interactive && onChange && onChange(i)}
        className={`material-symbols-outlined text-black ${interactive ? 'cursor-pointer text-[24px] hover:scale-110 transition-transform' : 'text-[18px]'}`}
        style={{ fontVariationSettings: `'FILL' ${i <= rating ? 1 : 0}` }}
      >star</span>
    ))}
  </div>
);

export default function ProductDetails() {
  const router = useRouter();
  const { id } = router.query;

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [qty, setQty] = useState(1);

  const [ratingInput, setRatingInput] = useState(5);
  const [commentInput, setCommentInput] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const { currentUser, userProfile } = useAuth();
  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const { toast } = useToast();

  const fetchProductData = async (productId: string) => {
    setLoading(true);
    try {
      const prodRef = doc(db, 'products', productId);
      const prodSnap = await getDoc(prodRef);
      if (!prodSnap.exists()) { setProduct(null); setLoading(false); return; }
      const prodData = { id: prodSnap.id, ...prodSnap.data() } as Product;
      setProduct(prodData);
      if (prodData.sizes.length > 0) setSelectedSize(prodData.sizes[0]);
      if (prodData.colors.length > 0) setSelectedColor(prodData.colors[0]);
      setActiveImageIdx(0);

      const relatedQuery = query(collection(db, 'products'), where('category', '==', prodData.category), where('__name__', '!=', productId));
      const relatedSnap = await getDocs(relatedQuery);
      const relatedList: Product[] = [];
      relatedSnap.forEach((d) => relatedList.push({ id: d.id, ...d.data() } as Product));
      setRelatedProducts(relatedList.slice(0, 4));

      const reviewsQuery = query(collection(db, 'reviews'), where('productId', '==', productId));
      const reviewsSnap = await getDocs(reviewsQuery);
      const reviewsList: Review[] = [];
      reviewsSnap.forEach((d) => reviewsList.push({ id: d.id, ...d.data() } as Review));
      setReviews(reviewsList.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()));
    } catch (e) {
      console.error('Error loading product:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (router.isReady && typeof id === 'string') fetchProductData(id);
  }, [id, router.isReady]);

  const handleAddToCart = () => {
    if (!product) return;
    if (product.sizes.length > 0 && !selectedSize) { toast.warning('SELECT A SIZE.'); return; }
    addToCart(product.id, qty, selectedSize || 'ONE SIZE', selectedColor || 'DEFAULT');
    toast.success(`${product.name} ADDED TO CART.`);
  };

  const handleBuyNow = () => {
    if (!product) return;
    if (product.sizes.length > 0 && !selectedSize) { toast.warning('SELECT A SIZE.'); return; }
    addToCart(product.id, qty, selectedSize || 'ONE SIZE', selectedColor || 'DEFAULT');
    router.push('/checkout');
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !currentUser) return;
    if (!commentInput.trim()) { toast.warning('REVIEW CANNOT BE EMPTY.'); return; }
    setSubmittingReview(true);
    try {
      const reviewDoc = {
        productId: product.id,
        userId: currentUser.uid,
        userName: userProfile?.displayName || 'Anonymous',
        rating: ratingInput,
        comment: commentInput,
        createdAt: Timestamp.now()
      };
      const docRef = await addDoc(collection(db, 'reviews'), reviewDoc);
      const newReview = { id: docRef.id, ...reviewDoc } as Review;
      setReviews((prev) => [newReview, ...prev]);
      const updatedReviews = [newReview, ...reviews];
      const avgRating = updatedReviews.reduce((acc, r) => acc + r.rating, 0) / updatedReviews.length;
      await updateDoc(doc(db, 'products', product.id), { rating: Number(avgRating.toFixed(1)), reviewsCount: updatedReviews.length });
      setProduct((prev) => prev ? { ...prev, rating: Number(avgRating.toFixed(1)), reviewsCount: updatedReviews.length } : null);
      setCommentInput('');
      toast.success('REVIEW SUBMITTED.');
    } catch {
      toast.error('SUBMISSION FAILED.');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          <div className="aspect-[4/5] bg-gray-200 animate-pulse border-4 border-black" />
          <div className="space-y-6 py-10">
            <div className="h-6 bg-gray-200 animate-pulse w-1/3" />
            <div className="h-16 bg-gray-200 animate-pulse w-2/3" />
            <div className="h-10 bg-gray-200 animate-pulse w-1/4" />
            <div className="h-40 bg-gray-200 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-24 md:py-32 text-center border-4 border-black border-dashed mt-20">
        <span className="material-symbols-outlined text-[48px] md:text-[64px] text-gray-300 font-bold block mb-4 md:mb-6">production_quantity_limits</span>
        <h2 className="font-anton text-3xl md:text-5xl text-black mb-3 md:mb-4 uppercase">PIECE UNAVAILABLE</h2>
        <p className="text-gray-500 text-sm mb-10 font-bold uppercase tracking-widest max-w-md mx-auto">This piece has been pulled from the archive or sold out permanently.</p>
        <Link href="/catalog">
          <button className="bg-black text-white px-10 py-4 font-bold uppercase tracking-widest cursor-pointer hover:bg-gray-800 transition-colors border-2 border-black">
            BACK TO THE STASH
          </button>
        </Link>
      </div>
    );
  }

  const hasSale = !!product.salePrice;

  return (
    <>
      <Head>
        <title>{product.name} — TWILLOX</title>
        <meta name="description" content={product.description} />
      </Head>

      <div className="bg-white min-h-screen pt-4 pb-20 border-b-8 border-black">
        <div className="max-w-[1440px] mx-auto px-6 md:px-12">

          {/* Breadcrumb */}
          <nav className="flex gap-2 text-xs font-bold uppercase tracking-widest text-gray-400 mb-12 items-center">
            <Link href="/" className="hover:text-black transition-colors">HOME</Link>
            <span>/</span>
            <Link href="/catalog" className="hover:text-black transition-colors">THE STASH</Link>
            <span>/</span>
            <Link href={`/catalog?category=${product.category}`} className="hover:text-black transition-colors">{product.category}</Link>
            <span>/</span>
            <span className="text-black truncate max-w-[200px]">{product.name}</span>
          </nav>

          {/* Main layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">

            {/* Left — Image Gallery */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className="relative bg-surface-dim aspect-[4/5] overflow-hidden border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <motion.img
                  key={activeImageIdx}
                  src={product.imageUrls[activeImageIdx]}
                  alt={product.name}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="w-full h-full object-cover mix-blend-multiply"
                />
                
                {/* Badges & Wishlist */}
                <div className="absolute top-6 left-6 flex flex-col gap-2 z-10">
                  {hasSale && (
                    <span className="bg-[#8B0000] text-white text-[10px] font-bold px-4 py-2 uppercase tracking-widest border border-black shadow-hard">
                      SALE
                    </span>
                  )}
                </div>
                <button
                  onClick={() => toggleWishlist(product.id)}
                  className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white flex items-center justify-center border-2 border-black hover:bg-black hover:text-white transition-colors shadow-hard cursor-pointer z-10"
                >
                  <span className="material-symbols-outlined text-[20px] font-bold" style={{ fontVariationSettings: `'FILL' ${isInWishlist(product.id) ? 1 : 0}` }}>favorite</span>
                </button>
              </div>
              
              {/* Thumbnails */}
              {product.imageUrls.length > 1 && (
                <div className="grid grid-cols-5 gap-4 mt-4">
                  {product.imageUrls.map((url, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImageIdx(i)}
                      className={`aspect-[4/5] bg-surface-dim border-2 transition-all cursor-pointer ${activeImageIdx === i ? 'border-black shadow-hard opacity-100 scale-[1.02]' : 'border-gray-300 opacity-60 hover:opacity-100 hover:border-black'}`}
                    >
                      <img src={url} alt="" className="w-full h-full object-cover mix-blend-multiply" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right — Product Info */}
            <div className="lg:col-span-5 flex flex-col lg:py-6">
              <h1 className="font-anton text-3xl md:text-5xl lg:text-7xl text-black mb-1 md:mb-2 uppercase leading-none">{product.name}</h1>
              <p className="font-bold uppercase tracking-widest text-xs md:text-sm text-gray-500 mb-6 md:mb-8">TWILLOX // {product.category}</p>

              {/* Price */}
              <div className="flex items-center gap-4 mb-8 bg-surface-dim p-4 border-l-8 border-black w-max">
                {hasSale ? (
                  <>
                    <span className="text-3xl text-gray-400 line-through font-bold">${product.price}</span>
                    <span className="text-4xl font-bold text-[#8B0000]">${product.salePrice}</span>
                  </>
                ) : (
                  <span className="text-4xl font-bold text-black">${product.price}</span>
                )}
              </div>

              {/* Description */}
              <div className="mb-10 bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <h4 className="font-bold uppercase tracking-widest text-black mb-2 text-xs border-b-2 border-black pb-2">THE DETAILS</h4>
                <p className="text-black font-bold uppercase text-sm leading-relaxed tracking-wider">{product.description}</p>
              </div>

              {/* Size selector */}
              {product.sizes.length > 0 && (
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-sm font-bold uppercase tracking-widest text-black">SIZE</label>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {product.sizes.map((s) => (
                      <button
                        key={s}
                        onClick={() => setSelectedSize(s)}
                        className={`min-w-[70px] px-4 py-3 text-sm font-bold uppercase tracking-widest border-2 transition-all cursor-pointer ${
                          selectedSize === s
                            ? 'bg-black text-white border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                            : 'bg-white border-black text-black hover:bg-gray-100'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Color selector */}
              {product.colors.length > 0 && (
                <div className="mb-10">
                  <label className="text-sm font-bold uppercase tracking-widest text-black block mb-4">
                    COLOR: <span className="text-gray-500 ml-2">{selectedColor || 'SELECT'}</span>
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {product.colors.map((c) => (
                      <button
                        key={c}
                        onClick={() => setSelectedColor(c)}
                        className={`px-6 py-3 text-sm font-bold uppercase tracking-widest border-2 transition-all cursor-pointer ${
                          selectedColor === c
                            ? 'bg-black text-white border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                            : 'bg-white border-black text-black hover:bg-gray-100'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* CTAs */}
              <div className="flex flex-col gap-4 mb-6 md:mb-10">
                <div className="flex gap-4">
                  <button 
                    onClick={handleAddToCart}
                    disabled={product.stock <= 0}
                    className="flex-1 bg-black text-white py-3 md:py-4 font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-colors cursor-pointer border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[6px] hover:translate-y-[6px] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {product.stock > 0 ? 'COP THIS' : 'SOLD OUT'}
                  </button>
                </div>
                
                <button
                  onClick={handleBuyNow}
                  className="w-full bg-white text-black py-3 md:py-4 font-bold uppercase tracking-widest hover:bg-gray-50 transition-colors cursor-pointer border-2 border-black"
                >
                  EXPRESS CHECKOUT
                </button>
              </div>

              {/* Trust badges */}
              <div className="space-y-3 md:space-y-4 pt-6 md:pt-8 border-t-4 border-black">
                <div className="flex items-center gap-3 text-xs md:text-sm font-bold uppercase tracking-widest text-black">
                  <span className="material-symbols-outlined text-[18px] md:text-[20px]">local_shipping</span> GLOBAL SHIPPING
                </div>
                <div className="flex items-center gap-3 text-xs md:text-sm font-bold uppercase tracking-widest text-black">
                  <span className="material-symbols-outlined text-[18px] md:text-[20px]">assignment_return</span> NO RETURNS
                </div>
                <div className="flex items-center gap-3 text-xs md:text-sm font-bold uppercase tracking-widest text-black">
                  <span className="material-symbols-outlined text-[18px] md:text-[20px]">verified</span> AUTHENTIC ONLY
                </div>
                <div className="flex items-center gap-3 text-xs md:text-sm font-bold uppercase tracking-widest text-black">
                  <span className="material-symbols-outlined text-[18px] md:text-[20px]">lock</span> SECURE VAULT
                </div>
              </div>
            </div>
          </div>

          {/* Reviews */}
          <section className="mt-12 md:mt-24 pt-8 md:pt-16 border-t-8 border-black">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 md:gap-16">

              {/* Write review */}
              <div className="lg:col-span-1">
                <h3 className="font-anton text-2xl md:text-4xl text-black mb-4 md:mb-8 uppercase">DROP A REVIEW</h3>
                {currentUser ? (
                  <form onSubmit={handleSubmitReview} className="space-y-6 p-6 border-4 border-black bg-white shadow-hard">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-widest text-black block mb-3">RATING</label>
                      <StarRating rating={ratingInput} interactive onChange={setRatingInput} />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-widest text-black block mb-3">YOUR TAKE</label>
                      <textarea
                        rows={4}
                        placeholder="ENTER LOG..."
                        value={commentInput}
                        onChange={(e) => setCommentInput(e.target.value)}
                        className="w-full bg-surface-dim border-2 border-black focus:border-black focus:bg-white p-4 text-sm font-bold uppercase text-black placeholder:text-gray-400 outline-none resize-none transition-colors"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="w-full bg-black text-white py-4 font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors disabled:opacity-50 cursor-pointer border-2 border-black"
                    >
                      {submittingReview ? 'POSTING...' : 'POST REVIEW'}
                    </button>
                  </form>
                ) : (
                  <div className="bg-surface-dim border-4 border-black p-6 md:p-12 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                    <p className="font-bold text-black uppercase tracking-widest text-xs md:text-sm mb-6">GOTTA SIGN IN TO DROP A REVIEW.</p>
                    <Link href="/auth">
                      <button className="bg-black text-white px-8 py-4 font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors cursor-pointer border-2 border-black">
                        SIGN IN
                      </button>
                    </Link>
                  </div>
                )}
              </div>

              {/* Reviews list */}
              <div className="lg:col-span-2 mt-8 lg:mt-0">
                <div className="flex items-end justify-between border-b-4 border-black pb-3 md:pb-4 mb-4 md:mb-8">
                  <h3 className="font-anton text-2xl md:text-4xl text-black uppercase">
                    REVIEWS
                  </h3>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-black uppercase text-xl">AVG: {(product.rating ?? 0).toFixed(1)}</span>
                    <StarRating rating={Math.round(product.rating ?? 0)} />
                  </div>
                </div>

                {reviews.length > 0 ? (
                  <div className="space-y-8">
                    {reviews.map((rev) => (
                      <div key={rev.id} className="p-6 border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <span className="text-lg font-bold uppercase text-black block">{rev.userName}</span>
                            <span className="text-xs font-bold uppercase tracking-widest text-gray-500">DROPPED: {rev.createdAt.toDate().toLocaleDateString()}</span>
                          </div>
                          <StarRating rating={rev.rating} />
                        </div>
                        <p className="text-sm font-bold uppercase text-black leading-relaxed tracking-wider">{rev.comment}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-16 text-center border-4 border-black border-dashed">
                    <p className="text-sm font-bold uppercase tracking-widest text-gray-500">NO ONE SAID NUN YET.</p>
                  </div>
                )}
              </div>

            </div>
          </section>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <section className="mt-16 md:mt-32 pt-8 md:pt-16 border-t-8 border-black">
              <div className="flex items-end justify-between mb-6 md:mb-12 border-b-4 border-black pb-3 md:pb-4">
                <h2 className="font-anton text-3xl md:text-5xl uppercase text-black leading-none">MORE LIKE<br/>THIS</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {relatedProducts.map((p) => (
                  <Link key={p.id} href={`/product/${p.id}`} className="group block text-left">
                    <div className="relative overflow-hidden bg-surface-dim aspect-[4/5] mb-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-hover:translate-x-[-2px] group-hover:translate-y-[-2px] group-hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
                      <img src={p.imageUrls[0]} alt={p.name} className="w-full h-full object-cover mix-blend-multiply" />
                    </div>
                    <h4 className="text-xl font-anton uppercase text-black mb-1 truncate">{p.name}</h4>
                    <p className="text-sm font-bold text-gray-500">${p.salePrice || p.price}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}

        </div>
      </div>
    </>
  );
}
