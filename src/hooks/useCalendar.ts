import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { ConflitoDiagnostico } from '../types/calendar';

export function useCalendar() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---------------------------------------------------
  // 🔍 VERIFICAR CONFLITOS
  // ---------------------------------------------------
  const verificarConflitos = useCallback(
    async (
      espaco_id: string,
      data: string,
      hora_inicio: string,
      hora_fim: string,
      exclude_evento_id?: string
    ): Promise<ConflitoDiagnostico> => {
      try {
        setError(null);

        // Buscar eventos no mesmo espaço/data
        let query = supabase
          .from("eventos_agenda")
          .select("id, nome, data_evento, hora_inicio, hora_fim")
          .eq("espaco_id", espaco_id)
          .eq("data_evento", data)
          .eq("status", "confirmado");

        // Excluir o próprio evento ao EDITAR
        if (exclude_evento_id) {
          query = query.neq("id", exclude_evento_id);
        }

        const { data: eventos, error: eventoErr } = await query;

        if (eventoErr) throw eventoErr;

        // Filtrar conflitos reais (intervalo se sobrepõe)
        const eventosConflito = (eventos || []).filter((e: any) => {
          if (!e.hora_inicio || !e.hora_fim) return false;

          return !(
            e.hora_fim <= hora_inicio || 
            e.hora_inicio >= hora_fim
          ); 
        });

        // Buscar reservas no mesmo espaço/data
        const { data: reservas, error: reservaErr } = await supabase
          .from("reservas_espacos")
          .select("id, responsavel_nome, data_reserva, hora_inicio, hora_fim")
          .eq("espaco_id", espaco_id)
          .eq("data_reserva", data)
          .eq("status", "confirmada");

        if (reservaErr) throw reservaErr;

        const reservasConflito = (reservas || []).filter((r: any) => {
          return !(r.hora_fim <= hora_inicio || r.hora_inicio >= hora_fim);
        });

        const existe = eventosConflito.length > 0 || reservasConflito.length > 0;

        return {
          existe,
          tipo: existe ? "horario" : "nenhum",
          mensagem: existe
            ? "Existe um conflito de horário com outro evento ou reserva"
            : "Sem conflitos",
          conflitos: [
            ...eventosConflito.map((e: any) => ({
              evento_id: e.id,
              nome: e.nome,
              data: e.data_evento,
              hora_inicio: e.hora_inicio,
              hora_fim: e.hora_fim
            })),
            ...reservasConflito.map((r: any) => ({
              reserva_id: r.id,
              nome: r.responsavel_nome,
              data: r.data_reserva,
              hora_inicio: r.hora_inicio,
              hora_fim: r.hora_fim
            })),
          ]
        };
      } catch (err: any) {
        setError(err.message);
        return {
          existe: false,
          tipo: "nenhum",
          mensagem: "Erro ao verificar conflitos",
          conflitos: []
        };
      }
    },
    []
  );

  // ---------------------------------------------------
  // 🟩 CRIAR EVENTO
  // ---------------------------------------------------
  const criarEvento = useCallback(
    async (eventoData: any, user_id: string) => {
      try {
        setLoading(true);
        setError(null);

        console.log("📝 [CRIAR EVENTO] Dados recebidos:", eventoData);
        console.log("👤 [CRIAR EVENTO] User ID:", user_id);
        console.log("👥 [CRIAR EVENTO] Participantes IDs:", eventoData.participantes_ids);

        // ✅ ETAPA 1: Inserir o evento
        const { data: novoEvento, error: insertError } = await supabase
          .from("eventos_agenda")
          .insert({
            nome: eventoData.nome,
            descricao: eventoData.descricao,
            data_evento: eventoData.data_evento,
            data_fim: eventoData.data_fim,
            multiplos_dias: eventoData.multiplos_dias,
            hora_inicio: eventoData.hora_inicio,
            hora_fim: eventoData.hora_fim,
            dia_inteiro: eventoData.dia_inteiro,
            local: eventoData.local,
            endereco_completo: eventoData.endereco_completo,
            espaco_id: eventoData.espaco_id,
            status: eventoData.status || "confirmado",
            observacoes: eventoData.observacoes,
            criado_por: user_id,
            sincronizado_google: false
          })
          .select()
          .single();

        if (insertError) {
          console.error("❌ [CRIAR EVENTO] Erro ao inserir evento:", insertError);
          throw insertError;
        }

        console.log("✅ [CRIAR EVENTO] Evento criado com ID:", novoEvento.id);

        // ✅ ETAPA 2: Adicionar participantes
        if (eventoData.participantes_ids && eventoData.participantes_ids.length > 0) {
          console.log("👥 [PARTICIPANTES] Iniciando inserção de", eventoData.participantes_ids.length, "participantes");

          const participantes = eventoData.participantes_ids.map((pessoa_id: string) => {
            console.log("  - Preparando participante:", pessoa_id);
            return {
              evento_id: novoEvento.id,
              pessoa_id: pessoa_id,
              confirmacao_presenca: "pendente",
              notificacao_enviada: false
            };
          });

          console.log("👥 [PARTICIPANTES] Array preparado:", participantes);

          const { data: participantesInseridos, error: participantesError } = await supabase
            .from("evento_participantes")
            .insert(participantes)
            .select();

          if (participantesError) {
            console.error("❌ [PARTICIPANTES] Erro ao inserir:", participantesError);
            console.error("❌ [PARTICIPANTES] Mensagem:", participantesError.message);
            console.error("❌ [PARTICIPANTES] Detalhes:", participantesError.details);
            console.error("❌ [PARTICIPANTES] Hint:", participantesError.hint);
            console.error("❌ [PARTICIPANTES] Code:", participantesError.code);
            // Não falhar a operação inteira
            console.warn("⚠️ [PARTICIPANTES] Evento criado mas participantes não foram adicionados");
          } else {
            console.log("✅ [PARTICIPANTES] Inseridos com sucesso:", participantesInseridos);
            console.log("✅ [PARTICIPANTES] Total inserido:", participantesInseridos?.length);
          }
        } else {
          console.log("ℹ️ [PARTICIPANTES] Nenhum participante para adicionar");
        }

        return novoEvento;
      } catch (err: any) {
        console.error("❌ [CRIAR EVENTO] Erro geral:", err);
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // ---------------------------------------------------
  // ✏️ ATUALIZAR EVENTO
  // ---------------------------------------------------
  const atualizarEvento = useCallback(
    async (evento_id: string, eventoData: any) => {
      try {
        setLoading(true);
        setError(null);

        console.log("✏️ Atualizando evento:", evento_id, eventoData);

        // ✅ ETAPA 1: Atualizar dados do evento
        const { data: eventoAtualizado, error: updateError } = await supabase
          .from("eventos_agenda")
          .update({
            nome: eventoData.nome,
            descricao: eventoData.descricao,
            data_evento: eventoData.data_evento,
            data_fim: eventoData.data_fim,
            multiplos_dias: eventoData.multiplos_dias,
            hora_inicio: eventoData.hora_inicio,
            hora_fim: eventoData.hora_fim,
            dia_inteiro: eventoData.dia_inteiro,
            local: eventoData.local,
            endereco_completo: eventoData.endereco_completo,
            espaco_id: eventoData.espaco_id,
            status: eventoData.status,
            observacoes: eventoData.observacoes,
            updated_at: new Date().toISOString()
          })
          .eq("id", evento_id)
          .select()
          .single();

        if (updateError) {
          console.error("❌ Erro ao atualizar evento:", updateError);
          throw updateError;
        }

        console.log("✅ Evento atualizado:", eventoAtualizado);

        // ✅ ETAPA 2: Atualizar participantes (se fornecido)
        if (eventoData.participantes_ids !== undefined) {
          console.log("👥 Atualizando participantes...");

          // Deletar participantes existentes
          const { error: deleteError } = await supabase
            .from("evento_participantes")
            .delete()
            .eq("evento_id", evento_id);

          if (deleteError) {
            console.error("❌ Erro ao deletar participantes antigos:", deleteError);
          }

          // Inserir novos participantes
          if (eventoData.participantes_ids.length > 0) {
            const novosParticipantes = eventoData.participantes_ids.map((pessoa_id: string) => ({
              evento_id,
              pessoa_id,
              confirmacao_presenca: "pendente",
              notificacao_enviada: false
            }));

            const { error: insertError } = await supabase
              .from("evento_participantes")
              .insert(novosParticipantes);

            if (insertError) {
              console.error("❌ Erro ao inserir novos participantes:", insertError);
            } else {
              console.log("✅ Participantes atualizados com sucesso!");
            }
          }
        }

        return eventoAtualizado;
      } catch (err: any) {
        console.error("❌ Erro geral ao atualizar evento:", err);
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // ---------------------------------------------------
  // 🗑️ DELETAR EVENTO
  // ---------------------------------------------------
  const deletarEvento = useCallback(async (evento_id: string) => {
    try {
      setLoading(true);
      setError(null);

      console.log("🗑️ Deletando evento:", evento_id);

      // Os participantes serão deletados automaticamente se houver CASCADE
      const { error } = await supabase
        .from("eventos_agenda")
        .delete()
        .eq("id", evento_id);

      if (error) throw error;

      console.log("✅ Evento deletado com sucesso!");
    } catch (err: any) {
      console.error("❌ Erro ao deletar evento:", err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ---------------------------------------------------
  // 🟦 CRIAR RESERVA
  // ---------------------------------------------------
  const criarReserva = useCallback(
    async (reservaData: any, user_id: string) => {
      try {
        setLoading(true);
        setError(null);

        const conflitos = await verificarConflitos(
          reservaData.espaco_id,
          reservaData.data_reserva,
          reservaData.hora_inicio,
          reservaData.hora_fim
        );

        if (conflitos.existe) {
          throw new Error("Existe um conflito de horário. Verifique a disponibilidade.");
        }

        const { data, error: insertError } = await supabase
          .from("reservas_espacos")
          .insert({
            ...reservaData,
            criado_por: user_id,
            status: "confirmada"
          })
          .select()
          .single();

        if (insertError) throw insertError;
        return data;
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [verificarConflitos]
  );

  // Expor funções
  return {
    loading,
    error,
    setError,
    verificarConflitos,
    criarEvento,
    atualizarEvento,
    deletarEvento,
    criarReserva
  };
}