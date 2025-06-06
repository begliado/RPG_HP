import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Sparkle } from "lucide-react"; // Icônes bonus

const houses = [
  {
    key: "gryffondor",
    color: "#ae0001",
    label: "Gryffondor",
    path: "M100 100 L100 0 A100 100 0 0 1 200 100 Z",
    text: "🦁",
    pos: { x: 150, y: 45 },
  },
  {
    key: "serpentard",
    color: "#2a623d",
    label: "Serpentard",
    path: "M100 100 L200 100 A100 100 0 0 1 100 200 Z",
    text: "🐍",
    pos: { x: 150, y: 155 },
  },
  {
    key: "poufsouffle",
    color: "#ecb939",
    label: "Poufsouffle",
    path: "M100 100 L100 200 A100 100 0 0 1 0 100 Z",
    text: "🦡",
    pos: { x: 50, y: 155 },
  },
  {
    key: "serdaigle",
    color: "#0e1a40",
    label: "Serdaigle",
    path: "M100 100 L0 100 A100 100 0 0 1 100 0 Z",
    text: "🦅",
    pos: { x: 50, y: 45 },
  },
];

export default function HouseWheel({ value, onChange }) {
  const [hover, setHover] = useState(null);

  return (
    <div className="relative w-[260px] mx-auto">
      <svg
        viewBox="0 0 200 200"
        width="240"
        height="240"
        className="mx-auto cursor-pointer drop-shadow-2xl"
      >
        <defs>
          {houses.map((h) => (
            <radialGradient
              id={`${h.key}-grad`}
              key={h.key}
              cx="50%"
              cy="50%"
              r="75%"
            >
              <stop offset="0%" stopColor="#fff" stopOpacity="0.15" />
              <stop offset="40%" stopColor={h.color} />
              <stop offset="100%" stopColor="#000" />
            </radialGradient>
          ))}
        </defs>
        {houses.map((h) => (
          <motion.g
            key={h.key}
            whileHover={{ scale: 1.07 }}
            whileTap={{ scale: 0.98, rotate: -2 }}
            style={{ zIndex: hover === h.key ? 2 : 1 }}
          >
            <motion.path
              d={h.path}
              fill={`url(#${h.key}-grad)`}
              className={`transition-all duration-200 drop-shadow-xl cursor-pointer`}
              style={{
                filter:
                  value === h.key || hover === h.key
                    ? "drop-shadow(0 0 10px gold)"
                    : "",
                stroke: value === h.key || hover === h.key ? "gold" : "white",
                strokeWidth: value === h.key || hover === h.key ? 4 : 2,
              }}
              onMouseEnter={() => setHover(h.key)}
              onMouseLeave={() => setHover(null)}
              onClick={() => onChange(h.key)}
            >
              <title>{h.label}</title>
            </motion.path>
            <text
              x={h.pos.x}
              y={h.pos.y}
              textAnchor="middle"
              className="fill-white font-bold text-2xl pointer-events-none select-none drop-shadow"
              dy=".35em"
              style={{
                fontFamily: "serif",
                textShadow:
                  value === h.key || hover === h.key
                    ? "0 0 7px gold, 0 0 3px #fff"
                    : "0 0 3px #000",
                fontWeight: value === h.key ? 900 : 700,
              }}
            >
              {h.text}
            </text>
          </motion.g>
        ))}
        <circle
          cx="100"
          cy="100"
          r="97"
          fill="none"
          stroke="gold"
          strokeWidth="2.5"
          style={{ filter: "drop-shadow(0 0 10px gold)" }}
        />
        {/* Effet sparkles/fumée magique centrale */}
        {hover && (
          <Sparkles
            className="absolute left-[98px] top-[98px] text-yellow-300 animate-pulse pointer-events-none"
            size={40}
          />
        )}
      </svg>
      {/* Texte central magique */}
      <AnimatePresence>
        <motion.div
          key={hover || value || "none"}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center"
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
        >
          <div className="text-xl font-fancy text-gold drop-shadow-glow select-none">
            {hover
              ? `Maison ${houses.find((h) => h.key === hover)?.label}!`
              : value
              ? `Bienvenue à ${houses.find((h) => h.key === value)?.label} !`
              : "Clique sur ta Maison"}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
