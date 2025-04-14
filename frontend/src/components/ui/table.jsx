import { splitProps } from "solid-js"

import { cn } from "~/lib/utils"

const Table = (props) => {
  const [local, others] = splitProps(props, ["class"])
  return (
    <div class="relative w-full overflow-auto">
      <table class={cn("w-full caption-bottom text-sm", local.class)} {...others} />
    </div>
  );
}

const TableHeader = (props) => {
  const [local, others] = splitProps(props, ["class"])
  return <thead class={cn("[&_tr]:border-b", local.class)} {...others} />;
}

const TableBody = (props) => {
  const [local, others] = splitProps(props, ["class"])
  return <tbody class={cn("[&_tr:last-child]:border-0", local.class)} {...others} />;
}

const TableFooter = (props) => {
  const [local, others] = splitProps(props, ["class"])
  return (
    <tfoot
      class={cn("bg-primary font-medium text-primary-foreground", local.class)}
      {...others} />
  );
}

const TableRow = (props) => {
  const [local, others] = splitProps(props, ["class"])
  return (
    <tr
      class={cn(
        "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
        local.class
      )}
      {...others} />
  );
}

const TableHead = (props) => {
  const [local, others] = splitProps(props, ["class"])
  return (
    <th
      class={cn(
        "h-10 px-2 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
        local.class
      )}
      {...others} />
  );
}

const TableCell = (props) => {
  const [local, others] = splitProps(props, ["class"])
  return (
    <td
      class={cn("p-2 align-middle [&:has([role=checkbox])]:pr-0", local.class)}
      {...others} />
  );
}

const TableCaption = (props) => {
  const [local, others] = splitProps(props, ["class"])
  return <caption class={cn("mt-4 text-sm text-muted-foreground", local.class)} {...others} />;
}

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption }
