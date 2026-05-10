'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from 'framer-motion';

/** Accent charte Afro-food (ocre) */
const ACCENT = '#C2610F';
const ACCENT_GLOW = 'rgba(194, 97, 15, 0.45)';

const DISHES = [
  {
    id: 1,
    name: 'Thiéboudienne',
    origin: 'Sénégal',
    emoji: '🐟',
    image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&q=80',
    color: '#c0622f',
    delay: 0,
    x: '62%',
    y: '8%',
    rotate: -8,
    scale: 1.05,
  },
  {
    id: 2,
    name: 'Mafé',
    origin: 'Mali',
    emoji: '🥩',
    image: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&q=80',
    color: '#7b3e0e',
    delay: 0.15,
    x: '76%',
    y: '42%',
    rotate: 6,
    scale: 0.9,
  },
  {
    id: 3,
    name: 'Ndolé',
    origin: 'Cameroun',
    emoji: '🌿',
    image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&q=80',
    color: '#3a6b35',
    delay: 0.3,
    x: '58%',
    y: '58%',
    rotate: -4,
    scale: 0.85,
  },
] as const;

type SpiceParticle = {
  id: number;
  size: number;
  x: number;
  y: number;
  duration: number;
  delay: number;
  opacity: number;
};

function buildSpices(): SpiceParticle[] {
  return Array.from({ length: 22 }, (_, i) => ({
    id: i,
    size: Math.random() * 5 + 2,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: Math.random() * 8 + 6,
    delay: Math.random() * 4,
    opacity: Math.random() * 0.4 + 0.1,
  }));
}

type Dish = (typeof DISHES)[number];
type HeroStat = { val: string; label: string };
type HeroProps = {
  stats?: HeroStat[];
};

