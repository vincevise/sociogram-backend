const {
  GetObjectCommand,
  DeleteObjectCommand,
  S3Client,
  PutObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner")

require("dotenv").config();

const bucketName = process.env.AWS_BUCKET;
const region = 'ap-south-1';
const accessKeyId = process.env.AWS_ACCESS_KEY;
const secretAccessKey = process.env.AWS_SECRET_KEY;
console.log(bucketName);
 
async function uploadFile(fileBuffer, fileName) {
    let contentType = "image/jpeg";
    if (fileName.split(".")[1] === "png") {
        contentType = "image/png";
    }

    const uploadParams = {
        Bucket: bucketName,
        Body: fileBuffer,
        Key: fileName,
        ContentEncoding: "base64",
        ContentType: contentType,
    };

    return s3Client.send(new PutObjectCommand(uploadParams));
}

const s3Client = new S3Client({
    region,
    credentials: {
        accessKeyId,
        secretAccessKey,
    },
});

async function deleteFile(fileName) {
    const deleteParams = {
        Bucket: bucketName,
        Key: fileName,
    };

    const response = await s3Client.send(new DeleteObjectCommand(deleteParams));
    console.log(response);
    return response;
}

async function getObjectSignedUrl(key) {
    const params = {
        Bucket: bucketName,
        Key: key,
    };

    // https://aws.amazon.com/blogs/developer/generate-presigned-url-modular-aws-sdk-javascript/
    const command = new GetObjectCommand(params);
    const seconds = 3600 ;
    const url = await getSignedUrl(s3Client, command, {
        expiresIn: seconds,
    }); 
    console.log(url, Date.now(), 'url');
    return url;
}

module.exports = {
    uploadFile,
    deleteFile,
    getObjectSignedUrl,
};
