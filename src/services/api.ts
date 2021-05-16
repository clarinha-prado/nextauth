import axios, { AxiosError } from 'axios';
import { parseCookies, setCookie } from 'nookies';
import { signOut } from '../contexts/AuthContext';
import { AuthTokenError } from './errors/AuthTokenError';

let isRefreshing = false;
let failedRequestQueue = [];

export function setupApiClient(ctx = undefined) {
    let cookies = parseCookies(ctx);

    // executado toda vez q "api" eh usada
    const api = axios.create({
        baseURL: 'http://localhost:3333',
        headers: {
            Authorization: `Bearer ${cookies['nextauth.token']}`
        }
    });

    // intercepta respostas do backend
    api.interceptors.response.use(

        // se a execucao deu certo, soh retorna a resposta
        response => { return response; },

        // se deu erro,
        (error: AxiosError) => {

            // se o erro for 401
            if (error.response.status === 401) {

                // se o erro for 'token.expired'
                if (error.response.data?.code === 'token.expired') {

                    // recupera refreshToken de dentro do cookie
                    cookies = parseCookies(ctx);
                    const { 'nextauth.refreshToken': refreshToken } = cookies;

                    // obtem dados do request
                    const originalConfig = error.config;

                    // se ainda nao estiver atualizando o token, comeca a atualizar
                    if (!isRefreshing) {
                        isRefreshing = true;

                        // chama endpoint de atualizacao do token
                        api.post('/refresh', { refreshToken }).then(
                            response => {
                                const { token } = response.data;

                                // cria um cookie com token dos dados de login
                                setCookie(ctx, 'nextauth.token', token, {
                                    maxAge: 60 * 60 * 24 * 30,    // 30 days
                                    path: '/'
                                });

                                // cria cookie com refreshToken
                                setCookie(ctx, 'nextauth.refreshToken', response.data.refreshToken, {
                                    maxAge: 60 * 60 * 24 * 30,    // 30 days
                                    path: '/'
                                });

                                // atualiza token JWT no header do app
                                api.defaults.headers['Authorization'] = `Bearer ${token}`;

                                // chama funcao de sucesso para todas as requisicoes q foram represadas
                                // as requisicoes q chegaram qdo o token estava sendo atualizadas foram
                                // guardadas no array failedRequestQueue
                                failedRequestQueue.forEach(request => { request.onSuccess(token); });
                                failedRequestQueue = [];
                            })
                            .catch(err => {
                                // se deu erro no refresh do token, chama a funcao de falha para as requisicoes
                                // represadas
                                failedRequestQueue.forEach(request => { request.onFailure(err); });
                                failedRequestQueue = [];

                                if (process.browser) {
                                    signOut();
                                }
                            })
                            .finally(() => { isRefreshing = false; });
                    }

                    // retorno assincrono, so vai retornar qdo a execucao dos resolve e reject terminarem
                    return new Promise((resolve, reject) => {

                        // se token.expired e jah estava atualizando o token, guarda duas funcoes no array
                        failedRequestQueue.push({

                            onSuccess: (token: string) => {
                                // atualiza o header c novo token
                                originalConfig.headers['Authorization'] = `Bearer ${token}`;

                                // resubmete a requisicao ao backend
                                resolve(api(originalConfig));
                            },
                            onFailure: (err: AxiosError) => {
                                // retorna o erro obtido durante a tentativa de refresh do token
                                reject(err);
                            }
                        })
                    })

                } else {
                    if (process.browser) {
                        signOut();
                    } else {
                        return Promise.reject(new AuthTokenError());
                    }
                }
            }
            return Promise.reject(new AuthTokenError());
        }
    )
    return api;
}