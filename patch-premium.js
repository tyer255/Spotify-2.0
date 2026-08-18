import fs from 'fs';
let code = fs.readFileSync('src/views/PremiumView.tsx', 'utf8');

if (!code.includes("import { motion } from 'motion/react';")) {
  code = code.replace("import React from 'react';", "import React from 'react';\nimport { motion } from 'motion/react';");
}

const originalCard = `{/* PERMANENT ACTIVE STATUS CARD */}
        <div className="p-5 rounded-3xl bg-[#181818] border border-emerald-500/30 space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                <Check className="w-3.5 h-3.5 text-black stroke-[3]" />
              </div>
              <span className="text-lg font-bold text-white">Premium Active</span>
            </div>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Unlimited Lifetime
            </span>
          </div>

          <div className="pl-7 space-y-1">
            <p className="text-sm font-semibold text-neutral-200 flex items-center gap-1.5">
              <span>♾️</span>
              <span>Unlimited Lifetime Access</span>
            </p>
            <p className="text-xs text-neutral-400">
              Never Expires · No renewal or payment required
            </p>
          </div>
        </div>`;

const newCard = `{/* PERMANENT ACTIVE STATUS CARD */}
        <motion.div 
          initial={{ opacity: 0, y: 15, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative p-5 rounded-3xl bg-gradient-to-r from-emerald-900/40 via-[#181818] to-[#181818] border border-emerald-500/50 space-y-3 shadow-[0_0_20px_rgba(16,185,129,0.15)] overflow-hidden"
        >
          {/* Animated Gradient Sweep */}
          <motion.div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent skew-x-12"
            animate={{ left: ['-100%', '200%'] }}
            transition={{ duration: 2.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 1.5 }}
          />

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div 
                animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
                className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 shadow-[0_0_10px_rgba(16,185,129,0.6)]"
              >
                <Check className="w-4 h-4 text-black stroke-[3]" />
              </motion.div>
              <span className="text-xl font-black text-white tracking-tight">Premium Active</span>
            </div>
            <motion.span 
              animate={{ opacity: [0.8, 1, 0.8], boxShadow: ["0 0 0px rgba(52,211,153,0)", "0 0 12px rgba(52,211,153,0.5)", "0 0 0px rgba(52,211,153,0)"] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-[11px] font-black uppercase px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 shadow-sm"
            >
              Unlimited Lifetime
            </motion.span>
          </div>

          <div className="relative pl-10 space-y-1">
            <p className="text-sm font-bold text-emerald-100 flex items-center gap-1.5">
              <InfinityIcon className="w-4 h-4 text-emerald-400" />
              <span>Unlimited Lifetime Access</span>
            </p>
            <p className="text-xs text-neutral-400 font-medium">
              Never Expires · No renewal or payment required
            </p>
          </div>
        </motion.div>`;

code = code.replace(originalCard, newCard);
fs.writeFileSync('src/views/PremiumView.tsx', code);
console.log("Patched PremiumView");
