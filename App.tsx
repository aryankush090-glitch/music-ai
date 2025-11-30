import React, { useState, useEffect } from 'react';
import { Mic, Loader2, AlertCircle, Music4 } from 'lucide-react';
import { useAudioRecorder } from './hooks/useAudioRecorder';
import { identifySong } from './services/geminiService';
import { AppStatus, SongResult } from './types';
import Visualizer from './components/Visualizer';
import ResultCard from './components/ResultCard';

const App: React.FC = () => {
  const { isRecording, startRecording, stopRecording, audioBlob, mediaStream, error: recorderError } = useAudioRecorder();
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [result, setResult] = useState<SongResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-analyze when recording stops and we have a blob
  useEffect(() => {
    const analyzeAudio = async () => {
      if (audioBlob && status === AppStatus.RECORDING) {
        setStatus(AppStatus.ANALYZING);
        try {
          const songData = await identifySong(audioBlob);
          if (songData) {
            setResult(songData);
            setStatus(AppStatus.SUCCESS);
          } else {
            setError("Couldn't identify that song. Try getting closer to the audio source.");
            setStatus(AppStatus.ERROR);
          }
        } catch (e) {
          setError("Failed to connect to the music knowledge base. Please try again.");
          setStatus(AppStatus.ERROR);
        }
      }
    };

    if (audioBlob && !isRecording) {
        analyzeAudio();
    }
  }, [audioBlob, isRecording, status]);

  useEffect(() => {
    if (recorderError) {
      setError(recorderError);
      setStatus(AppStatus.ERROR);
    }
  }, [recorderError]);

  const handleStart = async () => {
    setError(null);
    setStatus(AppStatus.RECORDING);
    await startRecording();
    // Record for exactly 10 seconds then auto stop (increased from 6s for better accuracy)
    setTimeout(() => {
      stopRecording();
    }, 10000);
  };

  const handleReset = () => {
    setStatus(AppStatus.IDLE);
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#0f0f11] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* Ambient Background Glow */}
      <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[50%] h-[50%] bg-green-900/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="absolute top-6 left-0 right-0 flex justify-center z-10">
        <div className="flex items-center space-x-2 bg-white/5 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
          <Music4 className="w-5 h-5 text-purple-400" />
          <span className="font-bold tracking-wide text-sm">TUNEGEM AI</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-2xl flex flex-col items-center z-10">
        
        {status === AppStatus.IDLE && (
          <div className="text-center space-y-8 animate-[fadeIn_0.5s_ease-out]">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-white to-gray-500">
              What's that song?
            </h1>
            <p className="text-gray-400 text-lg md:text-xl max-w-md mx-auto">
              Tap the button and let AI listen to the music around you.
            </p>
            
            <button
              onClick={handleStart}
              className="group relative flex items-center justify-center w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 shadow-[0_0_40px_rgba(124,58,237,0.5)] hover:shadow-[0_0_60px_rgba(124,58,237,0.7)] transition-all duration-300 transform hover:scale-105 active:scale-95"
            >
              <Mic className="w-10 h-10 md:w-12 md:h-12 text-white group-hover:animate-pulse" />
              <div className="absolute inset-0 rounded-full border border-white/20 group-hover:scale-110 transition-transform duration-500" />
            </button>
          </div>
        )}

        {(status === AppStatus.RECORDING || status === AppStatus.ANALYZING) && (
          <div className="w-full space-y-8 animate-[fadeIn_0.5s_ease-out]">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-white mb-2">
                {status === AppStatus.RECORDING ? "Listening..." : "Analyzing..."}
              </h2>
              <p className="text-gray-400">
                {status === AppStatus.RECORDING 
                  ? "Hold your device close to the music source (10s)" 
                  : "Identifying the track and artist details"}
              </p>
            </div>

            <div className="relative">
              <Visualizer stream={mediaStream} isRecording={status === AppStatus.RECORDING} />
              
              {status === AppStatus.ANALYZING && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-2xl">
                  <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
                </div>
              )}
            </div>
            
            {status === AppStatus.RECORDING && (
                <div className="flex justify-center">
                    <button 
                        onClick={() => stopRecording()} 
                        className="text-sm text-gray-500 hover:text-white transition-colors"
                    >
                        Stop Listening Early
                    </button>
                </div>
            )}
          </div>
        )}

        {status === AppStatus.SUCCESS && result && (
          <ResultCard result={result} onReset={handleReset} />
        )}

        {status === AppStatus.ERROR && (
          <div className="text-center space-y-6 max-w-sm animate-[fadeIn_0.5s_ease-out]">
             <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
               <AlertCircle className="w-10 h-10 text-red-500" />
             </div>
            <h2 className="text-2xl font-bold text-white">Oops!</h2>
            <p className="text-gray-400">{error || "Something went wrong."}</p>
            <button
              onClick={handleReset}
              className="bg-white text-black font-bold py-3 px-8 rounded-full hover:bg-gray-200 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="absolute bottom-6 text-center text-xs text-gray-600">
        Powered by Gemini 2.5 Flash • Spotify & YouTube Data
      </footer>
    </div>
  );
};

export default App;