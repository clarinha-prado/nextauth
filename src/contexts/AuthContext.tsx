import { createContext, ReactNode, useEffect, useState } from "react";
import { setCookie, parseCookies, destroyCookie } from 'nookies';
import Router from 'next/router';
import { api } from "../services/apiClient";

type SignInCredentials = {
    email: string;
    password: string;
}

type AuthContextData = {
    signIn(credentials: SignInCredentials): Promise<void>;
    user: User;
    isAuthenticated: boolean;
}

type AuthProviderProps = {
    children: ReactNode;
}

type User = {
    email: string;
    permissions: string[];
    roles: string[];
};

export const AuthContext = createContext({} as AuthContextData);

/********************************** SignOut **************************************/
export function signOut() {
    destroyCookie(undefined, 'nextauth.token');
    destroyCookie(undefined, 'nextauth.refreshToken');

    Router.push('/');
}

export function AuthProvider({ children }: AuthProviderProps) {
    // inicializa dados de autenticacao com obj vazio
    const [user, setUser] = useState<User>();

    // se user estiver vazio isAuthenticated = false
    const isAuthenticated = !!user;

    // na primeira carga do contexto verifica se existe token
    // useEffect SEMPRE roda no browser
    useEffect(() => {

        // tenta recuperar o token chamado 'nextauth.token'
        const { 'nextauth.token': token } = parseCookies();

        // se conseguiu recuperar o token
        if (token) {
            api.get('/me').then(response => {
                const { email, permissions, roles } = response.data;
                setUser({ email, permissions, roles });
            }).catch(() => {
                signOut();
            });
        }
    }, []);

    /********************************** SignIn **************************************/
    async function signIn({ email, password }: SignInCredentials) {
        try {
            // chama backend passando email e senha
            const response = await api.post('sessions', { email, password });

            // obtem permissoes e papeis da resposta
            // refreshToken neste app eh soh um uuid - universal unique id
            const { token, refreshToken, permissions, roles } = response.data;

            // cria um cookie com os dados de login
            setCookie(undefined, 'nextauth.token', token, {
                maxAge: 60 * 60 * 24 * 30,    // 30 days
                path: '/'
            });

            setCookie(undefined, 'nextauth.refreshToken', refreshToken, {
                maxAge: 60 * 60 * 24 * 30,    // 30 days
                path: '/'
            });

            // armazena dados de login no estado do contexto 
            setUser({
                email,
                permissions,
                roles
            });

            // configura token no header default do app
            api.defaults.headers['Authorization'] = `Bearer ${token}`;

            // se o login ocorreu com sucesso, chama a primeira pagina do app
            Router.push('/dashboard');
        } catch (err) {
            console.log(err);
        }
    }

    return (
        // compartilha os dados do AuthContextData com os elementos em children
        <AuthContext.Provider value={{ signIn, user, isAuthenticated }}>
            {children}
        </AuthContext.Provider>
    );
}