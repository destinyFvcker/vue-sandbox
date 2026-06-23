import type { ClassValue as ClsxClassValue } from "clsx";
import "datatables.net-buttons";
import "datatables.net-select";

declare module "tailwind-merge" {
  export type ClassNameValue = ClsxClassValue;
}
