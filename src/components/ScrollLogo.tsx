"use client";

import React, { useEffect, useRef } from "react";

interface ScrollLogoProps {
  src?: string;
  frames?: string[];
  frameCount?: number;
  framePattern?: (index: number) => string;
  className?: string;
  width?: number;
  height?: number;
  alt?: string;
}

/**
 * ScrollLogo - High-performance canvas-based scroll-driven logo renderer.
 * 
 * Performance guarantees:
 * 1. Exactly ONE <canvas> node rendered to DOM (0 <img> tags).
 * 2. Preloads images in background into memory using JS Image objects.
 * 3. Scroll tracking uses useRef - NEVER triggers React re-renders or setState on scroll.
 * 4. Drawing uses requestAnimationFrame throttled to screen refresh rate.
 */
export default function ScrollLogo({
  src = "/logo.png",
  frames,
  frameCount = 1,
  framePattern,
  className = "w-48 h-48 md:w-64 md:h-64 mx-auto",
  width = 256,
  height = 256,
  alt = "Shahe Madeena Logo",
}: ScrollLogoProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const scrollProgressRef = useRef<number>(0);
  const rafIdRef = useRef<number | null>(null);
  const isLoadedRef = useRef<boolean>(false);

  // Determine list of image URLs to preload
  const imageUrls: string[] = React.useMemo(() => {
    if (frames && frames.length > 0) return frames;
    if (framePattern && frameCount > 1) {
      return Array.from({ length: frameCount }, (_, i) => framePattern(i));
    }
    return [src];
  }, [src, frames, frameCount, framePattern]);

  // Preload images into memory (JS Image objects, NOT DOM elements)
  useEffect(() => {
    let active = true;
    const loadedImages: HTMLImageElement[] = [];
    let loadedCount = 0;

    imageUrls.forEach((url, index) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = url;
      img.onload = () => {
        if (!active) return;
        loadedCount++;
        if (loadedCount === imageUrls.length) {
          isLoadedRef.current = true;
          scheduleDraw();
        }
      };
      img.onerror = () => {
        if (!active) return;
        loadedCount++;
        if (loadedCount === imageUrls.length) {
          isLoadedRef.current = true;
          scheduleDraw();
        }
      };
      loadedImages[index] = img;
    });

    imagesRef.current = loadedImages;

    return () => {
      active = false;
    };
  }, [imageUrls]);

  // Drawing routine using canvas context
  const draw = () => {
    rafIdRef.current = null;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const images = imagesRef.current;
    if (images.length === 0) return;

    // Determine current frame or scale/rotation from scroll progress
    const progress = Math.max(0, Math.min(1, scrollProgressRef.current));
    const totalFrames = images.length;
    const frameIndex = totalFrames > 1 
      ? Math.min(Math.floor(progress * totalFrames), totalFrames - 1)
      : 0;

    const img = images[frameIndex];
    if (!img || !img.complete || img.naturalWidth === 0) return;

    const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1;
    const targetWidth = width * dpr;
    const targetHeight = height * dpr;

    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
    }

    ctx.save();
    ctx.clearRect(0, 0, targetWidth, targetHeight);

    if (totalFrames > 1) {
      // Direct frame sequence render
      const scale = Math.min(targetWidth / img.naturalWidth, targetHeight / img.naturalHeight);
      const drawW = img.naturalWidth * scale;
      const drawH = img.naturalHeight * scale;
      const offsetX = (targetWidth - drawW) / 2;
      const offsetY = (targetHeight - drawH) / 2;
      ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
    } else {
      // Single logo: subtle responsive scroll interaction (scale/float smoothly with zero re-renders)
      const scaleFactor = 1 - progress * 0.12;
      const imgAspect = img.naturalWidth / img.naturalHeight;
      let drawW = targetWidth * 0.9 * scaleFactor;
      let drawH = drawW / imgAspect;

      if (drawH > targetHeight * 0.9) {
        drawH = targetHeight * 0.9 * scaleFactor;
        drawW = drawH * imgAspect;
      }

      const offsetX = (targetWidth - drawW) / 2;
      const offsetY = (targetHeight - drawH) / 2;

      ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
    }

    ctx.restore();
  };

  const scheduleDraw = () => {
    if (rafIdRef.current === null) {
      rafIdRef.current = requestAnimationFrame(draw);
    }
  };

  // Scroll Listener using passive listener and useRef - strictly NO setState
  useEffect(() => {
    const calculateScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset || 0;
      const maxScroll = Math.max(
        document.documentElement.scrollHeight - window.innerHeight,
        300
      );
      scrollProgressRef.current = Math.min(Math.max(scrollY / maxScroll, 0), 1);
      scheduleDraw();
    };

    // Initial draw
    calculateScroll();

    window.addEventListener("scroll", calculateScroll, { passive: true });
    window.addEventListener("resize", scheduleDraw, { passive: true });

    return () => {
      window.removeEventListener("scroll", calculateScroll);
      window.removeEventListener("resize", scheduleDraw);
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [width, height]);

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Exactly ONE canvas element in the DOM */}
      <canvas
        ref={canvasRef}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          maxWidth: "100%",
          maxHeight: "100%",
        }}
        aria-label={alt}
        role="img"
        className="pointer-events-none drop-shadow-xl"
      />
    </div>
  );
}
