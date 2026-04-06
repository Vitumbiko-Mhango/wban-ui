import { Loader2 } from "lucide-react";

const Button = ({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  iconLeft = null,
  iconRight = null,
  onClick,
  type = "button",
  className = "",
}) => {
  const base =
    "inline-flex items-center justify-center gap-2 font-medium rounded-md transition-colors duration-150 cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed";

  const variants = {
    primary: "bg-primary-a20 hover:bg-primary-a30 text-light-a0",
    secondary: "bg-surface-a20 hover:bg-surface-a30 text-dark-a0",
    danger: "bg-danger-a0 hover:bg-danger-a10 text-light-a0 ",
    success: "bg-success-a10 hover:bg-success-a20 text-light-a0",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-s",
    lg: "px-5 py-2.5 text-base",
  };

  const iconSizes = { sm: "size-3.5", md: "size-4", lg: "size-[17px]" };

  const IconLeft = iconLeft;
  const IconRight = iconRight;

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {loading ? (
        <Loader2 className={`${iconSizes[size]} animate-spin`} />
      ) : (
        IconLeft && <IconLeft className={iconSizes[size]} />
      )}
      {loading ? "Loading..." : children}
      {!loading && IconRight && <IconRight className={iconSizes[size]} />}
    </button>
  );
};

export default Button;
