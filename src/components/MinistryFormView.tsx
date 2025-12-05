// components/MinistryFormView.tsx
import React from 'react';
import { ArrowLeft, Save, X } from 'lucide-react';
import { Ministry, MinistryFormData, MinistryStatus } from '../types/ministryPage.types';

interface MinistryFormViewProps {
  formData: MinistryFormData;
  selectedMinistry: Ministry | null;
  onFormChange: (data: MinistryFormData) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function MinistryFormView({
  formData,
  selectedMinistry,
  onFormChange,
  onSave,
  onCancel
}: MinistryFormViewProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onCancel}
            className="p-2 hover:bg-slate-100 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              {selectedMinistry ? 'Editar Ministério' : 'Novo Ministério'}
            </h2>
            <p className="text-slate-600 text-sm">Preencha os dados do ministério</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nome do Ministério *
              </label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => onFormChange({ ...formData, nome: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: Louvor e Adoração"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Descrição
              </label>
              <textarea
                value={formData.descricao}
                onChange={(e) => onFormChange({ ...formData, descricao: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Descreva o propósito e atividades do ministério..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => onFormChange({ ...formData, status: e.target.value as MinistryStatus })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Cor
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.cor}
                    onChange={(e) => onFormChange({ ...formData, cor: e.target.value })}
                    className="h-10 w-20 rounded border border-slate-300"
                  />
                  <input
                    type="text"
                    value={formData.cor}
                    onChange={(e) => onFormChange({ ...formData, cor: e.target.value })}
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="#3B82F6"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t">
              <button
                onClick={onCancel}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancelar
              </button>
              <button
                onClick={onSave}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Salvar Ministério
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}