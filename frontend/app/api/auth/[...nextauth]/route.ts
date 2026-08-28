import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
      access_token?: string;
    };
  }
  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
    access_token?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string;
    access_token?: string;
  }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

const ROLES_API = {
  administrador: 'administrador',
  coordinador: 'coordinador',
  analista: 'analista',
};

const authOptions: any = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Correo', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        const email = (credentials?.email || '').trim().toLowerCase();
        const password = (credentials?.password || '').trim();

        let resp: Response;
        try {
          resp = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });
        } catch {
          return null;
        }

        if (!resp.ok) return null;

        let data: any;
        try {
          data = await resp.json();
        } catch {
          return null;
        }

        const token = data?.access_token;
        if (!token) return null;

        // Determinar rol según el usuario logueado
        let role = 'administrador';
        if (email === 'coordinador@poderjudicial.gob.pe') role = 'coordinador';
        else if (email === 'analista@poderjudicial.gob.pe') role = 'analista';

        return {
          id: 'api',
          name: email.split('@')[0],
          email,
          role,
          access_token: token,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.role = user.role;
        token.access_token = user.access_token;
      }
      return token;
    },
    async session({ session, token }: any) {
      session.user.role = token.role;
      session.user.access_token = token.access_token;
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
