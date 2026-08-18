import fs from 'fs';
let code = fs.readFileSync('src/views/PremiumView.tsx', 'utf8');

const oldStandardCardEnd = `            <p className="text-[10px] text-neutral-400 text-center leading-relaxed">
              Your Spotify Premium account is active permanently. Terms apply.
            </p>
          </div>

          {/* Platinum / Unlimited Plan Card */}`;

const newStandardCardEnd = `            <p className="text-[10px] text-neutral-400 text-center leading-relaxed">
              Your Spotify Premium account is active permanently. Terms apply.
            </p>
          </motion.div>

          {/* Platinum / Unlimited Plan Card */}`;

code = code.replace(oldStandardCardEnd, newStandardCardEnd);
fs.writeFileSync('src/views/PremiumView.tsx', code);
console.log("Patched closing tag");
