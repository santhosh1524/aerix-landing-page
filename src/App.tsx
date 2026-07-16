import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { motion, AnimatePresence } from 'motion/react';
import {
  Camera, Shield, Cpu, Wind, Navigation, Battery, Play, Send, Key,
  Wifi, AlertCircle, Compass, HardDrive, RotateCcw, Check, Sparkles,
  Maximize2, ArrowRight, Activity, Terminal
} from 'lucide-react';

// Definitions for Exploded View parts
interface ComponentPart {
  id: string;
  name: string;
  coords: { x: number; y: number };
  specs: string[];
  description: string;
  tag: string;
}

const DRONE_COMPONENTS: ComponentPart[] = [
  {
    id: 'ai-core',
    name: 'AERIX Core AI Brain',
    coords: { x: 50, y: 50 },
    tag: 'INTELLIGENCE',
    description: '120 TOPS neuromorphic processor running local obstacle avoidance, sensor-fusion, and mission path planning.',
    specs: ['120 TOPS Neural Compute', 'Local SLAAM mapping', 'AES-256 Secure Link']
  },
  {
    id: 'propulsion',
    name: 'Quantum-V Rotors & Motors',
    coords: { x: 20, y: 30 },
    tag: 'PROPULSION',
    description: 'High-torque brushless outrunner motors paired with ultra-silent, lightweight contra-rotating carbon propellers.',
    specs: ['Max Thrust: 12.8kg', 'SilentDrive PWM tech', 'IP67 dust & water sealed']
  },
  {
    id: 'lidar',
    name: 'OmniShield 360° LiDAR',
    coords: { x: 50, y: 20 },
    tag: 'PERCEPTION',
    description: 'Solid-state LiDAR module generating 1.2 million points/sec. Creates a real-time 3D collision envelope.',
    specs: ['Range: 220 meters', 'Accuracy: +/- 2mm', 'Active scanning sweep']
  },
  {
    id: 'camera',
    name: '8K Spectra Gimbal Payload',
    coords: { x: 50, y: 80 },
    tag: 'IMAGING',
    description: '3-axis stabilized electro-optical thermal camera. Features 8K video, 12x optical zoom, and night-vision capabilities.',
    specs: ['8K at 60 FPS Video', 'FLIR Boson Thermal Core', '12x Optical Continuous Zoom']
  },
  {
    id: 'chassis',
    name: 'Carbon-Fiber Monocoque Frame',
    coords: { x: 80, y: 45 },
    tag: 'STRUCTURE',
    description: 'Aerospace-grade woven carbon fiber shell. Engineered for extreme wind resistance and crush resistance.',
    specs: ['Weight: 420 grams', 'Wind resistance: 45 knots', 'Integrative heat sinks']
  }
];

