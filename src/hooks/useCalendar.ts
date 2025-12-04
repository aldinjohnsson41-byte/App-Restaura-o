import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { EventoAgenda, ReservaEspaco, ConflitoDiagnostico } from '../types/calendar';

export function useCalendar() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

        const { data: eventoConflito } = await supabase
          .from('eventos_agenda')
          .select('id, nome, data_evento, hora_inicio, hora_fim')
          .eq('espaco_id', espaco_id)
          .eq('data_evento', data)
          .eq('status', 'confirmado')
          .neq('id', exclude_evento_id || 'null')
          .then((result) => {
            if (result.data) {
              return {
                data: result.data.filter((e: any) => {
                  if (!e.hora_inicio || !e.hora_fim) return false;
                  return !(
                    e.hora_fim <= hora_inicio ||
                    e.hora_inicio >= hora_fim
                  );
                }),
              };
            }
            return { data: [] };
          });

        const { data: reservaConflito } = await supabase
          .from('reservas_espacos')
          .select('id, responsavel_nome, data_reserva, hora_inicio, hora_fim')
          .eq('espaco_id', espaco_id)
          .eq('data_reserva', data)
          .eq('status', 'confirmada');

        const conflitosReserva = (reservaConflito || []).filter((r: any) => {
          return !(r.hora_fim <= hora_inicio || r.hora_inicio >= hora_fim);
        });

        const temConflito = (eventoConflito && eventoConflito.length > 0) ||
          (conflitosReserva && conflitosReserva.length > 0);

        return {
          existe: temConflito,
          tipo: temConflito ? 'horario' : 'nenhum',
          mensagem: temConflito
            ? 'Existe um conflito de horário com outro evento ou reserva'
            : 'Sem conflitos',
          conflitos: [
            ...(eventoConflito?.map((e: any) => ({
              evento_id: e.id,
              nome: e.nome,
              data: e.data_evento,
              hora_inicio: e.hora_inicio,
              hora_fim: e.hora_fim,
            })) || []),
            ...(conflitosReserva?.map((r: any) => ({
              reserva_id: r.id,
              nome: r.responsavel_nome,
              data: r.data_reserva,
              hora_inicio: r.hora_inicio,
              hora_fim: r.hora_fim,
            })) || []),
          ],
        };
      } catch (err: any) {
        setError(err.message);
        return {
          existe: false,
          tipo: 'nenhum',
          mensagem: 'Erro ao verificar conflitos',
          conflitos: [],
        };
      }
    },
    []
  );

  const criarEvento = useCallback(
    async (eventoData: any, user_id: string) => {
      try {
        setLoading(true);
        setError(null);

        console.log('📝 Criando evento:', eventoData);

        // ✅ 1. Criar o evento primeiro
        const { data: novoEvento, error: insertError } = await supabase
          .from('eventos_agenda')
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
            status: eventoData.status || 'confirmado',
            observacoes: eventoData.observacoes,
            criado_por: user_id,
          })
          .select()
          .single();

        if (insertError) {
          console.error('❌ Erro ao criar evento:', insertError);
          throw insertError;
        }

        console.log('✅ Evento criado:', novoEvento);

        // ✅ 2. Adicionar participantes se houver
        if (eventoData.participantes_ids && eventoData.participantes_ids.length > 0) {
          console.log('👥 Adicionando participantes:', eventoData.participantes_ids);

          const participantes = eventoData.participantes_ids.map((pessoa_id: string) => ({
            evento_id: novoEvento.id,
            pessoa_id: pessoa_id,
            confirmacao_presenca: 'pendente',
          }));

          const { error: participantesError } = await supabase
            .from('evento_participantes')
            .insert(participantes);

          if (participantesError) {
            console.error('❌ Erro ao adicionar participantes:', participantesError);
            // ⚠️ Não falha toda a operação se só os participantes falharem
          } else {
            console.log('✅ Participantes adicionados com sucesso');
          }
        }

        return novoEvento;
      } catch (err: any) {
        console.error('❌ Erro geral:', err);
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const atualizarEvento = useCallback(
    async (evento_id: string, eventoData: any) => {
      try {
        setLoading(true);
        setError(null);

        console.log('✏️ Atualizando evento:', evento_id, eventoData);

        // ✅ 1. Atualizar o evento
        const { data: eventoAtualizado, error: updateError } = await supabase
          .from('eventos_agenda')
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
          })
          .eq('id', evento_id)
          .select()
          .single();

        if (updateError) {
          console.error('❌ Erro ao atualizar evento:', updateError);
          throw updateError;
        }

        console.log('✅ Evento atualizado:', eventoAtualizado);

        // ✅ 2. Atualizar participantes se fornecido
        if (eventoData.participantes_ids !== undefined) {
          console.log('👥 Atualizando participantes...');

          // Deletar participantes antigos
          await supabase
            .from('evento_participantes')
            .delete()
            .eq('evento_id', evento_id);

          // Adicionar novos participantes
          if (eventoData.participantes_ids.length > 0) {
            const participantes = eventoData.participantes_ids.map((pessoa_id: string) => ({
              evento_id: evento_id,
              pessoa_id: pessoa_id,
              confirmacao_presenca: 'pendente',
            }));

            const { error: participantesError } = await supabase
              .from('evento_participantes')
              .insert(participantes);

            if (participantesError) {
              console.error('❌ Erro ao atualizar participantes:', participantesError);
            } else {
              console.log('✅ Participantes atualizados com sucesso');
            }
          }
        }

        return eventoAtualizado;
      } catch (err: any) {
        console.error('❌ Erro geral:', err);
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deletarEvento = useCallback(async (evento_id: string) => {
    try {
      setLoading(true);
      setError(null);

      console.log('🗑️ Deletando evento:', evento_id);

      const { error } = await supabase
        .from('eventos_agenda')
        .delete()
        .eq('id', evento_id);

      if (error) throw error;

      console.log('✅ Evento deletado com sucesso');
    } catch (err: any) {
      console.error('❌ Erro ao deletar:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

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
          throw new Error('Existe um conflito de horário. Verifique a disponibilidade.');
        }

        const { data, error: insertError } = await supabase
          .from('reservas_espacos')
          .insert({
            ...reservaData,
            criado_por: user_id,
            status: 'confirmada',
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

  return {
    loading,
    error,
    setError,
    verificarConflitos,
    criarEvento,
    atualizarEvento,
    deletarEvento,
    criarReserva,
  };
}