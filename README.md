# PHP, AWS S3 and AWS Lambda Image Scaling Tool

## What does it do?
This is a single webpage that uses PHP to generate AWS signatures to upload images directly to S3. Once on S3, the images are resized by AWS Lambda and sent to another S3 bucket. The webpage waits for the images to appear on that bucket then provides a download link to the user.

Use it as a stand alone tool, or tear into the PHP and tweak it to your needs.

AWS performs all of the heavy lifting which makes the service scalable, as the only thing your server is responsible for is generating the authentication credentials.

### Create the S3 Upload Bucket

For this tool we will need two buckets. The first one is for uploading images directly from our webpage. 

1. Open the AWS Management Console. 
1. Click on the **Services** dropdown in the upper-left corner and then click on **S3** under the Storage heading. 
1. Click **Create bucket**. 
1. Give your bucket a descriptive name (like 'my-uploaded-images'), pick your region, then click **Create**.
1. Click the Permissions tab, and then the CORS configuration option. 
1. Enter the configurtion below, replacing `mydomain.com` with your domain, and click Save. This CORS configration allows our webpage to upload images directly to S3.

    ```
    <!-- Sample policy -->
    <CORSConfiguration>
    	<CORSRule>
    		<AllowedOrigin>http://mydomain.com</AllowedOrigin>
    		<AllowedMethod>POST</AllowedMethod>
    		<MaxAgeSeconds>3000</MaxAgeSeconds>
    		<AllowedHeader>*</AllowedHeader>
    	</CORSRule>
    </CORSConfiguration>
    ```

1. Copy the bucket name and region into `$config_POST_region` and `$config_POST_bucket` in the `config/config.php` file.

### Create the S3 Resize Bucket

The second bucket is for storing the images that are resized by Lambda.

1. Repeat the above steps again with a different name for your resize bucket (like 'my-resized-images').
1. Enter the CORS configurtion below, replacing `mydomain.com` with your domain, and click Save. This CORS configuration allows our webpage to ping resized images to see if they exist.

```
<CORSConfiguration>
	<CORSRule>
		<AllowedOrigin>http://mydomain.com</AllowedOrigin>
		<AllowedMethod>GET</AllowedMethod>
		<MaxAgeSeconds>3000</MaxAgeSeconds>
		<AllowedHeader>*</AllowedHeader>
	</CORSRule>
</CORSConfiguration>
```

1. Copy the bucket name and region into `$config_GET_region` and `$config_GET_bucket` in the `config/config.php` file.

### Create an IAM User to access those buckets

The PHP script requires credentials for a user that can access both buckets created above. For security purposes we are only going to give the user access to these buckets (and not carte blanche access to all of our S3 buckets).

1. Open the the **[AWS Management Console](https://aws.amazon.com/console/)**. 
1. Click on the **Services** dropdown in the upper-left corner and then click on **IAM** under the Security, Identity & Compliance heading. 
1. Next, click **Users** on the navbar to the left. At the top, click **Add user** to begin creating a new user. 
1. Give the user a descriptive name (I'll call mine 'my_image_resizer')
1. Check the box next to **Programatic Access** to generate access keys.
1. Click **Next: Permissions**. 
1. The user will only need one policy, so let's attach it directly. Click **Attach existing policies directly**.
1. Click **Create policy**
1. Click **Create Your Own Policy**
1. Name it something like "resizer-buckets-access"
1. Describe it something like "Allows access to the two buckets we use to resize images using AWS lambda"
1. Update the policy document to look like the following, but use your bucket names:

    ```
    {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Action": "s3:*",
          "Resource": [
            "arn:aws:s3:::my-uploaded-images",
            "arn:aws:s3:::my-uploaded-images/*",
            "arn:aws:s3:::my-resized-images",
            "arn:aws:s3:::my-resized-images/*"
          ]
        },
        {
          "Effect": "Allow",
          "Action": "s3:ListAllMyBuckets",
          "Resource": "*",
          "Condition": {}
        }
      ]
    }
    ```

1. Click **Create**, which will close the window
1. Click **Refresh** and search for the name of your policy (resizer-buckets-access)
1. Check the box next to it. 
1. Click **Next: Review**. Look over the review to make sure everything looks correct.
1. Click **Create user**. 

On the next page you should see the Access key ID and Secret access key for the new user. Copy this information into the `$config_access_key_id` and `$config_secret_access_key` variables in `config/config.php` file.

### (Optional) Build the Lambda Function Code in Node.js

You can use the included zip file, or build the Lambda function that will resize our images for us as they get uploaded by hand.

1. `cd` into the `lambda_function` directory in this project
1. Run `npm install --prefix . aws-sdk gm async` to install the dependent modules.
1. Run `zip -r image_resizer.zip node_modules image_resizer.js`

### Upload the Lambda Function

The following steps install the Lambda function that watches the upload bucket for new images, then resizes them and places them on the resize bucket.

1. Open the the **[AWS Management Console](https://aws.amazon.com/console/)**. 
1. Click on the **Services** dropdown in the upper-left corner and then click on **Lambda** under the Compute heading. 
1. Click **Create a Lambda function**
1. Click **Blank Function**
1. Select **S3** from the itegrations dropdown
1. Select your input bucket (i.e. my-uploaded-images) from the Bucket dropdown
1. Select "Object Created (All) from the Event Type dropdown
1. Click **Next**
1. Name the function "ResizeUploadedImages"
1. Describe it as "Scale images from one bucket to the other"
1. Advanced settings: Timout increase to 1 min 0 sec so that there is plenty of time to resize larger images.
1. Select Node.js 6.10 from the Runtime dropdown
1. Select "Code entry type" from the Code entry type dropdown
1. Select the image_resizer.zip for the Function package
1. Add an environment variable for `DESTINATION_S3_BUCKET` and set the value to your destination bucket (i.e. my-resized-images)
1. For the Handler, enter `image_resizer.
1. Select "Create new role from template(s)" from the Role dropdown
1. Provide a Role name like: "myLambdaImageResizer"
1. Click **Next**
1. Review the information and click click **Create Function**

### Grant Access To Buckets to Lambda Role

The Lambda function we created above needs to be given permission to access your S3 buckets. Fortunately, we already created a policy that allows this.

1. Open IAM
1. Select Roles
1. Select the role you just created (i.e. 'myLambdaImageResizer')
1. Click Attach Policy
1. Search for the policy created earlier (resizer-buckets-access)
1. Check the checkbox and click "Attach Policy"

### Deploy

By now you should have all the configuration information you need in your `config.php` file. So just transfer your PHP Picture Resizer repository onto your PHP server, and you should be good to go!
