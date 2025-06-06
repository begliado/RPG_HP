import React, { useState } from 'react';

const houses = [
  { key: 'gryffondor', color: '#ae0001', label: 'Gryffondor', path: 'M100 100 L100 0 A100 100 0 0 1 200 100 Z' },
  { key: 'serpentard', color: '#2a623d', label: 'Serpentard', path: 'M100 100 L200 100 A100 100 0 0 1 100 200 Z' },
  { key: 'poufsouffle', color: '#ecb939', label: 'Poufsouffle', path: 'M100 100 L100 200 A100 100 0 0 1 0 100 Z' },
  { key: 'serdaigle', color: '#0e1a40', label: 'Serdaigle', path: 'M100 100 L0 100 A100 100 0 0 1 100 0 Z' },
];

export default function HouseWheel({ value, onChange }) {
  const [hover, setHover] = useState(null);

  return (
    <svg
      viewBox="0 0 200 200"
      width="200"
      height="200"
      className="mx-auto cursor-pointer"
    >
      {houses.map((h) => (
        <path
          key={h.key}
          d={h.path}
          fill={h.color}
          className={`transition-all duration-200 filter ${
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
      ))}
    </svg>
  );
}
