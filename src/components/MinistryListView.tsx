// components/MinistryListView.tsx
import React from 'react';
import { Users, Plus, Edit, Trash2, Search } from 'lucide-react';
import { Ministry } from '../types/ministryPage.types';
import { StatusBadge } from './StatusBadge';

interface MinistryListViewProps {
  ministries: Ministry[];
  searchTerm: string;
  statusFilter: string;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onNewMinistry: () => void;
  onEditMinistry: (ministry: Ministry) => void;
  onDeleteMinistry: (id: string) => void;
  onViewMinistry: (ministry: Ministry) => void;
}

export function MinistryListView({
  ministries,
  searchTerm,
  statusFilter,
  onSearchChange,
  onStatusFilterChange,
  onNewMinistry,
  onEditMinistry,
  onDeleteMinistry,
  onViewMinistry
}: MinistryListViewProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Ministérios</h2>
            <p className="text-slate-600 mt-1">Gerencie ministérios, membros e escalas</p>
          </div>
          <button
            onClick={onNewMinistry}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Novo Ministério
          </button>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar ministério..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos os Status</option>
              <option value="ativo">Ativos</option>
              <option value="inativo">Inativos</option>
            </select>
          </div>
        </div>

        {/* Grid de Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ministries.map((ministry) => (
            <div
              key={ministry.id}
              className="group bg-white rounded-xl shadow-sm border-2 border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all p-6 cursor-pointer"
              onClick={() => onViewMinistry(ministry)}
            >
              {/* Header do Card */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 flex-1">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: ministry.cor + '20' }}
                  >
                    <Users className="w-6 h-6" style={{ color: ministry.cor }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 truncate">
                      {ministry.nome}
                    </h3>
                    <StatusBadge status={ministry.status} />
                  </div>
                </div>
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onEditMinistry(ministry)}
                    className="p-2 hover:bg-slate-100 rounded-lg transition"
                    title="Editar"
                  >
                    <Edit className="w-4 h-4 text-slate-600" />
                  </button>
                  <button
                    onClick={() => onDeleteMinistry(ministry.id)}
                    className="p-2 hover:bg-red-50 rounded-lg transition"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </div>

              {/* Descrição */}
              {ministry.descricao && (
                <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                  {ministry.descricao}
                </p>
              )}

              {/* Estatísticas */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900">
                    {ministry.membros_count || 0}
                  </div>
                  <div className="text-xs text-slate-600">Membros</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900">
                    {ministry.escalas_count || 0}
                  </div>
                  <div className="text-xs text-slate-600">Escalas</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {ministries.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-slate-300">
            <Users className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Nenhum ministério encontrado
            </h3>
            <p className="text-slate-600 mb-4">
              {searchTerm ? 'Tente ajustar os filtros de busca' : 'Comece criando seu primeiro ministério'}
            </p>
            {!searchTerm && (
              <button
                onClick={onNewMinistry}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
              >
                <Plus className="w-4 h-4" />
                Criar Primeiro Ministério
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}