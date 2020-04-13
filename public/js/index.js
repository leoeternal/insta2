var add_bio_button=document.getElementById("showform");
var biovalue=document.getElementById("biovalue");
var chatTextArea=document.getElementById("chat-text-area");
var bio
var counter=0;

$("#uploadForm").hide();
$("#textarea").hide();
$("#submitbutton").hide();
$("#wrapper-edit-post").hide();
    
$(document).ready(function() {
     $('#uploadForm').submit(function() {
        $("#status").empty().text("File is uploading...");
        $(this).ajaxSubmit({
            error: function(xhr) {
          status('Error: ' + xhr.status);
            },
            success: function(response) {
        console.log(response)
            $("#status").empty().text(response);
            }
    });
    return false;
    });    
});

function showform(){
    $("#showform").hide();
    $("#textarea").show();
}

function showsubmitbutton(){
    $("#submitbutton").show();
}

function showimageform(){
    if(counter==0){
       $("#uploadForm").show();
       counter++;
    }else if(counter==1){
        $("#uploadForm").hide();
        counter--;
    }
}

function hidehomediv(){
    $("#wrapper-home").hide();
    $("#wrapper-edit-post").show();
    
}


chatTextArea.scrollTop = chatTextArea.scrollHeight - chatTextArea.clientHeight;
