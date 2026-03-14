import { useState } from "react";
import { Navigate } from "react-router-dom";
import { parseApiResponse } from "../utils/api";

const API_URL = `${process.env.REACT_APP_API_URL}/api/auth/login`;
const SIGNUP_API_URL = `${process.env.REACT_APP_API_URL}/api/auth/signup`;

function Login({ currentUser, onLogin, copy }) {
  const [role, setRole] = useState("user");
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (currentUser) {
    return <Navigate to={currentUser.role === "admin" ? "/admin" : "/submit"} replace />;
  }

  const handleRoleChange = (nextRole) => {
    setRole(nextRole);
    setMode("login");
    setName("");
    setEmail("");
    setPassword("");
    setMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    try {
      const isSignup = mode === "signup";
      const response = await fetch(isSignup ? SIGNUP_API_URL : API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          isSignup
            ? { name, email, password }
            : { email, password, role }
        ),
      });

      const data = await parseApiResponse(
        response,
        `Unable to reach the backend. Make sure the backend server is running on ${process.env.REACT_APP_API_URL}.`
      );

      if (!response.ok) {
        throw new Error(
          data.message || (isSignup ? copy.login.signupFailed || "Signup failed." : copy.login.loginFailed)
        );
      }

      if (isSignup) {
        setMessage(copy.login.signupSuccess || "Account created successfully. You can now sign in.");
        setMode("login");
        setRole("user");
        setName("");
        setPassword("");
      } else {
        onLogin(data.user);
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const roleLabel = role === "admin" ? copy.login.adminRole : copy.login.userRole;
  const showSignup = role === "user";
  const handleForgotPassword = () => {
    setMessage(copy.login.forgotPasswordInfo || "Password reset is not configured yet. Contact the administrator.");
  };

  return (
    <section className="panel auth-panel">
      <div>
        <p className="eyebrow">{copy.login.eyebrow}</p>
        <h2>{mode === "signup" ? (copy.login.signupTitle || "Create your account") : copy.login.title}</h2>
        <p className="hero-copy">
          {mode === "signup"
            ? copy.login.signupBody || "Create a user account to report civic issues and track updates."
            : copy.login.body}
        </p>

        <div className="role-switch">
          <button
            className={role === "user" ? "role-btn active" : "role-btn"}
            type="button"
            onClick={() => handleRoleChange("user")}
          >
            {copy.login.userRole}
          </button>
          <button
            className={role === "admin" ? "role-btn active" : "role-btn"}
            type="button"
            onClick={() => handleRoleChange("admin")}
          >
            {copy.login.adminRole}
          </button>
        </div>

        <form className="complaint-form" onSubmit={handleSubmit}>
          {mode === "signup" ? (
            <label>
              {copy.login.name || "Full name"}
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </label>
          ) : null}

          <label>
            {copy.login.email}
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label>
            {copy.login.password}
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          {mode === "login" ? (
            <div className="auth-links-row">
              <button type="button" className="auth-link-btn" onClick={handleForgotPassword}>
                {copy.login.forgotPassword || "Forgot your password?"}
              </button>
              {showSignup ? (
                <button
                  type="button"
                  className="auth-link-btn"
                  onClick={() => {
                    setMode("signup");
                    setMessage("");
                  }}
                >
                  {copy.login.signup || "Sign up"}
                </button>
              ) : null}
            </div>
          ) : (
            <button
              type="button"
              className="auth-link-btn"
              onClick={() => {
                setMode("login");
                setMessage("");
              }}
            >
              {copy.login.backToSignIn || "Back to sign in"}
            </button>
          )}

          <button className="primary-btn" type="submit" disabled={submitting}>
            {submitting
              ? copy.login.signingIn
              : mode === "signup"
                ? copy.login.createAccount || "Create account"
                : `${copy.login.signInAs} ${roleLabel}`}
          </button>
          {message ? <p className="form-message">{message}</p> : null}
        </form>
      </div>
    </section>
  );
}

export default Login;
