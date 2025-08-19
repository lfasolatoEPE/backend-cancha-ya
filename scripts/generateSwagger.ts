import fs from 'fs';
import path from 'path';
import logger from '../src/utils/logger';

const mainSwaggerPath = path.join(__dirname, '../docs/swagger.json');
const pathsDir = path.join(__dirname, '../docs/paths');
const outputSwaggerPath = path.join(__dirname, '../docs/swagger.generated.json');

logger.info('📄 Leyendo swagger base...');
const swagger = JSON.parse(fs.readFileSync(mainSwaggerPath, 'utf-8'));

swagger.paths = {};

logger.info('🔍 Buscando archivos de paths...');
const files = fs.readdirSync(pathsDir);

files.forEach(file => {
  const filePath = path.join(pathsDir, file);
  logger.info(`➡️  Agregando: ${file}`);
  const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  Object.assign(swagger.paths, content);
});

fs.writeFileSync(outputSwaggerPath, JSON.stringify(swagger, null, 2));
logger.info('✅ Swagger generado en docs/swagger.generated.json');
