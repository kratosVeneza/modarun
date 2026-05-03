import LegalPage from "@/components/LegalPage";

export default function TermosDeUsoPage() {
  return <LegalPage title="Termos de Uso" description="Regras para utilização da Moda Run, incluindo comunidade, eventos, treinos, chat e loja." updatedAt="03/05/2026" sections={[
    { title: "1. Aceitação", body: ["Ao acessar ou usar a Moda Run, você concorda com estes Termos de Uso e com a Política de Privacidade.", "Se não concordar, não utilize a plataforma."] },
    { title: "2. Conta do usuário", body: ["O usuário é responsável por manter suas informações corretas e pela segurança do acesso à conta.", "É proibido se passar por outra pessoa, criar contas falsas, tentar acessar contas de terceiros ou usar a plataforma para fraude, abuso ou atividades ilícitas."] },
    { title: "3. Comunidade e conteúdo", body: ["Você é responsável pelo conteúdo que publica, comenta ou envia. Não publique conteúdo ofensivo, ilegal, discriminatório, enganoso, pornográfico, violento, ameaçador, spam ou que viole direitos de terceiros.", "Podemos remover conteúdos, restringir funcionalidades ou suspender contas em caso de violação dos termos ou risco à comunidade."] },
    { title: "4. Treinos e eventos", body: ["Treinos, encontros e eventos exibidos na plataforma podem ser criados por usuários ou importados de fontes públicas. Confirme sempre informações oficiais antes de participar.", "A Moda Run não substitui orientação médica, profissional de educação física ou avaliação individual. Pratique atividades físicas com segurança."] },
    { title: "5. Chat e mensagens", body: ["O chat privado deve ser usado com respeito. É proibido assédio, golpes, spam, ameaças, conteúdo sexual não solicitado ou qualquer conduta abusiva.", "Mensagens podem ser preservadas para segurança, moderação, prevenção de abuso e cumprimento de obrigações legais."] },
    { title: "6. Loja", body: ["A loja pode direcionar o usuário para atendimento externo, como WhatsApp. Preços, disponibilidade, entrega e pagamento devem ser confirmados no momento da compra.", "Produtos e promoções podem ser alterados sem aviso prévio."] },
    { title: "7. Disponibilidade", body: ["Buscamos manter o app funcionando, mas não garantimos disponibilidade contínua, ausência de falhas ou compatibilidade com todos os dispositivos."] },
    { title: "8. Propriedade intelectual", body: ["Marca, identidade visual, layout, textos, códigos e elementos da Moda Run pertencem aos seus titulares. O usuário mantém direitos sobre seus conteúdos, mas autoriza sua exibição na plataforma conforme as funcionalidades usadas."] },
    { title: "9. Encerramento", body: ["Podemos suspender ou encerrar contas que violem estes termos, prejudiquem a plataforma ou coloquem outros usuários em risco."] },
  ]} />;
}
