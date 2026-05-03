import LegalPage from "@/components/LegalPage";

export default function PoliticaDeCookiesPage() {
  return <LegalPage title="Política de Cookies" description="Informações sobre cookies, armazenamento local e tecnologias semelhantes usadas para manter o app funcionando." updatedAt="03/05/2026" sections={[
    { title: "1. O que são cookies", body: ["Cookies e tecnologias semelhantes são pequenos dados salvos no navegador ou dispositivo para lembrar preferências, manter login, melhorar segurança e entender funcionamento do app."] },
    { title: "2. Como usamos", body: ["Podemos usar cookies e armazenamento local para autenticação, sessão, preferências de interface, funcionamento do PWA, segurança, prevenção de abuso e melhoria da experiência."] },
    { title: "3. Cookies essenciais", body: ["Cookies essenciais são necessários para login, segurança e navegação. Sem eles, algumas partes da plataforma podem não funcionar corretamente."] },
    { title: "4. Preferências", body: ["Podemos salvar preferências como estado de menus, modo de exibição ou configurações do app, para evitar que o usuário precise configurar tudo novamente."] },
    { title: "5. Serviços de terceiros", body: ["A plataforma pode usar provedores como autenticação, banco de dados, hospedagem, mapas, fontes e serviços externos. Esses provedores podem usar tecnologias próprias conforme suas políticas."] },
    { title: "6. Como gerenciar", body: ["Você pode apagar ou bloquear cookies pelo navegador. Isso pode causar logout, perda de preferências ou mau funcionamento de recursos essenciais."] },
  ]} />;
}
