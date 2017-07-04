# Lightweight Web-Based Picture Resizer Service

## What does it do?
This PHP Picture Reszier is a web-based picture resizer service that uses AWS to perform all of the heavy lifting. This service is unique because it allows the user to upload their files directly to a private AWS S3 bucket with all of the proper authentication, and then download those files from a separate private bucket after the resizing is complete, and it does all of this without the user uploading any files to your own personal server(s). This makes the service quite easy to scale, as your server is only really responsible for generating the authentication for each file.

## Quick Instructions:
There are three steps in setting up this service for your own personal use:
1. Make an AWS account, and set up an two S3 buckets (one for the uploaded images, one for the resized images), a lambda function to resize the images, and an IAM user with permission to access S3.
1. Setup a PHP server to run your own code off of.
1. Download this repository and place it on your server, then update the config file according to your own AWS configuration and credentials.

(This is walkthrough is heavily influenced by the official AWS tutorial found [here](http://docs.aws.amazon.com/lambda/latest/dg/with-s3-example.html), but I think you will find this guide to be faster and easier to follow.)

### Setting Up AWS
If you don't already have an AWS account, go ahead and set one up. Then follow the instructions [here](http://docs.aws.amazon.com/cli/latest/userguide/installing.html) to install the AWS Command Line Interface. Or if you're on a mac, use homebrew!

```
brew install awscli
```

#### Create the S3 Buckets

For this tool we need two buckets. One for uploading images directly to. The other bucket is for storing the resized images on.

1. Open the AWS Management Console. 
1. Click on the **Services** dropdown in the upper-left corner and then click on **S3** under the Storage heading. 
1. Click **Create bucket**. 
1. Give your bucket a descriptive name (like 'my-uploaded-images'), then click **Create**. 
1. Repeat this step again with a different name for your output bucket (like 'my-resized-images').

#### Create an IAM User to access those buckets

The PHP script requires credentials for a user that can access both buckets created above. For security purposes we are only going to give the user access to these buckets (and not carte blanche access to all of our S3 buckets)

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

On the next page you should see the Access key ID and Secret access key for the new user. Copy this information down.

##### Change the CORS Configuration on the Output Bucket
After you have created your output bucket, select it from the menu on the **S3** page in the AWS Management Console. Go to the **Permissions** tab. Click on **CORS configuration**. Change the line that looks like 
```
    <AllowedHeader>Authorization</AllowedHeader>
```
to instead say
```
    <AllowedHeader>*</AllowedHeader>
```

##### Build the Lambda Function Code in Node.js

Let's build the Lambda function that will resize our images for us as they get uploaded.

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
1. Select Node.js 6.10 from the Runtime dropdown
1. Copy and paste the code from `lambda_function/image_resizer.js`
1. Add an environment variable for `DESTINATION_S3_BUCKET` and set the value to your destination bucket (i.e. my-resized-images)
1. Select "Create new role from template(s)" from the Role dropdown
1. Provide a Role name like: "myLambdaImageResizer"
1. Click **Next**
1. Review the information and click click **Create Function**

### Setting Up a PHP Server
Lots of variety here. Probably look around for your PHP server implementation of choice and follow their instructions. For the purpose of this guide, the important things is just that you do this. For setting up a localhost server, I found [this guide](https://lukearmstrong.github.io/2016/12/setup-apache-mysql-php-homebrew-macos-sierra/) to be very helpful (I used the php70 instructions).

### Installing and Configuring the PHP Picture Resizer
You're almost done!

Open up the **config.php** file within the config folder and change all of the information within to match all of your own AWS information.

Now just transfer your PHP Picture Resizer repository onto your PHP server, and you should be good to go! Try it out!
