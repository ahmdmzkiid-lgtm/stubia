import React, { useState, useEffect, useRef } from 'react';

const ZoomableImage = ({ src, alt, className = '', containerClassName = '', onError }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const modalRef = useRef(null);
  const imgRef = useRef(null);

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden'; // prevent scrolling page
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const openModal = () => {
    setIsOpen(true);
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const closeModal = () => {
    setIsOpen(false);
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.25, 4));
  };

  const handleZoomOut = () => {
    setScale((prev) => {
      const nextScale = Math.max(prev - 0.25, 1);
      if (nextScale === 1) {
        setPosition({ x: 0, y: 0 }); // reset position if zoomed back out to 1x
      }
      return nextScale;
    });
  };

  const handleResetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleWheel = (e) => {
    e.stopPropagation();
    const zoomFactor = 0.1;
    const direction = e.deltaY < 0 ? 1 : -1;
    setScale((prev) => {
      const nextScale = Math.min(Math.max(prev + direction * zoomFactor, 1), 4);
      if (nextScale === 1) {
        setPosition({ x: 0, y: 0 });
      }
      return nextScale;
    });
  };

  const handleMouseDown = (e) => {
    if (scale === 1) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch Support
  const handleTouchStart = (e) => {
    if (scale === 1 || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
  };

  const handleTouchMove = (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setPosition({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  return (
    <>
      {/* Trigger Image */}
      <div className={`relative group cursor-zoom-in overflow-hidden rounded-xl inline-block ${containerClassName}`}>
        <img
          src={src}
          alt={alt}
          className={`${className} transition-all duration-300 group-hover:scale-[1.01] group-hover:brightness-95`}
          onClick={openModal}
          onError={onError}
          onContextMenu={(e) => e.preventDefault()}
          onDragStart={(e) => e.preventDefault()}
          style={{ userSelect: 'none', WebkitUserSelect: 'none', pointerEvents: 'auto' }}
        />
        {/* Overlay Hover Effect */}
        <div 
          onClick={openModal}
          className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none"
        >
          <div className="bg-black/60 text-white rounded-full px-3 py-1.5 backdrop-blur-sm shadow-md flex items-center gap-1.5 text-[11px] font-semibold scale-90 group-hover:scale-100 transition-all">
            <span className="material-symbols-outlined text-[16px]">zoom_in</span>
            Perbesar Gambar
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {isOpen && (
        <div
          ref={modalRef}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/85 backdrop-blur-md p-4 select-none animate-fade-in"
          onClick={closeModal}
          onWheel={handleWheel}
        >
          {/* Top Bar / Controls */}
          <div 
            className="absolute top-4 left-4 right-4 flex justify-between items-center z-10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image name / info */}
            <span className="text-white/80 text-[14px] font-semibold hidden sm:inline-block bg-black/35 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/5">
              {alt || 'Gambar Soal'}
            </span>

            {/* Controls */}
            <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 mx-auto sm:mr-0">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={scale === 1}
                className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/10 text-white transition-all disabled:opacity-30 disabled:hover:bg-transparent"
                title="Perkecil"
              >
                <span className="material-symbols-outlined">zoom_out</span>
              </button>
              <span className="text-white text-[12px] font-extrabold px-2 min-w-[50px] text-center font-mono">
                {Math.round(scale * 100)}%
              </span>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={scale === 4}
                className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/10 text-white transition-all disabled:opacity-30 disabled:hover:bg-transparent"
                title="Perbesar"
              >
                <span className="material-symbols-outlined">zoom_in</span>
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                disabled={scale === 1 && position.x === 0 && position.y === 0}
                className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/10 text-white transition-all disabled:opacity-30 disabled:hover:bg-transparent border-l border-white/10 ml-1 pl-1"
                title="Reset Zoom"
              >
                <span className="material-symbols-outlined">restart_alt</span>
              </button>
              <button
                type="button"
                onClick={closeModal}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-500/20 hover:bg-red-500/40 text-red-400 transition-all border-l border-white/10 ml-1 pl-1"
                title="Tutup"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          </div>

          {/* Large Image Container */}
          <div
            className="w-full h-full flex items-center justify-center overflow-hidden"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <img
              ref={imgRef}
              src={src}
              alt={alt}
              className={`max-w-full max-h-[85vh] object-contain transition-transform duration-75 select-none ${
                scale > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
              }`}
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              }}
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
              onClick={(e) => e.stopPropagation()}
              onContextMenu={(e) => e.preventDefault()}
              onDragStart={(e) => e.preventDefault()}
              onDoubleClick={(e) => {
                e.stopPropagation();
                if (scale > 1) {
                  handleResetZoom();
                } else {
                  setScale(2);
                }
              }}
            />
          </div>
          
          {/* Double click instruction */}
          <div className="absolute bottom-6 bg-black/45 text-white/60 px-4 py-2 rounded-xl text-[12px] font-medium pointer-events-none backdrop-blur-sm border border-white/5">
            Gunakan scroll wheel atau tombol di atas untuk zoom • Geser gambar untuk navigasi
          </div>
        </div>
      )}
    </>
  );
};

export default ZoomableImage;
