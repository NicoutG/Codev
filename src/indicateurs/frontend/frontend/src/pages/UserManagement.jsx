import { useState, useEffect } from "react";
import { getUsers, createUser, updateUser, deleteUser } from "../api/userApi";
import { useAuth } from "../auth/AuthContext";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const { user: currentUser } = useAuth();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "consultant",
  });

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      alert("Erreur lors du chargement: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    try {
      await createUser(formData);
      setShowCreate(false);
      setFormData({ username: "", email: "", password: "", role: "consultant" });
      loadUsers();
    } catch (err) {
      alert("Erreur lors de la création: " + err.message);
    }
  }

  async function handleUpdate(userId) {
    try {
      const updateData = {
        username: formData.username || undefined,
        email: formData.email || undefined,
        role: formData.role || undefined,
      };
      await updateUser(userId, updateData);
      setEditingUser(null);
      setFormData({ username: "", email: "", password: "", role: "consultant" });
      loadUsers();
    } catch (err) {
      alert("Erreur lors de la modification: " + err.message);
    }
  }

  async function handleDelete(userId) {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) {
      return;
    }
    try {
      await deleteUser(userId);
      loadUsers();
    } catch (err) {
      alert("Erreur lors de la suppression: " + err.message);
    }
  }

  function startEdit(user) {
    setEditingUser(user.id);
    setFormData({
      username: user.username,
      email: user.email,
      password: "",
      role: user.role,
    });
  }

  if (loading) {
    return <div style={{ padding: "20px" }}>Chargement...</div>;
  }

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1>Gestion des utilisateurs</h1>
        <button
          onClick={() => {
            setShowCreate(true);
            setEditingUser(null);
            setFormData({ username: "", email: "", password: "", role: "consultant" });
          }}
          style={{
            padding: "10px 20px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          + Créer un utilisateur
        </button>
      </div>

      {(showCreate || editingUser) && (
        <div style={{
          backgroundColor: "#f5f5f5",
          padding: "20px",
          borderRadius: "8px",
          marginBottom: "20px"
        }}>
          <h3>{editingUser ? "Modifier l'utilisateur" : "Créer un utilisateur"}</h3>
          <div style={{ display: "grid", gap: "15px", maxWidth: "500px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                Nom d'utilisateur *
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ddd",
                  borderRadius: "4px"
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ddd",
                  borderRadius: "4px"
                }}
              />
            </div>
            {!editingUser && (
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                  Mot de passe *
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "1px solid #ddd",
                    borderRadius: "4px"
                  }}
                />
              </div>
            )}
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                Rôle *
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ddd",
                  borderRadius: "4px"
                }}
              >
                <option value="consultant">Consultant</option>
                <option value="modificateur">Modificateur</option>
              </select>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => editingUser ? handleUpdate(editingUser) : handleCreate()}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                {editingUser ? "Modifier" : "Créer"}
              </button>
              <button
                onClick={() => {
                  setShowCreate(false);
                  setEditingUser(null);
                  setFormData({ username: "", email: "", password: "", role: "consultant" });
                }}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#f0f0f0" }}>
              <th style={{ padding: "10px", border: "1px solid #ddd", textAlign: "left" }}>Nom d'utilisateur</th>
              <th style={{ padding: "10px", border: "1px solid #ddd", textAlign: "left" }}>Email</th>
              <th style={{ padding: "10px", border: "1px solid #ddd", textAlign: "left" }}>Rôle</th>
              <th style={{ padding: "10px", border: "1px solid #ddd", textAlign: "left" }}>Statut</th>
              <th style={{ padding: "10px", border: "1px solid #ddd", textAlign: "left" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td style={{ padding: "10px", border: "1px solid #ddd" }}>{user.username}</td>
                <td style={{ padding: "10px", border: "1px solid #ddd" }}>{user.email}</td>
                <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                  <select
                    value={user.role}
                    onChange={(e) => {
                      updateUser(user.id, { role: e.target.value })
                        .then(() => loadUsers())
                        .catch((err) => alert("Erreur: " + err.message));
                    }}
                    style={{
                      padding: "4px 8px",
                      border: "1px solid #ddd",
                      borderRadius: "4px"
                    }}
                  >
                    <option value="consultant">Consultant</option>
                    <option value="modificateur">Modificateur</option>
                  </select>
                </td>
                <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                  <span style={{
                    padding: "4px 8px",
                    borderRadius: "4px",
                    backgroundColor: user.is_active ? "#c8e6c9" : "#ffcdd2",
                    color: user.is_active ? "#2e7d32" : "#c62828"
                  }}>
                    {user.is_active ? "Actif" : "Inactif"}
                  </span>
                </td>
                <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                  <div style={{ display: "flex", gap: "5px" }}>
                    <button
                      onClick={() => startEdit(user)}
                      style={{
                        padding: "4px 8px",
                        backgroundColor: "#17a2b8",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "12px"
                      }}
                    >
                      Modifier
                    </button>
                    {user.id !== currentUser?.id && (
                      <button
                        onClick={() => handleDelete(user.id)}
                        style={{
                          padding: "4px 8px",
                          backgroundColor: "#dc3545",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "12px"
                        }}
                      >
                        Supprimer
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