export default function App() {
  // State for API keys and chat
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem('AERIX_GEMINI_KEY') || import.meta.env.GEMINI_API_KEY || '';
  });
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatLog, setChatLog] = useState<Array<{ sender: 'user' | 'system' | 'ai'; text: string }>>([
    { sender: 'system', text: 'AERIX Core Onboard AI v1.0.4 Online.' },
    { sender: 'system', text: 'Telemetry linked. Mission Planner ready.' }
  ]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Waypoints state for tactical map
  const [waypoints, setWaypoints] = useState<Array<{ id: number; x: number; y: number }>>([]);
  
  // Hover effect coordinates for 3D drone
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  // Active component selected in exploded view
  const [activeComponent, setActiveComponent] = useState<string>('ai-core');

  // Simulated telemetry logs
  const [telemetry, setTelemetry] = useState({
    altitude: 0,
    speed: 0,
    battery: 100,
    wind: 12.4,
    gps: '37.7749° N, 122.4194° W',
    satellites: 18,
    temp: 24.8
  });

  // Chart canvas ref
  const chartCanvasRef = useRef<HTMLCanvasElement>(null);

  // Handle local save of API key
  const handleSaveApiKey = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const key = data.get('api_key') as string;
    localStorage.setItem('AERIX_GEMINI_KEY', key);
    setApiKey(key);
    setShowKeyInput(false);
    setChatLog(prev => [...prev, { sender: 'system', text: `API key saved successfully (${key ? 'configured' : 'cleared'}).` }]);
  };

  // Live telemetry loop
  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetry(prev => {
        // Random slight updates to make it feel alive
        const speedDelta = (Math.random() - 0.5) * 1.5;
        const tempDelta = (Math.random() - 0.5) * 0.2;
        const newSpeed = Math.max(0, Math.min(75, prev.speed + speedDelta));
        
        return {
          ...prev,
          speed: parseFloat(newSpeed.toFixed(1)),
          temp: parseFloat((prev.temp + tempDelta).toFixed(1)),
          battery: Math.max(0, parseFloat((prev.battery - 0.01).toFixed(2)))
        };
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Telemetry chart draw
  useEffect(() => {
    const canvas = chartCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let offset = 0;
    const points: number[] = Array(30).fill(50);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update points based on simulated drone oscillations
      offset += 0.05;
      points.shift();
      points.push(50 + Math.sin(offset) * 20 + (Math.random() - 0.5) * 8);

      // Grid background
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.08)';
      ctx.lineWidth = 1;
      for (let i = 0; i < canvas.width; i += 20) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
      }
      for (let i = 0; i < canvas.height; i += 15) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
      }

      // Draw telemetry line
      ctx.beginPath();
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2.5;
      ctx.shadowBlur = 8;
      ctx.shadowColor = 'rgba(6, 182, 212, 0.5)';

      const step = canvas.width / (points.length - 1);
      points.forEach((pt, idx) => {
        const x = idx * step;
        const y = pt;
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      
      // Fill under area
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(6, 182, 212, 0.05)';
      ctx.lineTo(canvas.width, canvas.height);
      ctx.lineTo(0, canvas.height);
      ctx.closePath();
      ctx.fill();

      animationId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animationId);
  }, []);

  // Mouse hover event for Hero Drone tilting
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5; // range: -0.5 to 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5; // range: -0.5 to 0.5
    setMousePos({ x, y });
  };

  // Add waypoint on tactile grid
  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    
    if (waypoints.length >= 10) {
      setChatLog(prev => [...prev, { sender: 'system', text: 'Error: Maximum waypoint route queue full (Limit: 10).' }]);
      return;
    }

    const newWp = { id: waypoints.length + 1, x, y };
    const updated = [...waypoints, newWp];
    setWaypoints(updated);

    // Update simulated telemetry
    setTelemetry(prev => ({
      ...prev,
      altitude: 35,
      speed: 48.5
    }));

    setChatLog(prev => [
      ...prev,
      { sender: 'system', text: `Waypoint WP-${newWp.id} set at Grid Coordinate [X: ${x}, Y: ${y}].` }
    ]);
  };

  // Clear waypoints
  const clearWaypoints = () => {
    setWaypoints([]);
    setTelemetry(prev => ({ ...prev, altitude: 0, speed: 0 }));
    setChatLog(prev => [...prev, { sender: 'system', text: 'Tactical flight route cleared.' }]);
  };

  // Chat/Mission query submittal
  const handleSendChat = async (textToSend?: string) => {
    const msg = textToSend || chatInput;
    if (!msg.trim()) return;

    // Add user message
    setChatLog(prev => [...prev, { sender: 'user', text: msg }]);
    if (!textToSend) setChatInput('');
    setIsGenerating(true);

    try {
      if (!apiKey) {
        // Fallback simulated smart engine response
        setTimeout(() => {
          let responseText = '';
          if (msg.toLowerCase().includes('waypoint') || msg.toLowerCase().includes('mission') || msg.toLowerCase().includes('flight')) {
            const count = waypoints.length;
            if (count === 0) {
              responseText = `[SIMULATION ENGINE] Mission query received. No active waypoint route loaded on grid map. Click waypoints on the tactical map grid to compile flight routes.`;
            } else {
              responseText = `[SIMULATION ENGINE] Analyzing tactical grid mission path:\n- Waypoints: ${waypoints.map(w => `WP-${w.id}(${w.x}, ${w.y})`).join(' ➜ ')}\n- Estimated Flight Path Distance: ${(count * 1.8).toFixed(2)} km\n- Battery Discharge Rate: ~${(count * 4.2).toFixed(1)}%\n- Wind Vector: Wind velocity is ${telemetry.wind} knots. Turbulence index low.\n- Clearances: Autonomous LiDAR scanning verified 100% elevation clearances.\nTakeoff state: Ready.`;
            }
          } else if (msg.toLowerCase().includes('status') || msg.toLowerCase().includes('diagnostic')) {
            responseText = `[SIMULATION ENGINE] Telemetry Diagnostics Report:\n- CPU Temp: ${telemetry.temp}°C\n- Satellite Link: ${telemetry.satellites} GPS locks (Active)\n- Battery Level: ${telemetry.battery}%\n- Propulsion Core: Rotor voltage nominal, motors operating at 0 RPM.\n- Obstacle Radar: Solid state LiDAR online. All systems nominal.`;
          } else {
            responseText = `[SIMULATION ENGINE] Received: "${msg}".\nTo run actual Gemini AI calls, please configure your API key by clicking the "API Key Setup" terminal widget at the top. Onboard Core is currently executing inside local simulation fallback mode.`;
          }
          setChatLog(prev => [...prev, { sender: 'ai', text: responseText }]);
          setIsGenerating(false);
        }, 1000);
        return;
      }

      // Initialize the new Google Gen AI SDK client
      const ai = new GoogleGenAI({ apiKey });
      
      // Build flight path contextual query
      const routeText = waypoints.length > 0
        ? `Active Flight Route Waypoints: ${waypoints.map(w => `[X: ${w.x}, Y: ${w.y}]`).join(' -> ')}`
        : 'No active waypoint route plotted yet.';

      const systemInstructions = `You are the onboard neural flight controller of the AERIX ONE autonomous quadcopter drone. 
Your tone is high-tech, precise, helpful, and scientific. Keep responses concise (under 120 words).
Current drone telemetry:
- Speed: ${telemetry.speed} Mph
- Altitude: ${telemetry.altitude} ft
- Battery: ${telemetry.battery}%
- Wind: ${telemetry.wind} knots
- GPS position: ${telemetry.gps}
- Active Route: ${routeText}
Answer user questions regarding flight paths, specifications, configurations, or operations. Format data using tech bulletin style tags (e.g. [SYSTEM_STATUS] [DIAGNOSTIC]).`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [
          { role: 'user', parts: [{ text: `${systemInstructions}\n\nUser Message: ${msg}` }] }
        ]
      });

      const responseText = response.text || 'Error: Empty response returned from flight core.';
      setChatLog(prev => [...prev, { sender: 'ai', text: responseText }]);
    } catch (err: any) {
      console.error(err);
      setChatLog(prev => [...prev, { sender: 'system', text: `ERROR calling Gemini AI: ${err.message || err.toString()}` }]);
    } finally {
      setIsGenerating(false);
    }
  };

  // Compile active route and ask AI to analyze it
  const handleAnalyzeRoute = () => {
    if (waypoints.length === 0) {
      setChatLog(prev => [...prev, { sender: 'system', text: 'Error: Cannot compile route. Map contains 0 waypoints.' }]);
      return;
    }
    const query = `Compile tactical telemetry analysis for active waypoint route: ${waypoints.map(w => `WP-${w.id}[X:${w.x}, Y:${w.y}]`).join(', ')}. Validate flight time and battery usage.`;
    handleSendChat(query);
  };

  return (
    <div className="min-h-screen bg-dark-bg text-gray-100 font-sans relative overflow-x-hidden bg-grid-pattern selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* HUD overlay grid decoration */}
      <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-radial-glow opacity-60"></div>
        {/* Animated Scanline overlay */}
        <div className="absolute inset-y-0 left-0 w-full bg-[linear-gradient(to_bottom,rgba(6,182,212,0)_97%,rgba(6,182,212,0.06)_98%,rgba(6,182,212,0.06)_100%)] bg-[size:100%_30px] animate-scanline"></div>
      </div>

      {/* HEADER / NAVIGATION */}
      <header className="sticky top-0 z-50 glass-panel border-b border-cyan-500/10 py-4 px-6 md:px-12 flex justify-between items-center transition-all duration-300">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded bg-cyan-950 border border-cyan-400/30 flex items-center justify-center relative overflow-hidden group">
            <Compass className="w-5 h-5 text-cyan-400 group-hover:rotate-90 transition-transform duration-500" />
            <div className="absolute inset-0 bg-cyan-400/10 scale-0 group-hover:scale-100 transition-transform duration-300 rounded"></div>
          </div>
          <div>
            <span className="font-sans font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400 text-xl glow-text-cyan">AERIX ONE</span>
            <span className="hidden xs:inline-block ml-2 text-[10px] text-cyan-400/60 font-mono tracking-widest border border-cyan-500/20 px-1.5 py-0.5 rounded bg-cyan-950/40">AI_CORE_V1.0</span>
          </div>
        </div>

        <nav className="hidden lg:flex space-x-8 text-sm font-mono tracking-wider text-gray-400">
          <a href="#features" className="hover:text-cyan-400 transition-colors duration-200">// FEATURES</a>
          <a href="#exploded" className="hover:text-cyan-400 transition-colors duration-200">// SCHEMATICS</a>
          <a href="#mission" className="hover:text-cyan-400 transition-colors duration-200">// MISSION_PLANNER</a>
          <a href="#telemetry" className="hover:text-cyan-400 transition-colors duration-200">// DIAGNOSTICS</a>
        </nav>

        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setShowKeyInput(!showKeyInput)}
            className={`font-mono text-xs px-3 py-1.5 border rounded flex items-center space-x-1.5 transition-all duration-200 ${
              apiKey 
                ? 'border-emerald-500/30 text-emerald-400 bg-emerald-950/20' 
                : 'border-amber-500/30 text-amber-400 bg-amber-950/20 hover:border-amber-400'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>{apiKey ? 'API KEY CONFIGURED' : 'API KEY REQUIRED'}</span>
          </button>
          <a 
            href="#mission" 
            className="hidden sm:inline-flex items-center justify-center font-mono text-xs px-4 py-2 bg-cyan-500 text-black hover:bg-cyan-400 transition-all duration-200 font-bold rounded shadow-lg shadow-cyan-500/20 hover:shadow-cyan-400/40 hover:-translate-y-0.5"
          >
            LAUNCH APP
          </a>
        </div>
      </header>

      {/* COLLAPSIBLE API KEY DRAWER */}
      <AnimatePresence>
        {showKeyInput && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-cyan-950/30 border-b border-cyan-500/20 relative z-40 overflow-hidden"
          >
            <div className="max-w-4xl mx-auto px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-semibold text-cyan-200 font-mono">Gemini AI Key Setup</h4>
                  <p className="text-xs text-gray-400 mt-1 max-w-xl">
                    For the flight intelligence console to work, provide a Gemini API key. Keys are saved locally in your browser storage and never sent elsewhere.
                  </p>
                </div>
              </div>
              <form onSubmit={handleSaveApiKey} className="flex gap-2 w-full md:w-auto">
                <input
                  type="password"
                  name="api_key"
                  placeholder="Paste Gemini API Key..."
                  defaultValue={apiKey}
                  className="px-3 py-1.5 text-sm terminal-input rounded w-full md:w-64"
                />
                <button type="submit" className="px-4 py-1.5 bg-cyan-500 text-black text-xs font-bold rounded hover:bg-cyan-400 transition-colors flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Save
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HERO SECTION */}
      <section 
        ref={heroRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setMousePos({ x: 0, y: 0 });
        }}
        className="relative pt-12 pb-24 md:py-32 px-6 md:px-12 max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-12"
      >
        <div className="flex-1 text-left relative z-20">
          <div className="inline-flex items-center space-x-2 bg-cyan-950/40 border border-cyan-500/20 px-3 py-1 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="text-[11px] font-mono text-cyan-400 tracking-wider font-bold">NEXT-GEN AUTONOMOUS HEAVY PAYLOAD DRONE</span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-none text-white font-sans">
            INTELLIGENCE <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-violet-400 glow-text-cyan">TAKES FLIGHT</span>
          </h1>

          <p className="mt-6 text-gray-400 text-base md:text-lg max-w-xl leading-relaxed">
            Meet <strong className="text-cyan-300 font-medium">AERIX ONE</strong>. The world's most advanced autonomous drone payload, driven by an onboard 120 TOPS AI core, real-time solid-state LiDAR obstacle mapping, and thermal imaging analytics.
          </p>

          {/* Core telemetries on hero */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-10 max-w-2xl font-mono">
            <div className="bg-cyan-950/15 border border-cyan-500/10 p-3 rounded hover:border-cyan-500/30 transition-all duration-300">
              <span className="text-gray-500 text-[10px] block">// MAX SPEED</span>
              <span className="text-white text-lg font-bold">75 Mph</span>
            </div>
            <div className="bg-cyan-950/15 border border-cyan-500/10 p-3 rounded hover:border-cyan-500/30 transition-all duration-300">
              <span className="text-gray-500 text-[10px] block">// FLIGHT TIME</span>
              <span className="text-white text-lg font-bold">50 Min</span>
            </div>
            <div className="bg-cyan-950/15 border border-cyan-500/10 p-3 rounded hover:border-cyan-500/30 transition-all duration-300">
              <span className="text-gray-500 text-[10px] block">// PERCEPTION</span>
              <span className="text-white text-lg font-bold">360° LiDAR</span>
            </div>
            <div className="bg-cyan-950/15 border border-cyan-500/10 p-3 rounded hover:border-cyan-500/30 transition-all duration-300">
              <span className="text-gray-500 text-[10px] block">// AI COMPUTE</span>
              <span className="text-white text-lg font-bold">120 TOPS</span>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap gap-4 items-center">
            <a 
              href="#mission" 
              className="inline-flex items-center justify-center font-mono text-sm px-6 py-3.5 bg-gradient-to-r from-cyan-500 to-teal-400 text-black hover:from-cyan-400 hover:to-teal-300 transition-all duration-300 font-extrabold rounded shadow-lg shadow-cyan-500/10 hover:shadow-cyan-400/30 hover:-translate-y-0.5 group"
            >
              INITIALIZE FLIGHT MISSION
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </a>
            <a 
              href="#exploded" 
              className="inline-flex items-center justify-center font-mono text-sm px-6 py-3.5 border border-cyan-500/20 text-cyan-400 bg-cyan-950/10 hover:bg-cyan-950/30 hover:border-cyan-500/40 rounded transition-all duration-300"
            >
              EXPLORE SCHEMATICS
            </a>
          </div>
        </div>

        {/* INTERACTIVE 3D ROTATION DRONE DISPLAY */}
        <div className="flex-1 w-full flex justify-center items-center relative min-h-[420px] md:min-h-[500px]">
          {/* Neon back glow */}
          <div className="absolute w-[80%] h-[80%] rounded-full bg-radial-glow opacity-30 animate-pulse-slow pointer-events-none"></div>

          {/* Interactive target reticle */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[300px] h-[300px] rounded-full border border-cyan-500/10 animate-spin opacity-40" style={{ animationDuration: '40s' }}></div>
            <div className="w-[360px] h-[360px] rounded-full border border-dashed border-cyan-500/5 animate-spin opacity-20" style={{ animationDuration: '60s', animationDirection: 'reverse' }}></div>
            <div className="w-[200px] h-[200px] rounded-full border border-cyan-400/10 flex items-center justify-center">
              {/* Reticle crosshair */}
              <div className="w-4 h-px bg-cyan-500/50 absolute left-[calc(50%-30px)]"></div>
              <div className="w-4 h-px bg-cyan-500/50 absolute right-[calc(50%-30px)]"></div>
              <div className="h-4 w-px bg-cyan-500/50 absolute top-[calc(50%-30px)]"></div>
              <div className="h-4 w-px bg-cyan-500/50 absolute bottom-[calc(50%-30px)]"></div>
            </div>
          </div>

          {/* 3D Tilting Drone Container */}
          <motion.div
            animate={{
              rotateY: mousePos.x * 25,
              rotateX: -mousePos.y * 25,
              y: [0, -10, 0]
            }}
            transition={{
              rotateY: { type: 'spring', stiffness: 80, damping: 20 },
              rotateX: { type: 'spring', stiffness: 80, damping: 20 },
              y: { repeat: Infinity, duration: 5, ease: 'easeInOut' }
            }}
            className="w-full max-w-[400px] aspect-square relative z-20 cursor-grab active:cursor-grabbing select-none"
          >
            <img 
              src="/aerix_drone.png" 
              alt="AERIX ONE Autonomous Drone Core"
              className="w-full h-full object-contain filter drop-shadow-[0_15px_50px_rgba(6,182,212,0.35)]"
              draggable="false"
            />

            {/* Glowing HUD Scan Overlay on Hover */}
            <AnimatePresence>
              {isHovered && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-transparent flex flex-col justify-between pointer-events-none p-4 font-mono text-[9px] text-cyan-400/80"
                >
                  <div className="flex justify-between">
                    <span className="border-l border-t border-cyan-500/40 p-1">SCANNING_PAYLOAD...</span>
                    <span className="border-r border-t border-cyan-500/40 p-1">FPS: 60.00</span>
                  </div>
                  <div className="flex flex-col items-center justify-center gap-1 my-auto">
                    <span className="text-[10px] glow-text-cyan tracking-wider font-extrabold px-2 py-0.5 bg-cyan-950/80 border border-cyan-500/40 rounded">SYS_ACTIVE</span>
                    <span className="text-[8px] text-cyan-400/40">ALT: {telemetry.altitude} FT | SPD: {telemetry.speed} MPH</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="border-l border-b border-cyan-500/40 p-1">LIDAR: 100% OK</span>
                    <span className="border-r border-b border-cyan-500/40 p-1">BATTERY: {telemetry.battery.toFixed(0)}%</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Telemetry telemetry HUD Panel overlay (Hero right-bottom) */}
          <div className="absolute right-0 bottom-4 glass-panel border border-cyan-500/10 p-3 rounded font-mono text-[10px] space-y-1 z-30 max-w-[170px] hidden md:block">
            <div className="flex justify-between border-b border-cyan-500/10 pb-1 mb-1 font-bold text-cyan-400">
              <span>// SYS_STATUS</span>
              <span>NOMINAL</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">PROP:</span>
              <span className="text-white">ONLINE</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">WIND:</span>
              <span className="text-white">{telemetry.wind} KTS</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">GPS:</span>
              <span className="text-white">FIXED</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">TEMP:</span>
              <span className="text-white">{telemetry.temp}°C</span>
            </div>
          </div>
        </div>
      </section>

      {/* TELEMETRY SPEED STRIP */}
      <div className="w-full bg-cyan-950/20 border-y border-cyan-500/10 py-3 relative overflow-hidden font-mono text-xs tracking-widest text-cyan-400/60 z-20">
        <div className="flex space-x-12 animate-[marquee_40s_linear_infinite] whitespace-nowrap">
          <span>ALTITUDE: {telemetry.altitude} FT</span>
          <span>•</span>
          <span>AIRSPEED: {telemetry.speed} MPH</span>
          <span>•</span>
          <span>BATTERY CHARGE: {telemetry.battery.toFixed(2)}%</span>
          <span>•</span>
          <span>WIND RESISTANCE: {telemetry.wind} KTS</span>
          <span>•</span>
          <span>GPS COORDINATES: {telemetry.gps}</span>
          <span>•</span>
          <span>COMPASS: {180 + Math.sin(Date.now() / 1000) * 10}° S</span>
          <span>•</span>
          <span>SATELLITES: {telemetry.satellites} (GPS LOCK)</span>
          <span>•</span>
          <span>SYS TEMP: {telemetry.temp}°C</span>
          <span>•</span>
          <span>ALTITUDE: {telemetry.altitude} FT</span>
          <span>•</span>
          <span>AIRSPEED: {telemetry.speed} MPH</span>
        </div>
      </div>

      {/* DETAILED FEATURES GRID */}
      <section id="features" className="py-24 px-6 md:px-12 max-w-7xl mx-auto relative z-20">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-cyan-400 font-mono text-xs tracking-widest block mb-3">// HIGH-PERFORMANCE SPECIFICATIONS</span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white">Engineered For Critical Missions</h2>
          <p className="mt-4 text-gray-400">
            AERIX ONE combines rugged aerospace hardware with the latest developments in local machine learning to execute operations where standard platforms fail.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="bg-panel-bg border border-panel-border p-8 rounded-lg hover:border-cyan-500/40 hover:-translate-y-1 transition-all duration-300 group">
            <div className="w-12 h-12 bg-cyan-950/40 rounded border border-cyan-500/20 flex items-center justify-center mb-6 text-cyan-400 group-hover:bg-cyan-500 group-hover:text-black transition-colors duration-300">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">120 TOPS Neural Core</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Equipped with a custom Edge TPU processor that runs solid-state machine learning models locally. Decides flight parameters and navigates around moving obstacles in fractions of a millisecond.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-panel-bg border border-panel-border p-8 rounded-lg hover:border-cyan-500/40 hover:-translate-y-1 transition-all duration-300 group">
            <div className="w-12 h-12 bg-cyan-950/40 rounded border border-cyan-500/20 flex items-center justify-center mb-6 text-cyan-400 group-hover:bg-cyan-500 group-hover:text-black transition-colors duration-300">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Solid State LiDAR</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Emits 1.2 million laser pulses per second in a spherical 360° matrix to draw high-fidelity digital elevation map overlays, bypassing dust, fog, and light-related visual failures.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-panel-bg border border-panel-border p-8 rounded-lg hover:border-cyan-500/40 hover:-translate-y-1 transition-all duration-300 group">
            <div className="w-12 h-12 bg-cyan-950/40 rounded border border-cyan-500/20 flex items-center justify-center mb-6 text-cyan-400 group-hover:bg-cyan-500 group-hover:text-black transition-colors duration-300">
              <Camera className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Spectra Gimbal Payload</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Integrates a high-resolution 8K optical sensor with a thermal micro-bolometer, stabilized by an active 3-axis mechanical gimbal. Features real-time AI target tracking and labeling.
            </p>
          </div>

          {/* Card 4 */}
          <div className="bg-panel-bg border border-panel-border p-8 rounded-lg hover:border-cyan-500/40 hover:-translate-y-1 transition-all duration-300 group">
            <div className="w-12 h-12 bg-cyan-950/40 rounded border border-cyan-500/20 flex items-center justify-center mb-6 text-cyan-400 group-hover:bg-cyan-500 group-hover:text-black transition-colors duration-300">
              <Navigation className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Tri-Band encrypted Uplink</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Secures communication with advanced AES-256 frequency-hopping military-grade encryption, ensuring drone telemetry and videos remain safe from interception.
            </p>
          </div>

          {/* Card 5 */}
          <div className="bg-panel-bg border border-panel-border p-8 rounded-lg hover:border-cyan-500/40 hover:-translate-y-1 transition-all duration-300 group">
            <div className="w-12 h-12 bg-cyan-950/40 rounded border border-cyan-500/20 flex items-center justify-center mb-6 text-cyan-400 group-hover:bg-cyan-500 group-hover:text-black transition-colors duration-300">
              <Wind className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Active Aerodynamic Hull</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Molded entirely from specialized woven carbon-fiber composites. Streamlined profiles reduce aerodynamic drag coefficient, granting stable flight in harsh 45-knot crosswinds.
            </p>
          </div>

          {/* Card 6 */}
          <div className="bg-panel-bg border border-panel-border p-8 rounded-lg hover:border-cyan-500/40 hover:-translate-y-1 transition-all duration-300 group">
            <div className="w-12 h-12 bg-cyan-950/40 rounded border border-cyan-500/20 flex items-center justify-center mb-6 text-cyan-400 group-hover:bg-cyan-500 group-hover:text-black transition-colors duration-300">
              <Battery className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Quantum Li-Silicon Cell</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Utilizes high-energy-density Lithium-Silicon cells. Supplies massive power output to the rotors, supporting up to 50 minutes of continuous autonomous hovering.
            </p>
          </div>
        </div>
      </section>

      {/* SCHEMATICS / INTERACTIVE EXPLODED VIEW SECTION */}
      <section id="exploded" className="py-24 px-6 md:px-12 bg-black/40 border-y border-cyan-500/5 relative">
        <div className="absolute inset-0 bg-radial-violet opacity-30 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-12 items-center">
            
            {/* Visual display (Left) */}
            <div className="flex-1 w-full flex justify-center items-center relative min-h-[400px]">
              
              {/* Tactical wireframe grid overlay */}
              <div className="absolute w-[90%] h-[90%] tech-dots opacity-20 pointer-events-none"></div>
              
              {/* Component selection lines */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <svg className="w-full h-full absolute inset-0 z-10" viewBox="0 0 100 100">
                  {/* Dynamic drawing based on active component */}
                  {DRONE_COMPONENTS.map(c => {
                    const isActive = c.id === activeComponent;
                    return (
                      <g key={c.id}>
                        {/* Target Circle */}
                        <circle
                          cx={c.coords.x}
                          cy={c.coords.y}
                          r={isActive ? 2.5 : 1}
                          className={`transition-all duration-500 ${isActive ? 'fill-cyan-400 stroke-cyan-400/40 stroke-[2px]' : 'fill-gray-600'}`}
                        />
                        {/* Indicator guide lines */}
                        {isActive && (
                          <>
                            <line
                              x1={c.coords.x}
                              y1={c.coords.y}
                              x2={c.coords.x > 50 ? c.coords.x - 15 : c.coords.x + 15}
                              y2={c.coords.y > 50 ? c.coords.y - 10 : c.coords.y + 10}
                              stroke="#06b6d4"
                              strokeWidth="0.3"
                              strokeDasharray="1 1"
                            />
                            <circle
                              cx={c.coords.x > 50 ? c.coords.x - 15 : c.coords.x + 15}
                              cy={c.coords.y > 50 ? c.coords.y - 10 : c.coords.y + 10}
                              r="0.5"
                              fill="#06b6d4"
                            />
                          </>
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Exploding drone image representation */}
              <div className="relative w-full max-w-[380px] aspect-square flex items-center justify-center">
                {/* Simulated exploded separation on hover/selection */}
                <motion.div
                  animate={{
                    y: activeComponent === 'lidar' ? -35 : 0,
                    scale: activeComponent === 'lidar' ? 1.05 : 1
                  }}
                  transition={{ type: 'spring', stiffness: 60 }}
                  className="absolute z-30 w-32 h-32 flex items-center justify-center top-8 pointer-events-none"
                >
                  <div className={`w-8 h-8 rounded-full border ${activeComponent === 'lidar' ? 'border-cyan-400 bg-cyan-950/60 shadow-lg shadow-cyan-400/40' : 'border-cyan-500/20 bg-black/60'} flex items-center justify-center transition-all duration-300`}>
                    <Shield className="w-4 h-4 text-cyan-400" />
                  </div>
                </motion.div>

                <motion.div
                  animate={{
                    x: activeComponent === 'propulsion' ? -40 : 0,
                    scale: activeComponent === 'propulsion' ? 1.05 : 1
                  }}
                  transition={{ type: 'spring', stiffness: 60 }}
                  className="absolute z-30 w-24 h-24 flex items-center justify-center left-4 pointer-events-none"
                >
                  <div className={`w-8 h-8 rounded-full border ${activeComponent === 'propulsion' ? 'border-cyan-400 bg-cyan-950/60 shadow-lg shadow-cyan-400/40' : 'border-cyan-500/20 bg-black/60'} flex items-center justify-center transition-all duration-300`}>
                    <Wind className="w-4 h-4 text-cyan-400" />
                  </div>
                </motion.div>

                <motion.div
                  animate={{
                    y: activeComponent === 'camera' ? 35 : 0,
                    scale: activeComponent === 'camera' ? 1.05 : 1
                  }}
                  transition={{ type: 'spring', stiffness: 60 }}
                  className="absolute z-30 w-32 h-32 flex items-center justify-center bottom-4 pointer-events-none"
                >
                  <div className={`w-8 h-8 rounded-full border ${activeComponent === 'camera' ? 'border-cyan-400 bg-cyan-950/60 shadow-lg shadow-cyan-400/40' : 'border-cyan-500/20 bg-black/60'} flex items-center justify-center transition-all duration-300`}>
                    <Camera className="w-4 h-4 text-cyan-400" />
                  </div>
                </motion.div>

                {/* Base drone display underlay */}
                <div className="w-full h-full relative">
                  <img
                    src="/aerix_drone.png"
                    alt="AERIX Exploded view base"
                    className="w-full h-full object-contain opacity-55 filter grayscale contrast-125"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-bg/60 via-transparent to-transparent"></div>
                </div>
              </div>

            </div>

            {/* Content Display details (Right) */}
            <div className="flex-1 space-y-6">
              <div>
                <span className="text-cyan-400 font-mono text-xs tracking-widest block mb-2">// DETAILED COMPONENT ANALYSIS</span>
                <h2 className="text-3xl md:text-4xl font-extrabold text-white">Modular Subsystem Architecture</h2>
              </div>

              {/* Selector Tabs */}
              <div className="flex flex-wrap gap-2 border-b border-cyan-500/10 pb-4">
                {DRONE_COMPONENTS.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setActiveComponent(c.id)}
                    className={`px-3 py-1.5 font-mono text-[11px] rounded transition-all duration-200 border ${
                      activeComponent === c.id
                        ? 'bg-cyan-500 text-black border-cyan-400 font-bold shadow-md shadow-cyan-500/10'
                        : 'bg-cyan-950/10 text-cyan-400/60 border-cyan-500/15 hover:border-cyan-500/35 hover:text-cyan-300'
                    }`}
                  >
                    {c.id.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Selected component detail card */}
              {(() => {
                const comp = DRONE_COMPONENTS.find(c => c.id === activeComponent)!;
                return (
                  <motion.div
                    key={comp.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="glass-panel border border-cyan-500/20 p-6 rounded-lg relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 px-3 py-1 bg-cyan-950 text-cyan-400 font-mono text-[9px] border-l border-b border-cyan-500/20 tracking-widest font-bold">
                      {comp.tag}
                    </div>

                    <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-3">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                      {comp.name}
                    </h3>
                    <p className="text-gray-400 text-sm leading-relaxed mb-6">
                      {comp.description}
                    </p>

                    <h4 className="font-mono text-xs text-cyan-400 border-b border-cyan-500/10 pb-2 mb-3">// SYSTEM SPECIFICATIONS</h4>
                    <ul className="space-y-2">
                      {comp.specs.map((spec, i) => (
                        <li key={i} className="flex items-center gap-2 font-mono text-xs text-gray-300">
                          <span className="text-cyan-500 text-[10px]">➜</span>
                          {spec}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                );
              })()}
            </div>

          </div>
        </div>
      </section>

      {/* MISSION PLANNING & AI CHATBOT TERMINAL */}
      <section id="mission" className="py-24 px-6 md:px-12 max-w-7xl mx-auto relative z-20">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-cyan-400 font-mono text-xs tracking-widest block mb-3">// TACTICAL FLIGHT INTERFACE</span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white">AI Onboard Mission Controller</h2>
          <p className="mt-4 text-gray-400">
            Define coordinate routes on the vector map grid, compile flight plans, and engage the Gemini-powered mission analyzer to run collision avoidance diagnostics.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          
          {/* Tactical Vector Map Grid (Left) */}
          <div className="glass-panel rounded-lg p-6 flex flex-col justify-between min-h-[500px]">
            <div>
              <div className="flex justify-between items-center border-b border-cyan-500/10 pb-3 mb-4 font-mono text-xs">
                <span className="text-cyan-400 font-bold flex items-center gap-1.5">
                  <Compass className="w-4 h-4 animate-spin" style={{ animationDuration: '8s' }} />
                  // TACTICAL_GRID_SCANNER
                </span>
                <span className="text-gray-500">WAYPOINTS: {waypoints.length}/10</span>
              </div>
              <p className="text-xs text-gray-400 mb-4">
                Click inside the coordinate matrix below to queue GPS targets. Dashed lines connect flight route segments.
              </p>
            </div>

            {/* Map Matrix Grid Box */}
            <div 
              onClick={handleMapClick}
              className="relative w-full aspect-square md:aspect-video bg-black/70 border border-cyan-500/20 rounded cursor-crosshair overflow-hidden group select-none flex-grow"
            >
              {/* Dynamic Coordinate Grid lines */}
              <div className="absolute inset-0 bg-grid-pattern opacity-40"></div>
              
              {/* Hover sweep radar */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_var(--x,_50%)_var(--y,_50%),rgba(6,182,212,0.06)_0%,transparent_50%)] pointer-events-none"
                   style={{
                     // Update pointer-events coordinates dynamically from inline attributes or mouse tracker
                     ['--x' as any]: '50%',
                     ['--y' as any]: '50%'
                   }}
              ></div>

              {/* Waypoints lines */}
              {waypoints.length > 1 && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                  <path
                    d={`M ${waypoints.map(w => `${w.x}%,${w.y}%`).join(' L ')}`}
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                    className="animate-[dash_2s_linear_infinite]"
                  />
                </svg>
              )}

              {/* Waypoint Dots */}
              {waypoints.map((wp) => (
                <div
                  key={wp.id}
                  className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-20 group/wp"
                  style={{ left: `${wp.x}%`, top: `${wp.y}%` }}
                >
                  <div className="w-4 h-4 rounded-full bg-cyan-950 border-2 border-cyan-400 flex items-center justify-center text-[8px] font-bold text-cyan-400 shadow-md shadow-cyan-400/50 scale-100 hover:scale-125 transition-transform">
                    {wp.id}
                  </div>
                  {/* Waypoint label */}
                  <span className="bg-black/90 border border-cyan-500/30 px-1 py-0.5 rounded text-[8px] font-mono text-cyan-300 mt-1 pointer-events-none opacity-0 group-hover/wp:opacity-100 transition-opacity">
                    WP-{wp.id}[{wp.x},{wp.y}]
                  </span>
                </div>
              ))}

              {waypoints.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none font-mono text-[10px] text-cyan-500/30 animate-pulse">
                  [ MATRIX EMPTY - CLICK TO LAY GPS WAYPOINTS ]
                </div>
              )}
            </div>

            {/* Map Actions */}
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleAnalyzeRoute}
                disabled={waypoints.length === 0}
                className="flex-1 font-mono text-xs py-2 px-4 bg-cyan-950 border border-cyan-500/30 text-cyan-400 hover:border-cyan-400 hover:bg-cyan-900/30 rounded disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-1.5 font-bold"
              >
                <Activity className="w-3.5 h-3.5" />
                COMPILE & ANALYZE PATH
              </button>
              <button
                onClick={clearWaypoints}
                disabled={waypoints.length === 0}
                className="font-mono text-xs py-2 px-3 border border-red-500/20 text-red-400 bg-red-950/5 hover:bg-red-950/20 hover:border-red-500/40 rounded disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                RESET
              </button>
            </div>
          </div>

          {/* Onboard AI Chat Console (Right) */}
          <div className="glass-panel rounded-lg p-6 flex flex-col justify-between min-h-[500px]">
            <div>
              <div className="flex justify-between items-center border-b border-cyan-500/10 pb-3 mb-4 font-mono text-xs">
                <span className="text-cyan-400 font-bold flex items-center gap-1.5">
                  <Terminal className="w-4 h-4" />
                  // FLIGHT_CORE_SHELL
                </span>
                <span className="flex items-center gap-1 text-[10px] text-gray-500">
                  <span className={`w-1.5 h-1.5 rounded-full ${isGenerating ? 'bg-cyan-400 animate-ping' : 'bg-emerald-400'}`}></span>
                  {isGenerating ? 'PROCESSING' : 'LINK_ONLINE'}
                </span>
              </div>
            </div>

            {/* Chat output console log */}
            <div className="flex-grow bg-black/60 border border-cyan-500/10 rounded p-4 overflow-y-auto font-mono text-xs space-y-3 h-[300px] mb-4 relative scroll-smooth">
              {chatLog.map((log, idx) => (
                <div key={idx} className="flex flex-col">
                  <span className={`text-[9px] font-bold mb-0.5 tracking-wider ${
                    log.sender === 'user' ? 'text-violet-400 self-end' :
                    log.sender === 'system' ? 'text-cyan-400/40' : 'text-cyan-400'
                  }`}>
                    {log.sender === 'user' ? '↳ PILOT_UPLINK' : log.sender === 'system' ? '⚙️ METRIC_LOG' : '⚡ AERIX_AI'}
                  </span>
                  <div className={`p-2.5 rounded max-w-[85%] leading-relaxed whitespace-pre-wrap ${
                    log.sender === 'user' 
                      ? 'bg-violet-950/20 border border-violet-500/20 text-violet-200 self-end' 
                      : log.sender === 'system'
                        ? 'bg-transparent text-cyan-400/50 p-0'
                        : 'bg-cyan-950/20 border border-cyan-500/10 text-cyan-100'
                  }`}>
                    {log.text}
                  </div>
                </div>
              ))}

              {isGenerating && (
                <div className="flex flex-col animate-pulse">
                  <span className="text-[9px] text-cyan-400/40 font-bold mb-0.5">// TRANSMITTING</span>
                  <div className="bg-cyan-950/10 text-cyan-400/50 p-2 border border-dashed border-cyan-500/20 rounded font-mono text-xs">
                    Processing flight telemetry coordinates and compiling response...
                  </div>
                </div>
              )}
            </div>

            {/* Chat input form */}
            <div className="space-y-3">
              {/* Telemetry helper suggestions */}
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => handleSendChat("Run system sensor diagnostics.")}
                  className="px-2 py-0.5 bg-cyan-950/30 border border-cyan-500/15 hover:border-cyan-500/35 rounded text-[10px] font-mono text-cyan-400"
                >
                  [Diagnostic Run]
                </button>
                <button
                  onClick={() => handleSendChat("Explain the solid-state LiDAR coverage.")}
                  className="px-2 py-0.5 bg-cyan-950/30 border border-cyan-500/15 hover:border-cyan-500/35 rounded text-[10px] font-mono text-cyan-400"
                >
                  [LiDAR Specs]
                </button>
                <button
                  onClick={() => handleSendChat("What happens during a battery reserve event?")}
                  className="px-2 py-0.5 bg-cyan-950/30 border border-cyan-500/15 hover:border-cyan-500/35 rounded text-[10px] font-mono text-cyan-400"
                >
                  [Safety Protocol]
                </button>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendChat();
                  }}
                  placeholder="Query onboard computer..."
                  className="flex-grow px-3 py-2 text-xs terminal-input rounded"
                />
                <button
                  onClick={() => handleSendChat()}
                  className="p-2.5 bg-cyan-500 hover:bg-cyan-400 text-black rounded transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* DETAILED DIAGNOSTICS GRAPH & METRICS PANEL */}
      <section id="telemetry" className="py-24 px-6 md:px-12 bg-black/20 border-t border-cyan-500/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            
            {/* Real-time Oscilloscope Chart (Left/Center) */}
            <div className="lg:col-span-2 glass-panel p-6 rounded-lg space-y-4">
              <div className="flex justify-between items-center border-b border-cyan-500/10 pb-3 font-mono text-xs">
                <span className="text-cyan-400 font-bold flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  // DYNAMIC_TELEMETRY_FEED
                </span>
                <span className="text-cyan-400/50">LIVE OSCILLOSCOPE [FREQ: 60Hz]</span>
              </div>
              <div className="relative w-full h-[220px] bg-black/60 border border-cyan-500/15 rounded overflow-hidden">
                <canvas 
                  ref={chartCanvasRef} 
                  width={600} 
                  height={220}
                  className="w-full h-full block"
                ></canvas>
                <div className="absolute left-3 top-3 pointer-events-none font-mono text-[9px] text-cyan-400/40 space-y-0.5">
                  <div>FREQ: 433 MHz</div>
                  <div>DEV_SCALE: 20 mV/Div</div>
                  <div>ATT: 0 dB</div>
                </div>
              </div>
            </div>

            {/* System storage & GPS locks detail (Right) */}
            <div className="glass-panel p-6 rounded-lg space-y-5">
              <div className="border-b border-cyan-500/10 pb-3 font-mono text-xs">
                <span className="text-cyan-400 font-bold flex items-center gap-2">
                  <HardDrive className="w-4 h-4" />
                  // HARDWARE_HEALTH
                </span>
              </div>

              <div className="space-y-4 font-mono text-xs">
                {/* Metric 1 */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-gray-500">SOLID STATE STORAGE</span>
                    <span className="text-cyan-400">142.4 GB / 512 GB</span>
                  </div>
                  <div className="w-full bg-cyan-950/40 border border-cyan-500/20 h-2 rounded overflow-hidden">
                    <div className="bg-cyan-500 h-full w-[28%]"></div>
                  </div>
                </div>

                {/* Metric 2 */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-gray-500">PROPULSION RPM LOAD</span>
                    <span className="text-cyan-400">{telemetry.speed > 0 ? `${(telemetry.speed * 125).toFixed(0)} RPM` : '0 RPM (IDLE)'}</span>
                  </div>
                  <div className="w-full bg-cyan-950/40 border border-cyan-500/20 h-2 rounded overflow-hidden">
                    <div className="bg-cyan-500 h-full transition-all duration-500" style={{ width: `${(telemetry.speed / 75) * 100}%` }}></div>
                  </div>
                </div>

                {/* Metric 3 */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-gray-500">TRANSMISSION FREQUENCY</span>
                    <span className="text-cyan-400">5.8 GHz (MUTUAL LINK)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] mt-1">
                    <Wifi className="w-3.5 h-3.5" />
                    <span>SIGNAL STRENGTH: 98dBm (EXCELLENT)</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-cyan-500/10 bg-black/60 py-12 px-6 md:px-12 font-mono text-xs text-gray-500 relative z-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center space-x-3">
            <Compass className="w-5 h-5 text-cyan-500/40" />
            <span className="font-sans font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400 text-base">AERIX ONE</span>
          </div>
          
          <div className="text-center md:text-right">
            <div>© {new Date().getFullYear()} AERIX CORP. ALL RIGHTS RESERVED.</div>
            <div className="text-[10px] text-cyan-400/30 mt-1">INTELLIGENCE FLIGHT PROTOCOL // CLOUD UPLINK COMPATIBLE</div>
          </div>
        </div>
      </footer>

    </div>
  );
}
