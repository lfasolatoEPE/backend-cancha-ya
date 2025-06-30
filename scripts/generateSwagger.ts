import fs from "fs";
import path from "path";

const mainSwaggerPath = path.join(__dirname, "../docs/swagger.json");
const pathsDir = path.join(__dirname, "../docs/paths");
const outputSwaggerPath = path.join(__dirname, "../docs/swagger.generated.json");

console.log("📄 Leyendo swagger base...");
const swagger = JSON.parse(fs.readFileSync(mainSwaggerPath, "utf-8"));

swagger.paths = {};

console.log("🔍 Buscando archivos de paths...");
const files = fs.readdirSync(pathsDir);

files.forEach(file => {
  const filePath = path.join(pathsDir, file);
  console.log(`➡️  Agregando: ${file}`);
  const content = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  Object.assign(swagger.paths, content);
});

fs.writeFileSync(outputSwaggerPath, JSON.stringify(swagger, null, 2));
console.log("✅ Swagger generado en docs/swagger.generated.json");
