import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { SuccessNotification } from "../components/SuccessNotification";
import { useLocation, useNavigate } from "react-router-dom";

axios.defaults.withCredentials = true;
const firebaseConfig = {
  apiKey: `${process.env.API_KEY_FIREBASE}`,
  authDomain: `${process.env.AUTHDOMAIN_FIREBASE}`,
  projectId: `${process.env.PROJECT_ID_FIREBASE}`,
  storageBucket: `${process.env.STORAGEBUCKET}`,
  messagingSenderId: `${process.env.MESSAGING_SENDER_ID_FIREBASE}`,
  appId: `${process.env.APP_ID_FIREBASE}`,
  measurementId: `${process.env.MEASUREMENT_ID_FIREBASE}`,
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export const AuthForm = () => {
  const { setIsAuthenticated, setUserRole, logout } = useAuth();
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("null");
  const [attempts, setAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTime, setBlockTime] = useState(0);
  const [blockMessage, setBlockMessage] = useState("");

  const [showSuccess, setShowSuccess] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalStep, setModalStep] = useState(1);
  const [resetEmail, setResetEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [modalError, setModalError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname]);

  useEffect(() => {
    const storedAttempts = parseInt(localStorage.getItem("loginAttempts")) || 0;
    const storedBlockUntil = parseInt(localStorage.getItem("blockUntil")) || 0;
    const now = Math.floor(Date.now() / 1000);

    setAttempts(storedAttempts);

    if (storedBlockUntil > now) {
      setIsBlocked(true);
      setBlockTime(storedBlockUntil - now);
      updateBlockMessage(storedAttempts, storedBlockUntil - now);
    } else if (storedBlockUntil !== 0) {
      resetLoginState();
    }
  }, []);

  useEffect(() => {
    let timer;
    if (isBlocked && blockTime > 0) {
      timer = setInterval(() => {
        setBlockTime((prev) => {
          const newTime = prev - 1;
          if (newTime <= 0) {
            resetLoginState();
            setIsBlocked(false);
            setBlockMessage("");
          } else {
            updateBlockMessage(attempts, newTime);
          }
          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isBlocked, blockTime, attempts]);

  const updateBlockMessage = (attemptCount, timeLeft) => {
    const minutesLeft = Math.ceil(timeLeft / 60);
    let message = "";
    if (attemptCount >= 15) {
      message = `Acceso bloqueado por 5 horas. Tiempo restante: ${minutesLeft} minuto${minutesLeft !== 1 ? "s" : ""
        }`;
    } else if (attemptCount >= 5) {
      message = `Demasiados intentos fallidos. Espera ${minutesLeft} minuto${minutesLeft !== 1 ? "s" : ""
        } antes de intentar de nuevo`;
    }
    setBlockMessage(message);
  };

  const resetLoginState = () => {
    setAttempts(0);
    setIsBlocked(false);
    setBlockTime(0);
    setBlockMessage("");
    localStorage.removeItem("loginAttempts");
    localStorage.removeItem("blockUntil");
  };

  const handleFailedAttempt = () => {
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    localStorage.setItem("loginAttempts", newAttempts);

    if (newAttempts >= 5) {
      setIsBlocked(true);
      let blockDuration;
      if (newAttempts >= 15) {
        blockDuration = 5 * 60 * 60;
      } else if (newAttempts >= 10) {
        blockDuration = 15 * 60;
      } else if (newAttempts >= 7) {
        blockDuration = 5 * 60;
      } else {
        blockDuration = 2 * 60;
      }

      const blockUntil = Math.floor(Date.now() / 1000) + blockDuration;
      setBlockTime(blockDuration);
      localStorage.setItem("blockUntil", blockUntil);
      updateBlockMessage(newAttempts, blockDuration);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();

    if (isBlocked) {
      setError(blockMessage);
      return;
    }

    if (!username || !password) {
      setError("Por favor, completa todos los campos.");
      handleFailedAttempt();
      return;
    }

    const url = `${process.env.REACT_APP_API_BASE_URL}/api/auth/token/`;
    const payload = { username, email: "null", password };

    try {
      const response = await axios.post(url, payload, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      const { access, refresh, user } = response.data;
      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("user_role", user.is_staff ? "admin" : "user");
      setIsAuthenticated(true);
      setUserRole(user.is_staff ? "admin" : "user");

      resetLoginState();

      if (user.is_staff) {
        window.location.href = "/admin-panel/gestionar/";
      } else {
        setError("Error. Debe iniciar con su cuenta de administrador");
        logout();
      }
    } catch (error) {
      if (error.response) {
        const errorData = error.response.data;
        if (isLogin) {
          setError(errorData.detail || "Error al iniciar sesión");
        } else {
          const errorObj = errorData.error || {};
          setError(
            errorObj.username ||
            errorObj.email ||
            errorObj.password ||
            "Error al registrarse"
          );
        }
      } else {
        setError("Ocurrió un error inesperado.");
      }
    }
  };

  const handlePasswordResetRequest = async () => {
    if (!resetEmail) {
      setModalError("Ingresa tu correo.");
      return;
    }
    try {
      await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/api/auth/password-reset/request/`,
        { email: resetEmail }
      );
      setModalError("");
      setModalStep(2);
    } catch (error) {
      setModalError(
        error.response?.data?.error || "Error al enviar el correo."
      );
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode) {
      setModalError("Ingresa el código.");
      return;
    }
    try {
      await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/api/auth/password-reset/verify/`,
        { code: verificationCode, email: resetEmail }
      );
      setModalError("");
      setModalStep(3);
    } catch (error) {
      setModalError(error.response?.data?.error || "Código incorrecto.");
    }
  };

  const handlePasswordResetConfirm = async () => {
    if (!newPassword || !confirmPassword) {
      setModalError("Completa ambos campos.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setModalError("Las contraseñas no coinciden.");
      return;
    }
    try {
      await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/api/auth/password-reset/confirm/`,
        {
          password: newPassword,
          confirm_password: confirmPassword,
          email: resetEmail,
        }
      );
      setModalError("");
      setShowModal(false);
      setShowSuccess(true);
      setModalStep(1);
      setResetEmail("");
      setVerificationCode("");
      setNewPassword("");
      setConfirmPassword("");
      navigate("/login");
    } catch (error) {
      setModalError(
        error.response?.data?.error || "Error al cambiar la contraseña."
      );
    }
  };
  useEffect(() => {
    setError("");
  }, [username, password, isLogin]);

  return (
    <div className="auth-container">
      {showSuccess && (
        <SuccessNotification
          message={
            modalStep === 1
              ? "Registro exitoso."
              : "Contraseña cambiada con éxito."
          }
          onClose={() => setShowSuccess(false)}
        />
      )}
      <div className="auth-card">
        <div className="auth-form">
          <div className="left-side">
            <img
              src="https://cdn.pixabay.com/photo/2022/06/22/06/53/cabinet-7277181_1280.jpg"
              alt="Background"
            />
            <div className="overlay-shape"></div>
          </div>
          <div className="right-side">
            <h2 className="auth-title">INICIAR SESION ADMINISTRADOR</h2>
            <form onSubmit={handleAuth}>
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Nombre de usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={isBlocked}
                />
              </div>
              <div className="input-group">
                <input
                  type="password"
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isBlocked}
                />
                <p className="recovery-link" onClick={() => setShowModal(true)}>
                  ¿Olvidaste tu contraseña?
                </p>
              </div>

              <button type="submit" className="auth-btn" disabled={isBlocked}>
                Iniciar Sesión
              </button>
              {(error || blockMessage) && (
                <p
                  style={{
                    color: "red",
                    margin: "auto",
                    marginBottom: "-20px",
                    textAlign: "center",
                    fontFamily: "Lucida Sans",
                  }}
                >
                  {blockMessage || error}
                </p>
              )}
              <hr />
            </form>
          </div>
        </div>
      </div>
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close" onClick={() => setShowModal(false)}>
              ✖
            </button>
            <h3>Recuperar Contraseña</h3>
            {modalStep === 1 && (
              <>
                <p>Ingresa tu correo para recibir un código.</p>
                <div className="input-group">
                  <input
                    type="email"
                    placeholder="Correo electrónico"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                  />
                </div>
                <button onClick={handlePasswordResetRequest}>Enviar</button>
              </>
            )}
            {modalStep === 2 && (
              <>
                <p>Ingresa el código recibido.</p>
                <div className="input-group">
                  <input
                    type="text"
                    placeholder="Código"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    required
                  />
                </div>
                <button onClick={handleVerifyCode}>Verificar</button>
              </>
            )}
            {modalStep === 3 && (
              <>
                <p>Ingresa tu nueva contraseña.</p>
                <div className="input-group">
                  <input
                    type="password"
                    placeholder="Nueva contraseña"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="input-group">
                  <input
                    type="password"
                    placeholder="Confirmar contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                <button onClick={handlePasswordResetConfirm}>Cambiar</button>
              </>
            )}
            {modalError && <p className="modal-error">{modalError}</p>}
          </div>
        </div>
      )}
    </div>
  );
};
