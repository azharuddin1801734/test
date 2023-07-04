const mongoose = require("mongoose");
const { Storage } = require("@google-cloud/storage");

const storage = new Storage({
  credentials: {
    private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
    private_key: process.env.GOOGLE_PRIVATE_KEY ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/gm, "\n") : "GOOGLE_PRIVATE_KEY is empty",
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    client_id: process.env.GOOGLE_CLIENT_ID2,
    auth_uri: process.env.GOOGLE_AUTH_URI,
    token_uri: process.env.GOOGLE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.GOOGLE_PROVIDER,
    client_x509_cert_url: process.env.GOOGLE_CLIENT,
  },
});

const storySchema = new mongoose.Schema({
  specialist: {
    type: mongoose.Schema.ObjectId,
    ref: "Specialist",
  },
  resource: String,
  mediaType: {
    type: String,
    enum: ["VIDEO", "IMAGE"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },

});

storySchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

storySchema.pre("remove", { query: true, document: false }, async (next) => {
  await storage.bucket("freshr-44d1a.appspot.com").file(this.resource).delete();
  next();
});

const Story = mongoose.model("Story", storySchema);

module.exports = Story;
