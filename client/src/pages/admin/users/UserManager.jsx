import React, { useState, useEffect } from 'react';
import { Search, Ban, Trash2 } from 'lucide-react';
import { userService } from '../../../services/api';

const UserManager = () => {
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const { data } = await userService.getAll();
            setUsers(data);
        } catch (error) {
            console.error("Failed to load users", error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            try {
                await userService.delete(id);
                setUsers(users.filter(u => u._id !== id));
            } catch (error) {
                console.error("Failed to delete user", error);
                alert("Failed to delete user");
            }
        }
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.phone.includes(searchTerm)
    );

    return (
        <div style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
            <header style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: '700' }}>Users</h1>
                <p style={{ color: '#868e96' }}>Manage detailed user profiles</p>
            </header>

            {/* Search */}
            <div style={{ marginBottom: '2rem', position: 'relative', maxWidth: '400px' }}>
                <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#868e96' }} />
                <input
                    type="text"
                    placeholder="Search by name or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 2.8rem', borderRadius: '12px', border: '1px solid #eee', outline: 'none' }}
                />
            </div>

            {/* List */}
            <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
                {filteredUsers.map((user, index) => (
                    <div key={user._id} style={{
                        padding: '1rem',
                        borderBottom: index < filteredUsers.length - 1 ? '1px solid #f1f3f5' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '1rem'
                    }}>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <div style={{
                                width: '40px', height: '40px', borderRadius: '50%',
                                background: '#f1f3f5', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: '600', color: '#1a1b1e'
                            }}>
                                {user.name?.charAt(0) || 'U'}
                            </div>
                            <div>
                                <div style={{ fontWeight: '600' }}>{user.name}</div>
                                <div style={{ fontSize: '0.85rem', color: '#868e96' }}>{user.phone} • {user.isAdmin ? 'Admin' : 'User'}</div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <button
                                onClick={() => handleDelete(user._id)}
                                style={{
                                    padding: '8px',
                                    borderRadius: '8px',
                                    background: '#fff5f5',
                                    color: '#ff6b6b'
                                }}
                                title="Delete User"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default UserManager;
