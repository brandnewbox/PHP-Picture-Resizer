$(function() {
  $('#file_upload').fileupload({
    autoUpload: false,
    maxNumberOfFiles: 1,
    dataType: "xml",
    method: "POST",
    add:  function (e, data) {
      console.log('fileuploadadd');
      dropzone_reset();
      $.ajax({
        url: "services/generate_post_credentials.php",
        type: 'POST',
        dataType: 'json',
        data: {
          filename: data.files[0].name
        },
        async: false
      }).done(function(response) {
        console.log('Successfully got credentials');
        save_data_to_form(response);
        $('#progress-filename').text(""+data.files[0].name);
        data.submit();
      }).fail(function(response) {
        alert('Failed to get credentials');
      });
    },
    fail: function(e, data) {
      alert('There was an error uploading the file to S3. Please check your credentials.');
    },
    send: function(e, data) {
      console.log('fileuploadsend');
      $('#status-title').text("Uploading...");
      $('#status-row').show();
      $('#status-filename').text(data.files[0].name);
    },
    done: function(e, data) {
      start_processing();
    },
    progress: function(e,data) {
      var progress = parseInt(data.loaded / data.total * 100, 10);
      console.log('Progress: '+progress);
      progress_bar_update(progress);
    }
  });

  var save_data_to_form = function(data) {
    console.log('save_data_to_form');
    $('#file_upload').attr('action','http://'+data.bucket+'.s3.amazonaws.com');
    $('#file_upload').find('input[name=key]').val(data.key);
    $('#file_upload').find('input[name=AWSAccessKeyId]').val(data.AWSAccessKeyId);
    $('#file_upload').find('input[name=acl]').val(data.acl);
    $('#file_upload').find('input[name=success_action_status]').val(data.success_action_status);
    $('#file_upload').find('input[name=Policy]').val(data.Policy);
    $('#file_upload').find('input[name=X-Amz-Signature]').val(data.XAmzSignature);
    $('#file_upload').find('input[name=x-amz-meta-tag]').val(data.XAmzMetaTag);
    $('#file_upload').find('input[name=Content-Type]').val(data.ContentType);
    $('#file_upload').find('input[name=x-amz-meta-uuid]').val(data.XAmzMetaUuid);
    $('#file_upload').find('input[name=x-amz-server-side-encryption]').val(data.XAmzServerSideEncryption);
    $('#file_upload').find('input[name=X-Amz-Credential]').val(data.XAmzCredential);
    $('#file_upload').find('input[name=X-Amz-Algorithm]').val(data.XAmzAlgorithm);
    $('#file_upload').find('input[name=X-Amz-Date]').val(data.XAmzDate);
    console.log('saved_data_to_form');
  }

  var progress_bar_update = function(percent) {
    $('#progress-bar').css('width',percent + '%');
    $('#progress-bar span').text(Math.round(percent) + '%');
  }

  var processing_percentage = 0;

  var start_processing = function(){
    var aws_resized_image_key = 'modified-'+$('#file_upload').find('input[name=key]').val();
    $.ajax({
      url: "services/generate_get_credentials.php",
      type: 'GET',
      dataType: 'json',
      data: {filekey: aws_resized_image_key},
      async: true
    }).done(function(response) {
      show_processing_progress(response.signed_get_url);
    }).fail(function(response) {
      alert('Failed to get credentials');
    });
  }

  var show_processing_progress = function(url) {
    var progress_update = setInterval(function() {
      $('#status-title').text("Processing...");
      $('#progress-bar').removeClass('progress-bar-info');
      $('#progress-bar').addClass('progress-bar-warning');
      progress_bar_update(processing_percentage);
      processing_percentage += 100/60;
      if (is_valid_url(url)) {
        clearTimeout(progress_timeout);
        clearInterval(progress_update);
        download_ready(url);
      }
    },1000);

    var progress_timeout = setTimeout(function(){
      clearInterval(progress_update);
      $('#status-title').text("Timed out.");
    }, 60000);
  }

  var download_ready = function(url) {
    progress_bar_update(100);
    $('#status-title').text("Complete!");
    $('#progress-bar').removeClass('progress-bar-warning');
    $('#progress-bar').addClass('progress-bar-success');
    $('#download-button').show();
    $('#download-button').attr('href', url);
  }

  var is_valid_url = function(url) {
      var is_valid = false;
      $.ajax({
        url: url,
        type: "get",
        dataType: "json",
        async: false,
        complete: function(xhr, textStatus) {
          is_valid = parseInt(xhr.status) == 200;
          console.log("status:"+xhr.status);
          console.log(xhr.status);
        }
      });
      return is_valid;
  }

  // https://stackoverflow.com/questions/6848043/how-do-i-detect-a-file-is-being-dragged-rather-than-a-draggable-element-on-my-pa
  // Dragover effects for dropzone (WIP)
  var dragTimer;
  $(document).on('dragover', function(e) {
    var dt = e.originalEvent.dataTransfer;
    if (dt.types && (dt.types.indexOf ? dt.types.indexOf('Files') != -1 : dt.types.contains('Files'))) {
      $("#dropzone").addClass('overdocument');
      window.clearTimeout(dragTimer);
    }
  });


  $('#dropzone').on('dragover', function(e) {
    var dt = e.originalEvent.dataTransfer;
    if (dt.types && (dt.types.indexOf ? dt.types.indexOf('Files') != -1 : dt.types.contains('Files'))) {
      $("#dropzone").addClass('overdropzone');
      window.clearTimeout(dragTimer);
    }
  });

  $('#dropzone').on('dragleave', function(e) {
    dragTimer = window.setTimeout(function() {
      $("#dropzone").removeClass('overdropzone');
    }, 25);
  });

  $(document).on('dragleave', function(e) {
    dragTimer = window.setTimeout(function() {
      dropzone_reset();
    }, 25);
  });

  function dropzone_reset() {
    $("#dropzone").removeClass('overdocument');
  }
});
