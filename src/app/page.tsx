import ArchitectureConsole from "./architecture-console";
import {
  databaseContent,
  rootHtaccessContent,
  treeContent,
  uploadsHtaccessContent,
} from "@/content/generated-artifacts";

export const dynamic = "force-static";

const artifacts = [
  { id: "tree", label: "Folder Tree", eyebrow: "01 · STRUCTURE", filename: "FOLDER_TREE.md", language: "text", content: treeContent },
  { id: "database", label: "Database Schema", eyebrow: "02 · MYSQL 8", filename: "schema.sql", language: "sql", content: databaseContent },
  { id: "shield", label: "Root Security", eyebrow: "03 · APACHE", filename: ".htaccess", language: "apache", content: rootHtaccessContent },
  { id: "upload", label: "Upload Isolation", eyebrow: "04 · MEDIA", filename: "uploads/.htaccess", language: "apache", content: uploadsHtaccessContent },
];

export default function HomePage() {
  return <ArchitectureConsole artifacts={artifacts} />;
}
