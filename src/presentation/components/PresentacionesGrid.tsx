import type { Presentacion } from '../../domain/types';
import React from 'react';

interface Props {
  presentaciones: Presentacion[];
  onSelect: (p: Presentacion) => void;
  onEdit?: (p: Presentacion) => void;
  onDelete?: (id: string) => void;
}

export const PresentacionesGrid: React.FC<Props> = ({ presentaciones, onSelect, onEdit, onDelete }) => (
  <table className="presentaciones-grid">
    <thead>
      <tr>
        <th>Fecha</th>
        <th>Título</th>
        <th>Descripción</th>
        <th>Capacidad</th>
        <th>URL</th>
        {onEdit && <th>Acciones</th>}
      </tr>
    </thead>
    <tbody>
      {presentaciones.map(p => (
        <tr key={p.id}>
          <td>{new Date(p.fechaCreacion).toLocaleDateString()}</td>
          <td>{p.titulo}</td>
          <td>{p.descripcion}</td>
          <td>{p.capacidad || '-'}</td>
          <td><a href={p.url} target="_blank" rel="noopener noreferrer">Abrir</a></td>
          {onEdit && (
            <td>
              <button onClick={() => onSelect(p)}>Ejecutar</button>
              <button onClick={() => onEdit(p)}>Editar</button>
              <button onClick={() => onDelete && onDelete(p.id)}>Eliminar</button>
            </td>
          )}
          {!onEdit && (
            <td><button onClick={() => onSelect(p)}>Ejecutar</button></td>
          )}
        </tr>
      ))}
    </tbody>
  </table>
);
