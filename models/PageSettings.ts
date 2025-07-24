import mongoose from 'mongoose';

const PageSettingsSchema = new mongoose.Schema({
  pageId: { type: String, required: true },
  name: { type: String, required: true },
  accessToken: { type: String, required: true },
  systemPrompt: {
    type: String,
    default: "you are a helpful assistant for selling products on this page also you only reply in Mongolian",
  },

});

const PageSettings = mongoose.model('PageSettings', PageSettingsSchema);
export default PageSettings;
