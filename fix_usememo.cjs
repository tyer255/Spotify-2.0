const fs = require('fs');
let code = fs.readFileSync('src/components/Player/TabletRightPlayer.tsx', 'utf8');

code = code.replace(
  "import React, { useState, useEffect } from 'react';",
  "import React, { useState, useEffect, useMemo } from 'react';"
);

// If that wasn't the exact line:
code = code.replace(
  "import { useState, useEffect } from 'react';",
  "import { useState, useEffect, useMemo } from 'react';"
);

fs.writeFileSync('src/components/Player/TabletRightPlayer.tsx', code);
