import React from 'react';
import { Phone, CheckCircle, Package, ShieldCheck, Mail } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import './AboutUs.css';

const AboutUs = () => {
    const { storeName, storePhone, storeEmail } = useShop();

    return (
        <div className="page about-page">
            <header className="about-header">
                <h1>About {storeName}</h1>
            </header>

            <div className="about-hero">
                <h2>{storeName} - Curating Tomorrow's Requirements Today.</h2>
            </div>

            <div className="features-list">
                <div className="feature-item">
                    <div className="feature-icon"><Package size={24} /></div>
                    <div className="feature-text">
                        <h3>Fast Delivery</h3>
                        <p>We deliver quickly and safely right to your door.</p>
                    </div>
                </div>
                <div className="feature-item">
                    <div className="feature-icon"><CheckCircle size={24} /></div>
                    <div className="feature-text">
                        <h3>Quality Products</h3>
                        <p>100% authentic brands guaranteed.</p>
                    </div>
                </div>
                <div className="feature-item">
                    <div className="feature-icon"><ShieldCheck size={24} /></div>
                    <div className="feature-text">
                        <h3>Secure Payment</h3>
                        <p>Pay safely with Chapa, Telebirr, or CBE.</p>
                    </div>
                </div>
            </div>

            <div className="contact-card">
                <h3>Contact Us</h3>
                {storePhone && (
                    <div className="contact-row">
                        <Phone size={20} />
                        <span>{storePhone}</span>
                    </div>
                )}
                {storeEmail && (
                    <div className="contact-row" style={{ marginTop: '0.5rem' }}>
                        <Mail size={20} />
                        <span>{storeEmail}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AboutUs;
