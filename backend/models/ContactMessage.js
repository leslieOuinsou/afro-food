import mongoose from 'mongoose';

const reponseSchema = new mongoose.Schema({
  corps: { type: String, required: true },
  date: { type: Date, default: Date.now },
  auteur: { type: String, default: 'Admin' }
}, { _id: true });

const contactMessageSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  email: { type: String, required: true },
  sujet: { type: String, required: true },
  message: { type: String, required: true },
  statut: {
    type: String,
    enum: ['non_lu', 'lu', 'repondu'],
    default: 'non_lu'
  },
  reponses: [reponseSchema],
  dateLecture: Date,
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

contactMessageSchema.index({ createdAt: -1 });
contactMessageSchema.index({ statut: 1 });

export default mongoose.model('ContactMessage', contactMessageSchema);
