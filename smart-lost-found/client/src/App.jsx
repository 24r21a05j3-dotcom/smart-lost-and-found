import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import AuthPage from "./pages/AuthPage";
import ReportItem from "./pages/ReportItem";
import ItemDetails from "./pages/ItemDetails";
import MyReports from "./pages/MyReports";
import Admin from "./pages/Admin";
import { getUser, logout } from "./services/api";
import "./index.css";

function Navbar() {
  useLocation(); // re-read login state after navigation
  const navigate = useNavigate();
  const user = getUser();
  return (
    <nav className="navbar">
      <Link className="brand" to="/">FindIt</Link>
      <div className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/report">Report an item</Link>
        {user && <Link to="/my">My reports</Link>}
        {user?.role === "admin" && <Link to="/admin">Admin</Link>}
        {user ? (
          <a href="#logout" onClick={(e) => { e.preventDefault(); logout(); navigate("/login"); }}>Log out ({user.name})</a>
        ) : (
          <>
            <Link to="/login">Log in</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}

const NotFound = () => (
  <main className="container"><h1>Page not found</h1><Link to="/">Return home</Link></main>
);

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
        <Route path="/report" element={<ReportItem />} />
        <Route path="/items/:id" element={<ItemDetails />} />
        <Route path="/my" element={<MyReports />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
