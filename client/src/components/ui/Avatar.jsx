const SIZES = { xs: 'w-6 h-6 text-xs', sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base', xl: 'w-16 h-16 text-xl' };
const DOTS  = { xs: 'w-1.5 h-1.5', sm: 'w-2 h-2', md: 'w-2.5 h-2.5', lg: 'w-3 h-3', xl: 'w-3.5 h-3.5' };

const Avatar = ({ user, size = 'md', online }) => (
  <div className="relative shrink-0">
    {user?.avatar
      ? <img src={user.avatar} alt={user.name} className={`${SIZES[size]} rounded-full object-cover ring-2 ring-white`} />
      : <div className={`${SIZES[size]} rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-semibold ring-2 ring-white`}>
          {user?.name?.[0]?.toUpperCase() || '?'}
        </div>
    }
    {online !== undefined && (
      <span className={`absolute bottom-0 right-0 ${DOTS[size]} rounded-full ring-2 ring-white ${online ? 'bg-emerald-400' : 'bg-gray-300'}`} />
    )}
  </div>
);

export default Avatar;
