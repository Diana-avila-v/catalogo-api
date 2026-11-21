const { Schema, model } = require('mongoose');

const favoritoSchema = new Schema(
  {
    usuario: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
      required: [true, 'El usuario es obligatorio'],
    },
    producto: {
      type: Schema.Types.ObjectId,
      ref: 'Producto',
      required: [true, 'El producto es obligatorio'],
    },
  },
  { timestamps: true, versionKey: false }
);

// Un usuario no puede tener el mismo producto dos veces en favoritos.
// Lo garantiza la base de datos (error 11000 -> 409), aunque lleguen dos peticiones a la vez.
// Además sirve para buscar rápido los favoritos de un usuario (prefijo "usuario").
favoritoSchema.index({ usuario: 1, producto: 1 }, { unique: true });

// En las respuestas JSON se expone "id" en lugar de "_id"
favoritoSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

module.exports = model('Favorito', favoritoSchema); // colección "favoritos"
