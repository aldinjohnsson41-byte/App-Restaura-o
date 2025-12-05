// hooks/useMinistries.ts
import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Ministry, MinistryFormData, MinistryFilters } from '../types/ministry';

export function useMinistries() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMinistries = useCallback(async (filters?: MinistryFilters) => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('ministries')
        .select(`
          *,
          _count:ministry_members(count)
        `)
        .order('nome');

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.search) {
        query = query.ilike('nome', `%${filters.search}%`);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      return data as Ministry[];
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMinistry = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('ministries')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      return data as Ministry;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createMinistry = useCallback(async (formData: MinistryFormData, userId: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: createError } = await supabase
        .from('ministries')
        .insert({ ...formData, created_by: userId })
        .select()
        .single();

      if (createError) throw createError;

      // Registrar no histórico
      await supabase.from('schedule_changes_history').insert({
        tabela: 'ministries',
        registro_id: data.id,
        acao: 'create',
        dados_novos: data,
        created_by: userId
      });

      return data as Ministry;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateMinistry = useCallback(async (id: string, formData: Partial<MinistryFormData>, userId: string) => {
    setLoading(true);
    setError(null);

    try {
      // Buscar dados anteriores
      const { data: oldData } = await supabase
        .from('ministries')
        .select('*')
        .eq('id', id)
        .single();

      const { data, error: updateError } = await supabase
        .from('ministries')
        .update(formData)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Registrar no histórico
      await supabase.from('schedule_changes_history').insert({
        tabela: 'ministries',
        registro_id: id,
        acao: 'update',
        dados_anteriores: oldData,
        dados_novos: data,
        created_by: userId
      });

      return data as Ministry;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteMinistry = useCallback(async (id: string, userId: string) => {
    setLoading(true);
    setError(null);

    try {
      // Buscar dados antes de deletar
      const { data: oldData } = await supabase
        .from('ministries')
        .select('*')
        .eq('id', id)
        .single();

      const { error: deleteError } = await supabase
        .from('ministries')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      // Registrar no histórico
      await supabase.from('schedule_changes_history').insert({
        tabela: 'ministries',
        registro_id: id,
        acao: 'delete',
        dados_anteriores: oldData,
        created_by: userId
      });

      return true;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    fetchMinistries,
    fetchMinistry,
    createMinistry,
    updateMinistry,
    deleteMinistry
  };
}

// hooks/useMinistryMembers.ts
export function useMinistryMembers() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = useCallback(async (ministryId: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('ministry_members')
        .select(`
          *,
          pessoa:pessoa_id(id, nome_completo, email, telefone, whatsapp)
        `)
        .eq('ministry_id', ministryId)
        .order('funcao', { ascending: false })
        .order('data_entrada', { ascending: false });

      if (fetchError) throw fetchError;

      return data;
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const addMember = useCallback(async (formData: any, userId: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: insertError } = await supabase
        .from('ministry_members')
        .insert(formData)
        .select()
        .single();

      if (insertError) throw insertError;

      // Registrar no histórico
      await supabase.from('schedule_changes_history').insert({
        tabela: 'ministry_members',
        registro_id: data.id,
        acao: 'create',
        dados_novos: data,
        created_by: userId
      });

      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateMember = useCallback(async (id: string, formData: any, userId: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data: oldData } = await supabase
        .from('ministry_members')
        .select('*')
        .eq('id', id)
        .single();

      const { data, error: updateError } = await supabase
        .from('ministry_members')
        .update(formData)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      await supabase.from('schedule_changes_history').insert({
        tabela: 'ministry_members',
        registro_id: id,
        acao: 'update',
        dados_anteriores: oldData,
        dados_novos: data,
        created_by: userId
      });

      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const removeMember = useCallback(async (id: string, userId: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data: oldData } = await supabase
        .from('ministry_members')
        .select('*')
        .eq('id', id)
        .single();

      const { error: deleteError } = await supabase
        .from('ministry_members')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      await supabase.from('schedule_changes_history').insert({
        tabela: 'ministry_members',
        registro_id: id,
        acao: 'delete',
        dados_anteriores: oldData,
        created_by: userId
      });

      return true;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    fetchMembers,
    addMember,
    updateMember,
    removeMember
  };
}

// hooks/useMinistrySchedules.ts
export function useMinistrySchedules() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSchedules = useCallback(async (ministryId: string, dataInicio?: string, dataFim?: string) => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('ministry_schedules')
        .select(`
          *,
          ministry:ministry_id(id, nome, cor),
          membros:ministry_schedule_members(
            *,
            pessoa:pessoa_id(id, nome_completo, telefone)
          )
        `)
        .eq('ministry_id', ministryId)
        .order('data_escala', { ascending: true });

      if (dataInicio) {
        query = query.gte('data_escala', dataInicio);
      }

      if (dataFim) {
        query = query.lte('data_escala', dataFim);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      return data;
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createSchedule = useCallback(async (formData: any, userId: string) => {
    setLoading(true);
    setError(null);

    try {
      // Verificar conflitos de horário
      const { data: conflicts } = await supabase
        .from('ministry_schedules')
        .select('*')
        .eq('ministry_id', formData.ministry_id)
        .eq('data_escala', formData.data_escala)
        .neq('status', 'cancelada')
        .overlaps('hora_inicio', 'hora_fim', formData.hora_inicio, formData.hora_fim);

      if (conflicts && conflicts.length > 0) {
        throw new Error('Já existe uma escala neste horário');
      }

      const { data: schedule, error: scheduleError } = await supabase
        .from('ministry_schedules')
        .insert({
          ministry_id: formData.ministry_id,
          data_escala: formData.data_escala,
          hora_inicio: formData.hora_inicio,
          hora_fim: formData.hora_fim,
          observacoes: formData.observacoes,
          status: formData.status,
          created_by: userId
        })
        .select()
        .single();

      if (scheduleError) throw scheduleError;

      // Adicionar membros
      if (formData.membros && formData.membros.length > 0) {
        const membrosData = formData.membros.map((m: any) => ({
          schedule_id: schedule.id,
          pessoa_id: m.pessoa_id,
          funcao_escala: m.funcao_escala
        }));

        const { error: membrosError } = await supabase
          .from('ministry_schedule_members')
          .insert(membrosData);

        if (membrosError) throw membrosError;
      }

      await supabase.from('schedule_changes_history').insert({
        tabela: 'ministry_schedules',
        registro_id: schedule.id,
        acao: 'create',
        dados_novos: { ...schedule, membros: formData.membros },
        created_by: userId
      });

      return schedule;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSchedule = useCallback(async (id: string, formData: any, userId: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data: oldData } = await supabase
        .from('ministry_schedules')
        .select('*, membros:ministry_schedule_members(*)')
        .eq('id', id)
        .single();

      const { data, error: updateError } = await supabase
        .from('ministry_schedules')
        .update({
          data_escala: formData.data_escala,
          hora_inicio: formData.hora_inicio,
          hora_fim: formData.hora_fim,
          observacoes: formData.observacoes,
          status: formData.status
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Atualizar membros se fornecidos
      if (formData.membros) {
        await supabase
          .from('ministry_schedule_members')
          .delete()
          .eq('schedule_id', id);

        if (formData.membros.length > 0) {
          const membrosData = formData.membros.map((m: any) => ({
            schedule_id: id,
            pessoa_id: m.pessoa_id,
            funcao_escala: m.funcao_escala
          }));

          await supabase
            .from('ministry_schedule_members')
            .insert(membrosData);
        }
      }

      await supabase.from('schedule_changes_history').insert({
        tabela: 'ministry_schedules',
        registro_id: id,
        acao: 'update',
        dados_anteriores: oldData,
        dados_novos: { ...data, membros: formData.membros },
        created_by: userId
      });

      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteSchedule = useCallback(async (id: string, userId: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data: oldData } = await supabase
        .from('ministry_schedules')
        .select('*')
        .eq('id', id)
        .single();

      const { error: deleteError } = await supabase
        .from('ministry_schedules')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      await supabase.from('schedule_changes_history').insert({
        tabela: 'ministry_schedules',
        registro_id: id,
        acao: 'delete',
        dados_anteriores: oldData,
        created_by: userId
      });

      return true;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    fetchSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule
  };
}

// hooks/useServices.ts
export function useServices() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('services')
        .select(`
          *,
          ministerios:service_ministries(
            *,
            ministry:ministry_id(id, nome, cor)
          )
        `)
        .order('dia_semana')
        .order('hora_inicio');

      if (fetchError) throw fetchError;

      return data;
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createService = useCallback(async (formData: any, userId: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data: service, error: serviceError } = await supabase
        .from('services')
        .insert({
          nome: formData.nome,
          dia_semana: formData.dia_semana,
          hora_inicio: formData.hora_inicio,
          hora_fim: formData.hora_fim,
          observacoes: formData.observacoes,
          status: formData.status,
          created_by: userId
        })
        .select()
        .single();

      if (serviceError) throw serviceError;

      // Adicionar ministérios
      if (formData.ministerios && formData.ministerios.length > 0) {
        const ministeriosData = formData.ministerios.map((m: any) => ({
          service_id: service.id,
          ministry_id: m.ministry_id,
          ordem: m.ordem,
          obrigatorio: m.obrigatorio
        }));

        const { error: ministeriosError } = await supabase
          .from('service_ministries')
          .insert(ministeriosData);

        if (ministeriosError) throw ministeriosError;
      }

      return service;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    fetchServices,
    createService
  };
}