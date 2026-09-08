import mongoose from 'mongoose';

/**
 * Abre la conexión a MongoDB.
 * En esta etapa del proyecto la conexión es opcional: si no hay MONGO_URL
 * configurada, el servidor igual se levanta para poder probar las rutas base.
 */
export const connectDB = async (mongoUrl) => {
  mongoose.connection.on('error', (error) => {
    console.error('Error en la conexión a MongoDB:', error.message);
  });

  return mongoose.connect(mongoUrl);
};

export default connectDB;
