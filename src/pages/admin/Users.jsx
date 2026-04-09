import React from "react";
import Heading from "../../components/common/Heading";
import GeneralTable from "../../components/common/GeneralTable";
import { Plus, Square, SquarePen, Trash2 } from "lucide-react";
import Button from "../../components/common/Button";

const Users = () => {
  const usersData = [
    {
      id: 1,
      name: "Dr. Alice Smith",
      email: "alice.smith@example.com",
      position: "Cardiologist",
      role: "Admin",
    },
    {
      id: 2,
      name: "Nurse Bob Johnson",
      email: "bob.johnson@example.com",
      position: "Nurse",
      role: "User",
    },
    {
      id: 3,
      name: "Dr. Carol Lee",
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
        <Button variant="primary" size="md" iconLeft={Plus}>
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
            <td className="px-6 py-4 whitespace-nowrap">{user.name}</td>
            <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
            <td className="px-6 py-4 whitespace-nowrap">{user.position}</td>
            <td className="px-6 py-4 whitespace-nowrap">{user.role}</td>
            <td className="px-6 py-4 whitespace-nowrap space-x-4">
              <button
                title="Edit User"
                className="text-sm text-primary-a20 hover:underline cursor-pointer"
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
    </div>
  );
};

export default Users;
