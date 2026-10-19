import ArchitectureConsole from "./architecture-console";
import {
  apiPhpContent,
  appJsContent,
  configPhpContent,
  databaseContent,
  indexHtmlContent,
  rootHtaccessContent,
  styleCssContent,
  treeContent,
  uploadsHtaccessContent,
} from "@/content/generated-artifacts";

export const dynamic = "force-static";

const artifacts = [
  { id: "tree", label: "Folder Tree", eyebrow: "01 · STRUCTURE", filename: "FOLDER_TREE.md", language: "text", content: treeContent },
  { id: "database", label: "Database Schema", eyebrow: "02 · MYSQL 8", filename: "schema.sql", language: "sql", content: databaseContent },
  { id: "html", label: "SPA Shell", eyebrow: "03 · HTML5", filename: "index.html", language: "html", content: indexHtmlContent },
  { id: "css", label: "Luxury Styles", eyebrow: "04 · CSS3", filename: "style.css", language: "css", content: styleCssContent },
  { id: "js", label: "SPA Engine", eyebrow: "05 · ES6+", filename: "app.js", language: "js", content: appJsContent },
  { id: "config", label: "DB Connection", eyebrow: "06 · PHP 8.1", filename: "config.php", language: "php", content: configPhpContent },
  { id: "api", label: "REST Backend", eyebrow: "07 · PHP 8.1", filename: "api.php", language: "php", content: apiPhpContent },
  { id: "shield", label: "Root Security", eyebrow: "08 · APACHE", filename: ".htaccess", language: "apache", content: rootHtaccessContent },
  { id: "upload", label: "Upload Isolation", eyebrow: "09 · MEDIA", filename: "uploads/.htaccess", language: "apache", content: uploadsHtaccessContent },
];

export default function HomePage() {
  return <ArchitectureConsole artifacts={artifacts} />;
}
