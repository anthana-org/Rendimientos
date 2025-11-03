import React from 'react';

interface ChartData {
  period: string;
  capital: number;
  rendimientoAmount: number;
  balance: number;
  contractType?: string;
  monthlyReturn?: number;
  monthsElapsed?: number;
}

interface PerformanceChartProps {
  data: ChartData[];
  height?: number;
}

export const PerformanceChart: React.FC<PerformanceChartProps> = ({ 
  data, 
  height = 400 
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700 text-center">
        <svg className="w-16 h-16 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p className="text-gray-400 text-lg">No hay datos suficientes para generar la gráfica</p>
        <p className="text-gray-500 text-sm mt-2">Se necesitan al menos 2 puntos de datos</p>
      </div>
    );
  }

  // Calcular dimensiones y escalas
  const maxBalance = Math.max(...data.map(d => d.balance));
  const minBalance = Math.min(...data.map(d => d.balance));
  const range = maxBalance - minBalance;
  const padding = range * 0.1; // 10% padding
  
  const chartHeight = height - 100; // Espacio para etiquetas (aumentado para ejes)
  const chartWidth = 800;
  const paddingLeft = 70; // Espacio para etiquetas del eje Y
  const paddingBottom = 40; // Espacio para etiquetas del eje X
  const stepX = (chartWidth - paddingLeft) / Math.max(data.length - 1, 1);
  
  // Crear puntos para la línea de balance
  const points = data.map((point, index) => {
    const x = paddingLeft + index * stepX;
    const y = chartHeight - paddingBottom - ((point.balance - minBalance + padding) / (range + padding * 2)) * chartHeight;
    return { x, y, ...point };
  });

  // Crear path para la línea
  const pathData = points.map((point, index) => {
    const command = index === 0 ? 'M' : 'L';
    return `${command} ${point.x} ${point.y}`;
  }).join(' ');

  // Crear área bajo la curva
  const areaData = [
    `M ${paddingLeft} ${chartHeight - paddingBottom}`,
    ...points.map(point => `L ${point.x} ${point.y}`),
    `L ${points[points.length - 1].x} ${chartHeight - paddingBottom}`,
    'Z'
  ].join(' ');

  return (
    <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          Evolución del Patrimonio por Contratos
        </h3>
        <div className="text-right">
          <p className="text-green-400 text-sm">Patrimonio Total</p>
          <p className="text-white text-2xl font-bold">
            ${data[data.length - 1]?.balance?.toLocaleString() || '0'}
          </p>
        </div>
      </div>

      <div className="relative overflow-x-auto">
        <svg width={chartWidth} height={height} className="min-w-full">
          {/* Grid lines */}
          <defs>
            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="50%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#6ee7b7" />
            </linearGradient>
          </defs>
          
          {/* Grid lines and Y-axis labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
            const y = chartHeight - paddingBottom - (chartHeight - paddingBottom) * ratio;
            const value = minBalance + (ratio * (maxBalance - minBalance));
            return (
              <g key={index}>
                <line 
                  x1={paddingLeft} y1={y} x2={chartWidth} y2={y} 
                  stroke="#374151" strokeWidth="1" strokeDasharray="2,2"
                />
                <text 
                  x={paddingLeft - 10} y={y + 4} 
                  textAnchor="end" 
                  className="text-sm fill-gray-400 font-medium"
                >
                  ${(value / 1000).toFixed(0)}k
                </text>
              </g>
            );
          })}
          
          {/* Y-axis line */}
          <line 
            x1={paddingLeft} y1={chartHeight - paddingBottom} 
            x2={paddingLeft} y2={0} 
            stroke="#4b5563" strokeWidth="2"
          />
          
          {/* Y-axis label */}
          <text 
            x={15} 
            y={chartHeight / 2} 
            transform="rotate(-90 15 center)" 
            textAnchor="middle" 
            className="text-sm fill-gray-300 font-semibold"
          >
            $
          </text>
          
          {/* Area under curve */}
          <path 
            d={areaData} 
            fill="url(#areaGradient)" 
          />
          
          {/* Main line */}
          <path 
            d={pathData} 
            stroke="url(#lineGradient)" 
            strokeWidth="3" 
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Data points */}
          {points.map((point, index) => {
            // Mostrar etiquetas cada N puntos para evitar solapamiento
            const showLabel = points.length <= 8 || index % Math.ceil(points.length / 8) === 0 || index === points.length - 1;
            
            return (
              <g key={index}>
                {/* Point circle */}
                <circle 
                  cx={point.x} 
                  cy={point.y} 
                  r="6" 
                  fill="#10b981" 
                  stroke="#ffffff" 
                  strokeWidth="2"
                  className="hover:r-8 transition-all duration-200 cursor-pointer"
                />
                
                {/* Tooltip trigger area */}
                <circle 
                  cx={point.x} 
                  cy={point.y} 
                  r="15" 
                  fill="transparent" 
                  className="cursor-pointer"
                >
                  <title>
                    {`${point.period}
Contrato: $${point.capital?.toLocaleString()}
Rendimiento: +$${point.rendimientoAmount?.toLocaleString()}
Patrimonio Acumulado: $${point.balance?.toLocaleString()}
Rendimiento Mensual: ${point.monthlyReturn || 0}%
Meses Transcurridos: ${point.monthsElapsed || 0}`}
                  </title>
                </circle>
                
                {/* Period labels - solo mostrar algunas para evitar solapamiento */}
                {showLabel && (
                  <g transform={`translate(${point.x},${height - paddingBottom + 25})`}>
                    <text 
                      x="0" 
                      y="0" 
                      textAnchor="middle" 
                      className="text-xs fill-gray-400 font-medium"
                      transform="rotate(-45 0 0)"
                    >
                      {point.period}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
          
          {/* X-axis line */}
          <line 
            x1={paddingLeft} y1={chartHeight - paddingBottom} 
            x2={chartWidth} y2={chartHeight - paddingBottom} 
            stroke="#4b5563" strokeWidth="2"
          />
          
          {/* X-axis label */}
          <text 
            x={paddingLeft + (chartWidth - paddingLeft) / 2} 
            y={height - 5} 
            textAnchor="middle" 
            className="text-sm fill-gray-300 font-semibold"
          >
            Tiempo
          </text>
        </svg>
      </div>

      {/* Legend and stats */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-700/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-gray-300 text-sm font-medium">Total Invertido</span>
          </div>
          <p className="text-white text-lg font-bold">
            ${data.reduce((sum, d) => sum + (d.capital || 0), 0).toLocaleString()}
          </p>
        </div>
        
        <div className="bg-gray-700/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-gray-300 text-sm font-medium">Ganancias Totales</span>
          </div>
          <p className="text-green-400 text-lg font-bold">
            +${data.reduce((sum, d) => sum + (d.rendimientoAmount || 0), 0).toLocaleString()}
          </p>
        </div>
        
        <div className="bg-gray-700/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            <span className="text-gray-300 text-sm font-medium">ROI Total</span>
          </div>
          <p className="text-white text-lg font-bold">
            {(() => {
              const totalInvested = data.reduce((sum, d) => sum + (d.capital || 0), 0);
              const totalGains = data.reduce((sum, d) => sum + (d.rendimientoAmount || 0), 0);
              return totalInvested > 0 ? ((totalGains / totalInvested) * 100).toFixed(2) + '%' : '0%';
            })()}
          </p>
        </div>
        
        <div className="bg-gray-700/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span className="text-gray-300 text-sm font-medium">Contratos Activos</span>
          </div>
          <p className="text-white text-lg font-bold">
            {data.length}
          </p>
        </div>
      </div>

      {/* Performance indicators */}
      <div className="mt-4 flex flex-wrap gap-2">
        {data.map((point, index) => (
          <div key={index} className="bg-gray-700/30 rounded-lg px-3 py-2 text-xs">
            <span className="text-gray-400">{point.period}:</span>
            <span className="text-green-400 ml-1 font-medium">
              +${point.rendimientoAmount?.toLocaleString() || '0'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
