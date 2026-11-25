import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { AuthProvider } from '../context/AuthContext.jsx';
import useAuth from '../hooks/useAuth.js';

function VerificarSesionPrueba() {
  const { verificar, usuario } = useAuth();
  const [error, setError] = useState('');

  async function verificarCuenta() {
    try {
      await verificar('apicultor@ejemplo.com', '123456');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <button onClick={verificarCuenta}>Verificar</button>
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

describe('AuthContext: verificación de cuenta', () => {
  it('muestra un error y no guarda sesión si la respuesta no trae token', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      text: async () => '',
    }));

    render(
      <AuthProvider>
        <VerificarSesionPrueba />
      </AuthProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Verificar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'El servidor no devolvió el token de autenticación.',
    );
    expect(storage.getItem('apiario_token')).toBeNull();
  });

  it('acepta token y usuario dentro de data y guarda la sesión', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      text: async () => JSON.stringify({
        data: {
          token: 'jwt-de-prueba',
          usuario: { email: 'apicultor@ejemplo.com', rol: 'dueno' },
        },
      }),
    }));

    render(
      <AuthProvider>
        <VerificarSesionPrueba />
      </AuthProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Verificar' }));

    expect(await screen.findByText('apicultor@ejemplo.com')).toBeInTheDocument();
    await waitFor(() => {
      expect(storage.getItem('apiario_token')).toBe('jwt-de-prueba');
    });
  });
});
