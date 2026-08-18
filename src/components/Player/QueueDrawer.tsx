import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { usePlayer } from '../../context/PlayerContext';
import { X, ListMusic, Trash2, ArrowUp, ArrowDown, Play, Music } from 'lucide-react';

export const QueueDrawer: React.FC = () => {
  const {
    track: currentTrack,
    queue,
    queueIndex,
    playQueueItem,
    removeFromQueue,
    reorderQueue,
    clearQueue,
    isQueueOpen,
    setIsQueueOpen,
  } = usePlayer();

  if (!isQueueOpen) return null;

  const upNextList = queue.slice(queueIndex + 1);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, x: '100%' }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="w-full sm:max-w-md h-[90vh] sm:h-full bg-neutral-900 border-l border-neutral-800 flex flex-col text-white shadow-2xl rounded-t-3xl sm:rounded-none"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-800 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <ListMusic className="w-5 h-5 text-emerald-500" />
              <h3 className="font-bold text-lg">Play Queue</h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 font-mono">
                {queue.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {queue.length > 1 && (
                <button
                  onClick={clearQueue}
                  title="Clear Queue"
                  className="p-2 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setIsQueueOpen(false)}
                className="p-2 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Queue List Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Currently Playing */}
            {currentTrack && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 px-2 mb-2">
                  Now Playing
                </h4>
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                  <img
                    src={currentTrack.images?.small || currentTrack.images?.medium || currentTrack.images?.large || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop&q=80'}
                    alt={currentTrack.title}
                    className="w-12 h-12 rounded-lg object-cover flex-shrink-0 shadow"
                  />
                  <div className="min-w-0 flex-1">
                    <h5 className="font-semibold text-sm truncate text-emerald-400">{currentTrack.title}</h5>
                    <p className="text-xs text-neutral-400 truncate">{currentTrack.artist}</p>
                  </div>
                  <div className="flex items-end gap-0.5 h-4 px-2">
                    <span className="w-1 bg-emerald-500 rounded-full h-full animate-pulse" />
                    <span className="w-1 bg-emerald-500 rounded-full h-2 animate-pulse delay-75" />
                    <span className="w-1 bg-emerald-500 rounded-full h-3 animate-pulse delay-150" />
                  </div>
                </div>
              </div>
            )}

            {/* Up Next List */}
            <div>
              <div className="flex items-center justify-between px-2 mb-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Next in Queue ({upNextList.length})
                </h4>
              </div>

              {upNextList.length > 0 ? (
                <div className="space-y-1">
                  {upNextList.map((t, idx) => {
                    const actualIndex = queueIndex + 1 + idx;
                    return (
                      <div
                        key={`${t.id}-${actualIndex}`}
                        className="group flex items-center justify-between p-2.5 rounded-xl hover:bg-neutral-800/60 transition-colors"
                      >
                        <div
                          onClick={() => playQueueItem(actualIndex)}
                          className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                        >
                          <img
                            src={t.images?.small || t.images?.medium || t.images?.large || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop&q=80'}
                            alt={t.title}
                            className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                          />
                          <div className="min-w-0 flex-1 pr-2">
                            <h5 className="font-medium text-sm truncate text-neutral-200 group-hover:text-white">
                              {t.title}
                            </h5>
                            <p className="text-xs text-neutral-400 truncate">{t.artist}</p>
                          </div>
                        </div>

                        {/* Reorder and Delete Actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {idx > 0 && (
                            <button
                              onClick={() => reorderQueue(actualIndex, actualIndex - 1)}
                              title="Move Up"
                              className="p-1 text-neutral-400 hover:text-white"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {idx < upNextList.length - 1 && (
                            <button
                              onClick={() => reorderQueue(actualIndex, actualIndex + 1)}
                              title="Move Down"
                              className="p-1 text-neutral-400 hover:text-white"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => removeFromQueue(actualIndex)}
                            title="Remove from queue"
                            className="p-1 text-neutral-400 hover:text-red-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-neutral-500 space-y-2">
                  <Music className="w-8 h-8 mx-auto text-neutral-600" />
                  <p className="text-sm">No songs queued up next</p>
                  <p className="text-xs text-neutral-500">
                    Use &ldquo;Add to Queue&rdquo; on any track to build your stream.
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
