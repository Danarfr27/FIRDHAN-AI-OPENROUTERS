import React, { createContext, useState, useContext, type ReactNode } from "react";

export interface User {
  username: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
}

interface AuthCredential {
  username: string;
  password: string;
  name: string;
}

// Parse auth users from environment
export const getAuthUsers = (): AuthCredential[] => {
  const env = import.meta.env as Record<string, string | undefined>;
  const users: AuthCredential[] = [];

  const rawUsers = env.VITE_AUTH_USERS ?? env.VITE_AUTH_CREDENTIALS;
  if (rawUsers) {
    const trimmed = rawUsers.trim();
    const normalized = trimmed.startsWith("'") && trimmed.endsWith("'")
      ? trimmed.slice(1, -1)
      : trimmed;

    try {
      const parsed = JSON.parse(normalized);
      if (Array.isArray(parsed)) {
        users.push(
          ...parsed
            .map((user: any) => {
              const username = typeof user?.username === "string"
                ? user.username
                : typeof user?.email === "string"
                  ? user.email
                  : "";

              if (!username || typeof user?.password !== "string") {
                return null;
              }

              return {
                username,
                password: user.password,
                name: typeof user?.name === "string" ? user.name : username,
              } as AuthCredential;
            })
            .filter((user): user is AuthCredential => Boolean(user))
        );
      }
    } catch (error) {
      console.error("Failed to parse VITE_AUTH_USERS:", error);
    }
  }

  // Also support separate USERxx_USER / USERxx_PASS and VITE_USERxx_USER / VITE_USERxx_PASS.
  for (let index = 1; index <= 20; index += 1) {
    const suffix = String(index).padStart(2, "0");
    const username = env[`VITE_USER${suffix}_USER`] ?? env[`USER${suffix}_USER`] ?? env[`VITE_ID${suffix}`] ?? env[`ID${suffix}`];
    const password = env[`VITE_USER${suffix}_PASS`] ?? env[`USER${suffix}_PASS`] ?? env[`VITE_PW${suffix}`] ?? env[`PW${suffix}`];
    const name = env[`VITE_USER${suffix}_NAME`] ?? env[`USER${suffix}_NAME`] ?? env[`VITE_ID${suffix}_NAME`] ?? env[`ID${suffix}_NAME`];

    if (typeof username === "string" && username && typeof password === "string" && password) {
      users.push({
        username,
        password,
        name: typeof name === "string" && name ? name : username,
      });
    }
  }

  if (users.length === 0) {
    const fallbackUsers: AuthCredential[] = [
      { username: "danar27", password: "danar27", name: "Danar Firdhan" },
      { username: "admin", password: "admin123", name: "System Admin" },
    ];

    console.warn("No auth users configured via VITE_AUTH_USERS or USERxx_USER/USERxx_PASS. Using built-in fallback credentials.");
    return fallbackUsers;
  }

  return users;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = (username: string, password: string) => {
    const authUsers = getAuthUsers();

    const foundUser = authUsers.find(
      (u) => u.username.toLowerCase() === username.toLowerCase() && u.password === password
    );

    if (!foundUser) {
      return { success: false, error: "Invalid username or password" };
    }

    const newUser: User = { username: foundUser.username, name: foundUser.name };
    setUser(newUser);
    localStorage.setItem("user", JSON.stringify(newUser));
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  // Check if user is already logged in on mount
  React.useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        const authUsers = getAuthUsers();
        const savedUsername = parsedUser.username ?? parsedUser.email;
        const userExists = authUsers.some(
          (u) => u.username.toLowerCase() === String(savedUsername).toLowerCase()
        );
        if (userExists) {
          setUser({
            username: savedUsername,
            name: parsedUser.name ?? savedUsername,
          });
        } else {
          localStorage.removeItem("user");
        }
      } catch (e) {
        console.error("Failed to parse saved user:", e);
        localStorage.removeItem("user");
      }
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
