import { useNavigate } from 'react-router-dom';
import { getImageUrl } from '../../utils/imageProxy';

interface ActorCardProps {
  actor: {
    id?: number;
    name: string;
    photo_url?: string;
    role_name?: string;
  };
  size?: 'small' | 'medium' | 'large';
  showRole?: boolean;
  className?: string;
}

export default function ActorCard({ 
  actor, 
  size = 'medium', 
  showRole = false,
  className = '' 
}: ActorCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (actor.id) {
      navigate(`/actor/${actor.id}`);
    }
  };

  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-24 h-24',
    large: 'w-32 h-32'
  };

  const textSizeClasses = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base'
  };

  return (
    <div 
      className={`group cursor-pointer text-center ${className}`}
      onClick={handleClick}
    >
      <div className={`${sizeClasses[size]} mx-auto rounded-full overflow-hidden ring-1 ring-white/10 group-hover:ring-white/30 transition-all duration-300 group-hover:scale-105`}>
        {actor.photo_url ? (
          <img
            src={getImageUrl(actor.photo_url)}
            alt={actor.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/placeholder-actor.jpg';
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
            <div className="text-2xl text-white/50">🎭</div>
          </div>
        )}
      </div>
      
      <div className="mt-2">
        <p className={`font-medium text-white group-hover:text-primary transition-colors line-clamp-2 ${textSizeClasses[size]}`}>
          {actor.name}
        </p>
        {showRole && actor.role_name && (
          <p className={`text-white/60 line-clamp-1 ${size === 'small' ? 'text-xs' : 'text-xs'}`}>
            {actor.role_name}
          </p>
        )}
      </div>
    </div>
  );
}
