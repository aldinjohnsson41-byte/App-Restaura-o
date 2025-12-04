const [modo, setModo] = useState("detalhes");
const [eventoAtual, setEventoAtual] = useState(evento);

if (modo === "editar") {
  return (
    <EventoForm
      evento={eventoAtual}
      onSaved={(dadosAtualizados) => {
        setEventoAtual(dadosAtualizados);
        setModo("detalhes");
      }}
      onCancel={() => setModo("detalhes")}
    />
  );
}
