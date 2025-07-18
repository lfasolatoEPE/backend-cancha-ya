import { AppDataSource } from './database/data-source';
import app from './app';

const PORT = parseInt(process.env.PORT || '3000', 10);

AppDataSource.initialize()
  .then(() => {
    console.log('📦 Conexión a PostgreSQL establecida');
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('❌ Error al inicializar la base de datos:', error);
    process.exit(1);
  });
