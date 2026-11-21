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

favoritoSchema.index({ usuario: 1, producto: 1 }, { unique: true });

favoritoSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

module.exports = model('Favorito', favoritoSchema); // colección "favoritos"
