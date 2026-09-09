'use client';

import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface SpeedChartProps {
  data: { time: number; speed: number }[];
  color: string;
}

export default function SpeedChart({ data, color }: SpeedChartProps) {
  return (
    <div className="w-full h-32 bg-[#151619] rounded-lg border border-[#333] p-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="time" hide />
          <YAxis hide domain={[0, 'auto']} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#151619', border: '1px solid #333', color: '#fff' }}
            itemStyle={{ color: color }}
            formatter={(value: any) => {
              if (typeof value === 'number') {
                return [`${value.toFixed(2)} Mbps`, 'Speed'];
              }
              return [value, 'Speed'];
            }}
            labelFormatter={() => ''}
          />
          <Line 
            type="monotone" 
            dataKey="speed" 
            stroke={color} 
            strokeWidth={2} 
            dot={false} 
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
