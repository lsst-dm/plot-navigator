import { Link } from 'react-router-dom';

export function Button({ to, children, inactive = false, className = '', ...props }) {
  const baseClasses = inactive ? "inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors border-1 border-gray-500 text-gray-500"
   : "inline-flex items-center bg-buttons hover:bg-buttons-hover text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors";

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