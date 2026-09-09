'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, ArrowDown, ArrowUp, Zap, RefreshCw, Server, ShieldCheck, Cpu, Wifi, ChevronDown, Signal, Globe } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, YAxis, AreaChart, Area } from 'recharts';

type TestStatus = 'idle' | 'ping' | 'download' | 'upload' | 'complete';

const SERVERS = [
  { id: 'eu-west', name: 'EU_WEST_01', location: 'London, UK', status: 'online', load: 45, url: 'https://dynamodb.eu-west-2.amazonaws.com' },
  { id: 'eu-central', name: 'EU_CENTRAL_01', location: 'Frankfurt, DE', status: 'online', load: 89, url: 'https://dynamodb.eu-central-1.amazonaws.com' },
  { id: 'us-east', name: 'US_EAST_01', location: 'New York, NY', status: 'online', load: 62, url: 'https://dynamodb.us-east-1.amazonaws.com' },
  { id: 'us-west', name: 'US_WEST_01', location: 'San Francisco, CA', status: 'online', load: 34, url: 'https://dynamodb.us-west-1.amazonaws.com' },
  { id: 'sa-east', name: 'SA_EAST_01', location: 'São Paulo, BR', status: 'online', load: 55, url: 'https://dynamodb.sa-east-1.amazonaws.com' },
  { id: 'ap-northeast', name: 'AP_NORTHEAST_01', location: 'Tokyo, JP', status: 'online', load: 42, url: 'https://dynamodb.ap-northeast-1.amazonaws.com' },
  { id: 'ap-southeast', name: 'AP_SOUTHEAST_01', location: 'Singapore, SG', status: 'online', load: 71, url: 'https://dynamodb.ap-southeast-1.amazonaws.com' },
  { id: 'oc-sydney', name: 'OC_SYDNEY_01', location: 'Sydney, AU', status: 'online', load: 28, url: 'https://dynamodb.ap-southeast-2.amazonaws.com' },
];

// --- Integrity Protection Hook ---
// This hook ensures the credit "Built by Alen Pepa" is present and visible.
// If tampered with, it disables the application functionality.
function useIntegrityCheck() {
  const [isCompromised, setIsCompromised] = useState(false);
  
  useEffect(() => {
    const checkIntegrity = () => {
      const creditElement = document.getElementById('architect-credit');
      
      if (!creditElement) {
        setIsCompromised(true);
        return;
      }

      // Check if visible
      const style = window.getComputedStyle(creditElement);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
        setIsCompromised(true);
        return;
      }

      // Check content
      const text = creditElement.innerText.toUpperCase();
      if (!text.includes('ALEN PEPA')) {
        setIsCompromised(true);
        return;
      }
    };

    // Initial check
    checkIntegrity();

    // Periodic check
    const interval = setInterval(checkIntegrity, 2000);

    // Mutation observer for immediate reaction
    const observer = new MutationObserver((mutations) => {
      checkIntegrity();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true
    });

    return () => {
      clearInterval(interval);
      observer.disconnect();
    };
  }, []);

  return isCompromised;
}

