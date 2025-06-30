import React from 'react';

const Header: React.FC = () => (
    <header
        style={{
            background: 'linear-gradient(90deg, #1e3c72 0%, #2a5298 100%)',
            color: '#fff',
            padding: '1.5rem 2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(30,60,114,0.08)',
        }}
    >
        <div style={{ display: 'flex', alignItems: 'center' }}>
            <img
                src="/logo.png"
                alt="LuxeIQ Logo"
                style={{ height: 40, marginRight: 16 }}
            />
            <h1 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0, letterSpacing: 1 }}>
                LuxeIQ Quote Calculator
            </h1>
        </div>
        <nav>
            {/* Add navigation links here if needed */}
        </nav>
    </header>
);

export default Header;