// pages/GruposFamiliaresPage.tsx
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import { supabase, Pessoa } from '../lib/supabase';
import { GrupoWithCounts, FormState } from '../types/grupos';
import { useGruposFamiliares } from '../hooks/useGruposFamiliares';
import GruposList from '../components/GruposFamiliares/GruposList';
import GrupoForm from '../components/GruposFamiliares/GrupoForm';
import GrupoViewModal from '../components/GruposFamiliares/GrupoViewModal';
import PessoaDetails from '../components/Pessoas/PessoaDetails';

interface GruposFamiliaresPageProps {
  onBack: () => void;
}

export default function GruposFamiliaresPage({ onBack }: GruposFamiliaresPageProps) {
  const {
    grupos,
    pessoas,
    loading,
    error,
    setError,
    loadAll,
    createGrupo,
    updateGrupo,
    deleteGrupo
  } = useGruposFamiliares();

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<GrupoWithCounts | null>(null);
  const [form, setForm] = useState<FormState>({
    nome: '',
    descricao: '',
    lider_1_id: '',
    lider_2_id: '',
    co_lider_1_id: '',
    co_lider_2_id: '',
    membros_ids: []
  });

  // View modal states
  const [showGroupView, setShowGroupView] = useState(false);
  const [viewingGroup, setViewingGroup] = useState<GrupoWithCounts | null>(null);

  // Pessoa details states
  const [selectedPessoaId, setSelectedPessoaId] = useState<string | null>(null);
  const [personViewOpen, setPersonViewOpen] = useState(false);

  // Load data on mount
  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // --- Form handlers ---
  const handleNew = () => {
    setEditing(null);
    setForm({
      nome: '',
      descricao: '',
      lider_1_id: '',
      lider_2_id: '',
      co_lider_1_id: '',
      co_lider_2_id: '',
      membros_ids: []
    });
    setShowForm(true);
    setError('');
  };

  const handleEdit = async (grupo: GrupoWithCounts) => {
    setEditing(grupo);
    
    const { data: membrosData } = await supabase
      .from('pessoas')
      .select('id')
      .eq('grupo_familiar_id', grupo.id)
      .order('nome_completo');
    
    const membros_ids = (membrosData || []).map((m: any) => m.id);

    setForm({
      nome: grupo.nome || '',
      descricao: (grupo as any).descricao || '',
      lider_1_id: (grupo as any).lider_1_id || '',
      lider_2_id: (grupo as any).lider_2_id || '',
      co_lider_1_id: (grupo as any).co_lider_1_id || '',
      co_lider_2_id: (grupo as any).co_lider_2_id || '',
      membros_ids
    });
    setShowForm(true);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');

    if (!form.nome.trim()) {
      setError('Nome do grupo é obrigatório');
      return;
    }

    const leaderIds = [
      form.lider_1_id,
      form.lider_2_id,
      form.co_lider_1_id,
      form.co_lider_2_id
    ].filter(Boolean);

    if (new Set(leaderIds).size !== leaderIds.length) {
      setError('Uma mesma pessoa não pode ocupar mais de um papel de liderança');
      return;
    }

    try {
      if (editing) {
        await updateGrupo(editing.id!, form);
      } else {
        await createGrupo(form);
      }
      setShowForm(false);
      setEditing(null);
    } catch (err) {
      // Error is handled in hook
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditing(null);
    setError('');
  };

  const handleDelete = async (grupoId: string) => {
    try {
      await deleteGrupo(grupoId);
    } catch (e) {
      alert('Erro ao excluir grupo');
    }
  };

  // --- View modal handlers ---
  const openGroupView = (grupo: GrupoWithCounts) => {
    setViewingGroup(grupo);
    setShowGroupView(true);
  };

  const closeGroupView = () => {
    setShowGroupView(false);
    setViewingGroup(null);
  };

  const handleEditFromView = () => {
    if (viewingGroup) {
      closeGroupView();
      handleEdit(viewingGroup);
    }
  };

  // --- Pessoa handlers ---
  const openPessoaFicha = (pessoa: Pessoa) => {
    setSelectedPessoaId(pessoa.id);
    setPersonViewOpen(true);
  };

  const closePessoaFicha = () => {
    setSelectedPessoaId(null);
    setPersonViewOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-slate-100 rounded-lg transition"
        >
          <ArrowLeft className="w-5 h-5 text-slate-700" />
        </button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-slate-900">Grupos Familiares</h2>
          <p className="text-slate-600 text-sm">
            Gerencie células, líderes, membros e ocorrências
          </p>
        </div>
        {!showForm && !personViewOpen && (
          <button
            onClick={handleNew}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Novo Grupo
          </button>
        )}
      </div>

      {/* Pessoa Details (inline) */}
      {personViewOpen && selectedPessoaId && (
        <div className="p-4 bg-white rounded-xl border">
          <div className="mb-4">
            <button
              onClick={closePessoaFicha}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-800"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>
          </div>
          <PessoaDetails pessoaId={selectedPessoaId} onClose={closePessoaFicha} />
        </div>
      )}

      {/* Main Content */}
      {!personViewOpen && (
        <>
          {/* Form */}
          {showForm && (
            <GrupoForm
              editing={editing}
              form={form}
              setForm={setForm}
              pessoas={pessoas}
              loading={loading}
              error={error}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              onRemoveMembro={(id) => {
                setForm(prev => ({
                  ...prev,
                  membros_ids: prev.membros_ids.filter(x => x !== id)
                }));
              }}
              onOpenPessoaFicha={openPessoaFicha}
            />
          )}

          {/* List */}
          {!showForm && (
            <GruposList
              grupos={grupos}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onView={openGroupView}
              loading={loading}
            />
          )}

          {/* View Modal */}
          {showGroupView && viewingGroup && (
            <GrupoViewModal
              grupo={viewingGroup}
              pessoas={pessoas}
              onClose={closeGroupView}
              onEdit={handleEditFromView}
              onReload={loadAll}
              onViewPessoa={openPessoaFicha}
            />
          )}
        </>
      )}
    </div>
  );
}