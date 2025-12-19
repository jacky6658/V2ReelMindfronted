import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: "group toast group-[.toaster]:bg-popover group-[.toaster]:text-popover-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg dark:group-[.toaster]:text-white",
          description: "group-[.toast]:text-popover-foreground/80 dark:group-[.toast]:!text-white/95",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground dark:group-[.toast]:!text-white",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground dark:group-[.toast]:!text-white",
        },
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
