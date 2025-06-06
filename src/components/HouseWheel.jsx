import React, { useState } from 'react';

const houses = [
  {
    key: 'gryffondor',
    color: '#ae0001',
    label: 'Gryffondor',
    path: 'M100 100 L100 0 A100 100 0 0 1 200 100 Z',
    text: 'G',
    pos: { x: 150, y: 45 },
  },
  {
    key: 'serpentard',
    color: '#2a623d',
    label: 'Serpentard',
    path: 'M100 100 L200 100 A100 100 0 0 1 100 200 Z',
    text: 'S',
    pos: { x: 150, y: 155 },
  },
  {
    key: 'poufsouffle',
    color: '#ecb939',
    label: 'Poufsouffle',
    path: 'M100 100 L100 200 A100 100 0 0 1 0 100 Z',
    text: 'P',
    pos: { x: 50, y: 155 },
  },
  {
    key: 'serdaigle',
    color: '#0e1a40',
    label: 'Serdaigle',
    path: 'M100 100 L0 100 A100 100 0 0 1 100 0 Z',
    text: 'D',
    pos: { x: 50, y: 45 },
  },
];

export default function HouseWheel({ value, onChange }) {
  const [hover, setHover] = useState(null);

  return (
    <svg
      viewBox="0 0 200 200"
      width="200"
      height="200"
      className="mx-auto cursor-pointer drop-shadow-lg"
    >
      <defs>
        {houses.map((h) => (
          <radialGradient id={`${h.key}-grad`} key={h.key} cx="50%" cy="50%" r="75%">
            <stop offset="20%" stopColor={h.color} />
            <stop offset="100%" stopColor="#000" />
          </radialGradient>
        ))}
      </defs>
      {houses.map((h) => (
        <g key={h.key}>
          <path
            d={h.path}
            fill={`url(#${h.key}-grad)`}
            className={`transition-all duration-200 ${
              value === h.key || hover === h.key ? 'brightness-125' : ''
            } ${hover === h.key || value === h.key ? 'stroke-white stroke-2' : ''} ${
              hover === h.key ? 'scale-105' : ''
            }`}
            onMouseEnter={() => setHover(h.key)}
            onMouseLeave={() => setHover(null)}
            onClick={() => onChange(h.key)}
          >
            <title>{h.label}</title>
          </path>
          <text
            x={h.pos.x}
            y={h.pos.y}
            textAnchor="middle"
            className="fill-white font-bold text-xs pointer-events-none select-none"
            dy=".35em"
          >
            {h.text}
          </text>
        </g>
      ))}
      <circle cx="100" cy="100" r="98" fill="none" stroke="white" strokeWidth="2" />
    </svg>
  );
}
