import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';

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
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (isLoaded.current) return;
    
    try {
      if (typeof window !== 'undefined' && window.adsbygoogle) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        isLoaded.current = true;
      } else {
        // AdSense script not loaded, show fallback
        setHasError(true);
      }
    } catch (error) {
      console.error('AdSense error:', error);
      setHasError(true);
    }
  }, []);

  // Fallback placeholder when ads fail to load
  if (hasError) {
    return (
      <Card className={`bg-muted/50 border-dashed ${className}`}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center text-muted-foreground">
            <p className="text-sm">Advertisement</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div ref={adRef} className={`adsense-container ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-4592764624232365"
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive="true"
      />
    </div>
  );
};

export default AdSenseAd;
