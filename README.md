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

1. Open the AWS Management Console. 
1. Click on the **Services** dropdown in the upper-left corner and then click on **S3** under the Storage heading. 
1. Click **Create bucket**. 
1. Give your bucket a descriptive name (like 'my-uploaded-images'), then click **Create**. 
1. Repeat this step again with a different name for your output bucket (like 'my-resized-images').

#### Create an IAM User to access those buckets

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




Do this by entering your .aws directory (probably at: ~/.aws) and modify your config file with a text editor to add the following (using your own user's name and region):
```
[bucket_admin]
output = text
region = YOUR_REGION_CODE(ex: us-east-1)
```
Now you need to modify your credentials file. Open it up with a text editor and add the following to the end using the Access key ID and Secret access key you were just provided:
```
[bucket_admin]
aws_access_key_id = YOUR_ACCESS_KEY_ID_HERE
aws_secret_access_key = YOUR_SECRET_ACCESS_KEY_HERE
```

You can delete and regenerate these keys later if you need to, but it would probably be better to just put them somewhere safe.

##### Change the CORS Configuration on the Output Bucket
After you have created your output bucket, select it from the menu on the **S3** page in the AWS Management Console. Go to the **Permissions** tab. Click on **CORS configuration**. Change the line that looks like 
```
    <AllowedHeader>Authorization</AllowedHeader>
```
to instead say
```
    <AllowedHeader>*</AllowedHeader>
```

#### Creating the Lambda Function
To create the lambda function, we will start with writing the code the function will execute. AWS Lambda supports several languages for it's functions, but I have found Node.js to be the most painless.

##### Building the Function Code in Node.js
Start by installing [Node.js]() to your machine. After you have finished installing Node.js, you will need to install the following three dependencies:
* AWS SDK for JavaScript in Node.js (AWS already has this installed on their end, you won't need it when you upload to Lambda later)
* gm, GraphicsMagick for node.js
* Async utility module

Enter terminal on your machine, navigate to the lambda_function folder from within your copy of PHP Picture Resizer that you downloaded earlier, then type the following command to install your dependencies to the node_modules directory:
```
npm install aws-sdk gm async
```
Now open the **image_resizer.js** file within the **lambda_function** folder in the PHP Picture Resizer repository. Find the **dstBucket** variable initialization and change **"OUTPUT_BUCKET"** to whatever you named your output bucket. Finally, zip up the **image_resizer.js** file and the **node_modules** folder into a single .zip file (ex. image_resizer.zip) using the following command:
```
zip -r image_resizer.zip /path/to/node_modules /path/to/image_resizer.js
```

##### Creating the Lambda Execution Role in IAM
Return to the AWS Management Console. Click on the **Services** dropdown in the upper-left corner and then click on **IAM** under the Security, Identity & Compliacnce heading. Now click on **Roles** on the navbar to the left. Click **Create new role**. Find **AWS Lambda** from the list under AWS Service Role, and click the **Select** button next to it. Find the policy **AWSLambdaExecute**, check the box next to it, then click **Next Step**. Give the role a detailed name (such as 'lambda_execution_role'), then click **Create role**.

##### Creating the Lambda Function on AWS
Open up your terminal and enter in the following command:
```
aws lambda create-function \
--region YOUR_REGION_CODE(ex: us-east-1) \
--function-name YOUR_LAMBDA_FUNCTION_NAME(ex: lambda_image_resizer) \
--zip-file fileb://path/to/your/zipfile.zip(ex: fileb://~/Documents/PHP-Picture-Resizer/lambda_function/image_resizer.zip) \
--role EXECUTION_ROLE_ARN(on the role's iam page, ex: arn:aws:iam::123412341234:role/lambda_execution_role) \
--handler NAME_OF_YOUR_JS_FILE.FUNCTION_TO_CALL_FROM_JS_FILE(ex: image_resizer.handler) \
--runtime nodejs6.10 \
--profile IAM_PROFILE_NAME(ex. bucket_admin)  \
--timeout 10 \
--memory-size 1024
```

#### Add the Event Source
All that's left now is to give the lambda function the proper permission to execute on an S3 event, and to tell our input bucket to notify the lambda function whenever an object is placed in it.

##### Add Execution Permission to Lambda Function
Run the following command, substituting in your own information into all the angle-bracket spaces:
```
aws lambda add-permission \
--function-name YOUR_LAMBDA_FUNCTION_NAME(ex: lambda_image_resizer) \
--region YOUR_REGION_CODE(ex: us-east-1) \
--statement-id SOME_RANDOM_UNIQUE_ID(ex. my_image_resizer_123456789) \
--action "lambda:InvokeFunction" \
--principal s3.amazonaws.com \
--source-arn arn:aws:s3:::YOUR_INPUT_BUCKET_NAME \
--source-account BUCKET_OWNER_ACCOUNT_ID(found in top right corner in AWS Management Console, ex: 123412341234) \
--profile IAM_PROFILE_NAME(ex. bucket_admin)
```

##### Add Lambda Notification to S3 Bucket
Return to the AWS Management Console. Click on the **Services** dropdown in the upper-left corner and then click on **S3** under the Storage heading. Click on your input bucket. Click the **Properties** tab. Click the **Events** box underneath Advanced Settings. Click **Add notification**. Give the event a name (such as lambda_notifier). Check the box next to **ObjectCreate (All)**. Select **Lambda Function** from the **Send to** dropdown. Select your lambda funtion from the **Lambda** dropdown. Click **Save**.

### Setting Up a PHP Server
Lots of variety here. Probably look around for your PHP server implementation of choice and follow their instructions. For the purpose of this guide, the important things is just that you do this. For setting up a localhost server, I found [this guide](https://lukearmstrong.github.io/2016/12/setup-apache-mysql-php-homebrew-macos-sierra/) to be very helpful (I used the php70 instructions).

### Installing and Configuring the PHP Picture Resizer
You're almost done!

Open up the **config.php** file within the config folder and change all of the information within to match all of your own AWS information.

Now just transfer your PHP Picture Resizer repository onto your PHP server, and you should be good to go! Try it out!
