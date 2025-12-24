import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, GripVertical, Check, X } from 'lucide-react';
import { categoryService } from '../../../services/api';

const CategoryManager = () => {
    const [categories, setCategories] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');
    const [newCategoryName, setNewCategoryName] = useState('');

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            const { data } = await categoryService.getAll();
            setCategories(data);
        } catch (error) {
            console.error("Failed to load categories", error);
        }
    };

    const handleAdd = async () => {
        if (newCategoryName.trim()) {
            try {
                const { data } = await categoryService.create({ name: newCategoryName });
                setCategories([...categories, data]);
                setNewCategoryName('');
            } catch (error) {
                console.error("Failed to add category", error);
            }
        }
    };

    const startEdit = (cat) => {
        setEditingId(cat._id);
        setEditName(cat.name);
    };

    const saveEdit = async (id) => {
        try {
            const { data } = await categoryService.update(id, { name: editName });
            setCategories(categories.map(cat => cat._id === id ? data : cat));
            setEditingId(null);
        } catch (error) {
            console.error("Failed to update category", error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this category?')) {
            try {
                await categoryService.delete(id);
                setCategories(categories.filter(cat => cat._id !== id));
            } catch (error) {
                console.error("Failed to delete", error);
            }
        }
    };

    return (
        <div style={{ padding: '1.5rem', maxWidth: '800px', margin: '0 auto' }}>
            <header style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: '700' }}>Categories</h1>
                <p style={{ color: '#868e96' }}>Manage product categories</p>
            </header>

            {/* Add New */}
            <div style={{
                background: 'white',
                padding: '1.5rem',
                borderRadius: '16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                marginBottom: '2rem',
                display: 'flex',
                gap: '1rem',
                alignItems: 'center'
            }}>
                <input
                    placeholder="New Category Name"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    style={{
                        flex: 1,
                        padding: '0.8rem',
                        borderRadius: '12px',
                        border: '1px solid #eee',
                        outline: 'none',
                        background: '#f8f9fc'
                    }}
                />
                <button
                    onClick={handleAdd}
                    style={{
                        background: '#1a1b1e',
                        color: 'white',
                        padding: '0.8rem 1.5rem',
                        borderRadius: '12px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    <Plus size={20} />
                    <span>Add</span>
                </button>
            </div>

            {/* List */}
            <div style={{ display: 'grid', gap: '1rem' }}>
                {categories.map(cat => (
                    <div key={cat._id} style={{
                        background: 'white',
                        padding: '1rem',
                        borderRadius: '12px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem'
                    }}>
                        <div style={{ color: '#ced4da', cursor: 'grab' }}><GripVertical size={20} /></div>

                        {editingId === cat._id ? (
                            <div style={{ flex: 1, display: 'flex', gap: '0.5rem' }}>
                                <input
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', border: '1px solid #1a1b1e' }}
                                    autoFocus
                                />
                                <button onClick={() => saveEdit(cat._id)} style={{ color: '#10b981', padding: '4px' }}><Check size={20} /></button>
                                <button onClick={() => setEditingId(null)} style={{ color: '#ff6b6b', padding: '4px' }}><X size={20} /></button>
                            </div>
                        ) : (
                            <>
                                <div style={{ flex: 1, fontWeight: '500' }}>{cat.name}</div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button onClick={() => startEdit(cat)} style={{ padding: '8px', color: '#4dabf7', background: '#e7f5ff', borderRadius: '8px' }}>
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(cat._id)} style={{ padding: '8px', color: '#ff6b6b', background: '#fff5f5', borderRadius: '8px' }}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CategoryManager;
