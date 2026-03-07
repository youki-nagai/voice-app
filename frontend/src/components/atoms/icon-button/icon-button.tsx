import "./icon-button.css";

interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  variant?: "default" | "mic" | "send";
}

export function IconButton({
  active,
  variant = "default",
  className = "",
  children,
  ...props
}: IconButtonProps) {
  const classes = ["icon-button", variant, active ? "active" : "", className]
    .filter(Boolean)
    .join(" ");
  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
