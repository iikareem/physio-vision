import { apiJson } from "@/lib/api/client";
import type { User } from "@/lib/types";

export type LoginResponse = {
  token: string;
  user: User;
};

export function login(email: string, password: string) {
  return apiJson<LoginResponse>("/auth/login", {
    method: "POST",
    body: { email, password },
    auth: false,
  });
}

export function getMe(token?: string | null) {
  return apiJson<User>("/me", { token });
}
