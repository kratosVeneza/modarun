import LegalPage from "@/components/LegalPage";

export default function ContatoPage() {
  return <LegalPage title="Contato" description="Canais para dúvidas, suporte, privacidade, denúncias, parcerias e assuntos relacionados à Moda Run." updatedAt="03/05/2026" sections={[
    { title: "1. Suporte", body: ["Para suporte sobre conta, login, perfil, mensagens, notificações, treinos, eventos ou loja, entre em contato pelo canal oficial da Moda Run informado no app ou nas redes sociais oficiais."] },
    { title: "2. Privacidade e dados", body: ["Para exercer direitos relacionados a dados pessoais, informe o e-mail cadastrado, o tipo de solicitação e detalhes necessários para localizar sua conta."] },
    { title: "3. Denúncias", body: ["Para denunciar abuso, assédio, golpe, perfil falso, conteúdo impróprio ou uso indevido da plataforma, envie o máximo de informações possível, como nome do perfil, link, print e descrição do ocorrido."] },
    { title: "4. Loja e pedidos", body: ["Dúvidas sobre produtos, disponibilidade, entrega, trocas e pagamento devem ser confirmadas pelo canal de atendimento comercial da Moda Run."] },
  ]} />;
}
