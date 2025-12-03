// hooks/useGruposFamiliares.ts
import { useState, useCallback } from 'react';
import { supabase, Pessoa } from '../lib/supabase';
import { GrupoWithCounts, FormState, LeadershipField, MembroHistorico, Ocorrencia } from '../types/grupos';

export function useGruposFamiliares() {
  const [grupos, setGrupos] = useState<GrupoWithCounts[]>([]);
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadGrupos = useCallback(async () => {
    const { data, error } = await supabase
      .from('grupos_familiares')
      .select('*')
      .order('nome');
    
    if (error) {
      console.error(error);
      setError('Erro ao carregar grupos');
      return;
    }

    const gruposRaw = (data || []) as any[];
    const gruposWithCounts: GrupoWithCounts[] = await Promise.all(
      gruposRaw.map(async (g) => {
        const { count } = await supabase
          .from('pessoas')
          .select('*', { head: true, count: 'exact' })
          .eq('grupo_familiar_id', g.id);
        return { ...g, membros_count: count || 0 } as GrupoWithCounts;
      })
    );

    setGrupos(gruposWithCounts);
  }, []);

  const loadPessoas = useCallback(async () => {
    const { data, error } = await supabase
      .from('pessoas')
      .select('*')
      .order('nome_completo');
    
    if (error) {
      console.error(error);
      setError('Erro ao carregar pessoas');
      return;
    }
    setPessoas(data || []);
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([loadGrupos(), loadPessoas()]);
    } finally {
      setLoading(false);
    }
  }, [loadGrupos, loadPessoas]);

  const createGrupo = useCallback(async (form: FormState) => {
    setLoading(true);
    setError('');
    
    try {
      const { data, error } = await supabase
        .from('grupos_familiares')
        .insert({
          nome: form.nome,
          descricao: form.descricao || null,
          lider_1_id: form.lider_1_id || null,
          lider_2_id: form.lider_2_id || null,
          co_lider_1_id: form.co_lider_1_id || null,
          co_lider_2_id: form.co_lider_2_id || null
        })
        .select()
        .single();

      if (error) throw error;
      
      await syncMembers(data.id, [], form);
      await loadGrupos();
      await loadPessoas();
      
      return data.id;
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao criar grupo');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadGrupos, loadPessoas]);

  const updateGrupo = useCallback(async (grupoId: string, form: FormState) => {
    setLoading(true);
    setError('');
    
    try {
      const { error } = await supabase
        .from('grupos_familiares')
        .update({
          nome: form.nome,
          descricao: form.descricao || null,
          lider_1_id: form.lider_1_id || null,
          lider_2_id: form.lider_2_id || null,
          co_lider_1_id: form.co_lider_1_id || null,
          co_lider_2_id: form.co_lider_2_id || null
        })
        .eq('id', grupoId);

      if (error) throw error;

      const { data: currentMembers } = await supabase
        .from('pessoas')
        .select('id')
        .eq('grupo_familiar_id', grupoId);
      
      const currentIds = (currentMembers || []).map((m: any) => m.id);
      await syncMembers(grupoId, currentIds, form);
      
      await loadGrupos();
      await loadPessoas();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao atualizar grupo');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadGrupos, loadPessoas]);

  const syncMembers = async (grupoId: string, currentIds: string[], form: FormState) => {
    const newIds = form.membros_ids;
    const toAdd = newIds.filter(id => !currentIds.includes(id));
    const toRemove = currentIds.filter((id: string) => !newIds.includes(id));
    const now = new Date().toISOString();

    const leaderIds = [form.lider_1_id, form.lider_2_id, form.co_lider_1_id, form.co_lider_2_id].filter(Boolean);

    // Adicionar novos membros
    for (const id of toAdd) {
      const papel = getPapel(id, form);
      await supabase.from('pessoas').update({ 
        grupo_familiar_id: grupoId, 
        papel_grupo: papel 
      }).eq('id', id);
      
      await supabase.from('grupo_membros_historico').insert({
        grupo_id: grupoId,
        pessoa_id: id,
        acao: 'adicionado',
        papel,
        data: now,
        nota: currentIds.length > 0 ? 'Adicionado na edição' : 'Adicionado ao criar grupo'
      });
    }

    // Remover membros
    for (const id of toRemove) {
      await supabase.from('pessoas').update({ 
        grupo_familiar_id: null, 
        papel_grupo: null 
      }).eq('id', id);
      
      await supabase.from('grupo_membros_historico').insert({
        grupo_id: grupoId,
        pessoa_id: id,
        acao: 'removido',
        papel: null,
        data: now,
        nota: 'Removido na edição'
      });
    }

    // Garantir papel correto para líderes
    for (const id of leaderIds as string[]) {
      const papel = getPapel(id, form);
      await supabase.from('pessoas').update({ 
        grupo_familiar_id: grupoId, 
        papel_grupo: papel 
      }).eq('id', id);
      
      await supabase.from('grupo_membros_historico').insert({
        grupo_id: grupoId,
        pessoa_id: id,
        acao: 'Promovido',
        papel,
        data: now,
        nota: 'Definido como liderança'
      });
    }
  };

  const getPapel = (id: string, form: FormState): string => {
    if (id === form.lider_1_id || id === form.lider_2_id) return 'líder';
    if (id === form.co_lider_1_id || id === form.co_lider_2_id) return 'co-líder';
    return 'membro';
  };

  const deleteGrupo = useCallback(async (grupoId: string) => {
    setLoading(true);
    try {
      await supabase.from('pessoas').update({ 
        grupo_familiar_id: null, 
        papel_grupo: null 
      }).eq('grupo_familiar_id', grupoId);
      
      await supabase.from('ocorrencias').delete().eq('grupo_id', grupoId);
      await supabase.from('grupo_membros_historico').delete().eq('grupo_id', grupoId);
      
      const { error } = await supabase
        .from('grupos_familiares')
        .delete()
        .eq('id', grupoId);
      
      if (error) throw error;
      
      await loadGrupos();
      await loadPessoas();
    } catch (e) {
      console.error(e);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [loadGrupos, loadPessoas]);

  const addMemberToGroup = useCallback(async (grupoId: string, pessoa: Pessoa, papel: string = 'membro') => {
    setLoading(true);
    try {
      await supabase.from('pessoas').update({ 
        grupo_familiar_id: grupoId, 
        papel_grupo: papel 
      }).eq('id', pessoa.id);

      const now = new Date().toISOString();
      const descricao = `Membro ${pessoa.nome_completo} Adicionado`;
      
      await supabase.from('grupo_membros_historico').insert({
        grupo_id: grupoId,
        pessoa_id: pessoa.id,
        acao: 'Adicionado',
        papel,
        data: now,
        nota: descricao
      });

      await loadPessoas();
    } catch (e) {
      console.error(e);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [loadPessoas]);

  const removeMemberFromGroup = useCallback(async (grupoId: string, pessoa: Pessoa) => {
    setLoading(true);
    try {
      await supabase.from('pessoas').update({ 
        grupo_familiar_id: null, 
        papel_grupo: null 
      }).eq('id', pessoa.id);
      
      const now = new Date().toISOString();
      await supabase.from('grupo_membros_historico').insert({
        grupo_id: grupoId,
        pessoa_id: pessoa.id,
        acao: 'removido',
        papel: null,
        data: now,
        nota: 'Removido via modal'
      });

      await loadPessoas();
    } catch (e) {
      console.error(e);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [loadPessoas]);

  const changeLeadership = useCallback(async (
    grupoId: string, 
    field: LeadershipField, 
    pessoaId: string,
    prevValue: string | null,
    data: string,
    observacao: string
  ) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('grupos_familiares')
        .update({ [field]: pessoaId || null })
        .eq('id', grupoId);
      
      if (error) throw error;

      if (pessoaId) {
        const papel = field.startsWith('co_') ? 'co-líder' : 'líder';
        await supabase.from('pessoas').update({ 
          grupo_familiar_id: grupoId, 
          papel_grupo: papel 
        }).eq('id', pessoaId);
      }

      if (prevValue && prevValue !== pessoaId) {
        const { data: stillMember } = await supabase
          .from('pessoas')
          .select('id')
          .eq('id', prevValue)
          .eq('grupo_familiar_id', grupoId)
          .single();
        
        const papelNovo = stillMember ? 'membro' : null;
        await supabase.from('pessoas').update({ 
          papel_grupo: papelNovo 
        }).eq('id', prevValue);
      }

      const labelField = field.replace('_id', '').replace('_', ' ');
      const notaCompleta = observacao || `Alteração de ${labelField}`;
      
      await supabase.from('grupo_membros_historico').insert({
        grupo_id: grupoId,
        pessoa_id: pessoaId || null,
        acao: field.startsWith('co_') ? 'co_lider_alterado' : 'lider_alterado',
        papel: field.startsWith('co_') ? 'co-líder' : 'líder',
        data: data,
        nota: notaCompleta
      });

      await loadPessoas();
    } catch (e) {
      console.error(e);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [loadPessoas]);

  return {
    // States
    grupos,
    pessoas,
    loading,
    error,
    setError,
    
    // Load functions
    loadAll,
    loadGrupos,
    loadPessoas,
    
    // CRUD operations
    createGrupo,
    updateGrupo,
    deleteGrupo,
    
    // Member operations
    addMemberToGroup,
    removeMemberFromGroup,
    changeLeadership
  };
}