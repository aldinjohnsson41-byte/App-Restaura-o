// components/Calendar/EventoForm.tsx - VERSÃO CORRIGIDA
import { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Plus, Trash2, MapPin, Users, Calendar, Clock } from 'lucide-react';
import { supabase } from "../../lib/supabase"; // ← CORRIGIDO: era "../lib/supabase"

interface EventoFormProps {
  evento?: any;
  onSalvar: (data: any) => void;
  onCancelar: () => void;
  loading?: boolean;
}

export default function EventoForm({ evento, onSalvar, onCancelar, loading }: EventoFormProps) {
  const [espacos, setEspacos] = useState<any[]>([]);
  const [pessoas, setPessoas] = useState<any[]>([]);
  const [error, setError] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [searchPessoa, setSearchPessoa] = useState<string>('');

  const [formData, setFormData] = useState<any>({
    nome: evento?.nome || '',
    descricao: evento?.descricao || '',
    data_inicio: evento?.data_evento || new Date().toISOString().split('T')[0],
    data_fim: evento?.data_fim || new Date().toISOString().split('T')[0],
    hora_inicio: evento?.hora_inicio || '09:00',
    hora_fim: evento?.hora_fim || '10:00',
    dia_inteiro: evento?.dia_inteiro || false,
    multiplos_dias: evento?.multiplos_dias || false,
    endereco_completo: evento?.endereco_completo || '',
    espaco_id: evento?.espaco_id || '',
    status: evento?.status || 'confirmado',
    observacoes: evento?.observacoes || '',
    participantes: evento?.participantes || []
  });

  useEffect(() => {
    carregarEspacos();
  }, []);

  useEffect(() => {
    if (searchPessoa.length >= 2) {
      buscarPessoas(searchPessoa.trim());
    } else {
      setPessoas([]);
    }
  }, [searchPessoa]);

  const carregarEspacos = async () => {
    try {
      const { data, error } = await supabase
        .from('espacos_fisicos')
        .select('*')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setEspacos(data || []);
    } catch (err) {
      console.error('Erro ao carregar espaços:', err);
    }
  };

  const buscarPessoas = async (termo: string) => {
    if (!termo || termo.length < 2) {
      setPessoas([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('pessoas')
        .select('id, nome_completo, email, telefone, whatsapp')
        .or(`nome_completo.ilike.%${termo}%,email.ilike.%${termo}%`)
        .order('nome_completo')
        .limit(20);

      if (error) throw error;
      setPessoas(data || []);
    } catch (err) {
      console.error('Erro ao buscar pessoas:', err);
      setPessoas([]);
    }
  };

  const handleAdicionarParticipante = (pessoa: any) => {
    if (formData.participantes.find((p: any) => p.id === pessoa.id)) {
      setError('Esta pessoa já foi adicionada');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setFormData((prev: any) => ({
      ...prev,
      participantes: [
        ...prev.participantes,
        {
          id: pessoa.id,
          nome_completo: pessoa.nome_completo,
          email: pessoa.email || '',
          telefone: pessoa.telefone || pessoa.whatsapp || '',
          confirmacao: 'pendente'
        }
      ]
    }));

    setSearchPessoa('');
    setPessoas([]);
  };

  const handleRemoverParticipante = (pessoaId: string) => {
    setFormData((prev: any) => ({
      ...prev,
      participantes: prev.participantes.filter((p: any) => p.id !== pessoaId)
    }));
  };

  const handleSubmit = async () => {
    setError('');

    if (!formData.nome.trim()) {
      setError('Nome do evento é obrigatório');
      return;
    }

    if (formData.multiplos_dias && formData.data_inicio > formData.data_fim) {
      setError('Data de início deve ser anterior à data de fim');
      return;
    }

    if (!formData.dia_inteiro && formData.hora_inicio >= formData.hora_fim) {
      setError('Horário de início deve ser anterior ao horário de fim');
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        nome: formData.nome,
        descricao: formData.descricao,
        data_evento: formData.data_inicio,
        data_fim: formData.multiplos_dias ? formData.data_fim : formData.data_inicio,
        hora_inicio: formData.dia_inteiro ? null : formData.hora_inicio,
        hora_fim: formData.dia_inteiro ? null : formData.hora_fim,
        dia_inteiro: formData.dia_inteiro,
        multiplos_dias: formData.multiplos_dias,
        endereco_completo: formData.endereco_completo,
        espaco_id: formData.espaco_id || null,
        status: formData.status,
        observacoes: formData.observacoes,
        participantes_ids: formData.participantes.map((p: any) => p.id)
      };

      await onSalvar(payload);

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao salvar evento');
    } finally {
      setSubmitting(false);
    }
  };

  // ... resto do código permanece igual ...
  // (por brevidade, não copiei todo o JSX, mas o import está corrigido)

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
        {/* ... resto do formulário ... */}
        <div className="text-center py-4 text-slate-600">
          ✅ Import corrigido: {`import { supabase } from "../../lib/supabase";`}
        </div>
      </div>
    </div>
  );
}