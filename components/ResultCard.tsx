import React, { useState } from 'react';
import { SongResult } from '../types';
import { ExternalLink, Music, Info, ThumbsUp, ThumbsDown, Check, AlertCircle, RefreshCw } from 'lucide-react';

interface ResultCardProps {
  result: SongResult;
  onReset: () => void;
}

const ResultCard: React.FC<ResultCardProps> = ({ result, onReset }) => {
  const [feedback, setFeedback] = useState<'yes' | 'no' | null>(null);

  const spotifySearchUrl = `https://open.spotify.com/search/${encodeURIComponent(`${result.title} ${result.artist}`)}`;

  // Filter useful links for display (e.g. youtube, spotify, genius, wikipedia)
  const usefulLinks = result.searchLinks?.filter(link => 
    link.includes('spotify') || link.includes('youtube') || link.includes('genius') || link.includes('wikipedia')
  ).slice(0, 3) || [];

  return (
    <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-3xl p-6 shadow-2xl animate-[fadeIn_0.5s_ease-out]">
      {/* Confidence Badge */}
      <div className="flex justify-end mb-4">
        <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider ${
          result.confidence > 80 ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
        }`}>
          {Math.round(result.confidence)}% MATCH
        </span>
      </div>

      {/* Main Info */}
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="relative group">
           {/* Decorative generic vinyl art since we don't have real album art API */}
           <div className="w-40 h-40 rounded-full bg-gradient-to-tr from-gray-700 to-gray-800 flex items-center justify-center shadow-lg group-hover:rotate-[360deg] transition-transform duration-[5s] ease-linear">
              <div className="w-36 h-36 rounded-full bg-black flex items-center justify-center border-4 border-gray-800">
                  <Music className="w-12 h-12 text-gray-500" />
              </div>
              {/* Center hole */}
              <div className="absolute w-4 h-4 bg-gray-900 rounded-full border border-gray-700"></div>
           </div>
        </div>
        
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">{result.title}</h2>
          <p className="text-lg text-gray-400 font-medium">{result.artist}</p>
          <p className="text-sm text-gray-500 uppercase tracking-widest mt-2">{result.genre}</p>
        </div>
      </div>

      {/* Fun Fact */}
      {result.funFact && (
        <div className="mt-6 bg-gray-800/50 p-4 rounded-xl border border-gray-700/50">
          <div className="flex items-start space-x-2">
            <Info className="w-4 h-4 text-purple-400 mt-1 flex-shrink-0" />
            <p className="text-sm text-gray-300 italic">"{result.funFact}"</p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-8 space-y-3">
        <a 
          href={spotifySearchUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center justify-center w-full bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold py-3 px-4 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <img src="https://storage.googleapis.com/pr-newsroom-wp/1/2018/11/Spotify_Logo_CMYK_Black.png" alt="Spotify" className="h-6 mr-2" />
          Play on Spotify
        </a>
        
        <button 
          onClick={onReset}
          className="w-full bg-transparent hover:bg-white/5 text-gray-400 font-semibold py-3 px-4 rounded-xl transition-colors border border-transparent hover:border-gray-700"
        >
          Identify Another Song
        </button>
      </div>

       {/* Feedback Section */}
       <div className="mt-6 pt-4 border-t border-gray-800 flex flex-col items-center min-h-[80px] justify-center">
         {!feedback ? (
           <div className="animate-[fadeIn_0.3s_ease-out] flex flex-col items-center">
             <p className="text-xs text-gray-500 mb-3">Is this correct?</p>
             <div className="flex space-x-4">
               <button 
                 onClick={() => setFeedback('yes')}
                 className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors text-sm border border-gray-700"
               >
                 <ThumbsUp className="w-3 h-3" />
                 <span>Yes</span>
               </button>
               <button 
                 onClick={() => setFeedback('no')}
                 className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors text-sm border border-gray-700"
               >
                 <ThumbsDown className="w-3 h-3" />
                 <span>No</span>
               </button>
             </div>
           </div>
         ) : feedback === 'yes' ? (
           <div className="text-sm flex items-center space-x-2 text-green-400 bg-green-500/10 px-4 py-2 rounded-full animate-[fadeIn_0.3s_ease-out]">
             <Check className="w-4 h-4" />
             <span>Glad we got it right!</span>
           </div>
         ) : (
           <div className="flex flex-col items-center space-y-3 w-full animate-[fadeIn_0.3s_ease-out]">
             <div className="text-sm flex items-center space-x-2 text-orange-400">
                <AlertCircle className="w-4 h-4" />
                <span>Incorrect? Let's try again.</span>
             </div>
             <button 
                onClick={onReset}
                className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium py-2 px-6 rounded-full transition-all border border-white/10 shadow-lg hover:shadow-xl hover:scale-105"
             >
                <RefreshCw className="w-3 h-3" />
                <span>Retry Recognition</span>
             </button>
           </div>
         )}
       </div>

       {/* Verified Sources */}
       {usefulLinks.length > 0 && (
        <div className="mt-4 text-center">
          <p className="text-[10px] uppercase tracking-wider text-gray-600 mb-2">Verified Sources</p>
          <div className="flex flex-wrap justify-center gap-2">
            {usefulLinks.map((link, i) => {
              let hostname = '';
              try { hostname = new URL(link).hostname.replace('www.', ''); } catch (e) { hostname = 'Link'; }
              return (
                <a 
                  key={i} 
                  href={link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 text-xs text-blue-400 hover:text-blue-300 bg-blue-500/10 px-2 py-1 rounded"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>{hostname}</span>
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultCard;