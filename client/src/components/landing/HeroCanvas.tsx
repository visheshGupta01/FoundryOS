import React, { useEffect, useRef } from 'react';

interface SynapseParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseRadius: number;
  radius: number;
  alpha: number;
  pulsePhase: number;
  isSpecialNode?: boolean;
  avatarText?: string;
  glowColor: string;
}

interface SynapticPulse {
  sourceIdx: number;
  targetIdx: number;
  progress: number;
  speed: number;
  color: string;
}

export const HeroCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 700);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener('resize', handleResize);

    const mouse = { x: -1000, y: -1000, active: false };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.active = false;
      mouse.x = -1000;
      mouse.y = -1000;
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    const particles: SynapseParticle[] = [];
    const pulses: SynapticPulse[] = [];

    const specialistLabels = ['CS', 'MR', 'CA', 'GH', 'SC', 'BP', 'MEM', 'MCP'];
    const accentPalettes = [
      '#ffffff',
      '#f5f5f5',
      '#e5e5e5',
      '#d4d4d4',
      '#cccccc'
    ];

    const particleCount = Math.min(Math.floor((width * height) / 12000), 70);
    const connectionMaxDist = 150;

    for (let i = 0; i < particleCount; i++) {
      const isSpecial = i < specialistLabels.length;
      const palette = accentPalettes[i % accentPalettes.length];

      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        baseRadius: isSpecial ? 5.5 : Math.random() * 1.5 + 1.2,
        radius: isSpecial ? 5.5 : Math.random() * 1.5 + 1.2,
        alpha: isSpecial ? 0.9 : Math.random() * 0.4 + 0.3,
        pulsePhase: Math.random() * Math.PI * 2,
        isSpecialNode: isSpecial,
        avatarText: isSpecial ? specialistLabels[i] : undefined,
        glowColor: palette
      });
    }

    // Spawn synaptic energy pulses between random connected pairs
    const spawnPulse = () => {
      if (pulses.length > 25) return;
      const srcIdx = Math.floor(Math.random() * particles.length);
      const candidates: number[] = [];

      for (let j = 0; j < particles.length; j++) {
        if (srcIdx === j) continue;
        const dx = particles[srcIdx].x - particles[j].x;
        const dy = particles[srcIdx].y - particles[j].y;
        if (Math.sqrt(dx * dx + dy * dy) < connectionMaxDist) {
          candidates.push(j);
        }
      }

      if (candidates.length > 0) {
        const tgtIdx = candidates[Math.floor(Math.random() * candidates.length)];
        pulses.push({
          sourceIdx: srcIdx,
          targetIdx: tgtIdx,
          progress: 0,
          speed: Math.random() * 0.015 + 0.012,
          color: particles[srcIdx].glowColor
        });
      }
    };

    let pulseTimer = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      pulseTimer++;
      if (pulseTimer % 18 === 0) {
        spawnPulse();
      }

      // 1. Update & draw particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.pulsePhase += 0.03;

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        else if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        else if (p.y > height) p.y = 0;

        // Interactive cursor repulsion / magnetics
        if (mouse.active) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 140) {
            const force = (1 - dist / 140) * 1.5;
            p.x -= (dx / dist) * force;
            p.y -= (dy / dist) * force;
            p.radius = p.baseRadius * 1.4;
          } else {
            p.radius = p.baseRadius + Math.sin(p.pulsePhase) * 0.5;
          }
        } else {
          p.radius = p.baseRadius + Math.sin(p.pulsePhase) * 0.5;
        }

        // Draw particle glow
        if (p.isSpecialNode) {
          const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 4);
          gradient.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
          gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.10)');
          gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * 4, 0, Math.PI * 2);
          ctx.fillStyle = gradient;
          ctx.fill();

          // Core node
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = p.glowColor;
          ctx.fill();

          // Border ring
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius + 2, 0, Math.PI * 2);
          ctx.strokeStyle = '#ffffff88';
          ctx.lineWidth = 1;
          ctx.stroke();

          // Node label text
          if (p.avatarText) {
            ctx.font = 'bold 8px JetBrains Mono, monospace';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(p.avatarText, p.x, p.y - 12);
          }
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
          ctx.fill();
        }
      }

      // 2. Draw neural connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const p1 = particles[i];
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectionMaxDist) {
            const alpha = (1 - dist / connectionMaxDist) * 0.22;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.lineWidth = p1.isSpecialNode || p2.isSpecialNode ? 1.1 : 0.65;
            ctx.stroke();
          }
        }
      }

      // 3. Update & render traveling synaptic energy pulses
      for (let k = pulses.length - 1; k >= 0; k--) {
        const pulse = pulses[k];
        pulse.progress += pulse.speed;

        if (pulse.progress >= 1) {
          pulses.splice(k, 1);
          continue;
        }

        const p1 = particles[pulse.sourceIdx];
        const p2 = particles[pulse.targetIdx];
        if (!p1 || !p2) continue;

        const curX = p1.x + (p2.x - p1.x) * pulse.progress;
        const curY = p1.y + (p2.y - p1.y) * pulse.progress;

        // Draw traveling photon
        ctx.beginPath();
        ctx.arc(curX, curY, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = pulse.color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (canvas) {
        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('mouseleave', handleMouseLeave);
      }
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />;
};
