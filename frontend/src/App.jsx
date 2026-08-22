import { useState, useEffect } from 'react'
import Home from './pages/Home'
import QrGenerator from './pages/QrGenerator'
import AutoCaptions from './pages/AutoCaptions'
import Feedback from './pages/Feedback'

export default function App() {
  const [screen, setScreen] = useState('home')

  // Support phone hardware back button
  useEffect(() => {
    const handlePopState = (event) => {
      if (event.state?.screen) {
        setScreen(event.state.screen)
      } else {
        setScreen('home')
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const navigateTo = (newScreen) => {
    setScreen(newScreen)
    window.history.pushState(
      { screen: newScreen },
      '',
      `/${newScreen === 'home' ? '' : newScreen}`
    )
  }

  const goBackHome = () => {
    window.history.back()
  }

  if (screen === 'qr') return <QrGenerator onBack={goBackHome} />
  if (screen === 'captions') return <AutoCaptions onBack={goBackHome} />
  if (screen === 'feedback') return <Feedback onBack={goBackHome} />

  return <Home onOpenModule={(key) => navigateTo(key)} />
}