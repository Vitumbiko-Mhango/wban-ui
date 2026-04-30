import React, { useState } from "react";
import Heading from "../../components/common/Heading";
import GeneralTable from "../../components/common/GeneralTable";
import { Plus, Square, SquarePen, Trash2 } from "lucide-react";
import Button from "../../components/common/Button";
import AddUser from "../../components/AddUser";

const Users = () => {
  const[openAddUser, setOpenAddUser] = useState(false);
  const[selectedUser, setSelectedUser] = useState(null);

  const usersData = [
    {
      id: 1,
      firstname: "Alice",
      surname: "Smith",
      email: "alice.smith@example.com",
      position: "Cardiologist",
      role: "Admin",
    },
    {
      id: 2,
      firstname: "Bob",
      surname: "Johnson",
      email: "bob.johnson@example.com",
      position: "Nurse",
      role: "User",
    },
    {
      id: 3,
      firstname: "Carol",
      surname: "Lee",
      email: "carol.lee@example.com",
      position: "Pediatrician",
      role: "User",
    }

  ];

  return (
    <div>
      <Heading
        title={"Users"}
        subtitle={"Manage system users and their permissions"}
      />

      <div className="flex justify-end">
        <Button onClick={() => setOpenAddUser(true)} variant="primary" size="md" iconLeft={Plus}>
          Add User
        </Button>
      </div>

      <GeneralTable
        tableTitle={"User List"}
        headers={["Name", "Email", "Position", "Role", "Actions"]}
        rows={usersData}
        renderRows={(user) => (
          <tr
            key={user.id}
            className="border border-surface-a20 text-sm hover:bg-surface-a10 cursor-pointer"
          >
            <td className="px-6 py-4 whitespace-nowrap">{`${user.firstname} ${user.surname}`}</td>
            <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
            <td className="px-6 py-4 whitespace-nowrap">{user.position}</td>
            <td className="px-6 py-4 whitespace-nowrap">{user.role}</td>
            <td className="px-6 py-4 whitespace-nowrap space-x-4">
              <button
                title="Edit User"
                className="text-sm text-primary-a20 hover:underline cursor-pointer"
                onClick={() => setSelectedUser(user)}
              >
                <SquarePen className="size-4 inline-block mr-1 text-primary-a0" />
              </button>
              <button
                title="Delete User"
                className="text-sm text-danger-a20 hover:underline cursor-pointer"
              >
                <Trash2 className="size-4 inline-block text-danger-a0" />
              </button>
            </td>
          </tr>
        )}
      />

      {openAddUser && <AddUser closeForm={() => setOpenAddUser(false)} />}
        {selectedUser && (
          <AddUser
            closeForm={() => setSelectedUser(null)}
            user={selectedUser}
          />
        )}
    </div>
  );
};

export default Users;
