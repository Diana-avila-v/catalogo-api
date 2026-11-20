const { Schema, model } = require('mongoose');

const productoSchema = new Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true,
      maxlength: [100, 'El nombre no puede superar 100 caracteres'],
    },
    descripcion: {
      type: String,
      required: [true, 'La descripción es obligatoria'],
      trim: true,
      maxlength: [500, 'La descripción no puede superar 500 caracteres'],
    },
    categoria: {
      type: String,
      required: [true, 'La categoría es obligatoria'],
      trim: true,
      lowercase: true, // "Hogar" y "hogar" se guardan igual, así el filtro es coherente
      maxlength: [50, 'La categoría no puede superar 50 caracteres'],
    },
    precio: {
      type: Number,
      required: [true, 'El precio es obligatorio'],
      validate: {
        validator: (v) => Number.isFinite(v) && v > 0,
        message: 'El precio debe ser un número mayor que cero',
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Índice para que el filtro por categoría sea rápido
productoSchema.index({ categoria: 1 });

// En las respuestas JSON se expone "id" en lugar de "_id"
productoSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

module.exports = model('Producto', productoSchema);
