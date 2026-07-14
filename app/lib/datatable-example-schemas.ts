import type { JsonSchema } from "@jsonforms/core";

export const demoPersonSchema: JsonSchema = {
  type: "object",
  title: "Person",
  properties: {
    __select: { type: "boolean", title: "", readOnly: true },
    __action: { type: "string", title: "Action", readOnly: true },
    id: { type: "integer", title: "ID" },
    name: { type: "string", title: "Name" },
    username: { type: "string", title: "Username" },
    email: { type: "string", title: "Email", format: "email" },
    phone: { type: "string", title: "Phone" },
    image: { type: "string", title: "Image", format: "uri" },
    location: {
      type: "object",
      properties: {
        city: { type: "string", title: "Location" },
        country: { type: "string", title: "Country" },
        flag: { type: "string", title: "Flag" },
      },
    },
    status: {
      type: "string",
      title: "Status",
      enum: ["Active", "Inactive"],
    },
    balance: { type: "number", title: "Balance" },
    position: { type: "string", title: "Position" },
    office: { type: "string", title: "Office" },
    age: { type: "integer", title: "Age" },
    startDate: { type: "string", title: "Start date", format: "date" },
    department: { type: "string", title: "Department" },
    joinDate: { type: "string", title: "Join date", format: "date" },
    lastActive: { type: "string", title: "Last active", format: "date" },
  },
};

export const personColumnPaths = {
  dom: ["__select", "id", "name", "position", "office", "age", "startDate", "balance"],
  customComponent: ["__action", "name", "email", "position", "office", "lastActive"],
  layout: ["name", "department", "office", "status", "balance"],
  simple: ["id", "name", "email", "location.city", "status", "balance"],
  badgeIcons: ["name", "status", "location.city", "position", "lastActive"],
  fixedColumns: [
    "__select",
    "name",
    "email",
    "position",
    "office",
    "age",
    "startDate",
    "department",
    "status",
    "balance",
    "phone",
  ],
  columnReorder: ["name", "email", "position", "office", "department", "status", "balance"],
  pagination: ["__select", "name", "email", "position", "office", "status", "balance"],
} as const;

export const programmingLanguageSchema: JsonSchema = {
  type: "object",
  title: "Programming language",
  properties: {
    id: { type: "string", title: "ID" },
    name: { type: "string", title: "Name" },
    releaseYear: { type: "string", title: "Released" },
    developer: { type: "string", title: "Developer" },
    typing: { type: "string", title: "Typing" },
    paradigm: { type: "string", title: "Paradigm" },
    extension: { type: "string", title: "Extension" },
    latestVersion: { type: "string", title: "Latest" },
    popularity: { type: "string", title: "Popularity" },
  },
};

export const programmingLanguageColumnPaths = [
  "name",
  "releaseYear",
  "developer",
  "typing",
  "paradigm",
  "extension",
  "latestVersion",
  "popularity",
] as const;

export const keywordRowSchema: JsonSchema = {
  type: "object",
  title: "Keyword performance",
  properties: {
    id: { type: "integer", title: "ID" },
    keyword: { type: "string", title: "Keyword" },
    intents: {
      type: "array",
      title: "Intent",
      items: { type: "string", title: "Intent" },
    },
    volume: { type: "integer", title: "Volume" },
    cpc: { type: "number", title: "CPC" },
    traffic: { type: "integer", title: "Traffic" },
    link: { type: "string", title: "SERP", format: "uri" },
  },
};

export const keywordColumnPaths = [
  "keyword",
  "intents",
  "volume",
  "cpc",
  "traffic",
  "link",
] as const;
