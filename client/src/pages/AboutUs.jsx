import React from 'react';
import { Phone, CheckCircle, Package, ShieldCheck } from 'lucide-react';
import './AboutUs.css';

const AboutUs = () => {
    return (
        <div className="page about-page">
            <header className="about-header">
                <h1>About Us</h1>
            </header>

            <div className="about-hero">
                <h2>Curating Tomorrow's Requirements Today.</h2>
            </div>

            <div className="features-list">
                <div className="feature-item">
                    <div className="feature-icon"><Package size={24} /></div>
                    <div className="feature-text">
                        <h3>Fast Delivery</h3>
                        <p>We deliver within 60 minutes across Addis.</p>
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
                <div className="contact-row">
                    <Phone size={20} />
                    <span>+251 911 234 567</span>
                </div>
                {/* Social Icons would go here */}
            </div>
        </div>
    );
};

export default AboutUs;
