import { Link, useLocation, useNavigate } from "react-router-dom";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) =>
    location.pathname === path ? "text-blue-600 font-semibold" : "text-gray-700";

  const handleLogout = () => {
    // Clear auth token or user data
    localStorage.removeItem("token"); // adjust if you're using a different key
    navigate("/login");
  };

  return (
    <nav className="bg-white shadow-md px-6 py-4 flex justify-between items-center">
      <div className="text-xl font-bold text-blue-700">MyApp</div>

      <div className="space-x-6 flex items-center">
        <Link to="/" className={`hover:text-blue-500 ${isActive("/")}`}>
          Home
        </Link>
        <Link to="/upload" className={`hover:text-blue-500 ${isActive("/upload")}`}>
          Upload
        </Link>
        <button
          onClick={handleLogout}
          className="text-red-600 hover:text-red-800 font-medium ml-4"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
