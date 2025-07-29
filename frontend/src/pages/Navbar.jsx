import { Link, useLocation } from "react-router-dom";

function Navbar() {
  const location = useLocation();

  const isActive = (path) =>
    location.pathname === path ? "text-blue-600 font-semibold" : "text-gray-700";

  return (
    <nav className="bg-white shadow-md px-6 py-4 flex justify-between items-center">
      <div className="text-xl font-bold text-blue-700">MyApp</div>

      <div className="space-x-6">
        <Link to="/" className={`hover:text-blue-500 ${isActive("/")}`}>
          Home
        </Link>
        <Link to="/upload" className={`hover:text-blue-500 ${isActive("/upload")}`}>
          Upload
        </Link>
      </div>
    </nav>
  );
}

export default Navbar;
