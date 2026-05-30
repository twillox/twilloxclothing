import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Papa from 'papaparse';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '../../utils/firebase';
import { Product, Category } from '../../types';
import { useToast } from '../../context/ToastContext';
import AdminLayout from '../../components/AdminLayout';
import CrateButton from '../../components/CrateButton';

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(0);
  const [salePrice, setSalePrice] = useState('');
  const [category, setCategory] = useState('');
  const [stock, setStock] = useState(0);
  const [imageUrls, setImageUrls] = useState<string[]>(['']);
  const [sizes, setSizes] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [tags, setTags] = useState('');

  const availableSizes = ['S', 'M', 'L', 'XL', '8', '9', '10', '11', 'ONE SIZE'];

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Categories
      const catSnap = await getDocs(collection(db, 'categories'));
      const catList: Category[] = [];
      catSnap.forEach((doc) => {
        catList.push(doc.data() as Category);
      });
      setCategories(catList);
      if (catList.length > 0) setCategory(catList[0].slug);

      // 2. Fetch Products
      const prodSnap = await getDocs(collection(db, 'products'));
      const prodList: Product[] = [];
      prodSnap.forEach((doc) => {
        prodList.push({ id: doc.id, ...doc.data() } as Product);
      });
      setProducts(prodList);
    } catch (e) {
      console.error("Firestore loading error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
    setEditProduct(null);
    setName('');
    setDescription('');
    setPrice(0);
    setSalePrice('');
    if (categories.length > 0) setCategory(categories[0].slug);
    setStock(0);
    setImageUrls(['']);
    setSizes([]);
    setColors([]);
    setTags('');
    setShowModal(true);
  };

  const openEditModal = (product: Product) => {
    setEditProduct(product);
    setName(product.name);
    setDescription(product.description);
    setPrice(product.price);
    setSalePrice(product.salePrice ? product.salePrice.toString() : '');
    setCategory(product.category);
    setStock(product.stock);
    setImageUrls(product.imageUrls.length > 0 ? product.imageUrls : ['']);
    setSizes(product.sizes);
    setColors(product.colors);
    setTags(product.tags.join(', '));
    setShowModal(true);
  };

  // Image URLs list builders
  const handleImageUrlChange = (index: number, val: string) => {
    const updated = [...imageUrls];
    updated[index] = val;
    setImageUrls(updated);
  };

  const addImageUrlInput = () => {
    setImageUrls([...imageUrls, '']);
  };

  const removeImageUrlInput = (index: number) => {
    if (imageUrls.length === 1) return;
    setImageUrls(imageUrls.filter((_, i) => i !== index));
  };

  // Sizes checkbox handlers
  const handleSizeCheckbox = (size: string) => {
    setSizes((prev) => 
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  // Submit operations
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !description || price <= 0 || !category) {
      toast.warning("Fields missing: Complete product credentials.");
      return;
    }

    // Clean image URLs (remove empty elements)
    const cleanedUrls = imageUrls.filter(url => url.trim() !== '');
    if (cleanedUrls.length === 0) {
      toast.warning("Verification failed: Enter at least one valid image URL.");
      return;
    }

    const cleanTags = tags.split(',').map(t => t.trim()).filter(t => t !== '');
    
    // Fallback colors if empty
    const cleanColors = colors.length > 0 ? colors : ['ONE COLOR'];

    const docPayload = {
      name,
      description,
      price: Number(price),
      salePrice: salePrice.trim() !== '' ? Number(salePrice) : null,
      category,
      stock: Number(stock),
      imageUrls: cleanedUrls,
      sizes: sizes.length > 0 ? sizes : ['ONE SIZE'],
      colors: cleanColors,
      tags: cleanTags,
      updatedAt: Timestamp.now()
    };

    try {
      if (editProduct) {
        // Edit product
        const prodRef = doc(db, 'products', editProduct.id);
        await updateDoc(prodRef, docPayload);
        
        toast.success(`Inventory node synchronized: ${name} edited.`);
      } else {
        // Create new product
        const newId = `prod-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Math.floor(Math.random() * 1000)}`;
        const prodRef = doc(db, 'products', newId);
        
        const createPayload = {
          ...docPayload,
          id: newId,
          rating: 5.0,
          reviewsCount: 0,
          createdAt: Timestamp.now()
        };

        await setDoc(prodRef, createPayload);
        toast.success(`Inventory node created successfully: ${name}.`);
      }
      
      setShowModal(false);
      await fetchData();
    } catch (e: any) {
      toast.error(`Transaction compile failed: ${e.message}`);
    }
  };

  const handleDelete = async (productId: string, productName: string) => {
    const confirm = window.confirm(`FORCE DELETE TRIGGER: Purge catalog node "${productName}"? This action is absolute.`);
    if (!confirm) return;

    try {
      await deleteDoc(doc(db, 'products', productId));
      toast.success("Inventory node successfully purged from database.");
      await fetchData();
    } catch (e: any) {
      toast.error(`Purging failed: ${e.message}`);
    }
  };

  // --- BULK CSV OPERATIONS ---

  const handleExportCSV = () => {
    if (products.length === 0) {
      toast.warning("No products to export.");
      return;
    }
    const csvData = products.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price,
      salePrice: p.salePrice || '',
      category: p.category,
      stock: p.stock,
      imageUrls: p.imageUrls.join('|'),
      sizes: p.sizes.join('|'),
      colors: p.colors.join('|'),
      tags: p.tags.join('|'),
    }));

    const csvString = Papa.unparse(csvData);
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `twillox_inventory_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV Export successful.");
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        setLoading(true);
        try {
          const rows = results.data as any[];
          const promises = rows.map(async (row) => {
            // Generate an ID if it's a new product, or use the existing ID
            const docId = row.id?.trim() || `prod-${row.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Math.floor(Math.random() * 1000)}`;
            
            const payload = {
              id: docId,
              name: row.name,
              description: row.description,
              price: Number(row.price),
              salePrice: row.salePrice ? Number(row.salePrice) : null,
              category: row.category,
              stock: Number(row.stock),
              imageUrls: row.imageUrls ? row.imageUrls.split('|').map((s: string) => s.trim()) : [],
              sizes: row.sizes ? row.sizes.split('|').map((s: string) => s.trim()) : ['ONE SIZE'],
              colors: row.colors ? row.colors.split('|').map((s: string) => s.trim()) : ['ONE COLOR'],
              tags: row.tags ? row.tags.split('|').map((s: string) => s.trim()) : [],
              createdAt: Timestamp.now(),
              updatedAt: Timestamp.now(),
              rating: 5.0,
              reviewsCount: 0
            };

            // We use setDoc with merge: true so it updates if exists, creates if not
            return setDoc(doc(db, 'products', docId), payload, { merge: true });
          });

          await Promise.all(promises);
          toast.success(`Successfully imported/updated ${rows.length} products.`);
        } catch (err: any) {
          toast.error(`Import failed: ${err.message}`);
        } finally {
          if (fileInputRef.current) fileInputRef.current.value = '';
          await fetchData();
        }
      },
      error: (err) => {
        toast.error(`CSV Parsing error: ${err.message}`);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    });
  };

  return (
    <>
      <Head>
        <title>INVENTORY COMMAND // TWILLOX</title>
      </Head>

      <div className="space-y-6">
        
        {/* Header */}
        <div className="mb-margin-safe border-b-4 border-concrete-gray pb-unit flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h2 className="text-headline-lg font-anton uppercase text-on-surface">INVENTORY COMMAND // CATALOG EDITORS</h2>
            <p className="text-label-mono font-mono text-xs text-danger-red mt-1">SECURITY ACCESS: ADMIN CRUD OVERRIDE</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <input 
              type="file" 
              accept=".csv" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleImportCSV} 
            />
            <CrateButton onClick={() => fileInputRef.current?.click()} variant="secondary" className="py-2 px-6 text-xs shrink-0 select-none">
              IMPORT_CSV
            </CrateButton>
            <CrateButton onClick={handleExportCSV} variant="secondary" className="py-2 px-6 text-xs shrink-0 select-none">
              EXPORT_CSV
            </CrateButton>
            <CrateButton onClick={openAddModal} variant="primary" className="py-2 px-6 text-xs shrink-0 select-none">
              ADD_NEW_PRODUCT
            </CrateButton>
          </div>
        </div>

        {/* Products Grid Table */}
        {loading ? (
          <div className="text-center py-20 font-mono text-xs text-on-surface-variant animate-pulse uppercase">
            SYNCHRONIZING CATALOG DATA STREAM...
          </div>
        ) : products.length > 0 ? (
          <div className="border-2 border-concrete-gray bg-surface-container overflow-x-auto relative">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="bg-matte-black border-b-2 border-concrete-gray text-secondary select-none">
                  <th className="p-3">IMAGE</th>
                  <th className="p-3">SKU ID</th>
                  <th className="p-3">NAME</th>
                  <th className="p-3">ZONE (CAT)</th>
                  <th className="p-3">VAL (PRICE)</th>
                  <th className="p-3">STOCK</th>
                  <th className="p-3 text-right">COMMANDS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-concrete-gray bg-surface-container">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-surface-container-high transition-colors">
                    <td className="p-3">
                      <div className="w-12 h-12 border border-concrete-gray bg-matte-black overflow-hidden select-none">
                        <img alt={p.name} src={p.imageUrls[0]} className="w-full h-full object-cover" />
                      </div>
                    </td>
                    <td className="p-3 font-bold truncate max-w-[120px]" title={p.id}>
                      {p.id.toUpperCase()}
                    </td>
                    <td className="p-3 uppercase font-bold text-on-surface">
                      {p.name}
                    </td>
                    <td className="p-3 uppercase text-on-surface-variant">
                      {p.category}
                    </td>
                    <td className="p-3 font-bold text-secondary">
                      ${p.salePrice || p.price} {p.salePrice && <span className="text-[9px] text-danger-red line-through font-normal">${p.price}</span>}
                    </td>
                    <td className={`p-3 font-bold ${p.stock < 5 ? 'text-danger-red' : 'text-on-surface'}`}>
                      {p.stock}
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(p)}
                        className="text-secondary hover:text-warning-yellow-dark font-bold font-mono"
                      >
                        [EDIT]
                      </button>
                      <button
                        onClick={() => handleDelete(p.id, p.name)}
                        className="text-danger-red hover:text-red-700 font-bold font-mono"
                      >
                        [PURGE]
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="border-4 border-dashed border-outline-variant p-20 text-center bg-surface-container max-w-xl mx-auto">
            <span className="material-symbols-outlined text-[64px] text-on-surface-variant/30 block mb-4">inventory</span>
            <h3 className="font-anton text-headline-lg uppercase text-on-surface mb-2">CATALOG DEPOT EMPTY</h3>
            <p className="font-mono text-xs text-on-surface-variant leading-relaxed max-w-sm mx-auto mb-8">
              No streetwear items registered in active database. Launch seed scripts or create custom nodes.
            </p>
            <CrateButton onClick={openAddModal} variant="primary" className="mx-auto text-xs py-2 px-8">
              ADD_NEW_PRODUCT
            </CrateButton>
          </div>
        )}

        {/* Dynamic ADD/EDIT Form Modal Overlay */}
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-matte-black/80 backdrop-blur-sm overflow-y-auto">
            <div className="w-full max-w-2xl bg-surface-container-high border-4 border-concrete-gray p-margin-safe relative shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] my-10 max-h-[85vh] overflow-y-auto">
              
              <div className="flex justify-between items-start border-b border-concrete-gray pb-3 mb-6">
                <div>
                  <h3 className="font-anton text-headline-md uppercase text-secondary">
                    {editProduct ? `EDIT_NODE: ${editProduct.name}` : 'CREATE_NEW_INVENTORY_NODE'}
                  </h3>
                  <p className="text-label-mono font-mono text-[9px] text-on-surface-variant tracking-wider uppercase mt-1">
                    Firestore inventory catalog compiler
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-on-surface-variant hover:text-danger-red font-mono text-sm uppercase px-1 border border-concrete-gray"
                >
                  [CLOSE]
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
                
                {/* Name & category */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-label-mono font-mono text-[9px] text-on-surface-variant block mb-1 uppercase">PRODUCT NAME</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-surface border-2 border-concrete-gray focus:border-warning-yellow p-3 text-xs text-on-surface rounded-none outline-none focus:ring-0"
                      placeholder="e.g. TACTICAL_SHELL..."
                    />
                  </div>
                  <div>
                    <label className="text-label-mono font-mono text-[9px] text-on-surface-variant block mb-1 uppercase">DATABASE ZONE (CATEGORY)</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-surface border-2 border-concrete-gray focus:border-warning-yellow p-3.5 text-xs text-on-surface rounded-none outline-none"
                    >
                      {categories.map((cat) => (
                        <option key={cat.slug} value={cat.slug}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="text-label-mono font-mono text-[9px] text-on-surface-variant block mb-1 uppercase">ITEM DESCRIPTION STRINGS</label>
                  <textarea
                    required
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-surface border-2 border-concrete-gray focus:border-warning-yellow p-3 text-xs text-on-surface rounded-none outline-none focus:ring-0 placeholder:text-on-surface-variant/40"
                    placeholder="ENTER SPECIFICATIONS DETIALS..."
                  />
                </div>

                {/* Pricing and stock details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-label-mono font-mono text-[9px] text-on-surface-variant block mb-1 uppercase">VALUATION (PRICE USD)</label>
                    <input
                      type="number"
                      required
                      value={price || ''}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      className="w-full bg-surface border-2 border-concrete-gray focus:border-warning-yellow p-3 text-xs text-on-surface rounded-none outline-none focus:ring-0"
                    />
                  </div>
                  <div>
                    <label className="text-label-mono font-mono text-[9px] text-on-surface-variant block mb-1 uppercase">SALE PRICE (OFFSET USD)</label>
                    <input
                      type="number"
                      value={salePrice}
                      onChange={(e) => setSalePrice(e.target.value)}
                      className="w-full bg-surface border-2 border-concrete-gray focus:border-warning-yellow p-3 text-xs text-on-surface rounded-none outline-none focus:ring-0"
                      placeholder="OPTIONAL..."
                    />
                  </div>
                  <div>
                    <label className="text-label-mono font-mono text-[9px] text-on-surface-variant block mb-1 uppercase">STOCK RATIO (QUANTITY)</label>
                    <input
                      type="number"
                      required
                      value={stock || ''}
                      onChange={(e) => setStock(Number(e.target.value))}
                      className="w-full bg-surface border-2 border-concrete-gray focus:border-warning-yellow p-3 text-xs text-on-surface rounded-none outline-none focus:ring-0"
                    />
                  </div>
                </div>

                {/* Multiple Image URLs */}
                <div>
                  <div className="flex justify-between items-baseline mb-1.5">
                    <label className="text-label-mono font-mono text-[9px] text-on-surface-variant uppercase">IMAGE URL INPUTS</label>
                    <button
                      type="button"
                      onClick={addImageUrlInput}
                      className="text-[9px] text-secondary hover:text-warning-yellow font-bold uppercase"
                    >
                      [+ ADD_URL]
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {imageUrls.map((url, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          required
                          value={url}
                          onChange={(e) => handleImageUrlChange(index, e.target.value)}
                          className="flex-1 bg-surface border-2 border-concrete-gray focus:border-warning-yellow p-2.5 text-xs text-on-surface rounded-none outline-none focus:ring-0"
                          placeholder="https://example.com/product-image.jpg"
                        />
                        <button
                          type="button"
                          disabled={imageUrls.length === 1}
                          onClick={() => removeImageUrlInput(index)}
                          className="px-3 border-2 border-concrete-gray hover:text-danger-red hover:border-danger-red text-xs disabled:opacity-30 disabled:hover:text-on-surface disabled:border-concrete-gray"
                        >
                          [PURGE]
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Gauges size check selections */}
                <div>
                  <label className="text-label-mono font-mono text-[9px] text-on-surface-variant block mb-2 uppercase">AVAILABLE GAUGES (SIZES)</label>
                  <div className="flex flex-wrap gap-3">
                    {availableSizes.map((sz) => {
                      const checked = sizes.includes(sz);
                      return (
                        <label key={sz} className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleSizeCheckbox(sz)}
                            className="w-4 h-4 rounded-none accent-warning-yellow border-concrete-gray cursor-pointer"
                          />
                          <span className={checked ? 'text-secondary font-bold font-mono' : 'text-on-surface-variant font-mono'}>
                            {sz}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Colors custom inputs */}
                <div>
                  <label className="text-label-mono font-mono text-[9px] text-on-surface-variant block mb-1 uppercase">COLOR SHADES (COMMA SEPARATED)</label>
                  <input
                    type="text"
                    value={colors.join(', ')}
                    onChange={(e) => setColors(e.target.value.split(',').map(s => s.trim()).filter(s => s !== ''))}
                    className="w-full bg-surface border-2 border-concrete-gray focus:border-warning-yellow p-3 text-xs text-on-surface rounded-none outline-none focus:ring-0"
                    placeholder="e.g. Void Black, Concrete Grey..."
                  />
                </div>

                {/* Tags custom inputs */}
                <div>
                  <label className="text-label-mono font-mono text-[9px] text-on-surface-variant block mb-1 uppercase">TAG LABELS (COMMA SEPARATED)</label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="w-full bg-surface border-2 border-concrete-gray focus:border-warning-yellow p-3 text-xs text-on-surface rounded-none outline-none focus:ring-0"
                    placeholder="e.g. NEW, LIMITED, HARDWARE..."
                  />
                </div>

                <div className="pt-4 border-t border-dashed border-concrete-gray">
                  <CrateButton
                    type="submit"
                    className="w-full py-3.5 text-sm"
                  >
                    {editProduct ? 'COMMIT_PRODUCT_SYNCS' : 'COMPILE_NEW_PRODUCT'}
                  </CrateButton>
                </div>

              </form>

            </div>
          </div>
        )}

      </div>
    </>
  );
}

AdminProducts.getLayout = (page: React.ReactElement) => <AdminLayout>{page}</AdminLayout>;
