# File Upload Button Component

This component is a button that will upload a file to an AWS S3 server. When you click on the button it will prompt you to choose the file you want to upload and then it will be automatically uploaded to S3. Once the file is uploaded to S3, the URL of that file is sent back to the client. For this component to work you will need to create an `aws.js` file inside of the config directory. The file should look something like this, but with your own S3 credentials filled in:

```js
module.exports = {
	bucket: 'YOUR_S3_BUCKET_NAME',
	accessKeyId: 'ACCESS_KEY_ID',
	secretAccessKey: 'SECRET_ACCESS_KEY'
};
```