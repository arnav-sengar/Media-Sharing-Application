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