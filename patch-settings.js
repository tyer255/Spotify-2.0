import fs from 'fs';
let code = fs.readFileSync('src/views/SettingsView.tsx', 'utf8');

if (!code.includes("import { motion } from 'motion/react';")) {
  code = code.replace("import React, { useState } from 'react';", "import React, { useState } from 'react';\nimport { motion } from 'motion/react';");
}

const originalTile = `{/* Premium Active Status Tile */}
      <section
        onClick={() => onNavigate({ type: 'premium' })}
        className="p-5 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-neutral-900 to-neutral-900 border border-emerald-500/30 flex items-center justify-between gap-4 cursor-pointer hover:border-emerald-500/50 transition-all shadow-md group"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm sm:text-base text-white group-hover:text-emerald-400 transition-colors">
                Premium Active
              </h3>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Unlimited Lifetime
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Never Expires · View your active benefits and unlocked features
            </p>
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onNavigate({ type: 'premium' });
          }}
          className="px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-xs font-semibold text-neutral-200 flex-shrink-0 transition-colors"
        >
          View Status
        </button>
      </section>`;

const newTile = `{/* Premium Active Status Tile */}
      <motion.section
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.01 }}
        onClick={() => onNavigate({ type: 'premium' })}
        className="relative p-5 rounded-3xl bg-gradient-to-r from-emerald-950/60 via-neutral-900 to-neutral-900 border border-emerald-500/40 flex items-center justify-between gap-4 cursor-pointer hover:border-emerald-500/60 transition-all shadow-[0_0_15px_rgba(16,185,129,0.1)] group overflow-hidden"
      >
        {/* Animated Sweep */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent skew-x-12"
          animate={{ left: ['-100%', '200%'] }}
          transition={{ duration: 2.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 1.5 }}
        />

        <div className="relative flex items-center gap-3.5">
          <motion.div 
            animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
            className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
          >
            <Sparkles className="w-5 h-5" />
          </motion.div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm sm:text-base text-white group-hover:text-emerald-400 transition-colors">
                Premium Active
              </h3>
              <motion.span 
                animate={{ opacity: [0.8, 1, 0.8], boxShadow: ["0 0 0px rgba(52,211,153,0)", "0 0 8px rgba(52,211,153,0.5)", "0 0 0px rgba(52,211,153,0)"] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
              >
                Unlimited Lifetime
              </motion.span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Never Expires · View your active benefits and unlocked features
            </p>
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onNavigate({ type: 'premium' });
          }}
          className="relative px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-semibold text-white flex-shrink-0 transition-colors"
        >
          View Status
        </button>
      </motion.section>`;

code = code.replace(originalTile, newTile);
fs.writeFileSync('src/views/SettingsView.tsx', code);
console.log("Patched SettingsView");
