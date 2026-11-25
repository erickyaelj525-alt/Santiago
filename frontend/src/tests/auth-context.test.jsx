import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { AuthProvider } from '../context/AuthContext.jsx';
import useAuth from '../hooks/useAuth.js';

function RegistrarSesionPrueba() {
  const { register, usuario } = useAuth();
  const [error, setError] = useState('');

  async function registrarCuenta() {
    try {
      await register('Apicultor', 'apicultor@ejemplo.com', 'secreto123');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <button onClick={registrarCuenta}>Registrar</button>
      {error && <p role="alert">{error}</p>}
      {usuario && <p>{usuario.email}</p>}
    </>
  );
}

let storage;

beforeEach(() => {
  const entries = new Map();
  storage = {
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, String(value)),
    removeItem: (key) => entries.delete(key),
  };
  vi.stubGlobal('localStorage', storage);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('AuthContext: registro sin verificación por correo', () => {
  it('muestra un error y no guarda sesión si registro no devuelve token', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      text: async () => '',
    }));

    render(
      <AuthProvider>
        <RegistrarSesionPrueba />
      </AuthProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Registrar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se pudo completar la autenticación.',
    );
    expect(storage.getItem('apiario_token')).toBeNull();
  });

  it('inicia sesión inmediatamente al registrar la cuenta', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      text: async () => JSON.stringify({
        token: 'jwt-de-prueba',
        usuario: { email: 'apicultor@ejemplo.com', rol: 'dueno' },
      }),
    }));

    render(
      <AuthProvider>
        <RegistrarSesionPrueba />
      </AuthProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Registrar' }));

    expect(await screen.findByText('apicultor@ejemplo.com')).toBeInTheDocument();
    await waitFor(() => {
      expect(storage.getItem('apiario_token')).toBe('jwt-de-prueba');
    });
  });
});
