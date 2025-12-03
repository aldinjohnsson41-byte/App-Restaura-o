// components/GruposFamiliares/GruposList.tsx
import React from 'react';
import { Edit, Trash2, UsersRound } from 'lucide-react';
import { GrupoWithCounts } from '../../types/grupos';

interface GruposListProps {
  grupos: GrupoWithCounts[];
  onEdit: (grupo: GrupoWithCounts) => void;
  onDelete: (grupoId: string) => void;
  onView: (grupo: GrupoWithCounts) => void;
  loading: boolean;
}

export default function GruposList({ grupos, onEdit, onDelete, onView, loading }: GruposListProps) {
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-slate-600">Carregando grupos...</div>
      </div>
    );
  }

  if (grupos.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border">
        <UsersRound className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Nenhum grupo cadastrado</h3>
        <p className="text-slate-600 text-sm">Clique em "Novo Grupo" para começar</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {grupos.map((grupo) => (
        <div 
          key={grupo.id} 
          className="bg-white border rounded-xl p-6 hover:shadow-lg transition cursor-pointer"
          onClick={() => onView(grupo)}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900 mb-1">{grupo.nome}</h3>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <UsersRound className="w-3 h-3" />
                {grupo.membros_count || 0} membro(s)
              </p>
            </div>
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => onEdit(grupo)}
                className="p-2 rounded hover:bg-slate-50 transition"
                title="Editar grupo"
              >
                <Edit className="w-4 h-4 text-slate-600" />
              </button>
              <button
                onClick={() => {
                  if (confirm(`Deseja realmente excluir o grupo "${grupo.nome}"?`)) {
                    onDelete(grupo.id!);
                  }
                }}
                className="p-2 rounded hover:bg-red-50 transition"
                title="Excluir grupo"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
              </button>
            </div>
          </div>
          
          {(grupo as any).descricao && (
            <div className="text-sm text-slate-600 line-clamp-2">
              {(grupo as any).descricao}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}