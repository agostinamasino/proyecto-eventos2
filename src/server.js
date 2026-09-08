import app from './app.js';
import config from './config/config.js';
import connectDB from './config/db.js';
import logger from './utils/logger.js';

const { port, mongoUrl } = config;

const startServer = async () => {
  if (mongoUrl) {
    try {
      await connectDB(mongoUrl);
      logger.info('Conexión a MongoDB establecida');
    } catch (error) {
      logger.error('No se pudo conectar a MongoDB. El servidor continúa sin persistencia:', error.message);
    }
  } else {
    logger.info('MONGO_URL no configurada: el servidor se inicia sin conexión a base de datos');
  }

  app.listen(port, () => {
    logger.info(`Servidor escuchando en el puerto ${port}`);
  });
};

startServer();
