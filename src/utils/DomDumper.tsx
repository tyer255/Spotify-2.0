import { useEffect } from 'react';

export const DomDumper = () => {
  useEffect(() => {
    setTimeout(() => {
      const fixedBottom = document.querySelector('[class*="fixed"][class*="bottom-0"]');
      console.log('DOM_DUMP_FIXED_BOTTOM:', fixedBottom ? fixedBottom.className : 'NOT FOUND');
      
      const sidebar = document.querySelector('nav');
      console.log('DOM_DUMP_SIDEBAR:', sidebar ? sidebar.className : 'NOT FOUND');
      
      const grids = document.querySelectorAll('.grid');
      const gridClasses = Array.from(grids).map(g => g.className);
      console.log('DOM_DUMP_GRIDS:', gridClasses);
      
      const styles = Array.from(document.styleSheets).map(s => {
        try { return s.href || 'inline'; } catch(e) { return 'cors-error'; }
      });
      console.log('DOM_DUMP_STYLES:', styles);
    }, 3000);
  }, []);
  return null;
};
