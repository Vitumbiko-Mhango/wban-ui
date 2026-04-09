import { useState } from "react";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import Heading from "../../components/common/Heading";

const PasswordField = ({ label, value, onChange }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1.5">
      <label className="block text-xs text-dark-a0/60">{label}</label>
      <div className="relative flex items-center">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder="••••••••"
          className="w-full pl-3 pr-10 py-2 text-sm border border-surface-a30 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-a20 focus:border-primary-a20"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 text-dark-a0/40 hover:text-dark-a0 transition-colors cursor-pointer"
        >
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    </div>
  );
};

const SecurityPage = () => {
  const [current, setCurrent] = useState("");
  const [newPw, setNewPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  const mismatch = confirm.length > 0 && newPw !== confirm;
  const canSave = current.length > 0 && newPw.length >= 6 && newPw === confirm;

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      alert("Password changed successfully!");
      setCurrent("");
      setNewPwd("");
      setConfirm("");
    }, 1500);
  };

  return (
    <div>
      {/* heading */}
      <Heading title="Security Settings" subtitle={"Manage your password"} />
      <div className="max-w-md space-y-4">
        <div className="bg-white border border-surface-a30 rounded-lg p-6 space-y-4">
          <div>
            <h2 className="text-sm font-medium text-dark-a0">
              Change password
            </h2>
            <p className="text-xs text-dark-a0/50 mt-0.5">
              Update your login password below.
            </p>
          </div>
          <PasswordField
            label="Current password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
          />
          <PasswordField
            label="New password"
            value={newPw}
            onChange={(e) => setNewPwd(e.target.value)}
          />
          <div className="space-y-1.5">
            <label className="block text-xs text-dark-a0/60">
              Confirm new password
            </label>
            <div className="relative flex items-center">
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                className={`w-full pl-3 pr-10 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 ${
                  mismatch
                    ? "border-red-400 focus:ring-red-300"
                    : "border-surface-a30 focus:ring-primary-a20 focus:border-primary-a20"
                }`}
              />
            </div>
            {mismatch && (
              <p className="text-xs text-red-700">Passwords do not match.</p>
            )}
          </div>
          <div className="pt-2 flex gap-2">
            <button
              onClick={handleSave}
              disabled={!canSave || saving}
              className="text-sm font-medium px-4 py-2 rounded-md bg-primary-a20 text-white border border-primary-a30 hover:bg-primary-a30 disabled:opacity-45 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <LoaderCircle className="animate-spin size-4 text-light-a0" />
                  Saving...
                </span>
              ) : (
                "Save changes"
              )}
            </button>
            <button
              onClick={() => {
                setCurrent("");
                setNewPwd("");
                setConfirm("");
              }}
              className="text-sm font-medium px-4 py-2 rounded-md border border-surface-a30 text-dark-a0/60 hover:bg-surface-a20 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityPage;
