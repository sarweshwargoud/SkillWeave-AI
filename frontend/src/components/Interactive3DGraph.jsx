import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Network, Sparkles, Clock, CheckCircle2 } from 'lucide-react';

const Interactive3DGraph = () => {
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);

  // Nodes for the sample AI roadmap
  const nodes = [
    {
      id: 'center',
      label: 'AI & Data Science',
      x: 250,
      y: 200,
      size: 60,
      color: 'from-indigo-500 to-pink-500',
      description: 'The core syllabus endpoint curated and sequenced by our continuity engines.',
      details: {
        modules: 6,
        duration: '18 hours',
        mainTopic: 'Foundations & Implementation'
      }
    },
    {
      id: 'ml',
      label: 'Machine Learning',
      x: 100,
      y: 110,
      size: 45,
      color: 'from-blue-500 to-indigo-600',
      description: 'Regression, Classification, and Clustering foundations.',
      details: {
        videos: '4 lessons',
        continuityMatch: '99%',
        accent: 'US English'
      }
    },
    {
      id: 'dl',
      label: 'Deep Learning',
      x: 400,
      y: 110,
      size: 45,
      color: 'from-purple-500 to-pink-600',
      description: 'Neural Networks, Backpropagation, and Weights optimization.',
      details: {
        videos: '6 lessons',
        continuityMatch: '98%',
        accent: 'British English'
      }
    },
    {
      id: 'nlp',
      label: 'NLP & Transformers',
      x: 100,
      y: 290,
      size: 45,
      color: 'from-cyan-500 to-blue-600',
      description: 'Text Processing, Tokenization, LLMs, and RAG architectures.',
      details: {
        videos: '5 lessons',
        continuityMatch: '96%',
        accent: 'Indian English'
      }
    },
    {
      id: 'cv',
      label: 'Computer Vision',
      x: 400,
      y: 290,
      size: 45,
      color: 'from-pink-500 to-rose-600',
      description: 'Image processing, Convolutional Neural Networks, and object detection.',
      details: {
        videos: '3 lessons',
        continuityMatch: '97%',
        accent: 'US English'
      }
    }
  ];

  // Connections between nodes
  const connections = [
    { from: 'center', to: 'ml' },
    { from: 'center', to: 'dl' },
    { from: 'center', to: 'nlp' },
    { from: 'center', to: 'cv' },
    { from: 'ml', to: 'dl' },
    { from: 'dl', to: 'cv' }
  ];

  const handleNodeClick = (node) => {
    setSelectedNode(selectedNode?.id === node.id ? null : node);
  };

  return (
    <div 
      className="graph-container card"
      style={{
        background: 'rgba(15, 23, 42, 0.4)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '24px',
        padding: '2rem',
        position: 'relative',
        height: '480px',
        overflow: 'hidden',
        boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}
    >
      <div style={{ zIndex: 10, pointerEvents: 'none' }}>
        <h4 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Network size={20} className="text-primary" style={{ color: '#818cf8' }} />
          Interactive Roadmap Node-Graph
        </h4>
        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
          Hover connections to see flow, click nodes to expand 3D curriculum info.
        </p>
      </div>

      {/* SVG Canvas for lines and nodes */}
      <svg 
        style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%', 
          zIndex: 1 
        }}
        viewBox="0 0 500 400"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Draw connections */}
        {connections.map((conn, idx) => {
          const fromNode = nodes.find(n => n.id === conn.from);
          const toNode = nodes.find(n => n.id === conn.to);
          if (!fromNode || !toNode) return null;

          const isHighlighted = 
            hoveredNode === conn.from || hoveredNode === conn.to ||
            (selectedNode && (selectedNode.id === conn.from || selectedNode.id === conn.to));

          return (
            <motion.line
              key={idx}
              x1={fromNode.x}
              y1={fromNode.y}
              x2={toNode.x}
              y2={toNode.y}
              stroke={isHighlighted ? '#a855f7' : 'rgba(255, 255, 255, 0.1)'}
              strokeWidth={isHighlighted ? 3 : 1.5}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, delay: idx * 0.1 }}
              style={{
                filter: isHighlighted ? 'drop-shadow(0 0 8px #a855f7)' : 'none'
              }}
            />
          );
        })}

        {/* Draw moving particle signals along highlighted paths */}
        {connections.map((conn, idx) => {
          const fromNode = nodes.find(n => n.id === conn.from);
          const toNode = nodes.find(n => n.id === conn.to);
          if (!fromNode || !toNode) return null;

          const isHighlighted = 
            hoveredNode === conn.from || hoveredNode === conn.to ||
            (selectedNode && (selectedNode.id === conn.from || selectedNode.id === conn.to));

          if (!isHighlighted) return null;

          return (
            <motion.circle
              key={`pulse-${idx}`}
              r={4}
              fill="#ec4899"
              style={{ filter: 'drop-shadow(0 0 4px #ec4899)' }}
              animate={{
                cx: [fromNode.x, toNode.x],
                cy: [fromNode.y, toNode.y]
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            />
          );
        })}

        {/* Draw interactive SVG Nodes */}
        {nodes.map((node) => {
          const isSelected = selectedNode?.id === node.id;
          const isHovered = hoveredNode === node.id;

          return (
            <g 
              key={node.id}
              onClick={() => handleNodeClick(node)}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
              style={{ cursor: 'pointer' }}
            >
              {/* Pulsing Outer Ring */}
              <motion.circle
                cx={node.x}
                cy={node.y}
                r={node.size / 2 + (isHovered || isSelected ? 8 : 4)}
                fill="none"
                stroke={isSelected ? '#ec4899' : '#818cf8'}
                strokeWidth={1.5}
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.3, 0.6, 0.3]
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: Math.random()
                }}
              />

              {/* Central Circle */}
              <motion.circle
                cx={node.x}
                cy={node.y}
                r={node.size / 2}
                fill="url(#node-gradient)"
                style={{
                  filter: isHovered || isSelected ? 'drop-shadow(0 0 15px rgba(129, 140, 248, 0.6))' : 'none'
                }}
                animate={{
                  y: [node.y - 3, node.y + 3, node.y - 3]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: node.id === 'center' ? 0 : 0.5
                }}
              />

              {/* Node Label Text */}
              <foreignObject
                x={node.x - 70}
                y={node.y - 12}
                width={140}
                height={24}
                pointerEvents="none"
              >
                <div 
                  style={{ 
                    textAlign: 'center', 
                    fontSize: '0.75rem', 
                    fontWeight: 700, 
                    color: 'white',
                    textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {node.label}
                </div>
              </foreignObject>
            </g>
          );
        })}

        {/* Define Gradient Definitions */}
        <defs>
          <radialGradient id="node-gradient">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="60%" stopColor="#4f46e5" />
            <stop offset="100%" stopColor="#1e1b4b" />
          </radialGradient>
        </defs>
      </svg>

      {/* Floating Info Overlay Panel */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10, rotateY: 90 }}
            animate={{ opacity: 1, scale: 1, y: 0, rotateY: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10, rotateY: -90 }}
            transition={{ type: 'spring', damping: 15, stiffness: 100 }}
            style={{
              position: 'absolute',
              bottom: '1rem',
              left: '1rem',
              right: '1rem',
              background: 'rgba(30, 41, 59, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.15)',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              borderRadius: '16px',
              padding: '1.25rem',
              zIndex: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              transformStyle: 'preserve-3d',
              perspective: '600px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#a855f7', fontWeight: 800, tracking: '0.05em', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Sparkles size={12} />
                AI Node Module
              </span>
              <button 
                onClick={() => setSelectedNode(null)}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: '#94a3b8', 
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 'bold'
                }}
              >
                Close
              </button>
            </div>

            <h5 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'white' }}>{selectedNode.label}</h5>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#cbd5e1', lineHeight: '1.4' }}>{selectedNode.description}</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.5rem' }}>
              {selectedNode.details.modules ? (
                <>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.65rem', color: '#94a3b8' }}>Modules</span>
                    <strong style={{ fontSize: '0.85rem', color: 'white' }}>{selectedNode.details.modules} total</strong>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.65rem', color: '#94a3b8' }}>Duration</span>
                    <strong style={{ fontSize: '0.85rem', color: 'white', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Clock size={12} /> {selectedNode.details.duration}</strong>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.65rem', color: '#94a3b8' }}>Main Focus</span>
                    <strong style={{ fontSize: '0.85rem', color: '#818cf8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{selectedNode.details.mainTopic}</strong>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.65rem', color: '#94a3b8' }}>Videos</span>
                    <strong style={{ fontSize: '0.85rem', color: 'white' }}>{selectedNode.details.videos}</strong>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.65rem', color: '#94a3b8' }}>Continuity</span>
                    <strong style={{ fontSize: '0.85rem', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><CheckCircle2 size={12} /> {selectedNode.details.continuityMatch}</strong>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.65rem', color: '#94a3b8' }}>Accent Preference</span>
                    <strong style={{ fontSize: '0.85rem', color: '#a855f7' }}>{selectedNode.details.accent}</strong>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Interactive3DGraph;
