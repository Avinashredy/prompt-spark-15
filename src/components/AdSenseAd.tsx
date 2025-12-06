import { useEffect, useRef } from 'react';

interface AdSenseAdProps {
  adSlot: string;
  adFormat?: 'auto' | 'rectangle' | 'horizontal' | 'vertical';
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

const AdSenseAd = ({ adSlot, adFormat = 'auto', className = '' }: AdSenseAdProps) => {
  const adRef = useRef<HTMLDivElement>(null);
  const isLoaded = useRef(false);

  useEffect(() => {
    if (isLoaded.current) return;
    
    try {
      if (typeof window !== 'undefined') {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        isLoaded.current = true;
      }
    } catch (error) {
      console.error('AdSense error:', error);
    }
  }, []);

  return (
    <div ref={adRef} className={`adsense-container ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-XXXXXXXXXX" // Replace with your AdSense publisher ID
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive="true"
      />
    </div>
  );
};

export default AdSenseAd;
