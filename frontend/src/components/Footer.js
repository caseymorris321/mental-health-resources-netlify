import React from 'react';

const Footer = () => {
    const footerStyle = {
        fontSize: 'clamp(0.8rem, 2vw, 1rem)',
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100%',
        zIndex: 1000
    };
   
    const linkStyle = {
        color: '#CCE0FE',
        textDecoration: 'none',
    };

    return (
        <footer className="bg-lotus text-white text-center py-3 mt-4" style={footerStyle}>
            <div className="container">
                <span>© 2024 Lotus Resource Manager | </span>
                <span>Created by <a href="mailto:morricas@oregonstate.edu" style={linkStyle}>Casey Morris</a></span>
            </div>
        </footer>
    );
};

export default Footer;
