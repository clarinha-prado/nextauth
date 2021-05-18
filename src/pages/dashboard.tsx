import React, { useContext, useEffect } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useCan } from "../hooks/useCan";
import { setupApiClient } from "../services/api";
import { api } from "../services/apiClient";
import { withSSRAuth } from "../utils/withSSRAuth";
import { Can } from "../components/Can";

export default function Dashboard() {
    const { user } = useContext(AuthContext);

    /*     const UseCanSeeMetrics = useCan({
            roles: ['administrator  ']
        }); */

    // executa soh na carga do componente
    useEffect(() => {

        // exemplo de chamada ao backend enderecando sucesso e falha
        api.get('/me')
            .then(response => console.log(response))
            .catch(err => console.log(err));
    }, []);

    return (
        <>
            <h1>Dashboard: {user?.email}</h1>

            <Can permissions={['metrics.list']}>
                <div>Métricas</div>
            </Can>
        </>
    );
}

export const getServerSideProps = withSSRAuth(async (ctx) => {
    const apiClient = setupApiClient(ctx);
    const response = await apiClient.get('/me');

    return {
        props: {}
    }
})