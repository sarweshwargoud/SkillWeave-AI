import React, { useState, useEffect, useRef } from 'react';
import './Splitter.css';

const Splitter = ({
  direction = 'horizontal',
  onResize,
  onDoubleClick,
  title = "Drag to resize (Double-click to toggle)"
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const startPosRef = useRef(0);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      if (direction === 'horizontal') {
        const deltaX = e.clientX - startPosRef.current;
        startPosRef.current = e.clientX;
        onResize(deltaX);
      } else {
        const deltaY = e.clientY - startPosRef.current;
        startPosRef.current = e.clientY;
        onResize(deltaY);
      }
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        document.body.classList.remove('is-resizing-h', 'is-resizing-v');
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, direction, onResize]);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    startPosRef.current = direction === 'horizontal' ? e.clientX : e.clientY;
    document.body.classList.add(direction === 'horizontal' ? 'is-resizing-h' : 'is-resizing-v');
  };

  return (
    <div
      className={`vscode-splitter ${direction} ${isDragging ? 'dragging' : ''}`}
      onMouseDown={handleMouseDown}
      onDoubleClick={onDoubleClick}
      title={title}
      role="separator"
      aria-orientation={direction}
    >
      <div className="splitter-handle-bar" />
    </div>
  );
};

export default Splitter;
