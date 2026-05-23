(function () {
  var video    = document.getElementById('reelVideo');
  var overlay  = document.getElementById('reelOverlay');
  var controls = document.getElementById('reelControls');
  var playBtn  = document.getElementById('reelPlayBtn');
  var pauseBtn = document.getElementById('reelPauseBtn');
  var muteBtn  = document.getElementById('reelMuteBtn');
  var fsBtn    = document.getElementById('reelFsBtn');
  var progBar  = document.getElementById('reelProgressBar');
  var progWrap = document.getElementById('reelProgressWrap');

  if (!video) return;

  function playVideo() {
    video.style.opacity = '1';
    video.play();
    overlay.style.opacity = '0';
    overlay.style.pointerEvents = 'none';
    controls.style.display = 'flex';
  }

  function resetReel() {
    video.style.opacity = '0';
    overlay.style.opacity = '1';
    overlay.style.pointerEvents = 'auto';
    controls.style.display = 'none';
    progBar.style.width = '0%';
    pauseBtn.querySelector('i').className = 'bi bi-pause-fill';
  }

  playBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    playVideo();
  });

  pauseBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    if (video.paused) {
      video.play();
      pauseBtn.querySelector('i').className = 'bi bi-pause-fill';
    } else {
      video.pause();
      pauseBtn.querySelector('i').className = 'bi bi-play-fill';
    }
  });

  muteBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    video.muted = !video.muted;
    muteBtn.querySelector('i').className = video.muted
      ? 'bi bi-volume-mute-fill'
      : 'bi bi-volume-up-fill';
  });

  fsBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.getElementById('reelWrap').requestFullscreen();
    }
  });

  video.addEventListener('timeupdate', function () {
    if (video.duration) {
      progBar.style.width = (video.currentTime / video.duration * 100) + '%';
    }
  });

  progWrap.addEventListener('click', function (e) {
    e.stopPropagation();
    var rect = progWrap.getBoundingClientRect();
    video.currentTime = ((e.clientX - rect.left) / progWrap.offsetWidth) * video.duration;
  });

  video.addEventListener('ended', resetReel);
})();