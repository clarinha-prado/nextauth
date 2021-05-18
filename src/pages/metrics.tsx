import { setupApiClient } from "../services/api";
import { withSSRAuth } from "../utils/withSSRAuth";

export default function Dashboard() {
    return (
        <>
            <h1>Metrics</h1>
        </>
    );
}

// o segundo parametro do withSSRAuth verifica se o usuário tem acesso a pagina, se nao tiver 
// ele eh redirecionado para uma pagina privada q todos podem acessar, geralmente a tela inicial
// da aplicacao - esta solucao eh para SSR, se a pagina for renderizada no browser, essa 
// verificacao deve ser feita no useEffect com o hook useCan
export const getServerSideProps = withSSRAuth(async (ctx) => {
    const apiClient = setupApiClient(ctx);
    const response = await apiClient.get('/me');

    return {
        props: {}
    }
}, {
    permissions: ['metrics.list3'],
    roles: ['administrator']
});