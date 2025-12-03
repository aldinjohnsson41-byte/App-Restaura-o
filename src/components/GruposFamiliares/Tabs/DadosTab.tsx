// components/GruposFamiliares/Tabs/DadosTab.tsx
import React from 'react';
import { GrupoWithCounts, LeadershipField } from '../../../types/grupos';
import { Pessoa } from '../../../lib/supabase';

interface DadosTabProps {
  grupo: GrupoWithCounts;
  membros: Pessoa[];
  onChangeLeadership: (field: LeadershipField, pessoaId: string) => void;
  pessoaNomeById: (id?: string | null) => string;
}

export default function DadosTab({ 
  grupo, 
  membros, 
  onChangeLeadership, 
  pessoaNomeById 
}: DadosTabProps) {
  
  const leadershipFields: { label: string; field: LeadershipField }[] = [
    { label: 'Líder 1', field: 'lider_1_id' },
    { label: 'Líder 2', field: 'lider_2_id' },
    { label: 'Co-líder 1', field: 'co_lider_1_id' },
    { label: 'Co-líder 2', field: 'co_lider_2_id' }
  ];

  return (
    <div className="space-y-6">
      {/* Descrição */}
      <div>
        <h4 className="text-sm font-semibold text-slate-700 mb-2">Descrição</h4>
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <p className="text-slate-700">
            {(grupo as any).descricao || (
              <span className="text-slate-400 italic">Nenhuma descrição cadastrada</span>
            )}
          </p>
        </div>
      </div>

      {/* Liderança */}
      <div>
        <h4 className="text-sm font-semibold text-slate-700 mb-3">Liderança</h4>
        <div className="space-y-4">
          {leadershipFields.map(({ label, field }) => (
            <div 
              key={field}
              className="bg-slate-50 rounded-lg p-4 border border-slate-200"
            >
              <div className="flex items-center justify-between gap-4">
                {/* Info atual */}
                <div className="flex-1">
                  <div className="text-xs text-slate-500 mb-1">{label}</div>
                  <div className="font-medium text-slate-900">
                    {pessoaNomeById((grupo as any)[field])}
                  </div>
                </div>

                {/* Select para alterar */}
                <div className="flex-1">
                  <select
                    value={(grupo as any)[field] || ''}
                    onChange={(e) => onChangeLeadership(field, e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                  >
                    <option value="">-- Remover --</option>
                    {membros.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nome_completo}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Estatísticas */}
      <div>
        <h4 className="text-sm font-semibold text-slate-700 mb-3">Estatísticas</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
            <div className="text-xs text-orange-700 mb-1">Total de Membros</div>
            <div className="text-2xl font-bold text-orange-900">
              {grupo.membros_count || 0}
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="text-xs text-blue-700 mb-1">Líderes</div>
            <div className="text-2xl font-bold text-blue-900">
              {[
                (grupo as any).lider_1_id,
                (grupo as any).lider_2_id
              ].filter(Boolean).length}
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <div className="text-xs text-purple-700 mb-1">Co-líderes</div>
            <div className="text-2xl font-bold text-purple-900">
              {[
                (grupo as any).co_lider_1_id,
                (grupo as any).co_lider_2_id
              ].filter(Boolean).length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}