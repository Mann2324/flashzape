const RAZORPAY_KEY = 'rzp_test_TGpciUKLdCEMnr';

const beam = document.querySelector('#beam');
const modal = document.querySelector('#modal');
const statusEl = document.querySelector('#status');
const toast = document.querySelector('#toast');
const onButton = document.querySelector('#on');
const offButton = document.querySelector('#off');
const payButton = document.querySelector('#pay');

let flashlightOn = false;
let cameraStream = null;
let videoTrack = null;

function showMessage(text) {
  toast.textContent = text;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

async function turnTorchOn() {
  if (flashlightOn) return;

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    showMessage('Camera access requires HTTPS and a supported mobile browser');
    return;
  }

  onButton.disabled = true;
  statusEl.textContent = 'TURNING ON...';

  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { exact: 'environment' } },
      audio: false
    }).catch(() => navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
      audio: false
    }));

    videoTrack = cameraStream.getVideoTracks()[0];
    if (!videoTrack) throw new Error('No camera track available');

    const capabilities = typeof videoTrack.getCapabilities === 'function'
      ? videoTrack.getCapabilities()
      : {};

    if (!capabilities.torch) {
      cameraStream.getTracks().forEach(track => track.stop());
      cameraStream = null;
      videoTrack = null;
      statusEl.textContent = 'TORCH NOT SUPPORTED';
      showMessage('This browser/device does not allow website torch control. Try Chrome on Android.');
      return;
    }

    await videoTrack.applyConstraints({ advanced: [{ torch: true }] });

    flashlightOn = true;
    beam.classList.add('on');
    statusEl.textContent = 'FLASHLIGHT ON';
    showMessage('Phone torch is ON');
  } catch (error) {
    console.error('Torch error:', error);
    flashlightOn = false;
    beam.classList.remove('on');
    statusEl.textContent = 'FLASHLIGHT READY';

    if (error?.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError') {
      showMessage('Allow camera permission, then tap TURN ON again');
    } else if (error?.name === 'NotFoundError' || error?.name === 'OverconstrainedError') {
      showMessage('Rear camera could not be accessed');
    } else {
      showMessage('Could not turn on phone torch. Try Chrome on Android over HTTPS.');
    }
  } finally {
    onButton.disabled = false;
  }
}

async function turnTorchOff() {
  try {
    if (videoTrack) {
      const capabilities = typeof videoTrack.getCapabilities === 'function'
        ? videoTrack.getCapabilities()
        : {};
      if (capabilities.torch) {
        await videoTrack.applyConstraints({ advanced: [{ torch: false }] });
      }
    }
    cameraStream?.getTracks().forEach(track => track.stop());
  } catch (error) {
    console.error(error);
  }

  videoTrack = null;
  cameraStream = null;
  flashlightOn = false;
  beam.classList.remove('on');
  modal.classList.remove('show');
  statusEl.textContent = 'FLASHLIGHT READY';
}

function showOffChallenge() {
  if (!flashlightOn) {
    showMessage('Turn the flashlight on first');
    return;
  }
  modal.classList.add('show');
}

function openRazorpayCheckout() {
  if (!flashlightOn) {
    modal.classList.remove('show');
    showMessage('Flashlight is already off');
    return;
  }

  if (typeof Razorpay === 'undefined') {
    showMessage('Razorpay could not load');
    return;
  }

  const checkout = new Razorpay({
    key: RAZORPAY_KEY,
    amount: 1000,
    currency: 'INR',
    name: 'FlashZape',
    description: 'Turn off flashlight unlock',
    handler: function () {
      showMessage('Payment completed — flashlight unlocked');
      turnTorchOff();
    },
    theme: { color: '#ffd400' },
    modal: {
      ondismiss: function () {
        showMessage('Payment cancelled — flashlight stays on');
      }
    }
  });

  checkout.open();
}

onButton.addEventListener('click', turnTorchOn);
offButton.addEventListener('click', showOffChallenge);
payButton.addEventListener('click', openRazorpayCheckout);
