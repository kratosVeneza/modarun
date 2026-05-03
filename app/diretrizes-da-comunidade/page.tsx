import LegalPage from "@/components/LegalPage";

export default function DiretrizesDaComunidadePage() {
  return <LegalPage title="Diretrizes da Comunidade" description="Regras de convivência para manter a Moda Run segura, útil e respeitosa para corredores." updatedAt="03/05/2026" sections={[
    { title: "1. Respeito", body: ["Trate outros usuários com respeito. Não serão tolerados ataques pessoais, assédio, ameaças, discurso de ódio, discriminação, humilhação ou perseguição."] },
    { title: "2. Segurança em treinos", body: ["Ao criar ou participar de treinos, informe dados corretos, escolha locais seguros e respeite seus limites físicos. A participação é responsabilidade dos usuários envolvidos."] },
    { title: "3. Proibição de golpes e spam", body: ["É proibido usar feed, comentários, seguidores, chat ou notificações para golpes, links maliciosos, correntes, spam, falsas promoções ou captação abusiva de dados."] },
    { title: "4. Conteúdo inadequado", body: ["Não publique conteúdo pornográfico, violento, ilegal, enganoso, que exponha terceiros sem autorização ou que viole direitos autorais, imagem, honra ou privacidade."] },
    { title: "5. Denúncias e moderação", body: ["Conteúdos ou contas podem ser removidos, limitados ou suspensos se houver violação das regras, risco à comunidade ou exigência legal.", "Usuários podem entrar em contato para solicitar análise de situações abusivas."] },
    { title: "6. Uso comercial", body: ["Divulgação comercial, ofertas e promoções devem respeitar as regras da plataforma e não podem prejudicar a experiência da comunidade."] },
  ]} />;
}
