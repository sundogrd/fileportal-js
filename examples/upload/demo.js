window.addEventListener('DOMContentLoaded', function () {


    const onProgress = (evt) => {
        document.getElementById('progress').innerHTML = `${evt.totalPercent}%`;
    };

    document.querySelector('input').addEventListener('change', (event) => {
        const files = event.target.files;
        const file = files.item(0);
        const token = {};

        var reader = new FileReader();
        reader.readAsArrayBuffer(file);
        reader.onload = function () {
            var uploadFormData = new FormData();
            var blob = new Blob([reader.result]);
            uploadFormData.append("ext","png");
            uploadFormData.append("buffer", blob);
            debugger
      
            $.ajax({
                type: "POST",
                url: "http://files.lwio.me/multipart/upload",
                data: uploadFormData,
                processData: false,
                contentType: false,
                success(r) {
                    debugger
                    alert("Success!");
                }
            });
        }
    });
});
