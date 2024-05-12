let videoTrack = null;
let stream = null;
let selectedBitRate = 10;
let mediaRecorder = null;
let mimeType = 'video/webm;codecs=h264';
let startTime = 0;
let recordingInterval;
const initAsync = async () => {

    const codecs = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm;codecs=h264', 'video/mp4; codecs="avc1.42E01E'];

    codecs.forEach(codec => {
        if (MediaRecorder.isTypeSupported(codec)) {
            console.log(codec + ' es soportado');
        } else {
            console.log(codec + ' no es soportado');
        }
    });


    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter(dispositivo => dispositivo.kind === 'videoinput');
    if (cameras.length === 0) {
        return;
    }
    let selectedCamera = cameras[0].deviceId;
    let selectedResolution = 0;
    let selectedFrameRate = 30;

    showVideo(selectedCamera, resolutions[selectedResolution],selectedFrameRate);

    const listCameras = document.getElementById('listCameras');
    for (camera of cameras) {
        const addOpt = document.createElement('option');
        addOpt.value = camera.deviceId;
        addOpt.textContent = camera.label || 'Track sin etiqueta';
        listCameras.appendChild(addOpt);
    }

    listCameras.addEventListener('change', (event) => {
        const { target } = event;
        const { value } = target;
        selectedCamera = value;
        const resolution = resolutions[selectedResolution];
        const frameRate = frameRates[selectedFrameRate];
        showVideo(selectedCamera, resolution, frameRate);
    });

    //resolutions
    const listResolutions = document.getElementById('listResolutions');
    listResolutions.addEventListener('change', (event) => {
        const { target } = event;
        const { value } = target;
        selectedResolution = value;
        const resolution = resolutions[selectedResolution];
        const frameRate = frameRates[selectedFrameRate];
        showVideo(selectedCamera, resolution, frameRate);
    });

    //frameRate
    const listFps = document.getElementById('listFps');
    listFps.addEventListener('change', (event) => {
        const { target } = event;
        const { value } = target;
        selectedFrameRate = value;
        const resolution = resolutions[selectedResolution];
        const frameRate = frameRates[selectedFrameRate];
        showVideo(selectedCamera, resolution, frameRate);
    });

    //frameRate
    const listBitRate = document.getElementById('listBitRate');
    listBitRate.addEventListener('change', (event) => {
        const { target } = event;
        const { value } = target;
        selectedBitRate = value;
    });

    const btnCapture = document.getElementById('btnCapture');
    btnCapture.addEventListener('click', async () => {
        const bitRate = 1000000 * selectedBitRate;
        mediaRecorder = new MediaRecorder(stream, { mimeType: mimeType, videoBitsPerSecond: bitRate });
        mediaRecorder.ondataavailable = function (event) {
            const { data } = event;

            if (data && data.size > 0) {
                const url = URL.createObjectURL(data);
                const downloadLink = document.getElementById('downloadLink');
                downloadLink.href = url;
                downloadLink.download = 'recorded_video.webm';
                downloadLink.style.display = 'block';
            }
        };
        mediaRecorder.onstart = function () {
            startTime = Date.now();
            recordingInterval = setInterval(updateRecordingTime, 1000);
        };
        mediaRecorder.onstop = function () {
            btnCapture.disabled = false;
            clearInterval(recordingInterval);
        };
        btnCapture.disabled = true;
        mediaRecorder.start();
    });

    const btnStop = document.getElementById('btnStop');
    btnStop.addEventListener('click', async () => {
        mediaRecorder.stop();
    });
};

const updateRecordingTime = () => {
    const currentTime = Date.now();
    const elapsedTime = currentTime - startTime;
    const seconds = Math.floor(elapsedTime / 1000);
    const minutes = Math.floor(seconds / 60);
    const formattedTime = `${minutes}:${seconds}`;
    document.getElementById('recordingTime').textContent = formattedTime;
};

const resolutions = [
    { width: 1920, height: 1080 }, // Full HD
    { width: 2048, height: 1080 }, // 2K (Digital Cinema Initiatives standard)
    { width: 3840, height: 2160 }  // 4K (Ultra HD)
];

const frameRates = [30, 60];

const showVideo = async (deviceId, resolutions, frameRate) => {

    if (videoTrack !== null) {
        videoTrack.stop();
    }

    const { width, height } = resolutions || { width: 1920, height: 1080 };

    const constraints = {
        video: {
            deviceId: deviceId,
            width,
            height,
            frameRate: { ideal: frameRate, max: frameRate }
        }
    };

    stream = await navigator.mediaDevices.getUserMedia(constraints);

    const videoTracks = stream.getVideoTracks();

    videoTrack = videoTracks[0];

    const videoSettings = videoTrack.getSettings();
    console.log(videoSettings);

    const videoElement = document.getElementById('video');
    videoElement.srcObject = stream;
};

initAsync();