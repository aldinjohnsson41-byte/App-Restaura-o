import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface EventoNotificacao {
  evento_id: string;
  nome: string;
  data_evento: string;
  hora_inicio?: string;
  descricao?: string;
  local?: string;
  participantes: Array<{
    id: string;
    pessoa_id: string;
    email: string;
    nome: string;
    confirmacao_presenca: string;
  }>;
}

async function enviarEmailNotificacao(
  para: string,
  assunto: string,
  conteudo: string
): Promise<boolean> {
  try {
    const resposta = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'noreply@igreja.local',
        to: para,
        subject: assunto,
        html: conteudo,
      }),
    });

    return resposta.ok;
  } catch (erro) {
    console.error(`Erro ao enviar email para ${para}:`, erro);
    return false;
  }
}

function gerarTemplateEmail(
  tipo: string,
  evento: EventoNotificacao,
  pessoa: { nome: string; email: string }
): string {
  const dataFormatada = new Date(evento.data_evento).toLocaleDateString('pt-BR');
  const hora = evento.hora_inicio ? evento.hora_inicio.substring(0, 5) : 'Horário não definido';

  const baseHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4f46e5; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
          .footer { background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
          .evento-info { background-color: white; padding: 15px; margin: 10px 0; border-left: 4px solid #4f46e5; }
          .btn { background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block; margin-top: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Notificação de Evento</h1>
          </div>
          <div class="content">
            <p>Olá ${pessoa.nome},</p>
  `;

  let mensagem = '';
  switch (tipo) {
    case 'novo_evento':
      mensagem = `
        <p>Um novo evento foi criado na agenda da igreja:</p>
        <div class="evento-info">
          <strong>${evento.nome}</strong><br>
          Data: ${dataFormatada}<br>
          Hora: ${hora}<br>
          ${evento.local ? `Local: ${evento.local}<br>` : ''}
          ${evento.descricao ? `Descrição: ${evento.descricao}<br>` : ''}
        </div>
        <p>Confirme sua presença acessando o sistema.</p>
      `;
      break;
    case 'confirmacao_presenca':
      mensagem = `
        <p>Sua presença foi registrada no evento:</p>
        <div class="evento-info">
          <strong>${evento.nome}</strong><br>
          Data: ${dataFormatada}<br>
          Hora: ${hora}
        </div>
        <p>Obrigado por confirmar sua participação!</p>
      `;
      break;
    case 'cancelamento':
      mensagem = `
        <p>O evento abaixo foi cancelado:</p>
        <div class="evento-info">
          <strong>${evento.nome}</strong><br>
          Data: ${dataFormatada}<br>
          Hora: ${hora}
        </div>
        <p>Desculpe pelos inconvenientes.</p>
      `;
      break;
    case 'lembrete':
      mensagem = `
        <p>Lembrete: Não esqueça do evento de amanhã!</p>
        <div class="evento-info">
          <strong>${evento.nome}</strong><br>
          Data: ${dataFormatada}<br>
          Hora: ${hora}<br>
          ${evento.local ? `Local: ${evento.local}` : ''}
        </div>
        <p>Nos vemos lá!</p>
      `;
      break;
  }

  return baseHTML + mensagem + `
          </div>
          <div class="footer">
            <p>Este é um email automático. Não responda.</p>
            <p>Sistema de Gestão de Igreja</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { tipo, evento, participantes } = await req.json();

    if (!tipo || !evento) {
      return new Response(
        JSON.stringify({ erro: 'Tipo e evento são obrigatórios' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const resultados = [];

    if (participantes && participantes.length > 0) {
      for (const participante of participantes) {
        if (participante.email) {
          const template = gerarTemplateEmail(tipo, evento, {
            nome: participante.nome,
            email: participante.email,
          });

          const sucesso = await enviarEmailNotificacao(
            participante.email,
            `${evento.nome} - Notificação da Igreja`,
            template
          );

          resultados.push({
            email: participante.email,
            sucesso,
          });
        }
      }
    }

    return new Response(
      JSON.stringify({
        sucesso: true,
        mensagem: `${resultados.filter(r => r.sucesso).length} email(s) enviado(s)`,
        resultados,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (erro) {
    console.error('Erro ao processar notificação:', erro);
    return new Response(
      JSON.stringify({
        sucesso: false,
        erro: erro instanceof Error ? erro.message : 'Erro desconhecido',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
