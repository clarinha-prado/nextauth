import { GetServerSideProps, GetServerSidePropsContext, GetServerSidePropsResult } from "next";
import { destroyCookie, parseCookies } from "nookies";
import { AuthTokenError } from "../services/errors/AuthTokenError";
import decode from "jwt-decode";
import { validateUserPermissions } from "./validateUserPermissions";

type WithSSRAuthOption = {
    permissions: string[],
    roles: string[]
}

// roda no servidor, se este redirecionamento p login ocorresse no browser, dentro do useEffect sem o
// parametro dos [] por ex, o usuario veria o layout da tela sem os dados q soh pode ver se estiver
// autenticado, pois o useEffect eh executado depois do return
export function withSSRAuth<P>(fn: GetServerSideProps<P>, options?: WithSSRAuthOption): GetServerSideProps {
    return async (ctx: GetServerSidePropsContext): Promise<GetServerSidePropsResult<P>> => {
        const cookies = parseCookies(ctx);
        const token = cookies['nextauth.token'];

        if (!token) {
            return {
                redirect: {
                    destination: '/',
                    permanent: false
                }
            }
        }

        if (options) {
            const user = decode<{ permissions: string[], roles: string[] }>(token);
            const { permissions, roles } = options;
            const userHasValidPermissions = validateUserPermissions({ user, permissions, roles });

            if (!userHasValidPermissions) {
                return {
                    redirect: {
                        destination: '/dashboard',
                        permanent: false
                    }
                }
            }
        }

        try {
            return await fn(ctx);
        } catch (err) {
            if (err instanceof AuthTokenError) {
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
}