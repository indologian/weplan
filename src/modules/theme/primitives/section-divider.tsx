type Props = {
  variant?: "whitespace" | "rule" | "ornament";
  ornament?: React.ReactNode;
  className?: string;
};

export function SectionDivider({
  variant = "whitespace",
  ornament,
  className,
}: Props) {
  if (variant === "whitespace") {
    return <div className={className} style={{ height: "4rem" }} aria-hidden="true" />;
  }

  if (variant === "ornament" && ornament) {
    return (
      <div className={className} style={{ textAlign: "center", padding: "2rem 0" }} aria-hidden="true">
        {ornament}
      </div>
    );
  }

  return (
    <hr
      className={className}
      style={{
        border: "none",
        borderTop: "1px solid currentColor",
        opacity: 0.2,
        margin: "2rem auto",
        maxWidth: "120px",
      }}
      aria-hidden="true"
    />
  );
}
