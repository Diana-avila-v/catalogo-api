const { Schema, model } = require('mongoose');

const usuarioSchema = new Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true,
      maxlength: [80, 'El nombre no puede superar 80 caracteres'],
    },
    correo: {
      type: String,
      required: [true, 'El correo es obligatorio'],
      unique: true, // índice único: la BD rechaza correos repetidos (error 11000 -> 409)
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'El correo no tiene un formato válido'],
    },
    passwordHash: {
      type: String,
      required: true,
      select: false, // nunca se trae en las consultas, salvo que se pida con .select('+passwordHash')
    },
    rol: {
      type: String,
      enum: ['usuario', 'admin'],
      default: 'usuario',
    },
  },
  { timestamps: true, versionKey: false }
);

// Aunque alguien pida el hash explícitamente, nunca sale en una respuesta JSON
usuarioSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.passwordHash;
    return ret;
  },
});

module.exports = model('Usuario', usuarioSchema);
