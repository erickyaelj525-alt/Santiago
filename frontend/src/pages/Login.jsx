import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';
import Logo from '../components/Logo.jsx';
import Field from '../components/Field.jsx';

/** Validación sencilla de email. */
const emailValido = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

/**
 * Inicio de sesión con validación en cliente y manejo de errores del servidor.
 */
export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const destino = location.state?.desde || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errores, setErrores] = useState({});
  const [errorServidor, setErrorServidor] = useState('');
  const [sinVerificar, setSinVerificar] = useState(false);
  const [enviando, setEnviando] = useState(false);

  function validar() {
    const nuevos = {};
    if (!email) nuevos.email = 'El correo es obligatorio.';
    else if (!emailValido(email)) nuevos.email = 'Ingresa un correo válido.';
    if (!password) nuevos.password = 'La contraseña es obligatoria.';
    else if (password.length < 6) nuevos.password = 'Mínimo 6 caracteres.';
    setErrores(nuevos);
    return Object.keys(nuevos).length === 0;
  }

  async function manejarEnvio(e) {
    e.preventDefault();
    setErrorServidor('');
    setSinVerificar(false);
    if (!validar()) return;

    setEnviando(true);
    try {
      await login(email.trim(), password);
      navigate(destino, { replace: true });
    } catch (err) {
      // Muestra el mensaje del backend y los detalles de validación campo a campo.
      setErrorServidor(err.message || 'No se pudo iniciar sesión.');
      // 403: la cuenta existe pero aún no confirmó el código de su correo.
      if (err.status === 403) setSinVerificar(true);
      if (Array.isArray(err.details) && err.details.length) {
        const porCampo = {};
        err.details.forEach((d) => {
          if (d.campo) porCampo[d.campo] = d.mensaje;
        });
        setErrores((prev) => ({ ...prev, ...porCampo }));
      }
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="auth-layout">
      <section className="auth-card" aria-labelledby="login-titulo">
        <Link to="/" className="auth-volver">← Volver al inicio</Link>

        <div className="auth-marca">
          <Logo size={40} />
          <span className="auth-marca__nombre">Apiario Digital</span>
        </div>

        <h1 id="login-titulo">Inicia sesión</h1>
        <p className="texto-suave texto-pequeno">
          Gestiona tus apiarios, colmenas, inspecciones y cosechas desde un solo lugar.
        </p>

        {errorServidor && (
          <div className="aviso aviso--error" role="alert" style={{ marginBottom: '1rem' }}>
            {errorServidor}
            {sinVerificar && (
              <div style={{ marginTop: '0.5rem' }}>
                <Link to="/verificar" state={{ email: email.trim() }}>
                  Verificar mi cuenta ahora →
                </Link>
              </div>
            )}
          </div>
        )}

        <form onSubmit={manejarEnvio} noValidate>
          <Field id="email" label="Correo electrónico" error={errores.email} requerido>
            <input
              id="email"
              className="input"
              type="email"
              autoComplete="email"
              placeholder="apicultor@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={Boolean(errores.email)}
              aria-describedby={errores.email ? 'email-error' : undefined}
            />
          </Field>

          <Field id="password" label="Contraseña" error={errores.password} requerido>
            <input
              id="password"
              className="input"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={Boolean(errores.password)}
              aria-describedby={errores.password ? 'password-error' : undefined}
            />
          </Field>

          <button type="submit" className="btn btn--primario btn--bloque" disabled={enviando}>
            {enviando ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <p className="texto-centro texto-pequeno mt-3">
          ¿No tienes cuenta? <Link to="/registro">Regístrate gratis</Link>
        </p>
      </section>
    </main>
  );
}
