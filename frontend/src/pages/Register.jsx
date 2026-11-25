import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';
import Logo from '../components/Logo.jsx';
import Field from '../components/Field.jsx';

const emailValido = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

/**
 * Registro de la cuenta del DUEÑO del apiario, con validación en cliente.
 * Las cuentas de trabajadores NO se crean aquí: una vez dentro, el dueño las
 * da de alta desde la sección "Equipo".
 * Al enviar se crea la cuenta SIN verificar y se envía un código al correo;
 * el usuario es redirigido a la pantalla de verificación.
 */
export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [errores, setErrores] = useState({});
  const [errorServidor, setErrorServidor] = useState('');
  const [enviando, setEnviando] = useState(false);

  function validar() {
    const nuevos = {};
    if (!nombre.trim()) nuevos.nombre = 'Escribe tu nombre.';
    if (!email) nuevos.email = 'El correo es obligatorio.';
    else if (!emailValido(email)) nuevos.email = 'Ingresa un correo válido.';
    if (!password) nuevos.password = 'La contraseña es obligatoria.';
    else if (password.length < 6) nuevos.password = 'Mínimo 6 caracteres.';
    if (confirmar !== password) nuevos.confirmar = 'Las contraseñas no coinciden.';
    setErrores(nuevos);
    return Object.keys(nuevos).length === 0;
  }

  async function manejarEnvio(e) {
    e.preventDefault();
    setErrorServidor('');
    if (!validar()) return;

    setEnviando(true);
    try {
      const data = await register(nombre.trim(), email.trim(), password);
      // Cuenta creada: pasamos a verificar el código enviado al correo.
      navigate('/verificar', {
        replace: true,
        state: {
          email: email.trim(),
          correoConfigurado: data?.correo_configurado,
          codigoDemo: data?.codigo_demo,
        },
      });
    } catch (err) {
      setErrorServidor(err.message || 'No se pudo completar el registro.');
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
      <section className="auth-card" aria-labelledby="registro-titulo">
        <Link to="/" className="auth-volver">← Volver al inicio</Link>

        <div className="auth-marca">
          <Logo size={40} />
          <span className="auth-marca__nombre">Apiario Digital</span>
        </div>

        <h1 id="registro-titulo">Crea la cuenta de tu apiario</h1>
        <p className="texto-suave texto-pequeno">
          Registras tu cuenta de <strong>dueño</strong>. Te enviaremos un código de
          verificación a tu correo para activarla.
        </p>

        {errorServidor && (
          <div className="aviso aviso--error" role="alert" style={{ marginBottom: '1rem' }}>
            {errorServidor}
          </div>
        )}

        <form onSubmit={manejarEnvio} noValidate>
          <Field id="nombre" label="Nombre" error={errores.nombre} requerido>
            <input
              id="nombre"
              className="input"
              type="text"
              autoComplete="name"
              placeholder="Juana Méndez"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              aria-invalid={Boolean(errores.nombre)}
              aria-describedby={errores.nombre ? 'nombre-error' : undefined}
            />
          </Field>

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

          <Field
            id="password"
            label="Contraseña"
            error={errores.password}
            ayuda="Al menos 6 caracteres."
            requerido
          >
            <input
              id="password"
              className="input"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={Boolean(errores.password)}
              aria-describedby={errores.password ? 'password-error' : 'password-ayuda'}
            />
          </Field>

          <Field id="confirmar" label="Confirmar contraseña" error={errores.confirmar} requerido>
            <input
              id="confirmar"
              className="input"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              aria-invalid={Boolean(errores.confirmar)}
              aria-describedby={errores.confirmar ? 'confirmar-error' : undefined}
            />
          </Field>

          <button type="submit" className="btn btn--primario btn--bloque" disabled={enviando}>
            {enviando ? 'Creando cuenta…' : 'Crear cuenta'}
          </button>
        </form>

        <p className="texto-suave texto-pequeno mt-3">
          Al entrar podrás crear las cuentas de tus trabajadores desde la sección
          <strong> Equipo</strong>.
        </p>

        <p className="texto-centro texto-pequeno mt-3">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </section>
    </main>
  );
}
