import React from 'react';
import { Ministry } from '../../types/ministryPage.types';
import { StatusBadge } from '../StatusBadge';

interface MinistryDadosTabProps {
  ministry: Ministry;
  membros: any[];
}

export default function MinistryDadosTab({ ministry, membros }: MinistryDadosTabProps) {
  const membrosAtivos = membros.filter(m => m.status === 'ativo').length;
  const lideres = membros.filter(m => m.funcao === 'lider' && m.status === 'ativo').length;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-slate-500 mb-1">Descrição</h3>
        <p className="text-slate-900">
          {ministry.descricao || 'Sem descrição cadastrada'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-medium text-slate-500 mb-1">Cor</h3>
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded border border-slate-300"
              style={{ backgroundColor: ministry.cor }}
            />
            <span className="text-slate-900 font-mono">{ministry.cor}</span>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-medium text-slate-500 mb-1">Status</h3>
          <StatusBadge status={ministry.status} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 pt-6 border-t">
        <div className="text-center p-6 bg-blue-50 rounded-lg">
          <div className="text-3xl font-bold text-blue-900 mb-1">
            {membrosAtivos}
          </div>
          <div className="text-sm text-blue-700">Membros Ativos</div>
        </div>
        <div className="text-center p-6 bg-purple-50 rounded-lg">
          <div className="text-3xl font-bold text-purple-900 mb-1">
            {lideres}
          </div>
          <div className="text-sm text-purple-700">Líderes</div>
        </div>
        <div className="text-center p-6 bg-green-50 rounded-lg">
          <div className="text-3xl font-bold text-green-900 mb-1">
            {ministry.escalas_count || 0}
          </div>
          <div className="text-sm text-green-700">Escalas Futuras</div>
        </div>
      </div>
    </div>
  );
}