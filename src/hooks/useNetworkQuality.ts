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

// STUN servers for testing — 优先国内可达节点，避免在中国大陆因 GFW 干扰 Google STUN
// 而导致 RTT 误判（国内访问 Google STUN 普遍 300-800ms，但实际通话链路完全不同）
const STUN_SERVERS = [
  'stun:stun.miwifi.com',
  'stun:stun.qq.com:3478',
  'stun:stun.l.google.com:19302',
];

// 🔧 平台检测：Android / WebView 的 PeerConnection 本地启动开销显著高于桌面
// 实测：安卓 Chrome 80-200ms、微信 WebView 150-400ms、低端机/平板可达 500ms+
function detectPlatformOverhead(): { isAndroid: boolean; isWebView: boolean; overheadBudget: number } {
  if (typeof navigator === 'undefined') {
    return { isAndroid: false, isWebView: false, overheadBudget: 0 };
  }
  const ua = navigator.userAgent.toLowerCase();
  const isAndroid = /android|harmonyos/.test(ua);
  const isWebView = /micromessenger|miniprogram|mmwebsdk|mmw|; wv\)|version\/[\d.]+ chrome/.test(ua);
  // 安卓基础 150ms，WebView 再加 100ms（仅作为阈值放宽的参考，不直接相减）
  const overheadBudget = (isAndroid ? 150 : 0) + (isWebView ? 100 : 0);
  return { isAndroid, isWebView, overheadBudget };
}

export function useNetworkQuality(): UseNetworkQualityReturn {
  const [quality, setQuality] = useState<NetworkQuality>('unknown');
  const [rtt, setRtt] = useState<number | null>(null);
  const [connectionType, setConnectionType] = useState<string | null>(null);
  const [downlink, setDownlink] = useState<number | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const monitoringRef = useRef<NodeJS.Timeout | null>(null);
  const platformRef = useRef(detectPlatformOverhead());

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

  // 🔧 单次 STUN RTT 测量：在 setLocalDescription 完成后才开始计时
  // 这样可以剔除 createOffer/setLocalDescription/数据通道初始化等本地开销，
  // 接近真实的 STUN binding 往返时间
  const measureStunRttOnce = useCallback(async (): Promise<number | null> => {
    return new Promise((resolve) => {
      let pc: RTCPeerConnection;
      try {
        pc = new RTCPeerConnection({ iceServers: [{ urls: STUN_SERVERS }] });
      } catch {
        resolve(null);
        return;
      }

      let startTime = 0;
      let resolved = false;

      const finish = (value: number | null) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timeout);
        try { pc.close(); } catch {}
        resolve(value);
      };

      const timeout = setTimeout(() => finish(null), 4000);

      pc.onicecandidate = (event) => {
        if (event.candidate && event.candidate.type === 'srflx' && startTime > 0) {
          finish(Date.now() - startTime);
        }
      };

      pc.onicegatheringstatechange = () => {
        if (pc.iceGatheringState === 'complete' && startTime > 0) {
          finish(Date.now() - startTime);
        }
      };

      try { pc.createDataChannel('test'); } catch {}
      pc.createOffer()
        .then(offer => pc.setLocalDescription(offer))
        .then(() => {
          // ✅ 关键：本地描述设置完成后才开始计时
          // 此时 ICE agent 才会真正向 STUN 服务器发包
          startTime = Date.now();
        })
        .catch(() => finish(null));
    });
  }, []);

  // 🔧 多次采样取最小值，避免单次抖动导致误判（特别是安卓上）
  const measureStunRtt = useCallback(async (): Promise<number | null> => {
    const SAMPLES = 2;
    const results: number[] = [];
    for (let i = 0; i < SAMPLES; i++) {
      const r = await measureStunRttOnce();
      if (r !== null) results.push(r);
      // 两次采样之间稍作间隔，避免本地端口/缓存复用导致结果异常偏低
      if (i < SAMPLES - 1) await new Promise(r => setTimeout(r, 80));
    }
    if (results.length === 0) return null;
    return Math.min(...results);
  }, [measureStunRttOnce]);

  // Calculate quality based on metrics
  const calculateQuality = useCallback((
    measuredRtt: number | null,
    networkType: string | null,
    networkDownlink: number | null
  ): NetworkQuality => {
    // If we have RTT measurement, use it as primary indicator
    // 阈值已根据中国互联网现实放宽：家庭宽带/4G/5G 实测 STUN RTT 通常 200-400ms
    // 🔧 安卓 / WebView 再追加 overheadBudget 放宽，避免本地启动开销被误判为网络差
    if (measuredRtt !== null) {
      const budget = platformRef.current.overheadBudget;
      if (measuredRtt < 400 + budget) return 'excellent';
      if (measuredRtt < 800 + budget) return 'good';
      if (measuredRtt < 1500 + budget) return 'fair';
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

    // 测量与系统信息均不可得（如微信 WebView）：默认按良好处理，避免空报警
    return 'good';
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
