import { useEffect, useState } from "react";
import { Link, Navigate, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import SubmitComplaint from "./pages/SubmitComplaint";
import AdminDashboard from "./pages/AdminDashboard";
import Login from "./pages/Login";
import UserDashboard from "./pages/UserDashboard";
import copy from "./content/copy";

function ProtectedRoute({ currentUser, role, children }) {
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (role && currentUser.role !== role) {
    return <Navigate to={currentUser.role === "admin" ? "/admin" : "/user"} replace />;
  }

  return children;
}

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [language, setLanguage] = useState("en");
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const savedUser = window.localStorage.getItem("siliconsentry_user");
    const savedLanguage = window.localStorage.getItem("siliconsentry_language");
    const savedTheme = window.localStorage.getItem("siliconsentry_theme");

    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }

    if (savedLanguage) {
      setLanguage(savedLanguage);
    }

    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem("siliconsentry_theme", theme);
  }, [theme]);

  useEffect(() => {
    window.localStorage.setItem("siliconsentry_language", language);
  }, [language]);

  const handleLogin = (user) => {
    setCurrentUser(user);
    window.localStorage.setItem("siliconsentry_user", JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    window.localStorage.removeItem("siliconsentry_user");
  };

  const labels = copy[language] || copy.en;
  const hubLink = currentUser?.role === "admin" ? "/admin" : "/user";
  const hubLabel =
    currentUser?.role === "admin"
      ? labels.app.adminHub
      : currentUser?.role === "user"
        ? labels.app.userHub || "User Hub"
        : null;

  return (
    <div className="app-shell">
      <div className="utility-bar">
        <div className="utility-copy">
          <span>{labels.app.utilityPrimary}</span>
          <span>{labels.app.utilitySecondary}</span>
        </div>
        <div className="utility-controls">
          <label className="utility-control">
            <span>{labels.app.languageLabel}</span>
            <select value={language} onChange={(event) => setLanguage(event.target.value)}>
              <option value="en">English</option>
              <option value="kn">ಕನ್ನಡ</option>
              <option value="hi">हिन्दी</option>
              <option value="te">తెలుగు</option>
              <option value="ta">தமிழ்</option>
              <option value="ml">മലയാളം</option>
            </select>
          </label>
          <button
            className="theme-toggle"
            type="button"
            onClick={() => setTheme((current) => (current === "light" ? "dark" : "light"))}
          >
            {labels.app.themeLabel}:{" "}
            {theme === "light" ? labels.app.lightMode : labels.app.darkMode}
          </button>
        </div>
      </div>

      <header className="topbar">
        <div className="brand-block">
          <div className="brand-mark emblem-mark">
            <img
              src="/karnataka-logo.png.webp"
              alt="Government of Karnataka emblem"
            />
          </div>
          <div>
            <p className="eyebrow">{labels.app.eyebrow}</p>
            <h1>{labels.app.title}</h1>
            <p className="brand-subtitle">{labels.app.subtitle}</p>
          </div>
        </div>
        <nav>
          <Link to="/">{labels.app.home}</Link>
          {currentUser?.role === "user" ? <Link to="/submit">{labels.app.reportIssue}</Link> : null}
          {hubLabel ? <Link to={hubLink}>{hubLabel}</Link> : null}
          <Link to="/login">{currentUser ? labels.app.switchAccount : labels.app.login}</Link>
          {currentUser ? (
            <button className="nav-logout" type="button" onClick={handleLogout}>
              {labels.app.logout}
            </button>
          ) : null}
        </nav>
      </header>

      <main className="page-wrap">
        <Routes>
          <Route path="/" element={<Home currentUser={currentUser} copy={labels} />} />
          <Route
            path="/login"
            element={
              <Login
                currentUser={currentUser}
                onLogin={handleLogin}
                copy={labels}
              />
            }
          />
          <Route
            path="/user"
            element={
              <ProtectedRoute currentUser={currentUser} role="user">
                <UserDashboard currentUser={currentUser} copy={labels} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/submit"
            element={
              <ProtectedRoute currentUser={currentUser} role="user">
                <SubmitComplaint currentUser={currentUser} copy={labels} language={language} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute currentUser={currentUser} role="admin">
                <AdminDashboard currentUser={currentUser} copy={labels} />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>

      <footer className="portal-footer">
        <div className="footer-grid">
          <div className="footer-column">
            <h3>Issue Categories</h3>
            <a href="#!">Roads and Mobility</a>
            <a href="#!">Water Supply</a>
            <a href="#!">Sanitation and Waste</a>
            <a href="#!">Street Lights</a>
            <a href="#!">Public Safety</a>
            <a href="#!">Parks and Public Spaces</a>
          </div>

          <div className="footer-column">
            <h3>Citizen Services</h3>
            <a href="#!">Report a Civic Issue</a>
            <a href="#!">Track Submitted Complaints</a>
            <a href="#!">Upload Photo Evidence</a>
            <a href="#!">Ward and Department Routing</a>
            <a href="#!">Multilingual Access</a>
            <a href="#!">Review Service Quality</a>
          </div>

          <div className="footer-column">
            <h3>Admin and Analytics</h3>
            <a href="#!">Admin Dashboard</a>
            <a href="#!">Complaint Heat Map</a>
            <a href="#!">Trend Charts</a>
            <a href="#!">Resolution Tracking</a>
            <a href="#!">Department Performance</a>
            <a href="#!">Priority Monitoring</a>
          </div>

          <div className="footer-column">
            <h3>Support and Policy</h3>
            <a href="#!">About Silicon Sentry</a>
            <a href="#!">Contact Support</a>
            <a href="#!">Feedback</a>
            <a href="#!">FAQs</a>
            <a href="#!">Website Policy</a>
            <a href="#!">Accessibility</a>
          </div>

          <div className="footer-column footer-qr-column">
            <h3>Mobile Access</h3>
            <div className="footer-qr-card">
              <div className="footer-qr-box">
                <div className="qr-grid">
                  {Array.from({ length: 49 }).map((_, index) => (
                    <span
                      key={index}
                      className={index % 2 === 0 || index % 5 === 0 ? "qr-dot active" : "qr-dot"}
                    />
                  ))}
                </div>
              </div>
              <p>Scan to view Silicon Sentry on mobile</p>
            </div>
            <div className="footer-socials">
              <strong>Follow Updates</strong>
              <div className="social-icons">
                <span>f</span>
                <span>X</span>
                <span>in</span>
              </div>
            </div>
          </div>
        </div>

        <div className="footer-disclaimer">
          <div className="footer-disclaimer-tag">Translation Disclaimer</div>
          <p>
            Translated content across supported languages is provided to improve access for residents.
            Automated translations may not always capture exact civic or legal meaning and should be
            treated as guidance alongside the default English interface.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
