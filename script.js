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
  setTimeout(() => toast.classList.remove('show'), 2500);
}

async function turnTorchOn() {
  if (flashlightOn) return;

  flashlightOn = true;
  beam.classList.add('on');
  statusEl.textContent = 'FLASHLIGHT ON';

  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' } }
    });

    videoTrack = cameraStream.getVideoTracks()[0];
    const capabilities = videoTrack.getCapabilities?.();

    if (capabilities?.torch) {
      await videoTrack.applyConstraints({ advanced: [{ torch: true }] });
      showMessage('Phone torch is ON');
    } else {
      showMessage('Torch API unavailable — visual light active');
    }
  } catch (error) {
    showMessage('Camera unavailable — visual light active');
  }
}

async function turnTorchOff() {
  try {
    if (videoTrack) {
      const capabilities = videoTrack.getCapabilities?.();
      if (capabilities?.torch) {
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
