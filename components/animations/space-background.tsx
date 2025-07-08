"use client";

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

interface SpaceBackgroundProps {
  className?: string;
}

export const SpaceBackground: React.FC<SpaceBackgroundProps> = ({ className }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Setup scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x050714, 1);
    containerRef.current.appendChild(renderer.domElement);

    // Create stars
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.1,
      transparent: true,
    });

    const starsVertices = [];
    for (let i = 0; i < 15000; i++) {
      const x = (Math.random() - 0.5) * 2000;
      const y = (Math.random() - 0.5) * 2000;
      const z = (Math.random() - 0.5) * 2000;
      starsVertices.push(x, y, z);
    }

    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);

    // Create pixel cloud
    const pixelCount = 500;
    const pixelGeometry = new THREE.BufferGeometry();
    const pixelPositions = new Float32Array(pixelCount * 3);
    const pixelColors = new Float32Array(pixelCount * 3);
    
    for (let i = 0; i < pixelCount; i++) {
      const i3 = i * 3;
      pixelPositions[i3] = (Math.random() - 0.5) * 10;
      pixelPositions[i3 + 1] = (Math.random() - 0.5) * 10;
      pixelPositions[i3 + 2] = (Math.random() - 0.5) * 10 - 5;

      // Colors between blue and purple
      pixelColors[i3] = Math.random() * 0.2;
      pixelColors[i3 + 1] = Math.random() * 0.3; 
      pixelColors[i3 + 2] = Math.random() * 0.5 + 0.5;
    }

    pixelGeometry.setAttribute('position', new THREE.BufferAttribute(pixelPositions, 3));
    pixelGeometry.setAttribute('color', new THREE.BufferAttribute(pixelColors, 3));

    const pixelMaterial = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
    });

    const pixels = new THREE.Points(pixelGeometry, pixelMaterial);
    scene.add(pixels);

    // Animation loop
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);

      stars.rotation.y += 0.0001;
      stars.rotation.z += 0.0001;

      // Animate pixel cloud
      pixels.rotation.y += 0.002;
      
      const positions = pixelGeometry.attributes.position.array as Float32Array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] += Math.sin(Date.now() * 0.001 + positions[i]) * 0.001;
      }
      pixelGeometry.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };

    // Handle resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    animate();

    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', handleResize);
      if (containerRef.current && containerRef.current.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement);
      }
      scene.remove(stars);
      scene.remove(pixels);
      starsGeometry.dispose();
      starsMaterial.dispose();
      pixelGeometry.dispose();
      pixelMaterial.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className={`fixed top-0 left-0 w-full h-full -z-10 ${className}`}
      aria-hidden="true"
    />
  );
};