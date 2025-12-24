import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Search, ShoppingBag, User, Info } from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import './Navbar.css';

const Navbar = () => {
    const { cart } = useShop();
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

    const navItems = [
        { name: 'Home', icon: <Home size={24} />, path: '/' },
        // Search is part of home in this design, but if user wants separate tab...
        // The design doc says "Nav Bar: Home | Search | Cart | ... "
        // But page spec says Home = Home+Search+Filter. 
        // Maybe 'Search' tab just focuses the search bar on Home? 
        // Or it's a dedicated search page. I'll make it a dedicated page or link to Home with state.
        // For now, let's follow the Nav Bar item list literally.
        { name: 'Search', icon: <Search size={24} />, path: '/search' },
        { name: 'Cart', icon: <ShoppingBag size={24} />, path: '/cart', badge: totalItems },
        { name: 'Profile', icon: <User size={24} />, path: '/profile' },
        { name: 'About', icon: <Info size={24} />, path: '/about' },
    ];

    return (
        <nav className="bottom-nav">
            {navItems.map((item) => (
                <NavLink
                    key={item.name}
                    to={item.path}
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                    <div className="icon-container">
                        {item.icon}
                        {item.badge > 0 && <span className="badge">{item.badge}</span>}
                    </div>
                    {/* <span className="label">{item.name}</span>  Optional text labels if space permits */}
                </NavLink>
            ))}
        </nav>
    );
};

export default Navbar;
