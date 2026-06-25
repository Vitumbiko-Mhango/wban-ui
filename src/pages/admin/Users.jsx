/**
 * src/pages/admin/Users.jsx  (REPLACE YOUR EXISTING FILE)
 *
 * Changes from original:
 *  - Loads users from GET /api/users/
 *  - Add user: POST /api/auth/register/
 *  - Edit user: PATCH /api/users/{id}/
 *  - Delete user: DELETE /api/users/{id}/
 *  - Passes real onSubmit handlers into AddUserForm
 */

import React, { useCallback, useEffect, useState } from "react";
import Heading from "../../components/common/Heading";
import GeneralTable from "../../components/common/GeneralTable";
import { Plus, SquarePen, Trash2 } from "lucide-react";
import Button from "../../components/common/Button";
import AddUserForm from "../../components/AddUserForm";
import client from "../../api/client";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openAddUser, setOpenAddUser] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const fetchUsers = useCallback(async () => {
    try {
      const { data } = await client.get("/users/");
      setUsers(data?.results ?? data ?? []);
    } catch {
      setError("Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ── Add ──────────────────────────────────────────────────────────────────────
  const handleAdd = async (formData) => {
    await client.post("/auth/register/", {
      first_name: formData.firstname,
      last_name: formData.surname,
      username: formData.email.split("@")[0], // derive username from email
      email: formData.email,
      password: formData.password,
      role: formData.role,
    });
    setOpenAddUser(false);
    fetchUsers();
  };

  // ── Edit ─────────────────────────────────────────────────────────────────────
  const handleEdit = async (formData) => {
    const payload = {
      first_name: formData.firstname,
      last_name: formData.surname,
      email: formData.email,
      role: formData.role,
    };
    if (formData.password) payload.password = formData.password;
    await client.patch(`/users/${selectedUser.id}/`, payload);
    setSelectedUser(null);
    fetchUsers();
  };

  // ── Delete ───────────────────────────────────────────────────────────────────
  const handleDelete = async (user) => {
    if (
      !window.confirm(
        `Delete user ${displayName(user)}? This cannot be undone.`,
      )
    )
      return;
    await client.delete(`/users/${user.id}/`);
    fetchUsers();
  };

  // Derive a display name — backend currently only returns username/email/role
  // Once first_name/last_name are added to UserSerializer they'll appear automatically
  const displayName = (u) => {
    const full = [u.first_name, u.last_name].filter(Boolean).join(" ");
    return full || u.username || u.email || "—";
  };

  // Normalise backend field names for AddUserForm
  const toFormShape = (u) => ({
    id: u.id,
    firstname: u.first_name || "",
    surname: u.last_name || "",
    email: u.email,
    role: u.role,
  });

  return (
    <div>
      <Heading
        title="Users"
        subtitle="Manage system users and their permissions"
      />

      {error && (
        <div className="mt-4 mb-2 px-3 py-2 rounded-md bg-red-50 border border-red-200 text-sm text-danger-a0">
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <Button
          onClick={() => setOpenAddUser(true)}
          variant="primary"
          size="md"
          iconLeft={Plus}
        >
          Add User
        </Button>
      </div>

      <GeneralTable
        tableTitle="User List"
        headers={["Name", "Email", "Role", "Actions"]}
        rows={loading ? [] : users}
        renderRows={(user) => (
          <tr
            key={user.id}
            className="border border-surface-a20 text-sm hover:bg-surface-a10 cursor-pointer"
          >
            <td className="px-6 py-4 whitespace-nowrap">{displayName(user)}</td>
            <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
            <td className="px-6 py-4 whitespace-nowrap capitalize">
              {user.role}
            </td>
            <td className="px-6 py-4 whitespace-nowrap space-x-4">
              <button
                title="Edit User"
                className="text-sm text-primary-a20 hover:underline cursor-pointer"
                onClick={() => setSelectedUser(toFormShape(user))}
              >
                <SquarePen className="size-4 inline-block mr-1 text-primary-a0" />
              </button>
              <button
                title="Delete User"
                className="text-sm text-danger-a20 hover:underline cursor-pointer"
                onClick={() => handleDelete(user)}
              >
                <Trash2 className="size-4 inline-block text-danger-a0" />
              </button>
            </td>
          </tr>
        )}
      />

      {loading && (
        <p className="text-center text-sm text-dark-a0/50 py-8">
          Loading users…
        </p>
      )}

      {openAddUser && (
        <AddUserForm
          closeForm={() => setOpenAddUser(false)}
          onSubmit={handleAdd}
        />
      )}
      {selectedUser && (
        <AddUserForm
          closeForm={() => setSelectedUser(null)}
          onSubmit={handleEdit}
          user={selectedUser}
        />
      )}
    </div>
  );
};

export default Users;
