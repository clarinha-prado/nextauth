import { GetServerSideProps, GetServerSidePropsContext, GetServerSidePropsResult } from "next";
import { destroyCookie, parseCookies } from "nookies";


// roda no servidor, se este redirecionamento p login ocorresse no browser, dentro do useEffect sem o
// parametro dos [] por ex, o usuario veria o layout da tela sem os dados q soh pode ver se estiver
// autenticado, pois o useEffect eh executado depois do return
export function withSSRAuth<P>(fn: GetServerSideProps<P>): GetServerSideProps {
    return async (ctx: GetServerSidePropsContext): Promise<GetServerSidePropsResult<P>> => {
        const cookies = parseCookies(ctx);

        if (!cookies['nextauth.token']) {
            return {
                redirect: {
                    destination: '/',
                    permanent: false
                }
            }
        }

        try {
            return await fn(ctx);
        } catch (err) {
            destroyCookie(ctx, 'nextauth.token');
            destroyCookie(ctx, 'nextauth.refreshToken');

            return {
                redirect: {
                    destination: '/',
                    permanent: false
                }
            }
        }
    }
}