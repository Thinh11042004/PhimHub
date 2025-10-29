import React from 'react';
import { getAvatarUrl } from '../../utils/avatarUtils';

interface AvatarProps {
  avatar?: string | null;
  username?: string;
  fullname?: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const sizeClasses = {
  small: 'w-8 h-8 text-xs',
  medium: 'w-10 h-10 text-sm',
  large: 'w-12 h-12 text-base'
};

export default function Avatar({ 
  avatar, 
  username, 
  fullname, 
  size = 'medium',
  className = '' 
}: AvatarProps) {
  const displayName = fullname || username || 'U';
  const initial = String(displayName).slice(0, 1).toUpperCase();
  const avatarUrl = avatar ? getAvatarUrl(avatar) : null;
  const [imgError, setImgError] = React.useState(false);

  return (
    <div 
      className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold overflow-hidden ${className}`}
      style={{
        background: avatarUrl && !imgError 
          ? `url(${avatarUrl}) center/cover` 
          : "linear-gradient(135deg, #60a5fa 0%, #a855f7 100%)"
      }}
    >
      {avatarUrl && !imgError ? (
        <img 
          src={avatarUrl}
          alt={displayName}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <span>{initial}</span>
      )}
    </div>
  );
}

