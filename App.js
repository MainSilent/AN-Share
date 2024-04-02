import RNFS from 'react-native-fs'
import React, { useState, useEffect } from 'react'
import { check, PERMISSIONS, RESULTS, openSettings } from 'react-native-permissions'
import { BridgeServer } from 'react-native-http-bridge-refurbished'
import { useNetInfo, addEventListener as netListener } from "@react-native-community/netinfo"
import { TouchableOpacity, SafeAreaView, StatusBar, StyleSheet, Text, ToastAndroid, Linking } from 'react-native'

let host
const PORT = 9630

function App() {
  const [url, setURL] = useState()
  const [server, setServer] = useState(0)
  const [ isWifi, setWifi ] = useState(false)
  const { type, isConnected, details } = useNetInfo()

  useEffect(() => {
    host = new BridgeServer('http_service', true)

    host.get('/', async (req, res) => {
      const path = req.getData.path
      const dirs = await list(path)
      let temple = ''

      await Promise.all(dirs.map(dir => {
        const isDir = dir.isDirectory()
        
        temple += `
        </br>
          <a target="_self" href="${isDir ? '?path='+dir.path : '/download?path='+dir.path}">
            ${dir.name}${isDir ? '/' : ''}
          </a>
        </br>
        `
      }))

      res.html(temple)
    })


    host.get('/download', async (req, res) => {
      const path = req.getData.path

      
    })
  }, [])

  netListener(_ => {
    if (isWifi != (isConnected && type == 'wifi'))
      setWifi(isConnected && type == 'wifi')

    if (isWifi) {
      const _url = `http://${details.ipAddress}:${PORT}`
      if (url != _url)
        setURL(_url)
    }
  })

  async function list (path) {
    if (!path)
      path = RNFS.ExternalStorageDirectoryPath

    return await RNFS.readDir(path)
  }

  const checkPerm = async () => {
    const res = await check(PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE)

    if (res != RESULTS.GRANTED)
      openSettings()

    return res == RESULTS.GRANTED
  }

  const connect = async () => {
    if (server == 1) return

    const isPerm = await checkPerm()
    if (!isPerm) return

    if (!isWifi)
      ToastAndroid.showWithGravity('Error: Wifi not connected to network', ToastAndroid.SHORT, ToastAndroid.CENTER)
    else {
      if (server == 0) {
        setServer(1)

        setTimeout(() => {
          host.listen(PORT)
          setServer(2)
        }, 1500)
      }
      else if (server == 2) {
        host.stop()
        setServer(0)
      }
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={'dark-content'} />

      <TouchableOpacity
        onPress={() => connect()}
        style={{
          ...styles.button,
          backgroundColor: server == 0 ? "green" : server == 1 ? "#bab72e" : "red"
        }}
      >
        <Text style={styles.buttonText}>
          {server == 0 ? "Connect" : server == 1 ? "Wait..." : "Disconnect"}
        </Text>
      </TouchableOpacity>

      <Text style={{...styles.ipText, marginTop: 40}}>Port: {PORT}</Text>
      <Text style={styles.ipText}>IP: {isWifi ? details.ipAddress : "XXX.XXX.XXX.XXX"}</Text>

      {isWifi && server == 2 &&
        <TouchableOpacity onPress={() => Linking.openURL(url)}>
          <Text style={{...styles.urlText}}>{url}</Text>
        </TouchableOpacity>
      }
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#12111c',
    alignItems: 'center',
    justifyContent: 'center'
  },
  button: {
    padding: 20,
    paddingHorizontal: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  buttonText: {
    color: 'white',
    fontSize: 18
  },
  ipText: {
    marginTop: 15,
    color: 'white',
    fontSize: 18
  },
  urlText: {
    fontSize: 20,
    marginTop: 30,
    color: 'lightblue',
    textDecorationLine: 'underline'
  }
})

export default App
