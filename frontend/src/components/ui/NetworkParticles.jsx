import { useEffect, useRef, useState } from 'react';


export function NetworkParticles() {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  
  useEffect(() => {
    // Canvas animation logic
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Check for reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    let animationFrameId;
    let particles = [];
    
    const mouse = {
      x: null,
      y: null,
      radius: 150
    };

    const handleMouseMove = (event) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = event.clientX - rect.left;
      mouse.y = event.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouse.x = null;
      mouse.y = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseout', handleMouseLeave);

    const resize = () => {
      if (!containerRef.current) return;
      canvas.width = containerRef.current.clientWidth;
      canvas.height = containerRef.current.clientHeight;
      init();
    };

    window.addEventListener('resize', resize);

    class Particle {
      constructor(x, y, directionX, directionY, size, color) {
        this.x = x;
        this.y = y;
        this.directionX = directionX;
        this.directionY = directionY;
        this.size = size;
        this.color = color;
      }
      
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
      }
      
      update() {
        if (this.x > canvas.width || this.x < 0) {
          this.directionX = -this.directionX;
        }
        if (this.y > canvas.height || this.y < 0) {
          this.directionY = -this.directionY;
        }
        
        // Move particle
        this.x += this.directionX;
        this.y += this.directionY;
        
        this.draw();
      }
    }

    const init = () => {
      particles = [];
      const numberOfParticles = (canvas.height * canvas.width) / 10000;
      
      const isDark = document.documentElement.classList.contains('dark');
      // Higher opacity and density for more visibility
      const color = isDark ? 'rgba(99, 102, 241, 0.8)' : 'rgba(79, 70, 229, 0.7)';

      for (let i = 0; i < numberOfParticles; i++) {
        const size = (Math.random() * 2.8) + 1.5;
        const x = (Math.random() * ((canvas.width - size * 2) - (size * 2)) + size * 2);
        const y = (Math.random() * ((canvas.height - size * 2) - (size * 2)) + size * 2);
        const directionX = (Math.random() * 0.4) - 0.2;
        const directionY = (Math.random() * 0.4) - 0.2;
        
        particles.push(new Particle(x, y, directionX, directionY, size, color));
      }
    };

    const connect = () => {
      let opacityValue = 1;
      const isDark = document.documentElement.classList.contains('dark');
      
      for (let a = 0; a < particles.length; a++) {
        for (let b = a; b < particles.length; b++) {
          const distance = ((particles[a].x - particles[b].x) * (particles[a].x - particles[b].x))
            + ((particles[a].y - particles[b].y) * (particles[a].y - particles[b].y));
            
          if (distance < 25000) {
            opacityValue = 1 - (distance / 25000);
            ctx.strokeStyle = isDark ? `rgba(99, 102, 241, ${opacityValue * 0.6})` : `rgba(99, 102, 241, ${opacityValue * 0.4})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particles[a].x, particles[a].y);
            ctx.lineTo(particles[b].x, particles[b].y);
            ctx.stroke();
          }
        }
        
        // Mouse connection
        if (mouse.x && mouse.y) {
          const dx = mouse.x - particles[a].x;
          const dy = mouse.y - particles[a].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < mouse.radius) {
            ctx.beginPath();
            ctx.strokeStyle = isDark ? `rgba(124, 58, 237, ${1 - distance/mouse.radius})` : `rgba(124, 58, 237, ${(1 - distance/mouse.radius) * 0.7})`;
            ctx.lineWidth = 1.5;
            ctx.moveTo(particles[a].x, particles[a].y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
          }
        }
      }
    };

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
      }
      connect();
    };

    resize();
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseout', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
      />
    </div>
  );
}

export default NetworkParticles;
