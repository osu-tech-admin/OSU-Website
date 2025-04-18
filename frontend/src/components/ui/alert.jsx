import { splitProps } from "solid-js"

import * as AlertPrimitive from "@kobalte/core/alert"
import { cva } from "class-variance-authority"

import { cn } from "~/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive:
          "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
)

const Alert = props => {
  const [local, others] = splitProps(props, ["class", "variant"])
  return (
    <AlertPrimitive.Root
      class={cn(alertVariants({ variant: props.variant }), local.class)}
      {...others} />
  );
}

const AlertTitle = (props) => {
  const [local, others] = splitProps(props, ["class"])
  return (
    <h5
      class={cn("mb-1 font-medium leading-none tracking-tight", local.class)}
      {...others} />
  );
}

const AlertDescription = (props) => {
  const [local, others] = splitProps(props, ["class"])
  return <div class={cn("text-sm [&_p]:leading-relaxed", local.class)} {...others} />;
}

export { Alert, AlertTitle, AlertDescription }
