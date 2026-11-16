import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Upload, AlertCircle } from 'lucide-react';
import { productService, categoryService } from '../../../services/api';

const ProductForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = Boolean(id);
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        brand: '',
        category: '',
        price: '',
        originalPrice: '',
        costPrice: '',
        stock: '0',
        minStockLevel: '5',
        sku: '',
        supplier: '',
        description: '',
        image: '',
        isActive: true
    });
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');

    useEffect(() => {
        loadData();
    }, [id, isEditMode]);

    const loadData = async () => {
        try {
            // Load Categories
            const catRes = await categoryService.getAll();
            setCategories(catRes.data);
            if (catRes.data.length > 0 && !isEditMode) {
                setFormData(prev => ({ ...prev, category: catRes.data[0].name }));
            }

            // Load Product if Edit
            if (isEditMode) {
                const prodRes = await productService.getById(id);
                const product = prodRes.data;
                setFormData({
                    name: product.name,
                    brand: product.brand,
                    category: product.category,
                    price: product.price,
                    originalPrice: product.originalPrice || '',
                    costPrice: product.costPrice || '',
                    stock: (product.stockQuantity !== undefined ? product.stockQuantity : 0).toString(),
                    minStockLevel: (product.minStockLevel || 5).toString(),
                    sku: product.sku || '',
                    supplier: product.supplier || '',
                    description: product.description,
                    image: product.image,
                    isActive: true
                });
                setPreviewUrl(product.image);
            }
        } catch (error) {
            console.error("Failed to load data", error);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const data = new FormData();
            data.append('name', formData.name);
            data.append('brand', formData.brand);
            data.append('category', formData.category);
            data.append('price', formData.price);
            data.append('originalPrice', formData.originalPrice);
            data.append('costPrice', formData.costPrice || 0);
            data.append('stockQuantity', formData.stock || 0);
            data.append('minStockLevel', formData.minStockLevel || 5);
            data.append('sku', formData.sku || '');
            data.append('supplier', formData.supplier || '');
            data.append('description', formData.description);

            if (selectedFile) {
                data.append('image', selectedFile);
            } else {
                data.append('image', formData.image);
            }

            if (isEditMode) {
                await productService.update(id, data);
            } else {
                await productService.create(data);
            }
            navigate('/admin/products');
        } catch (error) {
            console.error("Save failed", error);
            alert("Failed to save product: " + (error.response?.data?.message || error.message));
        } finally {
            setIsLoading(false);
        }
    };

    const margin = formData.price && formData.costPrice
        ? (((Number(formData.price) - Number(formData.costPrice)) / Number(formData.price)) * 100).toFixed(1)
        : null;

    return (
        <div style={{ padding: '1.5rem', maxWidth: '800px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button
                    onClick={() => navigate('/admin/products')}
                    style={{ padding: '8px', borderRadius: '8px', background: 'white', border: '1px solid #eee', cursor: 'pointer' }}
                >
                    <ArrowLeft size={20} />
                </button>
                <h1 style={{ fontSize: '1.5rem', fontWeight: '700' }}>
                    {isEditMode ? 'Edit Product' : 'Add New Product'}
                </h1>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.5rem' }}>
                {/* Main Info Card */}
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1.5rem' }}>Basic Information</h2>

                    <div style={{ display: 'grid', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#495057' }}>Product Name *</label>
                            <input
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                placeholder="e.g. Traditional Gondar Coffee Beans 1kg"
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #eee', background: '#f8f9fc' }}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#495057' }}>Brand *</label>
                                <input
                                    name="brand"
                                    value={formData.brand}
                                    onChange={handleChange}
                                    required
                                    placeholder="e.g. Local Roast"
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #eee', background: '#f8f9fc' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#495057' }}>Category *</label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    required
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #eee', background: '#f8f9fc' }}
                                >
                                    <option value="">Select Category</option>
                                    {categories.map(c => (
                                        <option key={c._id} value={c.name}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#495057' }}>SKU / Barcode</label>
                                <input
                                    name="sku"
                                    value={formData.sku}
                                    onChange={handleChange}
                                    placeholder="e.g. GOND-CF-001"
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #eee', background: '#f8f9fc' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#495057' }}>Supplier Name</label>
                                <input
                                    name="supplier"
                                    value={formData.supplier}
                                    onChange={handleChange}
                                    placeholder="e.g. Amhara Agricultural Coop"
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #eee', background: '#f8f9fc' }}
                                />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#495057' }}>Description *</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                required
                                rows={4}
                                placeholder="Describe product details, origin, package size..."
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #eee', background: '#f8f9fc', fontFamily: 'inherit' }}
                            />
                        </div>
                    </div>
                </div>

                {/* Pricing & Capital Store Valuation */}
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: '600' }}>Pricing & Store Stock (Capital)</h2>
                        {margin !== null && (
                            <span style={{
                                padding: '4px 10px',
                                borderRadius: '8px',
                                fontSize: '0.85rem',
                                fontWeight: '600',
                                background: Number(margin) >= 20 ? '#e6fcf5' : '#fff4e6',
                                color: Number(margin) >= 20 ? '#0ca678' : '#f76707'
                            }}>
                                Margin: {margin}%
                            </span>
                        )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#495057' }}>Selling Price (ETB) *</label>
                            <input
                                type="number"
                                name="price"
                                value={formData.price}
                                onChange={handleChange}
                                required
                                min="0"
                                step="any"
                                placeholder="Retail price"
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #eee', background: '#f8f9fc' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#495057' }}>Cost Price (ETB)</label>
                            <input
                                type="number"
                                name="costPrice"
                                value={formData.costPrice}
                                onChange={handleChange}
                                min="0"
                                step="any"
                                placeholder="What store paid"
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #eee', background: '#f8f9fc' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#495057' }}>Original Price (Optional)</label>
                            <input
                                type="number"
                                name="originalPrice"
                                value={formData.originalPrice}
                                onChange={handleChange}
                                min="0"
                                step="any"
                                placeholder="Before discount"
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #eee', background: '#f8f9fc' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#495057' }}>Initial Stock Qty</label>
                            <input
                                type="number"
                                name="stock"
                                value={formData.stock}
                                onChange={handleChange}
                                min="0"
                                placeholder="Count in stock"
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #eee', background: '#f8f9fc' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#495057' }}>Min Stock Alert Level</label>
                            <input
                                type="number"
                                name="minStockLevel"
                                value={formData.minStockLevel}
                                onChange={handleChange}
                                min="1"
                                placeholder="Default 5"
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #eee', background: '#f8f9fc' }}
                            />
                        </div>
                    </div>
                </div>

                {/* Image */}
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1.5rem' }}>Product Media</h2>

                    <div style={{ display: 'grid', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#495057' }}>Upload Image</label>
                            <div style={{ border: '2px dashed #eee', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    style={{ display: 'none' }}
                                    id="file-upload"
                                />
                                <label htmlFor="file-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                                    <Upload size={24} color="#868e96" />
                                    <span style={{ color: '#4dabf7' }}>Click to upload image</span>
                                </label>
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#495057' }}>Or Image URL</label>
                            <input
                                name="image"
                                value={formData.image}
                                onChange={handleChange}
                                placeholder="https://..."
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #eee', background: '#f8f9fc' }}
                            />
                        </div>

                        {previewUrl && (
                            <div style={{
                                width: '100%',
                                height: '200px',
                                borderRadius: '12px',
                                overflow: 'hidden',
                                border: '1px solid #eee'
                            }}>
                                <img
                                    src={previewUrl}
                                    alt="Preview"
                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={isLoading}
                    style={{
                        background: '#1a1b1e',
                        color: 'white',
                        padding: '1rem',
                        borderRadius: '12px',
                        border: 'none',
                        fontSize: '1rem',
                        fontWeight: '600',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                >
                    <Save size={20} />
                    <span>{isLoading ? 'Saving Product...' : (isEditMode ? 'Update Product' : 'Create Product')}</span>
                </button>
            </form>
        </div>
    );
};

export default ProductForm;
