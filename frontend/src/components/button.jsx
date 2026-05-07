import { Link } from 'react-router-dom';

export function Button({ to, children, inactive = false, className = '', ...props }) {
  const baseClasses = inactive ? "inline-block px-3 py-1.5 rounded-md text-sm font-medium transition-colors border-1 border-gray-500 text-gray-500"
   : "inline-block bg-[#0E7C7B] hover:bg-[#0a5e5d] text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors";

  if (to) {
    return (
      <Link to={to} className={`${baseClasses} ${className}`} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <button className={`${baseClasses} ${className}`} {...props}>
      {children}
    </button>
  );
}