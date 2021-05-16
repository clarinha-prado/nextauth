import { GetServerSideProps, GetServerSidePropsContext, GetServerSidePropsResult } from 'next';
import { FormEvent, useContext, useState } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { parseCookies } from 'nookies';
import styles from '../styles/Home.module.css';
import { withSSRGuest } from '../utils/withSSRGuest';

export default function Home() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const { signIn } = useContext(AuthContext);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const data = {
      email,
      password
    }

    await signIn(data);
  }

  return (
    <form onSubmit={handleSubmit} className={styles.container}>
      <input type="email" value={email} onChange={e => setEmail(e.target.value)} />
      <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
      <button type="submit">Entrar</button>
    </form>
  )
}

// se a pagina tiver q ser renderizada pelo servidor, eh preciso declarar o getServerSideProps
export const getServerSideProps = withSSRGuest(async (ctx: GetServerSidePropsContext) => {

  return {
    props: {}
  }
});