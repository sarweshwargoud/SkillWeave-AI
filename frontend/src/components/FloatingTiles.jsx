import { motion } from 'framer-motion';

const FloatingTiles = () => {
  return (
    <div className="floating-tiles-container" aria-hidden="true">
      {/* Top Left Floating Tile */}
      <motion.div
        className="floating-glass-tile tile-tl"
        animate={{
          y: [-12, 12, -12],
          rotate: [-14, -8, -14],
          scale: [1, 1.03, 1]
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <div className="tile-glow" />
      </motion.div>

      {/* Top Right Floating Tile */}
      <motion.div
        className="floating-glass-tile tile-tr"
        animate={{
          y: [14, -14, 14],
          rotate: [18, 12, 18],
          scale: [1, 1.04, 1]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5
        }}
      >
        <div className="tile-glow" />
      </motion.div>

      {/* Bottom Sub-tile */}
      <motion.div
        className="floating-glass-tile tile-br"
        animate={{
          y: [-8, 8, -8],
          rotate: [8, 14, 8]
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1
        }}
      >
        <div className="tile-glow" />
      </motion.div>
    </div>
  );
};

export default FloatingTiles;
