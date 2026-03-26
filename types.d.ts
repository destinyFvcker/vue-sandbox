import type { ClassValue as ClsxClassValue } from "clsx";

declare module "tailwind-merge" {
  export type ClassNameValue = ClsxClassValue;
}
