import mongoose from 'mongoose';

const PageSettingsSchema = new mongoose.Schema({
    pageId: {type: String, required: true},
    name:{type:String, required:true},
    accessToken: {type: String, required: true},
    systemPrompt:{type: String, default:""}
})

const PageSettings = mongoose.model('PageSettings', PageSettingsSchema);
export default PageSettings;