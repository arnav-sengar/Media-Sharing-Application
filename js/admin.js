function checkpassword(){
    const input = document.getElementById("passcode").value;
    const error = document.getElementById("lockerror");

    if(input == "photo123"){
        document.getElementById("lockscreen").style.display="none";
        document.getElementById("adminpanel").style.display="block";
    }else{
        error.style.display="block";
    }
}

function logout(){
    document.getElementById("adminpanel").style.display = "none";
    document.getElementById("lockscreen").style.display = "flex";
    document.getElementById("passcode").value = '';
    document.getElementById("lockerror").style.display = "none";
}

const fileInput = document.getElementById("fileinput");
const dropzone = document.getElementById("dropzone");
const photoGrid = document.getElementById("photogrid");
const emptymessage = document.getElementById("emptymsg");


fileInput.addEventListener("change",function(){
    handleFiles(this.files);
});

dropzone.addEventListener("dragover",function(e){
    e.preventDefault();
    dropzone.style.borderColor = "#3c3489";
});

dropzone.addEventListener("dragleave", function(){
    dropzone.style.borderColor = "#ccc";
})

dropzone.addEventListener("drop",function(e){
    e.preventDefault();
    dropzone.style.borderColor = "#ccc";
    handleFiles(e.dataTransfer.files);
})

// function to handle the uploaded files

function handleFiles(files){
    Array.from(files).forEach(function(file){
        if(!file.type.startsWith("image/")) return;

        const reader = new FileReader();
        reader.onload = function(e){
            addPhototoGrid(e.target.result,file.name);
        };
        reader.readAsDataURL(file);
    });
}

// jo bhi pictures upload ki h...unko properly grid mein show karna

function addPhototoGrid(src,name){
    if(emptymessage) emptymessage.remove();

    const div = document.createElement("div");
    div.className = "photo-item";
    div.innerHTML = `<img src = "${src}" alt = "${name}">`;
    photoGrid.appendChild(div);
}

// generating a copy link

function copylink() {
  const link = document.getElementById("sharelink").value;
  navigator.clipboard.writeText(link);
  
  const toast = document.getElementById("copy-toast");
  toast.style.opacity = "1";
  
  setTimeout(function() {
    toast.style.opacity = "0";
  }, 2000);
}

function togglePassword() {
  const input = document.getElementById("passcode");
  if (input.type === "password") {
    input.type = "text";
  } else {
    input.type = "password";
  }
}