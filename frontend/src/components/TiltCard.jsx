import { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

const TiltCard = ({ children, className = '', maxTilt = 12 }) => {
  const ref = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  // Motion values for tracking cursor position
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);

  // Springs for smooth movement
  const springConfig = { damping: 25, stiffness: 200, mass: 0.5 };
  const rotateX = useSpring(useTransform(y, [0, 1], [maxTilt, -maxTilt]), springConfig);
  const rotateY = useSpring(useTransform(x, [0, 1], [-maxTilt, maxTilt]), springConfig);

  const handleMouseMove = (e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    
    // Calculate cursor location from 0 to 1 relative to card dimensions
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    x.set(mouseX / width);
    y.set(mouseY / height);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0.5);
    y.set(0.5);
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        perspective: '1000px', // Crucial for 3D perspective
        display: 'inline-block',
        width: '100%',
      }}
    >
      <motion.div
        className={className}
        style={{
          rotateX: rotateX,
          rotateY: rotateY,
          transformStyle: 'preserve-3d',
          willChange: 'transform',
        }}
        animate={{
          scale: isHovered ? 1.02 : 1,
          boxShadow: isHovered 
            ? '0 20px 40px rgba(99, 102, 241, 0.15), 0 0 20px rgba(168, 85, 247, 0.1)'
            : '0 4px 20px rgba(0, 0, 0, 0.3)'
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        <div style={{ transform: 'translateZ(20px)', transformStyle: 'preserve-3d' }}>
          {children}
        </div>
      </motion.div>
    </div>
  );
};

export default TiltCard;
