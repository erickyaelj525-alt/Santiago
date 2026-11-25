import { Link } from 'react-router-dom';
import Logo from '../components/Logo.jsx';

/** Página 404. */
export default function NotFound() {
  return (
    <main className="auth-layout">
      <section className="auth-card texto-centro" aria-labelledby="nf-titulo">
        <div className="auth-marca" style={{ justifyContent: 'center' }}>
          <Logo size={44} />
        </div>
        <h1 id="nf-titulo">404 — Página no encontrada</h1>
        <p className="texto-suave">
          La ruta que buscas no existe o fue movida. Revisa el enlace o vuelve al panel.
        </p>
        <div className="pila mt-2">
          <Link className="btn btn--primario btn--bloque" to="/dashboard">Ir al panel</Link>
          <Link className="btn btn--secundario btn--bloque" to="/apiarios">Ver apiarios</Link>
        </div>
      </section>
    </main>
  );
}
