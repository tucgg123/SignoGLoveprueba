document.addEventListener("DOMContentLoaded", function() {
  const uuidBluetooth = 'battery_service' // 'alert_notification'
  const signCharacteristic = 'battery_level_state' // 'alert_level'
  const connectButton = document.getElementById('connect')
  const warningMessage = document.getElementById('warning-message')
  const textSign = document.getElementById('text-sign')
  const errorMessage = document.getElementById('error-message')
  const errorMessageText = document.getElementById('error-message-text')

  let device, signChar

  async function requestDevice() {
    device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [uuidBluetooth],
    })

    device.addEventListener('gattserverdisconnected', connectDevice)
  }

  async function parseSignGlove(value) {
    const is16Bits = value.getUnit8(0) & 0x1
    if (is16Bits) return value.getUnit16(1, true)
    return value.getUnit8(1)
  }

  async function connectDevice() {
    if (device.gatt.connected) return

    const server = await device.gatt.connect()
    const service = await server.getPrimaryService(uuidBluetooth)
    signChar = await service.getCharacteristic(signCharacteristic)
    signChar.addEventListener('characteristicvaluechanged', (event) => {
      textSign.textContent = parseSignGlove(event.target.value)
    })
  }

  async function startMonitoring() {
    await signChar.startNotifications()
  }

  connectButton.addEventListener('click', async () => {
    if (!navigator.bluetooth) {
      warningMessage.classList.remove('d-none')
      connectButton.classList.add('d-none')
      return
    }
    if (!device) {
      try {
        if (!errorMessage.classList.contains('d-none')) errorMessage.classList.add('d-none')

        await requestDevice()

        connectButton.innerHTML = `
          <span class="spinner-grow spinner-grow-sm" aria-hidden="true"></span>
          <span role="status">Conectando...</span>
        `
        connectButton.disabled = true

        await connectDevice()

        if (device) {
          connectButton.classList.add('d-none')
          textSign.classList.remove('d-none')
          await startMonitoring()
        } else {
          connectButton.textContent = 'Conectar guante'
          connectButton.disabled = false
        }
      } catch (error) {
        console.log(error.message)
        connectButton.textContent = 'Conectar guante'
        connectButton.disabled = false
        errorMessageText.textContent = error.message
        errorMessage.classList.remove('d-none')
        device = undefined
      }
    }
  })
})
