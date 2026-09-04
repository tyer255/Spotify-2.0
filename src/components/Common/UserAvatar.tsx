import React, { useState } from 'react';
import { User } from 'lucide-react';

interface UserAvatarProps {
  avatarUrl?: string | null;
  name?: string;
  sizeClassName?: string;
  iconClassName?: string;
  className?: string;
  onClick?: () => void;
  title?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  avatarUrl,
  name = 'Guest Profile',
  sizeClassName = 'w-10 h-10',
  iconClassName = 'w-1/2 h-1/2',
  className = '',
  onClick,
  title,
}) => {
  const [imageError, setImageError] = useState(false);

  if (avatarUrl && avatarUrl.trim() !== '' && !imageError) {
    return (
      <div
        className={`relative rounded-full overflow-hidden flex-shrink-0 bg-[#282828] border border-white/10 ${sizeClassName} ${className}`}
        onClick={onClick}
        title={title || name}
      >
        <img
          src={avatarUrl || undefined}
          alt={name}
          referrerPolicy="no-referrer"
          onError={() => setImageError(true)}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  // Default Guest Avatar: Spotify-style sleek silhouette avatar
  return (
    <div
      className={`relative rounded-full overflow-hidden flex-shrink-0 bg-[#282828] border border-white/10 flex items-center justify-center text-neutral-300 select-none shadow-sm ${sizeClassName} ${className}`}
      onClick={onClick}
      title={title || name}
    >
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className={iconClassName || 'w-1/2 h-1/2'}
      >
        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
      </svg>
    </div>
  );
};
