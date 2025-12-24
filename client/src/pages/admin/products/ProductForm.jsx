import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Upload } from 'lucide-react';
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
        stock: '100',
        description: '',
        image: '', // URL string
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
                    stock: '100', // Backend doesn't have stock yet, keep mock or add later
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
            data.append('description', formData.description);
            // data.append('countInStock', formData.stock); // If added to backend

            if (selectedFile) {
                data.append('image', selectedFile);
            } else {
                data.append('image', formData.image); // Keep existing URL if no new file
            }

            if (isEditMode) {
                await productService.update(id, data);
            } else {
                await productService.create(data);
            }
            navigate('/admin/products');
        } catch (error) {
            console.error("Save failed", error);
            alert("Failed to save product");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ padding: '1.5rem', maxWidth: '800px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button
                    onClick={() => navigate('/admin/products')}
                    style={{ padding: '8px', borderRadius: '8px', background: 'white', border: '1px solid #eee' }}
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
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#495057' }}>Product Name</label>
                            <input
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #eee', background: '#f8f9fc' }}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#495057' }}>Brand</label>
                                <input
                                    name="brand"
                                    value={formData.brand}
                                    onChange={handleChange}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #eee', background: '#f8f9fc' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#495057' }}>Category</label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #eee', background: '#f8f9fc' }}
                                >
                                    <option value="">Select Category</option>
                                    {categories.map(c => (
                                        <option key={c._id} value={c.name}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#495057' }}>Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={4}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #eee', background: '#f8f9fc', fontFamily: 'inherit' }}
                            />
                        </div>
                    </div>
                </div>

                {/* Pricing & Inventory */}
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1.5rem' }}>Pricing & Inventory</h2>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#495057' }}>Price (ETB)</label>
                            <input
                                type="number"
                                name="price"
                                value={formData.price}
                                onChange={handleChange}
                                required
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
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #eee', background: '#f8f9fc' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#495057' }}>Stock Quantity</label>
                            <input
                                type="number"
                                name="stock"
                                value={formData.stock}
                                onChange={handleChange}
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
                                background: '#f8f9fc',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '1px dashed #ccc'
                            }}>
                                <img src={previewUrl} alt="Preview" style={{ height: '100%', objectFit: 'contain' }} />
                            </div>
                        )}
                    </div>
                </div>

                {/* Submit */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <button
                        type="button"
                        onClick={() => navigate('/admin/products')}
                        style={{ padding: '1rem 2rem', borderRadius: '12px', fontWeight: '600', color: '#868e96' }}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading}
                        style={{
                            background: '#1a1b1e',
                            color: 'white',
                            padding: '1rem 2rem',
                            borderRadius: '12px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            opacity: isLoading ? 0.7 : 1,
                            cursor: isLoading ? 'not-allowed' : 'pointer'
                        }}
                    >
                        <Save size={20} />
                        {isLoading ? 'Saving...' : 'Save Product'}
                    </button>
                </div>

            </form>
        </div>
    );
};

export default ProductForm;
