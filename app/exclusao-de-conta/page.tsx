import LegalPage from "@/components/LegalPage";

export default function ExclusaoDeContaPage() {
  return <LegalPage title="Exclusão de Conta e Dados" description="Orientações para solicitar exclusão de conta, correção de dados ou remoção de conteúdo na Moda Run." updatedAt="03/05/2026" sections={[
    { title: "1. Como solicitar", body: ["Para solicitar exclusão de conta ou dados pessoais, entre em contato informando o e-mail cadastrado e descrevendo a solicitação.", "A solicitação pode incluir exclusão da conta, correção de dados, remoção de foto, remoção de publicação, mensagens, eventos ou outros conteúdos vinculados ao perfil."] },
    { title: "2. Verificação de identidade", body: ["Podemos solicitar confirmação de identidade para evitar exclusão indevida por terceiros."] },
    { title: "3. O que pode permanecer", body: ["Alguns registros podem ser mantidos pelo prazo necessário para segurança, prevenção de fraude, cumprimento de obrigação legal, defesa de direitos, auditoria ou preservação de integridade da comunidade."] },
    { title: "4. Conteúdo em interações", body: ["Comentários, curtidas, mensagens e interações podem exigir tratamento específico para preservar histórico, segurança e contexto de outros usuários, respeitando os direitos aplicáveis."] },
    { title: "5. Prazo", body: ["As solicitações serão avaliadas e respondidas em prazo razoável, conforme complexidade e legislação aplicável."] },
    { title: "6. Canal", body: ["Use a página de contato da Moda Run ou o canal oficial informado no app para enviar sua solicitação."] },
  ]} />;
}