export default function SpeedTestPage() {
  const [status, setStatus] = useState<TestStatus>('idle');
  const [ping, setPing] = useState<number | null>(null);
  const [jitter, setJitter] = useState<number | null>(null);
  const [downloadSpeed, setDownloadSpeed] = useState<number>(0);
  const [uploadSpeed, setUploadSpeed] = useState<number>(0);
  const [maxDownloadSpeed, setMaxDownloadSpeed] = useState<number>(0);
  const [maxUploadSpeed, setMaxUploadSpeed] = useState<number>(0);
  const [totalDuration, setTotalDuration] = useState<number | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [chartData, setChartData] = useState<{ index: number; speed: number }[]>([]);
  const [pingData, setPingData] = useState<{ index: number; ping: number }[]>([]);
  const [networkType, setNetworkType] = useState<string>('DETECTING...');
  const [selectedServer, setSelectedServer] = useState(SERVERS[0]);
  const [isServerDropdownOpen, setIsServerDropdownOpen] = useState(false);
  const [serverLatencies, setServerLatencies] = useState<Record<string, number | string>>({});
  
  const audioCtxRef = useRef<AudioContext | null>(null);

  const isCompromised = useIntegrityCheck();

  const handleServerHover = async (serverId: string, force: boolean = false) => {
    if (serverLatencies[serverId] && serverLatencies[serverId] !== 'loading' && !force) return;
    
    setServerLatencies(prev => ({ ...prev, [serverId]: 'loading' }));
    
    const server = SERVERS.find(s => s.id === serverId);
    if (!server || !server.url) {
      setServerLatencies(prev => ({ ...prev, [serverId]: 'N/A' }));
      return;
    }

    try {
      const start = performance.now();
      await fetch(server.url, { mode: 'no-cors', cache: 'no-store' });
      const duration = Math.round(performance.now() - start);
      setServerLatencies(prev => ({ ...prev, [serverId]: duration }));
    } catch (e) {
      setServerLatencies(prev => ({ ...prev, [serverId]: 'ERR' }));
    }
  };

  const pingAllServers = (e: React.MouseEvent) => {
    e.stopPropagation();
    SERVERS.forEach(server => {
      if (server.status === 'online') {
        handleServerHover(server.id, true);
      }
    });
  };

  useEffect(() => {
    const updateNetworkInfo = () => {
      const nav = navigator as any;
      const conn = nav.connection || nav.mozConnection || nav.webkitConnection;
      if (conn) {
        let networkLabel = 'BROADBAND';
        
        if (conn.type === 'wifi') {
          networkLabel = conn.downlink >= 100 ? 'WIFI 6' : 'WIFI';
        } else if (conn.type === 'cellular' || conn.effectiveType) {
          let eff = conn.effectiveType ? conn.effectiveType.toUpperCase() : '';
          if ((eff === '4G' || conn.type === 'cellular') && conn.downlink >= 100) {
            networkLabel = '5G';
          } else if (eff) {
            networkLabel = eff;
          } else if (conn.type === 'cellular') {
            networkLabel = 'CELLULAR';
          }
        } else if (conn.type && conn.type !== 'unknown') {
          networkLabel = conn.type.toUpperCase();
        }
        
        setNetworkType(networkLabel);
      } else {
        setNetworkType('BROADBAND');
      }
    };

    updateNetworkInfo();
    
    const nav = navigator as any;
    const conn = nav.connection || nav.mozConnection || nav.webkitConnection;
    if (conn) {
      conn.addEventListener('change', updateNetworkInfo);
      return () => conn.removeEventListener('change', updateNetworkInfo);
    }
  }, []);

  const playCompletionSound = () => {
    try {
      if (!audioCtxRef.current) return;
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const playNote = (freq: number, startTime: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.value = freq;
        
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.15, startTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      const now = ctx.currentTime;
      playNote(523.25, now, 0.6); // C5
      playNote(659.25, now + 0.15, 0.8); // E5
    } catch (e) {
      console.error("Audio playback failed", e);
    }
  };
  
  // Refs for cancellation and data tracking
  const abortController = useRef<AbortController | null>(null);
  const chartDataRef = useRef<{ index: number; speed: number }[]>([]);

  const reset = () => {
    if (abortController.current) {
      abortController.current.abort();
      abortController.current = null;
    }
    setStatus('idle');
    setPing(null);
    setJitter(null);
    setDownloadSpeed(0);
    setUploadSpeed(0);
    setMaxDownloadSpeed(0);
    setMaxUploadSpeed(0);
    setTotalDuration(null);
    setProgress(0);
    setChartData([]);
    setPingData([]);
    chartDataRef.current = [];
  };

  const runPingTest = async (signal: AbortSignal) => {
    setStatus('ping');
    const pings: number[] = [];
    setPingData([]);
    
    for (let i = 0; i < 10; i++) {
      if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
      const start = performance.now();
      try {
        const serverUrl = selectedServer.url || `/api/ping?t=${Date.now()}`;
        await fetch(serverUrl, { mode: selectedServer.url ? 'no-cors' : 'cors', cache: 'no-store', signal });
        const end = performance.now();
        const duration = Math.round(end - start);
        pings.push(duration);
        setPingData(prev => [...prev, { index: i, ping: duration }]);
        setProgress((i + 1) / 10 * 100);
      } catch (e) {
        if (e instanceof Error && e.name === 'AbortError') throw e;
        console.error("Ping failed", e);
      }
      await new Promise(r => setTimeout(r, 100));
    }

    if (pings.length > 0) {
      const min = Math.min(...pings);
      const avg = pings.reduce((a, b) => a + b, 0) / pings.length;
      const jitterVal = pings.reduce((a, b) => a + Math.abs(b - avg), 0) / pings.length;
      
      setPing(min);
      setJitter(jitterVal);
    }
  };

  const runDownloadTest = async (signal: AbortSignal) => {
    setStatus('download');
    setProgress(0);
    setChartData([]);
    chartDataRef.current = [];
    
    const sizeMB = 20; 

    const startTime = performance.now();
    let loadedBytes = 0;
    let lastUpdate = startTime;

    const response = await fetch(`/api/download?size=${sizeMB}&t=${Date.now()}`, {
      signal
    });
    
    const reader = response.body?.getReader();
    if (!reader) throw new Error("No reader");

    const totalBytes = sizeMB * 1024 * 1024;

    while (true) {
      if (signal.aborted) {
        reader.cancel();
        throw new DOMException('Aborted', 'AbortError');
      }
      const { done, value } = await reader.read();
      if (done) break;
      
      loadedBytes += value.length;
      const now = performance.now();
      const duration = (now - startTime) / 1000;
      
      const instantSpeed = (loadedBytes * 8) / (duration * 1000 * 1000); // Mbps
      
      if (now - lastUpdate > 100) {
        setDownloadSpeed(instantSpeed);
        setMaxDownloadSpeed(prev => Math.max(prev, instantSpeed));
        setProgress((loadedBytes / totalBytes) * 100);
        
        chartDataRef.current.push({ index: chartDataRef.current.length, speed: instantSpeed });
        if (chartDataRef.current.length > 50) chartDataRef.current.shift();
        setChartData([...chartDataRef.current]);
        
        lastUpdate = now;
      }
    }
    
    const totalDuration = (performance.now() - startTime) / 1000;
    const finalSpeed = (loadedBytes * 8) / (totalDuration * 1000 * 1000);
    setDownloadSpeed(finalSpeed);
  };

  const runUploadTest = async (signal: AbortSignal) => {
    setStatus('upload');
    setProgress(0);
    setChartData([]);
    chartDataRef.current = [];

    const sizeMB = 10;
    const sizeBytes = sizeMB * 1024 * 1024;
    const buffer = new Uint8Array(sizeBytes);
    const blob = new Blob([buffer]);

    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      const abortHandler = () => {
        xhr.abort();
        reject(new DOMException('Aborted', 'AbortError'));
      };
      signal.addEventListener('abort', abortHandler);

      xhr.open('POST', `/api/upload?t=${Date.now()}`, true);
      
      const startTime = performance.now();
      let lastUpdate = startTime;

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const now = performance.now();
          const duration = (now - startTime) / 1000;
          const instantSpeed = (e.loaded * 8) / (duration * 1000 * 1000);

          if (now - lastUpdate > 100) {
            setUploadSpeed(instantSpeed);
            setMaxUploadSpeed(prev => Math.max(prev, instantSpeed));
            setProgress((e.loaded / e.total) * 100);
            
            chartDataRef.current.push({ index: chartDataRef.current.length, speed: instantSpeed });
            if (chartDataRef.current.length > 50) chartDataRef.current.shift();
            setChartData([...chartDataRef.current]);
            
            lastUpdate = now;
          }
        }
      };

      xhr.onload = () => {
        signal.removeEventListener('abort', abortHandler);
        const totalDuration = (performance.now() - startTime) / 1000;
        const finalSpeed = (sizeBytes * 8) / (totalDuration * 1000 * 1000);
        setUploadSpeed(finalSpeed);
        resolve();
      };

      xhr.onerror = (e) => {
        signal.removeEventListener('abort', abortHandler);
        reject(e);
      };
      xhr.send(blob);
    });
  };

  const startTest = async () => {
    if (isCompromised) {
      alert("System Integrity Error: Core architecture files modified. Restore original credits to function.");
      return;
    }
    if (status !== 'idle' && status !== 'complete') return;
    
    // Initialize AudioContext on user interaction to bypass autoplay restrictions
    if (!audioCtxRef.current) {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        audioCtxRef.current = new AudioContext();
      }
    }
    if (audioCtxRef.current?.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    
    reset();
    
    const abort = new AbortController();
    abortController.current = abort;
    const testStartTime = performance.now();

    try {
      await runPingTest(abort.signal);
      if (abort.signal.aborted) return;
      await runDownloadTest(abort.signal);
      if (abort.signal.aborted) return;
      await runUploadTest(abort.signal);
      if (abort.signal.aborted) return;
      
      const testEndTime = performance.now();
      setTotalDuration((testEndTime - testStartTime) / 1000);
      setStatus('complete');
      playCompletionSound();
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') {
        console.log("Test aborted");
      } else {
        console.error("Test failed", e);
      }
    }
  };

  if (isCompromised) {
    return (
      <div className="min-h-screen bg-black text-red-500 flex flex-col items-center justify-center font-mono p-4 text-center">
        <h1 className="text-4xl font-bold mb-4">SYSTEM LOCKDOWN</h1>
        <p className="max-w-md">CRITICAL ERROR: Unauthorized modification detected. The system architect credit has been removed or altered.</p>
        <p className="mt-4 text-sm text-gray-500">Error Code: INTEGRITY_VIOLATION_0x99</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#E6E6E6] text-[#1a1a1a] flex flex-col items-center justify-center p-4 md:p-8 font-sans selection:bg-[#00FF9D] selection:text-black">
      
      {/* Hardware Device Container */}
      <div className="hardware-card w-full max-w-5xl relative p-6 md:p-10 flex flex-col gap-8">
        
        {/* Physical Screws */}
        <div className="absolute top-4 left-4 w-3 h-3 rounded-full bg-[#222] border border-[#111] shadow-inner flex items-center justify-center">
          <div className="w-full h-[1px] bg-[#111] rotate-45" />
        </div>
        <div className="absolute top-4 right-4 w-3 h-3 rounded-full bg-[#222] border border-[#111] shadow-inner flex items-center justify-center">
          <div className="w-full h-[1px] bg-[#111] -rotate-45" />
        </div>
        <div className="absolute bottom-4 left-4 w-3 h-3 rounded-full bg-[#222] border border-[#111] shadow-inner flex items-center justify-center">
          <div className="w-full h-[1px] bg-[#111] rotate-12" />
        </div>
        <div className="absolute bottom-4 right-4 w-3 h-3 rounded-full bg-[#222] border border-[#111] shadow-inner flex items-center justify-center">
          <div className="w-full h-[1px] bg-[#111] -rotate-12" />
        </div>

        {/* Header */}
        <header className="flex justify-between items-end border-b-2 border-[#222] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#222] rounded flex items-center justify-center border border-[#333]">
              <Activity className="w-5 h-5 text-[#8E9299]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tighter uppercase font-mono text-white">NETGAUGE</h1>
              <div className="text-[10px] font-mono text-[#8E9299] uppercase tracking-widest">Diagnostic Instrument</div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2 text-[10px] font-mono text-[#8E9299] uppercase tracking-widest bg-[#0a0b0e] px-3 py-1 rounded border border-[#222]">
              <div className={`w-2 h-2 rounded-full ${status !== 'idle' && status !== 'complete' ? 'bg-[#FF4444] animate-pulse' : 'bg-[#00FF9D]'}`} />
              {status !== 'idle' && status !== 'complete' ? 'Active' : 'Standby'}
            </div>
            <div className="text-[10px] font-mono text-[#555]">MOD-X // V.2.0.5</div>
          </div>
        </header>

        {/* Main Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Stats & Controls */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Control Panel */}
            <div className="bg-[#1a1c23] border border-[#2a2d35] rounded-xl p-6 shadow-inner relative">
              <div className="text-[10px] font-mono text-[#8E9299] uppercase tracking-widest mb-4">Operation Control</div>
              
              <div className="flex gap-4">
                <button
                  onClick={startTest}
                  disabled={status !== 'idle' && status !== 'complete'}
                  className={`
                    flex-1 py-6 bg-[#222] border-2 ${status !== 'idle' && status !== 'complete' ? 'border-[#FF4444] text-[#FF4444]' : 'border-[#333] text-white hover:border-[#00FF9D] hover:text-[#00FF9D]'} 
                    font-mono font-bold tracking-widest uppercase transition-all duration-200
                    rounded-lg flex items-center justify-center gap-3 shadow-[0_4px_0_#111] active:shadow-[0_0px_0_#111] active:translate-y-1
                    disabled:opacity-80 disabled:cursor-not-allowed
                  `}
                >
                  <span className="flex items-center gap-2">
                    {status === 'idle' || status === 'complete' ? 'INITIATE SEQUENCE' : 'TEST IN PROGRESS'}
                    {status === 'idle' || status === 'complete' ? <Zap className="w-4 h-4" /> : <RefreshCw className="w-4 h-4 animate-spin" />}
                  </span>
                </button>

                <button
                  onClick={reset}
                  disabled={status === 'idle'}
                  className={`
                    px-6 py-6 bg-[#222] border-2 border-[#333] text-[#8E9299] hover:border-[#FF4444] hover:text-[#FF4444]
                    font-mono font-bold tracking-widest uppercase transition-all duration-200
                    rounded-lg flex items-center justify-center shadow-[0_4px_0_#111] active:shadow-[0_0px_0_#111] active:translate-y-1
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                  title="Reset Test"
                >
                  RESET
                </button>
              </div>

              {/* Progress Track */}
              <div className="mt-6 h-2 bg-[#0a0b0e] rounded-full overflow-hidden border border-[#222]">
                <motion.div 
                  className={`h-full ${status !== 'idle' && status !== 'complete' ? 'bg-[#FF4444]' : 'bg-[#00FF9D]'}`}
                  initial={{ width: 0 }}
                  animate={{ width: status === 'idle' ? 0 : status === 'complete' ? '100%' : `${progress}%` }}
                />
              </div>
            </div>

            {/* Network Info */}
            <div className="bg-[#1a1c23] border border-[#2a2d35] rounded-xl p-6 shadow-inner flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-[#2a2d35] pb-4">
                <div className="flex items-center gap-3">
                  {networkType.includes('WIFI') ? (
                    <Wifi className="w-4 h-4 text-[#00FF9D]" />
                  ) : networkType.includes('G') || networkType === 'CELLULAR' ? (
                    <Signal className="w-4 h-4 text-[#FFB000]" />
                  ) : (
                    <Globe className="w-4 h-4 text-[#8E9299]" />
                  )}
                  <div>
                    <div className="text-[10px] font-mono text-[#8E9299] uppercase mb-1">Uplink</div>
                    <div className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded border inline-flex items-center justify-center ${
                      networkType.includes('WIFI') ? 'text-[#00FF9D] bg-[#00FF9D]/10 border-[#00FF9D]/20' :
                      networkType.includes('G') || networkType === 'CELLULAR' ? 'text-[#FFB000] bg-[#FFB000]/10 border-[#FFB000]/20' :
                      'text-white bg-[#222] border-[#333]'
                    }`}>
                      {networkType}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between relative">
                <div className="flex items-center gap-3">
                  <Server className="w-4 h-4 text-[#8E9299]" />
                  <div>
                    <div className="text-[10px] font-mono text-[#8E9299] uppercase">Node</div>
                    <div className="text-xs font-bold text-white">{selectedServer.name}</div>
                  </div>
                </div>
                <button 
                  onClick={() => status === 'idle' && setIsServerDropdownOpen(!isServerDropdownOpen)}
                  disabled={status !== 'idle'}
                  className="text-xs font-mono text-[#00FF9D] hover:text-white transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  CHANGE <ChevronDown className="w-3 h-3" />
                </button>

                {/* Server Dropdown */}
                <AnimatePresence>
                  {isServerDropdownOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full right-0 mt-2 w-64 bg-[#1a1c23] border border-[#2a2d35] rounded-xl shadow-2xl z-50 overflow-hidden"
                    >
                      <div className="p-2 text-[10px] font-mono text-[#8E9299] uppercase border-b border-[#2a2d35] flex items-center justify-between">
                        <span>Select Test Server</span>
                        <button 
                          onClick={pingAllServers}
                          className="text-[#00FF9D] hover:text-white transition-colors px-2 py-0.5 rounded bg-[#00FF9D]/10 hover:bg-[#00FF9D]/20"
                        >
                          Ping All
                        </button>
                      </div>
                      <div className="max-h-60 overflow-y-auto custom-scrollbar">
                        {SERVERS.map(server => (
                          <button
                            key={server.id}
                            onMouseEnter={() => {
                              if (server.status === 'online') {
                                handleServerHover(server.id);
                              }
                            }}
                            onClick={() => {
                              if (server.status === 'online') {
                                setSelectedServer(server);
                                setIsServerDropdownOpen(false);
                              }
                            }}
                            disabled={server.status !== 'online'}
                            className={`w-full text-left px-4 py-3 hover:bg-[#2a2d35] transition-colors flex items-center justify-between ${selectedServer.id === server.id ? 'bg-[#2a2d35] border-l-2 border-[#00FF9D]' : 'border-l-2 border-transparent'} ${server.status !== 'online' ? 'opacity-50 cursor-not-allowed hover:bg-transparent' : ''}`}
                          >
                            <div className="flex flex-col gap-1">
                              <span className="text-xs font-bold text-white font-mono flex items-center gap-2">
                                {server.name}
                                {server.status === 'online' ? (
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#00FF9D] animate-pulse" />
                                ) : (
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF4444]" />
                                )}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-[#8E9299] font-mono">{server.location}</span>
                                {serverLatencies[server.id] && server.status === 'online' && (
                                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                                    serverLatencies[server.id] === 'loading' ? 'text-[#8E9299] bg-[#222]' :
                                    typeof serverLatencies[server.id] === 'string' ? 'text-[#FF4444] bg-[#FF4444]/10' :
                                    (serverLatencies[server.id] as number) < 50 ? 'text-[#00FF9D] bg-[#00FF9D]/10' :
                                    (serverLatencies[server.id] as number) < 150 ? 'text-[#FFB000] bg-[#FFB000]/10' :
                                    'text-[#FF4444] bg-[#FF4444]/10'
                                  }`}>
                                    {serverLatencies[server.id] === 'loading' ? '...' : 
                                     typeof serverLatencies[server.id] === 'string' ? serverLatencies[server.id] : 
                                     `${serverLatencies[server.id]}ms`}
                                  </span>
                                )}
                              </div>
                            </div>
                            {server.status === 'online' && (
                              <div className="flex flex-col items-end gap-1">
                                <span className="text-[9px] font-mono text-[#8E9299]">LOAD</span>
                                <div className="w-8 h-1 bg-[#111] rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full ${server.load > 80 ? 'bg-[#FF4444]' : server.load > 50 ? 'bg-[#FFB000]' : 'bg-[#00FF9D]'}`}
                                    style={{ width: `${server.load}%` }}
                                  />
                                </div>
                              </div>
                            )}
                            {server.status !== 'online' && (
                              <span className="text-[9px] font-mono text-[#FF4444] uppercase tracking-wider">Maint</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Results Grid */}
            <div className={`grid ${status === 'complete' && totalDuration !== null ? 'grid-cols-3' : 'grid-cols-2'} gap-4`}>
              <StatBox label="PING" value={ping?.toFixed(0)} unit="ms" active={status === 'ping'} />
              <StatBox label="JITTER" value={jitter?.toFixed(0)} unit="ms" active={status === 'ping'} />
              {status === 'complete' && totalDuration !== null && (
                <StatBox label="DURATION" value={totalDuration.toFixed(1)} unit="s" active={false} />
              )}
            </div>

          </div>

          {/* Center/Right: Visualization */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* Main Screen Area */}
            <div className="hardware-screen relative min-h-[350px] flex flex-col items-center justify-center overflow-hidden p-6">
              {/* CRT Scanline Overlay */}
              <div className="absolute inset-0 pointer-events-none opacity-10" style={{ background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))', backgroundSize: '100% 4px, 6px 100%' }} />
              
              {/* Central Speed Display */}
              <div className="relative z-10 flex flex-col items-center w-full">
                <div className="flex justify-between w-full mb-4 px-8">
                  <div className="text-[10px] font-mono text-[#00FF9D] opacity-70">DATA_RATE</div>
                  <div className="text-[10px] font-mono text-[#00FF9D] opacity-70">
                    {status === 'download' ? 'RX_ACTIVE' : status === 'upload' ? 'TX_ACTIVE' : 'IDLE'}
                  </div>
                </div>

                <div className="flex items-baseline gap-4">
                  <motion.span 
                    key={status === 'download' ? downloadSpeed : status === 'upload' ? uploadSpeed : status}
                    initial={{ scale: 0.95, opacity: 0.8 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.1 }}
                    className="text-8xl md:text-9xl font-mono font-bold tracking-tighter text-[#00FF9D] drop-shadow-[0_0_8px_rgba(0,255,157,0.5)]"
                  >
                    {status === 'idle' ? '00.0' : 
                     status === 'ping' ? '---' :
                     status === 'download' ? downloadSpeed.toFixed(1) :
                     status === 'upload' ? uploadSpeed.toFixed(1) :
                     status === 'complete' ? downloadSpeed.toFixed(1) : '00.0'}
                  </motion.span>
                  <span className="text-2xl font-mono text-[#00FF9D] opacity-80 uppercase tracking-widest">Mbps</span>
                </div>

                <div className="flex items-center gap-8 mt-8">
                  <div className={`flex items-center gap-2 ${status === 'download' ? 'text-[#00FF9D]' : 'text-[#333]'}`}>
                    <ArrowDown className="w-6 h-6" />
                    <span className="font-mono font-bold">DOWN</span>
                  </div>
                  <div className={`flex items-center gap-2 ${status === 'upload' ? 'text-[#00FF9D]' : 'text-[#333]'}`}>
                    <ArrowUp className="w-6 h-6" />
                    <span className="font-mono font-bold">UP</span>
                  </div>
                </div>
              </div>

              {/* Live Graph */}
              <div className="absolute bottom-0 left-0 w-full h-24 opacity-50 pointer-events-none border-t border-[#00FF9D]/20">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <Area 
                      type="step" 
                      dataKey="speed" 
                      stroke="#00FF9D" 
                      fillOpacity={0.2} 
                      fill="#00FF9D" 
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Ping Graph */}
            <div className="hardware-screen p-4 flex flex-col h-40 relative overflow-hidden">
              <div className="absolute inset-0 pointer-events-none opacity-10" style={{ background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))', backgroundSize: '100% 4px, 6px 100%' }} />
              <div className="flex items-center justify-between mb-2 relative z-10">
                <span className="text-[10px] font-mono text-[#00FF9D] opacity-70 uppercase">Latency History</span>
                {status === 'ping' && <div className="w-2 h-2 bg-[#00FF9D] rounded-full animate-pulse" />}
              </div>
              <div className="flex-1 w-full opacity-80 relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={pingData}>
                    <Line 
                      type="monotone" 
                      dataKey="ping" 
                      stroke="#00FF9D" 
                      strokeWidth={2}
                      dot={{ r: 2, fill: '#00FF9D' }}
                      isAnimationActive={false}
                    />
                    <YAxis hide domain={[0, 'auto']} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Maximum Speeds Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="hardware-screen p-4 flex flex-col justify-between h-32">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-[#00FF9D] opacity-70 uppercase">Max Download Speed</span>
                  {status === 'download' && <div className="w-2 h-2 bg-[#00FF9D] rounded-full animate-pulse" />}
                </div>
                <div className="text-3xl font-mono font-bold text-[#00FF9D] flex items-baseline">
                  <motion.span
                    key={maxDownloadSpeed}
                    initial={{ scale: 0.95, opacity: 0.8 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.1 }}
                  >
                    {maxDownloadSpeed > 0 ? maxDownloadSpeed.toFixed(1) : '--'}
                  </motion.span>
                  <span className="text-sm text-[#00FF9D] opacity-50 ml-2">Mbps</span>
                </div>
              </div>

              <div className="hardware-screen p-4 flex flex-col justify-between h-32">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-[#00FF9D] opacity-70 uppercase">Max Upload Speed</span>
                  {status === 'upload' && <div className="w-2 h-2 bg-[#00FF9D] rounded-full animate-pulse" />}
                </div>
                <div className="text-3xl font-mono font-bold text-[#00FF9D] flex items-baseline">
                  <motion.span
                    key={maxUploadSpeed}
                    initial={{ scale: 0.95, opacity: 0.8 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.1 }}
                  >
                    {maxUploadSpeed > 0 ? maxUploadSpeed.toFixed(1) : '--'}
                  </motion.span>
                  <span className="text-sm text-[#00FF9D] opacity-50 ml-2">Mbps</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Footer / Credits - PROTECTED ELEMENT */}
        <footer className="w-full mt-4 flex justify-between items-center border-t-2 border-[#222] pt-4">
          <div className="flex gap-2">
            <div className="w-4 h-1 bg-[#333]" />
            <div className="w-4 h-1 bg-[#333]" />
            <div className="w-4 h-1 bg-[#333]" />
          </div>
          
          {/* 
            CRITICAL: This element is monitored by the useIntegrityCheck hook.
            Removing or modifying this ID or content will trigger the system lockdown.
          */}
          <div 
            id="architect-credit" 
            className="flex items-center gap-2 text-[10px] font-mono text-[#8E9299] bg-[#1a1c23] px-3 py-1 rounded border border-[#2a2d35]"
          >
            <ShieldCheck className="w-3 h-3 text-[#8E9299]" />
            <span>ARCHITECT: <span className="text-white font-bold">ALEN PEPA</span></span>
          </div>
        </footer>

      </div>
    </main>
  );
}

function StatBox({ label, value, unit, active }: { label: string, value?: string, unit: string, active?: boolean }) {
  return (
    <div className={`bg-[#1a1c23] border ${active ? 'border-[#00FF9D]' : 'border-[#2a2d35]'} rounded-xl p-4 transition-all duration-300 shadow-inner`}>
      <div className="text-[10px] font-mono uppercase tracking-widest text-[#8E9299] mb-2">{label}</div>
      <div className="text-2xl font-mono font-bold text-white">
        {value || '--'} <span className="text-xs text-[#555]">{unit}</span>
      </div>
    </div>
  );
}
