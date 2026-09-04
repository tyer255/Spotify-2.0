sed -i -e "s/import { UserAvatar } from '..\/components\/Common\/UserAvatar';/import { UserAvatar } from '..\/components\/Common\/UserAvatar';\nimport { SpotifyCodeScanner } from '..\/components\/Scanner\/SpotifyCodeScanner';/" src/views/SearchView.tsx

sed -i -e "s/const \[debouncedQuery, setDebouncedQuery\] = useState(searchQuery || '');/const [debouncedQuery, setDebouncedQuery] = useState(searchQuery || '');\n  const [isScannerOpen, setIsScannerOpen] = useState(false);/" src/views/SearchView.tsx

sed -i -e "s/showToast('Spotiz Camera Scanner is ready for album covers & codes');/setIsScannerOpen(true);/" src/views/SearchView.tsx

