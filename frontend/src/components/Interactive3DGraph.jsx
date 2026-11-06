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
      size: 64,
      color: '#111827',
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
      size: 48,
      color: '#4f46e5',
      description: 'Regression, Classification, and Clustering foundations with clear mathematical proofs.',
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
      size: 48,
      color: '#e11d48',
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
      size: 48,
      color: '#0891b2',
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
      size: 48,
      color: '#d97706',
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
      className="graph-container"
      style={{
        background: '#ffffff',
        border: '1px solid rgba(0, 0, 0, 0.08)',
        borderRadius: '28px',
        padding: '2rem',
        position: 'relative',
        height: '480px',
        overflow: 'hidden',
        boxShadow: '0 20px 45px rgba(0, 0, 0, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}
    >
      <div style={{ zIndex: 10, pointerEvents: 'none' }}>
        <h4 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#111827' }}>
          <Network size={20} style={{ color: '#e11d48' }} />
          Interactive Curriculum Graph
        </h4>
        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#6b7280' }}>
          Hover connections to see learning flow, click nodes to expand syllabus parameters.
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
              stroke={isHighlighted ? '#e11d48' : 'rgba(0, 0, 0, 0.12)'}
              strokeWidth={isHighlighted ? 3 : 1.5}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, delay: idx * 0.1 }}
              style={{
                filter: isHighlighted ? 'drop-shadow(0 0 6px rgba(225, 29, 72, 0.4))' : 'none'
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
              fill="#e11d48"
              animate={{
                cx: [fromNode.x, toNode.x],
                cy: [fromNode.y, toNode.y]
              }}
              transition={{
                duration: 2.2,
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
                stroke={isSelected ? '#e11d48' : '#cbd5e1'}
                strokeWidth={1.5}
                animate={{
                  scale: [1, 1.08, 1],
                  opacity: [0.4, 0.8, 0.4]
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
                fill={node.id === 'center' ? '#111827' : '#ffffff'}
                stroke={node.id === 'center' ? '#111827' : '#e5e7eb'}
                strokeWidth={2}
                style={{
                  filter: isHovered || isSelected ? 'drop-shadow(0 6px 14px rgba(0, 0, 0, 0.15))' : 'drop-shadow(0 2px 6px rgba(0, 0, 0, 0.05))'
                }}
                animate={{
                  y: [node.y - 2, node.y + 2, node.y - 2]
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
                y={node.y - 10}
                width={140}
                height={24}
                pointerEvents="none"
              >
                <div 
                  style={{ 
                    textAlign: 'center', 
                    fontSize: '0.75rem', 
                    fontWeight: 800, 
                    color: node.id === 'center' ? '#ffffff' : '#111827',
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
      </svg>

      {/* Floating Info Overlay Panel */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 20, stiffness: 180 }}
            style={{
              position: 'absolute',
              bottom: '1rem',
              left: '1rem',
              right: '1rem',
              background: '#ffffff',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.12)',
              borderRadius: '20px',
              padding: '1.25rem',
              zIndex: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#e11d48', fontWeight: 800, letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Sparkles size={12} />
                Syllabus Module
              </span>
              <button 
                onClick={() => setSelectedNode(null)}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: '#6b7280', 
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 'bold'
                }}
              >
                Close
              </button>
            </div>

            <h5 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#111827' }}>{selectedNode.label}</h5>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#4b5563', lineHeight: '1.4' }}>{selectedNode.description}</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginTop: '0.5rem', borderTop: '1px solid rgba(0, 0, 0, 0.06)', paddingTop: '0.5rem' }}>
              {selectedNode.details.modules ? (
                <>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.65rem', color: '#9ca3af', fontWeight: 700 }}>Modules</span>
                    <strong style={{ fontSize: '0.85rem', color: '#111827' }}>{selectedNode.details.modules} total</strong>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.65rem', color: '#9ca3af', fontWeight: 700 }}>Duration</span>
                    <strong style={{ fontSize: '0.85rem', color: '#111827', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Clock size={12} /> {selectedNode.details.duration}</strong>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.65rem', color: '#9ca3af', fontWeight: 700 }}>Main Focus</span>
                    <strong style={{ fontSize: '0.85rem', color: '#e11d48', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{selectedNode.details.mainTopic}</strong>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.65rem', color: '#9ca3af', fontWeight: 700 }}>Videos</span>
                    <strong style={{ fontSize: '0.85rem', color: '#111827' }}>{selectedNode.details.videos}</strong>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.65rem', color: '#9ca3af', fontWeight: 700 }}>Continuity</span>
                    <strong style={{ fontSize: '0.85rem', color: '#059669', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><CheckCircle2 size={12} /> {selectedNode.details.continuityMatch}</strong>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.65rem', color: '#9ca3af', fontWeight: 700 }}>Accent Mode</span>
                    <strong style={{ fontSize: '0.85rem', color: '#111827' }}>{selectedNode.details.accent}</strong>
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
