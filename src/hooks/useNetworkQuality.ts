import { useState, useEffect, useCallback, useRef } from 'react';

export type NetworkQuality = 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';

interface NetworkQualityResult {
  quality: NetworkQuality;
  rtt: number | null;
  connectionType: string | null;
  downlink: number | null;
}

interface UseNetworkQualityReturn {
  quality: NetworkQuality;
  rtt: number | null;
  connectionType: string | null;
  downlink: number | null;
  isChecking: boolean;
  checkNetwork: () => Promise<NetworkQualityResult>;
  startMonitoring: () => void;
  stopMonitoring: () => void;
}

// STUN servers for testing
const STUN_SERVERS = [
  'stun:stun.l.google.com:19302',
  'stun:stun1.l.google.com:19302',
];

export function useNetworkQuality(): UseNetworkQualityReturn {
  const [quality, setQuality] = useState<NetworkQuality>('unknown');
  const [rtt, setRtt] = useState<number | null>(null);
  const [connectionType, setConnectionType] = useState<string | null>(null);
  const [downlink, setDownlink] = useState<number | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const monitoringRef = useRef<NodeJS.Timeout | null>(null);

  // Get network info from Navigator API
  const getNetworkInfo = useCallback(() => {
    const connection = (navigator as any).connection || 
                       (navigator as any).mozConnection || 
                       (navigator as any).webkitConnection;
    
    if (connection) {
      return {
        type: connection.effectiveType || connection.type || null,
        downlink: connection.downlink || null,
        rtt: connection.rtt || null,
      };
    }
    return { type: null, downlink: null, rtt: null };
  }, []);

  // Measure RTT using STUN server
  const measureStunRtt = useCallback(async (): Promise<number | null> => {
    return new Promise((resolve) => {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: STUN_SERVERS }]
      });

      const startTime = Date.now();
      let resolved = false;

      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          pc.close();
          resolve(null);
        }
      }, 5000);

      pc.onicecandidate = (event) => {
        if (event.candidate && event.candidate.type === 'srflx') {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            const rttValue = Date.now() - startTime;
            pc.close();
            resolve(rttValue);
          }
        }
      };

      pc.onicegatheringstatechange = () => {
        if (pc.iceGatheringState === 'complete' && !resolved) {
          resolved = true;
          clearTimeout(timeout);
          const rttValue = Date.now() - startTime;
          pc.close();
          resolve(rttValue);
        }
      };

      // Create data channel to trigger ICE gathering
      pc.createDataChannel('test');
      pc.createOffer()
        .then(offer => pc.setLocalDescription(offer))
        .catch(() => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            pc.close();
            resolve(null);
          }
        });
    });
  }, []);

  // Calculate quality based on metrics
  const calculateQuality = useCallback((
    measuredRtt: number | null,
    networkType: string | null,
    networkDownlink: number | null
  ): NetworkQuality => {
    // If we have RTT measurement, use it as primary indicator
    if (measuredRtt !== null) {
      if (measuredRtt < 100) return 'excellent';
      if (measuredRtt < 200) return 'good';
      if (measuredRtt < 400) return 'fair';
      return 'poor';
    }

    // Fallback to connection type
    if (networkType) {
      switch (networkType) {
        case '4g':
        case 'wifi':
          return 'excellent';
        case '3g':
          return 'fair';
        case '2g':
        case 'slow-2g':
          return 'poor';
        default:
          break;
      }
    }

    // Fallback to downlink
    if (networkDownlink !== null) {
      if (networkDownlink >= 5) return 'excellent';
      if (networkDownlink >= 2) return 'good';
      if (networkDownlink >= 0.5) return 'fair';
      return 'poor';
    }

    return 'unknown';
  }, []);

  // Main check function
  const checkNetwork = useCallback(async (): Promise<NetworkQualityResult> => {
    setIsChecking(true);
    
    try {
      // Get basic network info
      const networkInfo = getNetworkInfo();
      setConnectionType(networkInfo.type);
      setDownlink(networkInfo.downlink);

      // Measure actual RTT
      const measuredRtt = await measureStunRtt();
      setRtt(measuredRtt);

      // Calculate quality
      const networkQuality = calculateQuality(
        measuredRtt,
        networkInfo.type,
        networkInfo.downlink
      );
      setQuality(networkQuality);

      return {
        quality: networkQuality,
        rtt: measuredRtt,
        connectionType: networkInfo.type,
        downlink: networkInfo.downlink,
      };
    } finally {
      setIsChecking(false);
    }
  }, [getNetworkInfo, measureStunRtt, calculateQuality]);

  // Start continuous monitoring
  const startMonitoring = useCallback(() => {
    if (monitoringRef.current) return;
    
    // Initial check
    checkNetwork();
    
    // Check every 10 seconds
    monitoringRef.current = setInterval(() => {
      checkNetwork();
    }, 10000);
  }, [checkNetwork]);

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    if (monitoringRef.current) {
      clearInterval(monitoringRef.current);
      monitoringRef.current = null;
    }
  }, []);

  // Listen for network changes
  useEffect(() => {
    const connection = (navigator as any).connection || 
                       (navigator as any).mozConnection || 
                       (navigator as any).webkitConnection;
    
    const handleChange = () => {
      checkNetwork();
    };

    if (connection) {
      connection.addEventListener('change', handleChange);
      return () => connection.removeEventListener('change', handleChange);
    }
  }, [checkNetwork]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopMonitoring();
  }, [stopMonitoring]);

  return {
    quality,
    rtt,
    connectionType,
    downlink,
    isChecking,
    checkNetwork,
    startMonitoring,
    stopMonitoring,
  };
}
