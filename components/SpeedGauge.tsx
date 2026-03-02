'use client';

import { motion } from 'motion/react';

interface SpeedGaugeProps {
  value: number; // Mbps
  max: number;
  label: string;
  isActive: boolean;
}

export default function SpeedGauge({ value, max, label, isActive }: SpeedGaugeProps) {
  // Calculate rotation
  const percentage = Math.min(value / max, 1);
  const angle = percentage * 180; // 180 degree arc

  return (
    <div className="relative flex flex-col items-center justify-center w-64 h-48">
      {/* Gauge Background */}
      <div className="absolute top-0 w-64 h-32 overflow-hidden">
        <div className="w-64 h-64 rounded-full border-[12px] border-[#333] border-dashed box-border" 
             style={{ clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)' }}></div>
      </div>

      {/* Gauge Fill */}
      <div className="absolute top-0 w-64 h-32 overflow-hidden">
        <motion.div 
          className="w-64 h-64 rounded-full border-[12px] border-[#00FF9D] box-border"
          initial={{ rotate: -180 }}
          animate={{ rotate: -180 + angle }}
          transition={{ type: "spring", stiffness: 50, damping: 15 }}
          style={{ 
            clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)',
            transformOrigin: 'center center'
          }}
        />
      </div>

      {/* Value Display */}
      <div className="absolute bottom-12 flex flex-col items-center">
        <span className="text-5xl font-mono font-bold text-white tracking-tighter">
          {value.toFixed(1)}
        </span>
        <span className="text-sm font-mono text-[#8E9299] uppercase tracking-widest mt-1">
          Mbps
        </span>
      </div>

      {/* Label */}
      <div className={`absolute bottom-0 text-sm font-bold uppercase tracking-widest transition-colors duration-300 ${isActive ? 'text-[#00FF9D]' : 'text-[#8E9299]'}`}>
        {label}
      </div>
    </div>
  );
}
