// components/StatusBadge.tsx
import React from 'react';

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const colors: Record<string, string> = {
    ativo: 'bg-green-100 text-green-800 border-green-200',
    inativo: 'bg-slate-100 text-slate-800 border-slate-200',
    afastado: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    planejada: 'bg-blue-100 text-blue-800 border-blue-200',
    confirmada: 'bg-green-100 text-green-800 border-green-200',
    concluida: 'bg-slate-100 text-slate-800 border-slate-200',
    cancelada: 'bg-red-100 text-red-800 border-red-200',
    membro: 'bg-blue-100 text-blue-800 border-blue-200',
    lider: 'bg-purple-100 text-purple-800 border-purple-200'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[status] || colors.ativo}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}