import React, { useEffect } from 'react';

const GoogleAd = ({ className = "" }) => {
    useEffect(() => {
        const scriptId = 'google-adsense-script';
        if (!document.getElementById(scriptId)) {
            const script = document.createElement('script');
            script.id = scriptId;
            script.async = true;
            script.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1357668949487642";
            script.crossOrigin = "anonymous";
            document.head.appendChild(script);
        }

        try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (e) {
            console.error("Adsbygoogle error", e);
        }

        return () => {
            const script = document.getElementById(scriptId);
            if (script) {
                script.remove();
            }
            // Remove any dynamically injected auto-ads containers if possible, 
            // though relying on AdSense URL settings is best practice.
        };
    }, []);

    return (
        <div className={`ad-container ${className}`} style={{ minHeight: '100px', width: '100%', display: 'flex', justifyContent: 'center', margin: '15px 0' }}>
            <ins className="adsbygoogle"
                style={{ display: 'block' }}
                data-ad-format="fluid"
                data-ad-layout-key="-fb+5w+4e-db+86"
                data-ad-client="ca-pub-1357668949487642"
                data-ad-slot="8298377826"></ins>
        </div>
    );
};

export default GoogleAd;
