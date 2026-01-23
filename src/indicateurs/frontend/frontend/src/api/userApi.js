import { fetchJson } from "./authApi";

export async function getUsers() {
  return fetchJson("/api/users");
}

export async function createUser(data) {
  return fetchJson("/api/users", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateUser(id, data) {
  return fetchJson(`/api/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteUser(id) {
  return fetchJson(`/api/users/${id}`, {
    method: "DELETE",
  });
}

export async function changePassword(oldPassword, newPassword) {
  return fetchJson("/api/auth/change-password", {
    method: "POST",
    body: JSON.stringify({
      old_password: oldPassword,
      new_password: newPassword,
    }),
  });
}