function DishCard({
  dish,
  mouseX,
  mouseY,
}: {
  dish: Dish;
  mouseX: MotionValue<number>;
  mouseY: MotionValue<number>;
}) {
  const rotateX = useTransform(mouseY, [-300, 300], [12, -12]);
  const rotateY = useTransform(mouseX, [-300, 300], [-12, 12]);
  const springX = useSpring(rotateX, { stiffness: 80, damping: 20 });
  const springY = useSpring(rotateY, { stiffness: 80, damping: 20 });

  return (
    <motion.div
      initial={{ opacity: 0, y: 60, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: dish.scale }}
      transition={{
        duration: 1,
        delay: dish.delay + 0.8,
        ease: [0.16, 1, 0.3, 1],
      }}
      style={{
        position: 'absolute',
        left: dish.x,
        top: dish.y,
        perspective: '800px',
        zIndex: 20,
      }}
      whileHover={{ scale: dish.scale * 1.08, zIndex: 30 }}
    >
      <motion.div
        style={{
          rotateX: springX,
          rotateY: springY,
          rotateZ: dish.rotate,
          transformStyle: 'preserve-3d',
          borderRadius: '20px',
          overflow: 'hidden',
          width: '180px',
          boxShadow:
            '0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.15)',
          cursor: 'pointer',
        }}
      >
        <div style={{ height: '140px', overflow: 'hidden', position: 'relative' }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- URLs externes Unsplash */}
          <img
            src={dish.image}
            alt={dish.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(to bottom, transparent 50%, ${dish.color}99)`,
            }}
          />
        </div>
        <div
          style={{
            background: `${dish.color}dd`,
            backdropFilter: 'blur(12px)',
            padding: '10px 14px',
          }}
        >
          <p
            className="font-title"
            style={{
              color: '#fff',
              fontWeight: 700,
              fontSize: '14px',
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            {dish.emoji} {dish.name}
          </p>
          <p
            className="font-ui"
            style={{
              color: 'rgba(255,255,255,0.65)',
              fontSize: '11px',
              margin: '3px 0 0',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            {dish.origin}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Hero({ stats }: HeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [mounted, setMounted] = useState(false);
  const [spices, setSpices] = useState<SpiceParticle[]>([]);

  useEffect(() => {
    queueMicrotask(() => {
      setMounted(true);
      setSpices(buildSpices());
    });
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const wordVariants = useMemo(
    () => ({
      hidden: { opacity: 0, y: 40, skewY: 3 },
      visible: (i: number) => ({
        opacity: 1,
        y: 0,
        skewY: 0,
        transition: { duration: 0.7, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] as const },
      }),
    }),
    []
  );

  const headline = ['Savourez', "l'Afrique,", 'Livré', 'chez vous'];
  const displayStats: HeroStat[] = stats && stats.length
    ? stats
    : [
        { val: '40+', label: 'Plats africains' },
        { val: '4.9★', label: 'Note moyenne' },
        { val: '30 min', label: 'Livraison moyenne' },
      ];

  return (
    <>
      <style>{`
        .hero-grain::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
          pointer-events: none;
          z-index: 1;
          opacity: 0.6;
        }
        .badge-pulse {
          animation: pulse-badge 2.5s cubic-bezier(0.4,0,0.6,1) infinite;
        }
        @keyframes pulse-badge {
          0%, 100% { box-shadow: 0 0 0 0 ${ACCENT_GLOW}; }
          50% { box-shadow: 0 0 0 10px rgba(194, 97, 15, 0); }
        }
      `}</style>

      <section
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="hero-grain"
        style={{
          position: 'relative',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
          background: '#0e0802',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `
              radial-gradient(ellipse 70% 60% at 70% 40%, #5c2a0a33 0%, transparent 65%),
              radial-gradient(ellipse 50% 50% at 20% 80%, #2a150522 0%, transparent 60%),
              radial-gradient(ellipse 80% 40% at 50% 0%, #1a0b0211 0%, transparent 70%)
            `,
            zIndex: 0,
          }}
        />

        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: "url('https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1920&q=60')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(3px) brightness(0.12) saturate(1.4)',
            zIndex: 0,
            transform: 'scale(1.05)',
          }}
        />

        <motion.div
          initial={{ scaleY: 0, opacity: 0 }}
          animate={{ scaleY: 1, opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: 'absolute',
            left: '5%',
            top: '10%',
            bottom: '10%',
            width: '1px',
            background: `linear-gradient(to bottom, transparent, ${ACCENT}aa, transparent)`,
            zIndex: 2,
            transformOrigin: 'top',
          }}
        />

        {mounted &&
          spices.map((s) => (
            <motion.div
              key={s.id}
              style={{
                position: 'absolute',
                left: `${s.x}%`,
                top: `${s.y}%`,
                width: s.size,
                height: s.size,
                borderRadius: '50%',
                background: ACCENT,
                zIndex: 2,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [s.opacity, s.opacity * 2, s.opacity],
                scale: [1, 1.3, 1],
              }}
              transition={{
                duration: s.duration,
                delay: s.delay,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          ))}

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="badge-pulse"
          style={{
            position: 'absolute',
            top: '2rem',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 20,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255,255,255,0.05)',
            border: `0.5px solid ${ACCENT}66`,
            borderRadius: '100px',
            padding: '6px 16px',
            backdropFilter: 'blur(10px)',
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: ACCENT,
              display: 'inline-block',
            }}
          />
          <span
            className="font-ui"
            style={{
              color: 'rgba(255,255,255,0.75)',
              fontSize: '12px',
              letterSpacing: '0.08em',
            }}
          >
            Livraison disponible • Paris & Île-de-France
          </span>
        </motion.div>

        <div
          className="relative z-10 mx-auto grid w-full max-w-[1280px] grid-cols-1 items-center gap-10 px-[5%] pb-8 pt-24 lg:grid-cols-2 lg:gap-16 lg:px-[5%] lg:pl-[8%] lg:pb-0 lg:pt-0"
        >
          <div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mb-8 flex items-center gap-3 lg:mb-8"
            >
              <div style={{ width: '32px', height: '1px', background: ACCENT }} />
              <span
                className="font-ui font-light"
                style={{
                  color: ACCENT,
                  fontSize: '12px',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                }}
              >
                Cuisine africaine authentique
              </span>
            </motion.div>

            <h1 className="mb-8 overflow-hidden leading-[1.05]" style={{ margin: '0 0 2rem' }}>
              {headline.map((word, i) => (
                <motion.span
                  key={word}
                  custom={i}
                  variants={wordVariants}
                  initial="hidden"
                  animate="visible"
                  className="font-title inline-block font-black"
                  style={{
                    marginRight: '0.25em',
                    fontSize: 'clamp(2.5rem, 5.5vw, 5.5rem)',
                    color: i % 2 === 0 ? '#fff' : ACCENT,
                    fontStyle: i === 1 ? 'italic' : 'normal',
                  }}
                >
                  {word}
                </motion.span>
              ))}
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.9 }}
              className="font-ui mb-12 max-w-[420px] font-light leading-relaxed"
              style={{
                color: 'rgba(255,255,255,0.55)',
                fontSize: '1.1rem',
              }}
            >
              Découvrez une explosion de saveurs venues du Sénégal, du Cameroun, du Mali et d&apos;ailleurs —
              préparées avec amour, livrées en fraîcheur.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 1.1 }}
              className="flex flex-wrap items-center gap-4"
            >
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                <Link
                  href="/catalogue"
                  className="font-ui inline-flex items-center gap-2.5 rounded-full px-8 py-4 text-[15px] font-normal tracking-wide text-white no-underline shadow-lg transition hover:opacity-95"
                  style={{
                    background: ACCENT,
                    boxShadow: '0 8px 40px rgba(194,97,15,0.35)',
                  }}
                >
                  Explorer le menu
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                    <path
                      d="M1 7h12M8 2l5 5-5 5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Link>
              </motion.div>

              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                <Link
                  href="/#comment-ca-marche"
                  className="font-ui border-b border-white/20 py-4 text-sm font-light tracking-wide text-white/60 no-underline transition hover:text-white/90"
                >
                  Comment ça marche ?
                </Link>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1.4 }}
              className="mt-14 flex flex-wrap gap-10 border-t border-white/[0.08] pt-8"
            >
              {displayStats.map((stat) => (
                <div key={stat.label}>
                  <p className="font-title m-0 text-[1.6rem] font-bold" style={{ color: ACCENT }}>
                    {stat.val}
                  </p>
                  <p
                    className="font-ui mt-1 text-xs tracking-wide text-white/40"
                    style={{ margin: '3px 0 0' }}
                  >
                    {stat.label}
                  </p>
                </div>
              ))}
            </motion.div>
          </div>

          <div className="relative mx-auto hidden h-[min(520px,70vh)] w-full max-w-[480px] lg:mx-0 lg:block" style={{ height: '520px' }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.5, delay: 0.6 }}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                width: '280px',
                height: '280px',
                borderRadius: '50%',
                background: `radial-gradient(circle, ${ACCENT}22 0%, transparent 70%)`,
                filter: 'blur(20px)',
              }}
            />

            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                width: '320px',
                height: '320px',
                borderRadius: '50%',
                border: `0.5px solid ${ACCENT}26`,
              }}
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                width: '420px',
                height: '420px',
                borderRadius: '50%',
                border: `0.5px dashed ${ACCENT}14`,
              }}
            />

            {mounted &&
              DISHES.map((dish) => <DishCard key={dish.id} dish={dish} mouseX={mouseX} mouseY={mouseY} />)}

            <motion.div
              initial={{ opacity: 0, scale: 0, rotate: -20 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, delay: 1.6, type: 'spring', stiffness: 200 }}
              style={{
                position: 'absolute',
                left: '42%',
                top: '40%',
                zIndex: 25,
                background: ACCENT,
                borderRadius: '50%',
                width: '90px',
                height: '90px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 0 40px ${ACCENT}80`,
                cursor: 'default',
              }}
            >
              <span style={{ fontSize: '28px', lineHeight: 1 }}>🍽️</span>
              <span
                className="font-ui"
                style={{
                  color: '#fff',
                  fontSize: '9px',
                  letterSpacing: '0.1em',
                  marginTop: '3px',
                  textTransform: 'uppercase',
                }}
              >
                Afrique
              </span>
            </motion.div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 0.8 }}
          className="font-ui absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-2"
        >
          <span className="text-[10px] uppercase tracking-[0.2em] text-white/30">Défiler</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{
              width: '1px',
              height: '40px',
              background: `linear-gradient(to bottom, ${ACCENT}cc, transparent)`,
            }}
          />
        </motion.div>
      </section>
    </>
  );
}
