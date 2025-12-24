import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Edit2, Trash2, Filter } from 'lucide-react';
import { productService, categoryService } from '../../../services/api';

const ProductList = () => {
    const [products, setProducts] = useState([]); // Init empty
    const [categories, setCategories] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [prodRes, catRes] = await Promise.all([
                productService.getAll(),
                categoryService.getAll()
            ]);
            setProducts(prodRes.data);
            setCategories(catRes.data);
        } catch (error) {
            console.error("Failed to load products", error);
        }
    };

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'All' || product.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                await productService.delete(id);
                setProducts(products.filter(p => p._id !== id));
            } catch (error) {
                alert("Failed to delete product");
            }
        }
    };

    return (
        <div style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: '700' }}>Products</h1>
                    <p style={{ color: '#868e96' }}>Manage your inventory</p>
                </div>
                <Link
                    to="/admin/products/new"
                    style={{
                        background: '#1a1b1e',
                        color: 'white',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontWeight: '600'
                    }}
                >
                    <Plus size={20} />
                    <span className="btn-text-responsive">Add Product</span>
                </Link>
            </div>

            {/* Controls */}
            <div style={{
                display: 'flex',
                gap: '1rem',
                marginBottom: '2rem',
                flexWrap: 'wrap'
            }}>
                <div style={{
                    flex: 1,
                    minWidth: '200px',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center'
                }}>
                    <Search size={20} style={{ position: 'absolute', left: '1rem', color: '#868e96' }} />
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.8rem 1rem 0.8rem 2.8rem',
                            borderRadius: '12px',
                            border: '1px solid #eee',
                            outline: 'none',
                            fontSize: '0.95rem'
                        }}
                    />
                </div>

                <div style={{ position: 'relative', minWidth: '150px' }}>
                    <Filter size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#868e96' }} />
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.8rem 1rem 0.8rem 2.8rem',
                            borderRadius: '12px',
                            border: '1px solid #eee',
                            backgroundColor: 'white',
                            outline: 'none',
                            fontSize: '0.95rem',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="All">All Categories</option>
                        {categories.map(cat => (
                            <option key={cat._id} value={cat.name}>{cat.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Desktop Table View (Hidden on Mobile) */}
            <div className="desktop-table-container" style={{
                background: 'white',
                borderRadius: '16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                overflow: 'hidden',
                display: 'none'
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f8f9fc', borderBottom: '1px solid #eee' }}>
                        <tr>
                            <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', color: '#868e96', fontWeight: '600' }}>PRODUCT</th>
                            <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', color: '#868e96', fontWeight: '600' }}>CATEGORY</th>
                            <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', color: '#868e96', fontWeight: '600' }}>PRICE</th>
                            <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', color: '#868e96', fontWeight: '600' }}>STOCK</th>
                            <th style={{ padding: '1rem', textAlign: 'right', fontSize: '0.85rem', color: '#868e96', fontWeight: '600' }}>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProducts.map(product => (
                            <tr key={product._id} style={{ borderBottom: '1px solid #f1f3f5' }}>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <img
                                            src={product.image}
                                            alt={product.name}
                                            style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', background: '#f1f3f5' }}
                                        />
                                        <div>
                                            <div style={{ fontWeight: '500', color: '#1a1b1e' }}>{product.name}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#868e96' }}>{product.brand}</div>
                                        </div>
                                    </div>
                                </td>
                                <td style={{ padding: '1rem', color: '#495057' }}>{product.category}</td>
                                <td style={{ padding: '1rem', fontWeight: '500' }}>ETB {product.price}</td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{
                                        background: '#e6fcf5',
                                        color: '#0ca678',
                                        padding: '4px 8px',
                                        borderRadius: '6px',
                                        fontSize: '0.8rem',
                                        fontWeight: '500'
                                    }}>In Stock</span>
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                        <Link to={`/admin/products/edit/${product._id}`} style={{ padding: '6px', color: '#4dabf7' }}><Edit2 size={18} /></Link>
                                        <button onClick={() => handleDelete(product._id)} style={{ padding: '6px', color: '#ff6b6b' }}><Trash2 size={18} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="mobile-grid" style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr' }}>
                {filteredProducts.map(product => (
                    <div key={product._id} style={{
                        background: 'white',
                        borderRadius: '16px',
                        padding: '1rem',
                        display: 'flex',
                        gap: '1rem',
                        alignItems: 'center',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
                    }}>
                        <img
                            src={product.image}
                            alt={product.name}
                            style={{ width: '70px', height: '70px', borderRadius: '10px', objectFit: 'cover', background: '#f1f3f5' }}
                        />
                        <div style={{ flex: 1 }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '2px' }}>{product.name}</h3>
                            <p style={{ fontSize: '0.85rem', color: '#868e96', marginBottom: '4px' }}>{product.category}</p>
                            <div style={{ fontWeight: '600', color: '#1a1b1e' }}>ETB {product.price}</div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <button style={{ padding: '8px', color: '#4dabf7', background: '#e7f5ff', borderRadius: '8px' }}><Edit2 size={16} /></button>
                            <button onClick={() => handleDelete(product._id)} style={{ padding: '8px', color: '#ff6b6b', background: '#fff5f5', borderRadius: '8px' }}><Trash2 size={16} /></button>
                        </div>
                    </div>
                ))}
            </div>

            <style>{`
        @media (min-width: 768px) {
            .desktop-table-container { display: block !important; }
            .mobile-grid { display: none !important; }
        }
        .btn-text-responsive { display: none; }
        @media (min-width: 640px) {
            .btn-text-responsive { display: inline !important; }
        }
      `}</style>

        </div>
    );
};

export default ProductList;
