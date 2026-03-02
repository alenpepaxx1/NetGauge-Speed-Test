'use client';

interface ResultsCardProps {
  ping: number | null;
  download: number | null;
  upload: number | null;
  jitter: number | null;
}

export default function ResultsCard({ ping, download, upload, jitter }: ResultsCardProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl">
      <StatBox label="Ping" value={ping?.toFixed(0)} unit="ms" />
      <StatBox label="Jitter" value={jitter?.toFixed(0)} unit="ms" />
      <StatBox label="Download" value={download?.toFixed(1)} unit="Mbps" highlight />
      <StatBox label="Upload" value={upload?.toFixed(1)} unit="Mbps" highlight />
    </div>
  );
}

function StatBox({ label, value, unit, highlight = false }: { label: string, value?: string, unit: string, highlight?: boolean }) {
  return (
    <div className="bg-[#151619] border border-[#333] p-4 rounded-lg flex flex-col items-center justify-center shadow-lg">
      <span className="text-[#8E9299] text-xs font-mono uppercase tracking-widest mb-2">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className={`text-2xl font-mono font-bold ${highlight ? 'text-[#00FF9D]' : 'text-white'}`}>
          {value || '--'}
        </span>
        <span className="text-[#8E9299] text-xs">{unit}</span>
      </div>
    </div>
  );
}
