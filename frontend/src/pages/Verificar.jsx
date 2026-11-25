import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';
import Logo from '../components/Logo.jsx';
import Field from '../components/Field.jsx';

/**
 * Verificación de la cuenta con el código de 6 dígitos enviado al correo.
 * Recibe el correo por location.state desde el registro (o permite reenviar
 * el código). Al verificar correctamente se inicia sesión y se entra al panel.
 */
export default function Verificar() {
  const { verificar, reenviarCodigo } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState(location.state?.email || '');
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [reenviando, setReenviando] = useState(false);

  // En modo demo (sin SMTP) el registro devuelve el código para facilitar pruebas.
  const [codigoDemo, setCodigoDemo] = useState(location.state?.codigoDemo || '');
  const correoConfigurado = location.state?.correoConfigurado;

  async function manejarEnvio(e) {
    e.preventDefault();
    setError('');
    setAviso('');

    if (!email.trim()) return setError('Falta el correo electrónico.');
    if (!/^\d{6}$/.test(codigo.trim())) return setError('El código debe tener 6 dígitos.');

    setEnviando(true);
    try {
      await verificar(email.trim(), codigo.trim());
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'No se pudo verificar el código.');
    } finally {
      setEnviando(false);
    }
  }

  async function manejarReenvio() {
    setError('');
    setAviso('');
    if (!email.trim()) return setError('Falta el correo electrónico.');

    setReenviando(true);
    try {
      const data = await reenviarCodigo(email.trim());
      setAviso(data?.mensaje || 'Te enviamos un nuevo código.');
      if (data?.codigo_demo) setCodigoDemo(data.codigo_demo);
    } catch (err) {
      setError(err.message || 'No se pudo reenviar el código.');
    } finally {
      setReenviando(false);
    }
  }

  return (
    <main className="auth-layout">
      <section className="auth-card" aria-labelledby="verificar-titulo">
        <Link to="/login" className="auth-volver">← Volver a iniciar sesión</Link>

        <div className="auth-marca">
          <Logo size={40} />
          <span className="auth-marca__nombre">Apiario Digital</span>
        </div>

        <h1 id="verificar-titulo">Verifica tu correo</h1>
        <p className="texto-suave texto-pequeno">
          Enviamos un código de 6 dígitos a <strong>{email || 'tu correo'}</strong>.
          Escríbelo aquí para activar tu cuenta.
        </p>

        {codigoDemo && (
          <div className="aviso aviso--info" role="status" style={{ marginBottom: '1rem' }}>
            Modo demo (sin servidor de correo): tu código es <strong>{codigoDemo}</strong>
          </div>
        )}

        {correoConfigurado === false && !codigoDemo && (
          <p className="texto-suave texto-pequeno">
            Revisa la consola del servidor: en modo demo el código se imprime ahí.
          </p>
        )}

        {error && (
          <div className="aviso aviso--error" role="alert" style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}
        {aviso && (
          <div className="aviso aviso--ok" role="status" style={{ marginBottom: '1rem' }}>
            {aviso}
          </div>
        )}

        <form onSubmit={manejarEnvio} noValidate>
          {!location.state?.email && (
            <Field id="email" label="Correo electrónico" requerido>
              <input
                id="email"
                className="input"
                type="email"
                autoComplete="email"
                placeholder="apicultor@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
          )}

          <Field id="codigo" label="Código de verificación" requerido>
            <input
              id="codigo"
              className="input input--codigo"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="123456"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
            />
          </Field>

          <button type="submit" className="btn btn--primario btn--bloque" disabled={enviando}>
            {enviando ? 'Verificando…' : 'Verificar cuenta'}
          </button>
        </form>

        <p className="texto-centro texto-pequeno mt-3">
          ¿No recibiste el código?{' '}
          <button
            type="button"
            className="enlace-boton"
            onClick={manejarReenvio}
            disabled={reenviando}
          >
            {reenviando ? 'Enviando…' : 'Reenviar código'}
          </button>
        </p>
      </section>
    </main>
  );
}
