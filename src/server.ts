import { AppDataSource } from './database/data-source';
import app from './app';
import logger from './utils/logger';

const PORT = parseInt(process.env.PORT || '3000', 10);

AppDataSource.initialize()
  .then(() => {
    logger.info('📦 Conexión a PostgreSQL establecida');
    app.listen(PORT, '0.0.0.0', () => {
      logger.info(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    logger.error('❌ Error al inicializar la base de datos:', error);
    process.exit(1);
  });
