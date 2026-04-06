'use client'

import React from 'react'
import { RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts'

interface ProgressRingProps {
  progress: number
  size?: number
}

export function ProgressRing({ progress, size = 120 }: ProgressRingProps) {
  const data = [{ value: progress }]

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <RadialBarChart
        width={size}
        height={size}
        cx={size / 2}
        cy={size / 2}
        innerRadius="70%"
        outerRadius="100%"
        barSize={10}
        data={data}
        startAngle={90}
        endAngle={-270}
      >
        <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
        <RadialBar
          background={{ fill: '#f3f4f6' }}
          dataKey="value"
          cornerRadius={10}
          fill="#2563EB"
        />
      </RadialBarChart>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-gray-900">{progress}%</span>
      </div>
    </div>
  )
}
