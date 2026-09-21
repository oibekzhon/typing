import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

// Split out so recharts - the largest dependency in the bundle - is fetched
// only once a test has produced points to plot, not on first paint.
export default function WpmChart({ data }) {
  const peak = Math.max(60, ...data.map((point) => point.wpm));
  const ceiling = Math.ceil((peak * 1.15) / 20) * 20;

  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -18 }}>
        <defs>
          <linearGradient id="wpm-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5eead4" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#5eead4" stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid stroke="#212a38" vertical={false} />
        <XAxis
          dataKey="time"
          stroke="#4c576a"
          tickLine={false}
          axisLine={false}
          fontSize={11}
          tickFormatter={(value) => `${value}s`}
        />
        {/* Scaled to the run rather than a fixed 0-400, or a 70 WPM line sits
            flat along the bottom of the chart. */}
        <YAxis stroke="#4c576a" tickLine={false} axisLine={false} fontSize={11} domain={[0, ceiling]} />
        <Tooltip
          cursor={{ stroke: '#4c576a' }}
          contentStyle={{
            background: '#121722',
            border: '1px solid #212a38',
            borderRadius: '0.6rem',
            color: '#ccd6e4',
            fontSize: '0.8rem',
          }}
          labelFormatter={(value) => `${value}s`}
          formatter={(value) => [`${value} wpm`, '']}
        />
        <Area type="monotone" dataKey="wpm" stroke="#5eead4" strokeWidth={2} fill="url(#wpm-fill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
