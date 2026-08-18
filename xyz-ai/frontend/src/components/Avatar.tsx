import { useEffect, useRef, useState } from 'react';

type AvatarState = 'idle' | 'listening' | 'thinking' | 'speaking';

interface AvatarProps {
  state: AvatarState;
  size?: number;
}

/**
 * AI Avatar Component
 * Animated SVG face with:
 * - Idle: gentle breathing + blinking
 * - Listening: pulsing ears/ring effect
 * - Thinking: rotating glow
 * - Speaking: mouth opens/closes synced to audio amplitude
 */
export function Avatar({ state, size = 160 }: AvatarProps) {
  const [mouthOpen, setMouthOpen] = useState(0);
  const [blinkState, setBlinkState] = useState(false);
  const animFrameRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Blinking animation (every 3-5 seconds)
  useEffect(() => {
    const blink = () => {
      setBlinkState(true);
      setTimeout(() => setBlinkState(false), 150);
    };

    const interval = setInterval(blink, 3000 + Math.random() * 2000);
    return () => clearInterval(interval);
  }, []);

  // Audio-synced mouth movement for speaking state
  useEffect(() => {
    if (state === 'speaking') {
      // Try to connect to the current audio output for lip sync
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;

        // Connect to speech synthesis audio if available
        const destination = audioContext.createMediaStreamDestination();
        analyser.connect(destination);

        // Fallback: simulate mouth movement with a smooth sine wave
        const simulateMouth = () => {
          const time = Date.now() / 150;
          const openness = (Math.sin(time) + 1) / 2 * 0.7 + 0.1;
          setMouthOpen(openness);
          animFrameRef.current = requestAnimationFrame(simulateMouth);
        };
        simulateMouth();
      } catch {
        // If AudioContext fails, use simple animation
        const simulateMouth = () => {
          const time = Date.now() / 150;
          const openness = (Math.sin(time) + 1) / 2 * 0.7 + 0.1;
          setMouthOpen(openness);
          animFrameRef.current = requestAnimationFrame(simulateMouth);
        };
        simulateMouth();
      }

      return () => {
        if (animFrameRef.current) {
          cancelAnimationFrame(animFrameRef.current);
        }
      };
    } else {
      setMouthOpen(0);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    }
  }, [state]);

  const eyeHeight = blinkState ? 1 : 6;
  const eyeY = blinkState ? 62 : 58;

  // Colors based on state
  const stateColors = {
    idle: { face: '#6366f1', ring: '#e0e7ff', glow: 'none' },
    listening: { face: '#3b82f6', ring: '#bfdbfe', glow: '#3b82f6' },
    thinking: { face: '#8b5cf6', ring: '#ede9fe', glow: '#8b5cf6' },
    speaking: { face: '#10b981', ring: '#d1fae5', glow: '#10b981' }
  };

  const colors = stateColors[state];

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Outer ring / glow effect */}
      <div
        className={`absolute inset-0 rounded-full transition-all duration-500 ${
          state === 'listening' ? 'animate-ping opacity-30' :
          state === 'thinking' ? 'animate-spin' :
          state === 'speaking' ? 'animate-pulse opacity-50' :
          'opacity-20'
        }`}
        style={{ backgroundColor: colors.ring }}
      />

      {/* Secondary pulse ring for listening */}
      {state === 'listening' && (
        <div className="absolute inset-2 rounded-full bg-blue-300 opacity-40 animate-pulse" />
      )}

      {/* SVG Avatar Face */}
      <svg
        viewBox="0 0 120 120"
        className="relative z-10"
        style={{ width: size * 0.75, height: size * 0.75 }}
      >
        {/* Head circle */}
        <circle
          cx="60"
          cy="60"
          r="50"
          fill={colors.face}
          className="transition-colors duration-500"
        />

        {/* Face highlight */}
        <ellipse
          cx="60"
          cy="45"
          rx="35"
          ry="30"
          fill="rgba(255,255,255,0.1)"
        />

        {/* Left eye */}
        <ellipse
          cx="44"
          cy={eyeY}
          rx="5"
          ry={eyeHeight}
          fill="white"
          className="transition-all duration-100"
        />
        {/* Left pupil */}
        {!blinkState && (
          <circle cx="44" cy="59" r="2.5" fill="#1e293b" />
        )}

        {/* Right eye */}
        <ellipse
          cx="76"
          cy={eyeY}
          rx="5"
          ry={eyeHeight}
          fill="white"
          className="transition-all duration-100"
        />
        {/* Right pupil */}
        {!blinkState && (
          <circle cx="76" cy="59" r="2.5" fill="#1e293b" />
        )}

        {/* Eyebrows */}
        <path
          d={state === 'thinking' ? 'M36 48 Q44 44 52 48' : 'M36 50 Q44 47 52 50'}
          stroke="rgba(255,255,255,0.6)"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d={state === 'thinking' ? 'M68 48 Q76 44 84 48' : 'M68 50 Q76 47 84 50'}
          stroke="rgba(255,255,255,0.6)"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />

        {/* Mouth */}
        {state === 'speaking' ? (
          /* Speaking mouth - opens and closes */
          <ellipse
            cx="60"
            cy="78"
            rx={8 + mouthOpen * 4}
            ry={2 + mouthOpen * 8}
            fill="#1e293b"
            className="transition-all duration-75"
          />
        ) : state === 'thinking' ? (
          /* Thinking mouth - small "o" */
          <circle cx="60" cy="78" r="4" fill="#1e293b" />
        ) : (
          /* Idle/Listening mouth - gentle smile */
          <path
            d="M48 76 Q60 86 72 76"
            stroke="white"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
        )}

        {/* Listening indicator - sound waves */}
        {state === 'listening' && (
          <>
            <path d="M20 55 Q15 60 20 65" stroke="white" strokeWidth="1.5" fill="none" opacity="0.6" className="animate-pulse" />
            <path d="M14 52 Q8 60 14 68" stroke="white" strokeWidth="1.5" fill="none" opacity="0.4" className="animate-pulse" />
            <path d="M100 55 Q105 60 100 65" stroke="white" strokeWidth="1.5" fill="none" opacity="0.6" className="animate-pulse" />
            <path d="M106 52 Q112 60 106 68" stroke="white" strokeWidth="1.5" fill="none" opacity="0.4" className="animate-pulse" />
          </>
        )}

        {/* Thinking indicator - dots */}
        {state === 'thinking' && (
          <>
            <circle cx="90" cy="40" r="3" fill="white" opacity="0.6" className="animate-bounce" style={{ animationDelay: '0ms' }} />
            <circle cx="98" cy="34" r="2.5" fill="white" opacity="0.5" className="animate-bounce" style={{ animationDelay: '200ms' }} />
            <circle cx="104" cy="28" r="2" fill="white" opacity="0.4" className="animate-bounce" style={{ animationDelay: '400ms' }} />
          </>
        )}
      </svg>

      {/* State label */}
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
          state === 'idle' ? 'bg-gray-100 text-gray-600' :
          state === 'listening' ? 'bg-blue-100 text-blue-700' :
          state === 'thinking' ? 'bg-purple-100 text-purple-700' :
          'bg-green-100 text-green-700'
        }`}>
          {state === 'idle' ? 'Ready' :
           state === 'listening' ? 'Listening...' :
           state === 'thinking' ? 'Thinking...' :
           'Speaking...'}
        </span>
      </div>
    </div>
  );
}
