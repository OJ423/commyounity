const { PutObjectCommand, S3Client } = require("@aws-sdk/client-s3");

const client = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS
},
region: process.env.AWS_DEFAULT_REGION
});



exports.insertFile = async (file) => {
  const fileName = `uploads/${Date.now()}_${file.originalname}`
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: fileName,
    Body: file.buffer,
    ACL: 'public-read',
    ContentType: file.mimetype
  });
  try {
    const response = await client.send(command);
    return fileName
  } catch(err) {
    console.log(err)
  }
}