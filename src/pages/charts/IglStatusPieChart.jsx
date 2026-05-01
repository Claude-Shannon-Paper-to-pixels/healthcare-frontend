import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import ChartCard from './ChartCard';

const COLORS = {
  'Not_submitted': '#94a3b8',   // Slate - not yet submitted
  'Pending': '#f59e0b',         // Amber/Yellow
  'Approved': '#16a34a',        // Green
  'Rejected': '#ef4444',        // Red
  'Partial Approval': '#3b82f6', // Blue
  'Under Review': '#8b5cf6',    // Purple
  'Cancelled': '#6b7280'        // Gray
};

function IglStatusPieChart({ data }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  // Filter out zero values for cleaner chart
  const filteredData = data.filter(item => item.value > 0);

  return (
    <ChartCard
      title="IGL Status Overview"
      // subtitle="Distribution of all IGL statuses"
    >
      {total === 0 ? (
        <div className="chart-empty">No IGL data available.</div>
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <Pie
              data={filteredData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="45%"
              outerRadius={85}
              innerRadius={45}
              paddingAngle={2}
              label={({ name, value, percent }) => 
                `${value} (${(percent * 100).toFixed(0)}%)`
              }
              labelLine={{ stroke: '#666', strokeWidth: 1 }}
            >
              {filteredData.map((entry) => (
                <Cell 
                  key={`cell-${entry.name}`} 
                  fill={COLORS[entry.name] || '#9ca3af'} 
                />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value, name) => [`${value} patients`, name]}
            />
            <Legend 
              verticalAlign="bottom" 
              height={50}
              wrapperStyle={{ paddingTop: '10px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

export default IglStatusPieChart;
