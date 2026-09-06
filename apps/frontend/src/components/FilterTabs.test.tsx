import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FilterTabs from './FilterTabs';

describe('FilterTabs', () => {
  it('renderiza las cuatro pestañas', () => {
    render(<FilterTabs value="ALL" onChange={() => {}} />);
    expect(screen.getByText('Todos')).toBeTruthy();
    expect(screen.getByText('Por leer')).toBeTruthy();
    expect(screen.getByText('Leyendo')).toBeTruthy();
    expect(screen.getByText('Leído')).toBeTruthy();
  });

  it('llama a onChange con la clave correcta al hacer click', () => {
    const onChange = vi.fn();
    render(<FilterTabs value="ALL" onChange={onChange} />);

    fireEvent.click(screen.getByText('Leyendo'));

    expect(onChange).toHaveBeenCalledWith('READING');
  });
});
