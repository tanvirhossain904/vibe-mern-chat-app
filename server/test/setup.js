process.env.NODE_ENV = "test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test_secret_at_least_32_characters_long_xx";
process.env.MONGODB_URI = process.env.MONGODB_URI || "mongodb://placeholder";
process.env.CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
process.env.CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || "test_cloud";
process.env.CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || "test_key";
process.env.CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || "test_secret";
