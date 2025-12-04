import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Save, X } from "lucide-react";

export default function EventoForm({ evento, onSaved, onCancel }) {
  const [form, setForm] = useState({
    nome: "",
    descricao: "",
    data_evento: "",
    data_fim: "",
    multiplos_dias: false,
    dia_inteiro: false,
    hora_inicio: "",
    hora_fim: "",
    status: "confirmado",
  });

  useEffect(() => {
    if (evento) {
      setForm({
        nome: evento.nome || "",
        descricao: evento.descricao || "",
        data_evento: evento.data_evento || "",
        data_fim: evento.data_fim || "",
        multiplos_dias: evento.multiplos_dias || false,
        dia_inteiro: evento.dia_inteiro || false,
        hora_inicio: evento.hora_inicio || "",
        hora_fim: evento.hora_fim || "",
        status: evento.status || "confirmado",
      });
    }
  }, [evento]);

  async function salvar() {
    const { data, error } = await supabase
      .from("eventos")
      .update(form)
      .eq("id", evento.id)
      .select()
      .single();

    if (error) {
      console.error(error);
      return alert("Erro ao atualizar evento.");
    }

    onSaved(data);
  }

  return (
    <div className="p-4 space-y-4">
      <input
        className="w-full p-2 border rounded"
        value={form.nome}
        onChange={(e) => setForm({ ...form, nome: e.target.value })}
        placeholder="Nome do evento"
      />

      <textarea
        className="w-full p-2 border rounded"
        value={form.descricao}
        onChange={(e) => setForm({ ...form, descricao: e.target.value })}
        placeholder="Descrição"
      />

      {/* ... restante dos campos ... */}

      <div className="flex gap-2">
        <button
          className="px-4 py-2 bg-green-600 text-white rounded flex items-center gap-2"
          onClick={salvar}
        >
          <Save size={18} /> Salvar
        </button>

        <button
          className="px-4 py-2 bg-gray-200 text-black rounded flex items-center gap-2"
          onClick={onCancel}
        >
          <X size={18} /> Cancelar
        </button>
      </div>
    </div>
  );
}
