// components/GruposFamiliares/Tabs/HistoricoTab.tsx
import React from 'react';
import { Check, AlertCircle, UserPlus, UserMinus, TrendingUp, TrendingDown, Shield } from 'lucide-react';
import { MembroHistorico } from '../../../types/grupos';

interface HistoricoTabProps {
  historico: MembroHistorico[];
  formatDate: (date?: string | null) => string;
}

export default function HistoricoTab({ historico, formatDate }: HistoricoTabProps) {
  
  const getAcaoIcon = (acao?: string) => {
    switch (acao) {
      case 'adicionado':
        return <UserPlus className="w-5 h-5 text-green-600" />;
      case 'removido':
        return <UserMinus className="w-5 h-5 text-red-600" />;
      case 'Promovido':
        return <TrendingUp className="w-5 h-5 text-blue-600" />;
      case 'Rebaixado':
        return <TrendingDown className="w-5 h-5 text-orange-600" />;
      case 'Lider alterado':
      case 'Co lider alterado':
        return <Shield className="w-5 h-5 text-purple-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-slate-400" />;
    }
  };

  const getAcaoBadgeColor = (acao?: string) => {
    switch (acao) {
      case 'adicionado':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'removido':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'Promovido':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Rebaixado':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Lider alterado':
      case 'Co lider alterado':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getSuccessIcon = (acao?: string) => {
    const successActions = ['Adicionado', 'Promovido', 'Lider Alterado', 'Co lider alterado'];
    return successActions.includes(acao || '');
  };

  if (historico.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200">
        <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-sm text-slate-500 italic">Nenhum registro no histórico</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {historico.map((item) => (
        <div
          key={item.id}
          className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition"
        >
          <div className="flex items-start gap-4">
            {/* Ícone da ação */}
            <div className="flex-shrink-0 mt-1">
              {getAcaoIcon(item.acao)}
            </div>

            {/* Conteúdo */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getAcaoBadgeColor(item.acao)}`}>
                    {item.acao?.replace('_', ' ')}
                  </span>
                  {item.papel && (
                    <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-full text-xs">
                      {item.papel}
                    </span>
                  )}
                </div>
                
                <span className="text-xs text-slate-500 whitespace-nowrap">
                  {formatDate(item.data)}
                </span>
              </div>

              {/* Descrição/Nota */}
              {(item.nota || item.descricao) && (
                <p className="text-sm text-slate-700">
                  {item.nota || item.descricao}
                </p>
              )}
            </div>

            {/* Ícone de status */}
            <div className="flex-shrink-0">
              {getSuccessIcon(item.acao) ? (
                <div className="p-1.5 bg-green-100 rounded-full">
                  <Check className="w-4 h-4 text-green-600" />
                </div>
              ) : (
                <div className="p-1.5 bg-slate-100 rounded-full">
                  <AlertCircle className="w-4 h-4 text-slate-400" />
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}