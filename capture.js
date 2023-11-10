;(function () {
  // The width and height of the captured photo. We will set the
  // width to the value defined here, but the height will be
  // calculated based on the aspect ratio of the input stream.

  var width = 1280 // We will scale the photo width to this
  var height = 0 // This will be computed based on the input stream

  // |streaming| indicates whether or not we're currently streaming
  // video from the camera. Obviously, we start at false.

  var streaming = false

  // The various HTML elements we need to configure or control. These
  // will be set by the startup() function.

  var video = null
  var canvas = null
  var photo = null
  var startbutton = null
  var retryButton = null

  let captureInterval
  let captureCount = 0

  let dataImage = []

  var overlayColors = [
    '#FF0000',
    '#00FF00',
    '#FF0000',
    '#FF66FF',
    '#66FFFF',
    '#009900',
    '#0000FF',
  ]

  var overlayColorsRGB = [
    'rgb(255, 0, 0)',
    'rgb(0, 255, 0)',
    'rgb(255, 0, 0)',
    'rgb(255, 102, 255)',
    'rgb(102, 255, 255)',
    'rgb(0, 153, 0)',
    'rgb(0, 0, 255)',
  ]

  function startup() {
    video = document.getElementById('video')
    canvas = document.getElementById('canvas')
    photo = document.getElementById('photo')
    startbutton = document.getElementById('startbutton')
    retryButton = document.getElementById('retrybutton')

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: false })
      .then(function (stream) {
        video.srcObject = stream
        video.play()
      })
      .catch(function (err) {
        console.log('An error occurred: ' + err)
      })

    video.addEventListener(
      'canplay',
      function (ev) {
        if (!streaming) {
          height = video.videoHeight / (video.videoWidth / width)

          // Firefox currently has a bug where the height can't be read from
          // the video, so we will make assumptions if this happens.

          if (isNaN(height)) {
            height = width / (4 / 3)
          }

          video.setAttribute('width', width)
          video.setAttribute('height', height)
          canvas.setAttribute('width', width)
          canvas.setAttribute('height', height)
          streaming = true
        }
      },
      false
    )

    startbutton.addEventListener(
      'click',
      function (ev) {
        document.getElementById('step1').style.display = 'none'
        document.getElementById('step2').style.display = 'block'
        startCapture()
        ev.preventDefault()
      },
      false
    )

    // Add an event listener to the "Retry" button
    retryButton.addEventListener('click', function () {
      document.getElementById('step3').style.display = 'none'
      const container = document.getElementById('container')
      container.innerHTML = ''
      document.getElementById('step1').style.display = 'none'
      document.getElementById('step2').style.display = 'block'
      startCapture()
    })

    clearphoto()
  }

  // Fill the photo with an indication that none has been
  // captured.

  function clearphoto() {
    var context = canvas.getContext('2d')
    context.fillRect(0, 0, canvas.width, canvas.height)

    var data = canvas.toDataURL('image/png')
    photo.setAttribute('src', data)
  }
  // Capture a photo by fetching the current contents of the video
  // and drawing it into a canvas, then converting that to a PNG
  // format data URL. By drawing it on an offscreen canvas and then
  // drawing that to the screen, we can change its size and/or apply
  // other changes before drawing it.

  function takepicture() {
    var context = canvas.getContext('2d')
    if (width && height) {
      if (captureCount < 9) {
        canvas.width = width
        canvas.height = height
        context.drawImage(video, 0, 0, width, height)

        // Create a transparent overlay div with different colors
        var overlayIndex = captureCount % overlayColors.length
        var overlayDiv = document.createElement('div')
        overlayDiv.style.width = '100%'
        overlayDiv.style.height = '100%'
        overlayDiv.style.position = 'absolute'
        overlayDiv.style.backgroundColor = overlayColors[overlayIndex]
        overlayDiv.style.opacity = '0.8'
        overlayDiv.style.top = '0'

        // Append the overlay div to the "output" element
        var outputDiv = document.querySelector('.output')
        outputDiv.appendChild(overlayDiv)

         // Remove the overlay element after displaying the image
      setTimeout(function () {
        outputDiv.removeChild(overlayDiv)
      }, 500) // Adjust the delay as needed (e.g., 2000 milliseconds for 2 seconds)
      }

      var data = canvas.toDataURL('image/png')
      dataImage.push(data)
      photo.setAttribute('src', data)


    } else {
      clearphoto()
    }
  }

  function startCapture() {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    if (captureInterval) {
      clearInterval(captureInterval)
    }
    captureCount = 0
    dataImage = []
    captureInterval = setInterval(function () {
      takepicture()
      captureCount++
      if (isMobile) {
        if (captureCount >= 9) {
          stopCapture()
        }
      } else {
        if (captureCount >= 8) {
          stopCapture()
        }
      }
    }, 500)
  }

  function stopCapture() {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    if (captureInterval) {
      clearInterval(captureInterval)
    }
    // Remove the last displayed image from the container

    // Hide the "Stop Capture" button
    document.getElementById('stopbutton').style.display = 'none'
    document.getElementById('step2').style.display = 'none'
    document.getElementById('step3').style.display = 'block'

    let length

    if (isMobile) {
      length = dataImage.length - 1
    } else {
      length = dataImage.length
    }

    for (let index = 0; index < dataImage.length; index++) {
      displayImage(index)
    }

    var container = document.getElementById('container')
    var lastOutputDiv = container.lastChild
    container.removeChild(lastOutputDiv)
  }

  function displayImage(data) {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    const container = document.getElementById('container')
    const outputDiv = document.createElement('div')
    outputDiv.className = 'output'

    const overlayColorDisplay = document.createElement('div')
    overlayColorDisplay.style.width = '160px'
    overlayColorDisplay.style.height = '20px'
    overlayColorDisplay.style.backgroundColor =
      overlayColors[data % overlayColors.length]
    overlayColorDisplay.style.marginBottom = '4px'
    overlayColorDisplay.innerHTML =
      overlayColorsRGB[data % overlayColors.length]

    const img = document.createElement('img')

    if (isMobile) {
      img.src = dataImage[data + 2]
    } else {
      img.src = dataImage[data + 1]
    }

    img.id = 'photo'
    img.alt = 'Captured Image'

    const downloadButton = document.createElement('a')
    if (isMobile) {
      downloadButton.href = dataImage[data + 2]
    } else {
      downloadButton.href = dataImage[data + 1]
    }

    downloadButton.download = 'captured_image.png'
    downloadButton.textContent = 'Download'
    downloadButton.style.color = '#fff'

    outputDiv.appendChild(overlayColorDisplay)
    outputDiv.appendChild(img)
    outputDiv.appendChild(downloadButton)
    container.appendChild(outputDiv)
  }

  // Set up our event listener to run the startup process
  // once loading is complete.
  window.addEventListener('load', startup, false)
})()
