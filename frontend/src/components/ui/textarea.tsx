import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({
  className,
  style,
  ...props
}: React.ComponentProps<"textarea">) {
  const textareaStyle = {
    backgroundImage: `url(${window.location.origin}/brown_GB.png)`,
    backgroundSize: "99% 101%",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    ...style,
  };

  return (
    <textarea
      data-slot="textarea"
      style={textareaStyle}
      className={cn(
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 flex field-sizing-content min-h-18 w-full rounded-md  bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-md",
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
