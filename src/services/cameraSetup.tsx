export async function setupCamera(videoElement: HTMLVideoElement): Promise<MediaStream> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Browser API navigator.mediaDevices.getUserMedia not available');
    }

    const videoConfig = {
        'audio': false,
        'video': {
            facingMode: 'user',
            // The device will choose the most appropriate resolution and settings
        }
    };

    const stream = await navigator.mediaDevices.getUserMedia(videoConfig);
    videoElement.srcObject = stream;

    await new Promise((resolve) => {
        videoElement.onloadedmetadata = () => {
            resolve(videoElement);
        };
    });

    videoElement.play();
    return stream;
}