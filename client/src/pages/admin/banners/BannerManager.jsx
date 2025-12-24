import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Image, X, Save, Upload } from 'lucide-react';
import { bannerService } from '../../../services/api';

const BannerManager = () => {
    const [banners, setBanners] = useState([]);
    const [isAdding, setIsAdding] = useState(false);
    const [newBanner, setNewBanner] = useState({ title: '', subtitle: '', image: '', active: true });
    const [selectedFile, setSelectedFile] = useState(null);

    useEffect(() => {
        loadBanners();
    }, []);

    const loadBanners = async () => {
        try {
            const { data } = await bannerService.getAll();
            setBanners(data);
        } catch (error) {
            console.error("Failed to load banners", error);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) setSelectedFile(file);
    };

    const handleSave = async () => {
        try {
            const formData = new FormData();
            formData.append('title', newBanner.title);
            formData.append('subtitle', newBanner.subtitle);
            formData.append('active', newBanner.active);
            formData.append('buttonText', newBanner.buttonText || 'Shop Now');
            formData.append('buttonLink', newBanner.buttonLink || '/products');
            if (selectedFile) {
                formData.append('image', selectedFile);
            } else if (newBanner.image) {
                formData.append('image', newBanner.image);
            }

            await bannerService.create(formData);
            setIsAdding(false);
            setNewBanner({ title: '', subtitle: '', image: '', active: true });
            setSelectedFile(null);
            loadBanners();
        } catch (error) {
            console.error("Failed to save banner", error);
            alert("Failed to save banner");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete banner?')) {
            try {
                await bannerService.delete(id);
                setBanners(banners.filter(b => b._id !== id));
            } catch (error) {
                console.error("Failed to delete", error);
            }
        }
    };

    return (
        <div style={{ padding: '1.5rem', maxWidth: '800px', margin: '0 auto' }}>
            <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: '700' }}>Banners</h1>
                    <p style={{ color: '#868e96' }}>Manage app banners</p>
                </div>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    style={{ background: '#1a1b1e', color: 'white', padding: '0.8rem 1.5rem', borderRadius: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    {isAdding ? <X size={20} /> : <Plus size={20} />}
                    <span>{isAdding ? 'Cancel' : 'Add New'}</span>
                </button>
            </header>

            {isAdding && (
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', marginBottom: '2rem', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ marginBottom: '1rem', fontWeight: '600' }}>New Banner</h3>
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        <input
                            placeholder="Title"
                            value={newBanner.title}
                            onChange={(e) => setNewBanner({ ...newBanner, title: e.target.value })}
                            style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid #eee' }}
                        />
                        <input
                            placeholder="Subtitle"
                            value={newBanner.subtitle}
                            onChange={(e) => setNewBanner({ ...newBanner, subtitle: e.target.value })}
                            style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid #eee' }}
                        />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <input
                                placeholder="Button Text (e.g. Shop Now)"
                                value={newBanner.buttonText || ''}
                                onChange={(e) => setNewBanner({ ...newBanner, buttonText: e.target.value })}
                                style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid #eee' }}
                            />
                            <input
                                placeholder="Button Link (e.g. /products/id)"
                                value={newBanner.buttonLink || ''}
                                onChange={(e) => setNewBanner({ ...newBanner, buttonLink: e.target.value })}
                                style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid #eee' }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <input type="file" onChange={handleFileChange} />
                            <span>OR</span>
                            <input
                                placeholder="Image URL"
                                value={newBanner.image}
                                onChange={(e) => setNewBanner({ ...newBanner, image: e.target.value })}
                                style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid #eee', flex: 1 }}
                            />
                        </div>
                        <button
                            onClick={handleSave}
                            style={{ background: '#10b981', color: 'white', padding: '0.8rem', borderRadius: '8px', fontWeight: '600', width: '100%' }}
                        >
                            Save Banner
                        </button>
                    </div>
                </div>
            )}

            <div style={{ display: 'grid', gap: '1.5rem' }}>
                {banners.map(banner => (
                    <div key={banner._id} style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                        <div style={{ height: '200px', width: '100%', position: 'relative' }}>
                            <img src={banner.image} alt="Banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)', display: 'flex', alignItems: 'flex-end', padding: '1.5rem' }}>
                                <div style={{ color: 'white' }}>
                                    <h3 style={{ fontSize: '1.5rem', fontWeight: '700' }}>{banner.title}</h3>
                                    <p>{banner.subtitle}</p>
                                </div>
                            </div>
                        </div>
                        <div style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <span style={{ padding: '4px 8px', background: banner.active ? '#e6fcf5' : '#f1f3f5', color: banner.active ? '#0ca678' : '#868e96', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600' }}>
                                    {banner.active ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            <button style={{ color: '#ff6b6b', padding: '8px' }} onClick={() => handleDelete(banner._id)}>
                                <Trash2 size={20} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BannerManager;
