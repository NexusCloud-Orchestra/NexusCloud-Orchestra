import React, { useEffect, useRef } from 'react';

function NeuralBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let animationFrameId;
    let width = canvas.offsetWidth;
    let height = canvas.offsetHeight;
    
    canvas.width = width;
    canvas.height = height;

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      canvas.width = width;
      canvas.height = height;
    };
    
    window.addEventListener('resize', handleResize);

    const particles = [];
    const particleCount = 42;
    const connectionDistance = 90;
    
    class Particle {
      constructor() {
        this.radius = Math.random() * 2 + 2; // slightly larger for collision visibility
        this.x = Math.random() * (width - this.radius * 2) + this.radius;
        this.y = Math.random() * (height - this.radius * 2) + this.radius;
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = (Math.random() - 0.5) * 0.4;
        this.hue = Math.floor(Math.random() * 360); // individual color
      }
      
      update() {
        this.x += this.vx;
        this.y += this.vy;
        
        if (this.x < this.radius || this.x > width - this.radius) this.vx = -this.vx;
        if (this.y < this.radius || this.y > height - this.radius) this.vy = -this.vy;
      }
      
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${this.hue}, 85%, 65%, 0.55)`;
        ctx.fill();
      }
    }
    
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }
    
    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Update particles
      particles.forEach(p => p.update());
      
      // Check collision and draw connections
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          // Collision: particles meet!
          const minDist = p1.radius + p2.radius + 1.5; // slight tolerance
          if (dist < minDist) {
            // Elastic collision simulation: swap velocities
            const tempVx = p1.vx;
            const tempVy = p1.vy;
            p1.vx = p2.vx;
            p1.vy = p2.vy;
            p2.vx = tempVx;
            p2.vy = tempVy;
            
            // Separate overlapping particles
            const overlap = minDist - dist;
            const sx = (dx / (dist || 1)) * overlap * 0.5;
            const sy = (dy / (dist || 1)) * overlap * 0.5;
            p1.x += sx;
            p1.y += sy;
            p2.x -= sx;
            p2.y -= sy;
            
            // Meet event: assign a new random color hue
            p1.hue = (p1.hue + 80) % 360;
            p2.hue = (p2.hue + 80) % 360;
          }
          
          // Draw connection lines as gradient between the meeting/neighboring particles
          if (dist < connectionDistance) {
            const alpha = (1 - dist / connectionDistance) * 0.15;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            
            const grad = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
            grad.addColorStop(0, `hsla(${p1.hue}, 85%, 65%, ${alpha})`);
            grad.addColorStop(1, `hsla(${p2.hue}, 85%, 65%, ${alpha})`);
            
            ctx.strokeStyle = grad;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }
      
      // Draw particles
      particles.forEach(p => p.draw());
      
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1,
      }}
    />
  );
}

export default NeuralBackground;
