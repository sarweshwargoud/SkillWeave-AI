import { motion } from 'framer-motion';

const TypographicVideo = () => {
  const marqueeItems1 = [
    "AI ROADMAPS",
    "CONTINUITY VERIFIED",
    "ZERO CLICKBAIT",
    "STRUCTURED SYLLABUS",
    "TRANSCRIPT MATCHED",
    "SKILLWEAVE AI",
    "LEARN SEQUENTIALLY"
  ];

  const marqueeItems2 = [
    "MACHINE LEARNING",
    "NEXT.JS SAAS",
    "SYSTEM DESIGN",
    "PYTHON ARCHITECTURE",
    "DEEP LEARNING",
    "FULL STACK CLOUD",
    "VECTOR EMBEDDINGS"
  ];

  return (
    <div className="typo-video-wrapper">
      {/* Dynamic ambient studio glow */}
      <div className="typo-ambient-glow" />

      {/* Kinetic typographical ribbon 1 */}
      <div className="typo-marquee-track track-1">
        <motion.div
          className="typo-marquee-inner"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ repeat: Infinity, duration: 24, ease: "linear" }}
        >
          {[...marqueeItems1, ...marqueeItems1].map((text, i) => (
            <span key={i} className="typo-stream-text">
              {text} <span className="typo-bullet">•</span>
            </span>
          ))}
        </motion.div>
      </div>

      {/* Kinetic typographical ribbon 2 (Reverse direction & outline style) */}
      <div className="typo-marquee-track track-2">
        <motion.div
          className="typo-marquee-inner"
          animate={{ x: ["-50%", "0%"] }}
          transition={{ repeat: Infinity, duration: 28, ease: "linear" }}
        >
          {[...marqueeItems2, ...marqueeItems2].map((text, i) => (
            <span key={i} className="typo-stream-text outline-mode">
              {text} <span className="typo-bullet">•</span>
            </span>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default TypographicVideo;
