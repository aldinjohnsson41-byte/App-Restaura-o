import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { AiOutlineSearch } from "react-icons/ai";
import { toast } from "react-toastify";
import { supabase } from "@/lib/supabaseClient";

interface FormParticipanteProps {
  compromissoId: string;
  onSuccess: () => void;
}

const FormParticipante = ({ compromissoId, onSuccess }: FormParticipanteProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    defaultValues: {
      nome_completo: "",
      email: "",
      telefone: "",
      whatsapp: "",
      forma_participacao: "",
      convite_participante: "",
      pessoas: [],
    }
  });

  const [pessoas, setPessoas] = useState<any[]>([]);
  const [loadingPessoas, setLoadingPessoas] = useState(false);
  const [selectedPessoas, setSelectedPessoas] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // ---------------------------------------------------------------------------
  // 🔍 BUSCA DE PESSOAS (CORRIGIDA — funciona como antes)
  // ---------------------------------------------------------------------------

  const buscarPessoas = async (termo: string) => {
    if (!termo || termo.length < 2) {
      setPessoas([]);
      return;
    }

    try {
      setLoadingPessoas(true);

      const { data, error } = await supabase
        .from("pessoas")
        .select("id, nome_completo, email, telefone, whatsapp")
        .or(`nome_completo.ilike.%${termo}%,email.ilike.%${termo}%`)
        .order("nome_completo")
        .limit(20);

      if (error) {
        console.error("Erro Supabase:", error);
        setPessoas([]);
        return;
      }

      setPessoas(data || []);
    } catch (err) {
      console.error("Erro ao buscar pessoas:", err);
      setPessoas([]);
    } finally {
      setLoadingPessoas(false);
    }
  };

  // Atualiza resultados conforme digita
  useEffect(() => {
    const delay = setTimeout(() => {
      buscarPessoas(searchTerm);
    }, 300);

    return () => clearTimeout(delay);
  }, [searchTerm]);

  // ---------------------------------------------------------------------------
  // Seleção de pessoas
  // ---------------------------------------------------------------------------

  const adicionarPessoa = (pessoa: any) => {
    if (selectedPessoas.find((p) => p.id === pessoa.id)) {
      toast.warn("Essa pessoa já foi adicionada.");
      return;
    }

    setSelectedPessoas((prev) => [...prev, pessoa]);
    setValue("pessoas", [...selectedPessoas, pessoa]);
    toast.success("Pessoa adicionada!");
  };

  const removerPessoa = (id: string) => {
    const atualizadas = selectedPessoas.filter((p) => p.id !== id);
    setSelectedPessoas(atualizadas);
    setValue("pessoas", atualizadas);
  };

  // ---------------------------------------------------------------------------
  // SUBMIT
  // ---------------------------------------------------------------------------

  const onSubmit = async (data: any) => {
    if (selectedPessoas.length === 0) {
      toast.error("Você deve adicionar pelo menos uma pessoa ao compromisso.");
      return;
    }

    const payload = {
      compromisso_id: compromissoId,
      forma_participacao: data.forma_participacao,
      convite_participante: data.convite_participante,
      pessoas: selectedPessoas.map((p) => p.id),
    };

    const { error } = await supabase.from("compromisso_participantes").insert([payload]);

    if (error) {
      console.error(error);
      toast.error("Erro ao adicionar participantes.");
      return;
    }

    toast.success("Participantes adicionados com sucesso!");
    onSuccess();
  };

  // ---------------------------------------------------------------------------
  // JSX DO FORMULÁRIO (NÃO FOI ALTERADO)
  // ---------------------------------------------------------------------------

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Adicionar Participantes</h2>

      {/* Campo de busca */}
      <div className="relative">
        <AiOutlineSearch className="absolute left-3 top-3 text-gray-500" />
        <input
          type="text"
          placeholder="Buscar pessoas (nome ou e-mail)"
          className="w-full border rounded p-2 pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Resultados */}
      <div className="mt-2 border rounded p-2 bg-gray-50 max-h-60 overflow-y-auto">
        {loadingPessoas ? (
          <p>Carregando...</p>
        ) : pessoas.length > 0 ? (
          pessoas.map((p) => (
            <div
              key={p.id}
              className="flex justify-between items-center p-2 border-b last:border-0"
            >
              <div>
                <div className="font-semibold">{p.nome_completo}</div>
                <div className="text-sm text-gray-600">{p.email}</div>
              </div>
              <button
                onClick={() => adicionarPessoa(p)}
                className="px-3 py-1 bg-blue-600 text-white rounded"
              >
                Adicionar
              </button>
            </div>
          ))
        ) : searchTerm.length >= 2 ? (
          <p>Nenhuma pessoa encontrada.</p>
        ) : (
          <p>Digite para buscar...</p>
        )}
      </div>

      {/* Lista de selecionados */}
      <div className="mt-4">
        <h3 className="font-semibold mb-2">Selecionados:</h3>
        {selectedPessoas.map((p) => (
          <div
            key={p.id}
            className="flex justify-between items-center p-2 border rounded mb-2"
          >
            <span>{p.nome_completo}</span>
            <button
              onClick={() => removerPessoa(p.id)}
              className="px-2 py-1 bg-red-600 text-white rounded"
            >
              Remover
            </button>
          </div>
        ))}
      </div>

      {/* Formulário de participação */}
      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <div>
          <label>Forma de Participação</label>
          <select
            {...register("forma_participacao", { required: true })}
            className="w-full border p-2 rounded"
          >
            <option value="">Selecione</option>
            <option value="presencial">Presencial</option>
            <option value="remoto">Remoto</option>
          </select>
          {errors.forma_participacao && (
            <p className="text-red-600">Campo obrigatório.</p>
          )}
        </div>

        <div>
          <label>Convite ao Participante</label>
          <textarea
            {...register("convite_participante", { required: true })}
            className="w-full border p-2 rounded"
          />
          {errors.convite_participante && (
            <p className="text-red-600">Campo obrigatório.</p>
          )}
        </div>

        <button
          type="submit"
          className="w-full bg-green-600 text-white py-2 rounded"
        >
          Salvar Participantes
        </button>
      </form>
    </div>
  );
};

export default FormParticipante;
