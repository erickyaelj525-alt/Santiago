import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import Badge from '../components/Badge.jsx';
import KpiCard from '../components/KpiCard.jsx';
import Field from '../components/Field.jsx';
import AuthContext from '../context/AuthContext.jsx';
import Login from '../pages/Login.jsx';

describe('Componentes de UI', () => {
  it('Badge renderiza el contenido y la variante indicada', () => {
    render(<Badge variante="ok">Activa</Badge>);
    const badge = screen.getByText('Activa');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('badge', 'badge--ok');
  });

  it('KpiCard muestra etiqueta, valor, unidad y nota opcional', () => {
    render(<KpiCard etiqueta="Colmenas activas" valor={12} unidad="unidades" nota="Último mes" />);
    expect(screen.getByText('Colmenas activas')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('unidades')).toBeInTheDocument();
    expect(screen.getByText('Último mes')).toBeInTheDocument();
  });

  it('Field muestra la etiqueta y el mensaje de error accesible con role="alert"', () => {
    render(
      <Field id="correo" label="Correo" error="Correo obligatorio" requerido>
        <input id="correo" />
      </Field>,
    );
    expect(screen.getByLabelText(/Correo/)).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Correo obligatorio');
  });
});

describe('Página Login', () => {
  it('muestra errores de validación cuando se envía vacío', () => {
    const loginMock = vi.fn();
    render(
      <MemoryRouter>
        <AuthContext.Provider value={{ login: loginMock, usuario: null, cargando: false }}>
          <Login />
        </AuthContext.Provider>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(screen.getByText('El correo es obligatorio.')).toBeInTheDocument();
    expect(screen.getByText('La contraseña es obligatoria.')).toBeInTheDocument();
    expect(loginMock).not.toHaveBeenCalled();
  });

  it('llama a login() cuando los datos son válidos', () => {
    const loginMock = vi.fn().mockResolvedValue({});
    render(
      <MemoryRouter>
        <AuthContext.Provider value={{ login: loginMock, usuario: null, cargando: false }}>
          <Login />
        </AuthContext.Provider>
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText(/Correo electrónico/i), {
      target: { value: 'demo@apiario.mx' },
    });
    fireEvent.change(screen.getByLabelText(/Contraseña/i), {
      target: { value: 'demo1234' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(loginMock).toHaveBeenCalledWith('demo@apiario.mx', 'demo1234');
  });
});
