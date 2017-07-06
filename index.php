<html>
<head>
  <title>Resizer</title>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.3.7/css/bootstrap.min.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/blueimp-file-upload/9.18.0/css/jquery.fileupload.css">
  <link rel="stylesheet" href="assets/styles.css">
</head>

<body class="col-xs-10 col-xs-offset-1">

  <h1>Magic Photo Resizer</h1>
  <h3>Resize any photo to 620px wide!</h3>

  <form action="" method="post" enctype="multipart/form-data" id="file_upload" class="col-xs-4 col-xs-offset-4">
    <br>
    <span id="dropzone" class="btn fileinput-button drop-zone">
      <p style="position:relative;top:10%;font-size:100%;">Drag a file here!</p>
      <p style="position:relative;top:15%;font-size:75%;">or click this box to choose one</p>
      <input id="fileupload" type="file" name="file" multiple class="drop-zone">
    </span>
    <br><br>

    <input type="hidden" name="key" value="" />
    <input type="hidden" name="acl" value="" />
    <input type="hidden" name="Content-Type" value="" />
    <input type="hidden" name="x-amz-meta-uuid" value="" />
    <input type="hidden" name="x-amz-server-side-encryption" value="" />
    <input type="hidden" name="X-Amz-Credential" value="" />
    <input type="hidden" name="X-Amz-Algorithm" value="" />
    <input type="hidden" name="X-Amz-Date" value="" />
    <input type="hidden" name="x-amz-meta-tag" value="" />
    <input type="hidden" name="Policy" value='' />
    <input type="hidden" name="X-Amz-Signature" value="" />
  </form>

  <div class="container col-xs-12">
    <!-- The global progress bar -->
    <div id="progress" style="display:none;">
      <p id="progress-title" class="progress-title col-xs-2"></p>
      <div id="progress-bar" class="progress progress-bar-thing col-xs-8 col-offset-xs-2">
        <div class="progress-bar progress-bar-striped active" role="progressbar" aria-valuenow="40" aria-valuemin="0" aria-valuemax="100"></div>
      </div>
      <a id="download-bar" class="download-bar btn btn-success col-xs-8 col-offset-xs-2" style="display:none;" href="" download="" target="_blank">Download</a>
      <p id="progress-filename" class="progress-filename col-xs-2 col-offset-xs-10"></p>
    </div>
  </div>


  <script src="assets/jquery.min.js"></script>
  <script src="assets/jquery.ui.widget.js"></script>
  <script src="assets/jquery.iframe-transport.js"></script>
  <script src="assets/jquery.fileupload.js"></script>
  <script src="assets/javascript.js"></script>
</body>
</html>
