import { Link } from 'react-router-dom';
// import defaultDirectorAvatar from '../../assets/default-director-avatar.png'; // You'll need to add this image

interface DirectorCardProps {
  director: {
    id?: number;
    name: string;
    photo_url?: string;
  };
  size?: 'small' | 'medium' | 'large';
}

export default function DirectorCard({ director, size = 'medium' }: DirectorCardProps) {
  const avatarSrc = director.photo_url || 'https://via.placeholder.com/300x300?text=Director';
  const cardClasses = {
    small: 'w-24',
    medium: 'w-32',
    large: 'w-40',
  };
  const imgClasses = {
    small: 'h-24 w-24',
    medium: 'h-32 w-32',
    large: 'h-40 w-40',
  };
  const nameClasses = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base',
  };

  return (
    <Link
      to={director.id ? `/director/${director.id}` : '#'}
      className={`flex flex-col items-center text-center group ${cardClasses[size]} ${director.id ? 'cursor-pointer hover:scale-105 transition-transform duration-200' : 'cursor-default'}`}
    >
      <div className={`relative rounded-full overflow-hidden flex-shrink-0 ${imgClasses[size]} bg-white/10 ring-1 ring-white/10 group-hover:ring-primary-300 transition-all duration-200`}>
        <img
          src={avatarSrc}
          alt={director.name}
          className="object-cover w-full h-full"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = 'https://via.placeholder.com/300x300?text=Director';
          }}
        />
      </div>
      <div className="mt-2">
        <p className={`font-medium text-white group-hover:text-primary-300 transition-colors duration-200 ${nameClasses[size]}`}>
          {director.name}
        </p>
      </div>
    </Link>
  );
}
