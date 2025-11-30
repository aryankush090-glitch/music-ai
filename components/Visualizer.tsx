import React, { useEffect, useRef } from 'react';

interface VisualizerProps {
  stream: MediaStream | null;
  isRecording: boolean;
}

const Visualizer: React.FC<VisualizerProps> = ({ stream, isRecording }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  useEffect(() => {
    if (!stream || !isRecording || !canvasRef.current) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      return;
    }

    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyserRef.current = analyser;

    const source = ctx.createMediaStreamSource(stream);
    source.connect(analyser);
    sourceRef.current = source;

    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      const width = canvas.width;
      const height = canvas.height;

      canvasCtx.clearRect(0, 0, width, height);

      // Create a gradient
      const gradient = canvasCtx.createLinearGradient(0, height, 0, 0);
      gradient.addColorStop(0, '#1DB954'); // Spotify Green
      gradient.addColorStop(1, '#A855F7'); // Purple

      canvasCtx.fillStyle = gradient;

      const barWidth = (width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * height;

        // Draw rounded bars
        canvasCtx.beginPath();
        canvasCtx.roundRect(x, height - barHeight, barWidth, barHeight, [4, 4, 0, 0]);
        canvasCtx.fill();

        x += barWidth + 1;
      }
    };

    draw();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (sourceRef.current) sourceRef.current.disconnect();
      // We don't close the context here to reuse it, or we could close it.
    };
  }, [stream, isRecording]);

  // Clean up context on unmount
  useEffect(() => {
    return () => {
       if (audioContextRef.current) {
         audioContextRef.current.close();
         audioContextRef.current = null;
       }
    }
  }, []);

  return (
    <div className="w-full h-48 md:h-64 bg-gray-900/50 rounded-2xl overflow-hidden border border-gray-800 shadow-inner relative">
       {!isRecording && (
         <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">
           Visualizer waiting for audio...
         </div>
       )}
      <canvas
        ref={canvasRef}
        width={800}
        height={300}
        className="w-full h-full object-cover"
      />
    </div>
  );
};

export default Visualizer;