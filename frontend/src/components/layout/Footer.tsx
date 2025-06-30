import React from "react";

const Footer: React.FC = () => (
    <footer style={{
        background: "#222",
        color: "#fff",
        padding: "1.5rem 0",
        textAlign: "center",
        fontSize: "1rem",
        marginTop: "auto"
    }}>
        <div>
            &copy; {new Date().getFullYear()} LexelQ Quote Calculator. All rights reserved.
        </div>
    </footer>
);

export default Footer;