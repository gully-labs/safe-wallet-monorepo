import { render, screen, waitFor } from '@testing-library/react'
import GullySignIn from './index'
import { __resetGullyIdForTests } from './gullyId'
import { useDarkMode } from '@/hooks/useDarkMode'

jest.mock('@/hooks/useDarkMode')

type WithGully = Window & { GullyID?: unknown }

const mockSdk = () => {
  const unmountButton = jest.fn()
  const client = {
    handleRedirect: jest.fn(() => Promise.resolve(null)),
    renderButton: jest.fn((el: HTMLElement) => {
      const b = document.createElement('button')
      b.textContent = 'Sign in with Gully ID'
      el.appendChild(b)
      return unmountButton
    }),
  }
  const init = jest.fn(() => client)
  ;(window as WithGully).GullyID = { init }
  return { client, init, unmountButton }
}

describe('GullySignIn', () => {
  beforeEach(() => {
    __resetGullyIdForTests()
    delete (window as WithGully).GullyID
    ;(useDarkMode as jest.Mock).mockReturnValue(true)
  })

  it('renders nothing when the flag is off, and says so on <html>', () => {
    const { container } = render(<GullySignIn config={null} />)
    expect(container).toBeEmptyDOMElement()
    expect(document.documentElement.dataset.gullyId).toBe('off')
  })

  it('renders the official Gully ID button by default (flag on, client gully-safe)', async () => {
    const { init, client, unmountButton } = mockSdk()
    const { unmount } = render(<GullySignIn />)
    await waitFor(() => expect(screen.getByTestId('gully-sign-in')).toHaveStyle({ display: 'flex' }))
    expect(screen.getByRole('button', { name: 'Sign in with Gully ID' })).toBeInTheDocument()
    expect(init).toHaveBeenCalledWith({ clientId: 'gully-safe', issuer: 'https://gullyid.xyz' })
    expect(client.renderButton).toHaveBeenCalledWith(expect.any(HTMLElement), {
      passkey: false,
      theme: 'dark',
      size: 's',
    })
    expect(document.documentElement.dataset.gullyId).toBe('on')
    unmount()
    expect(unmountButton).toHaveBeenCalled()
  })

  it('uses the light button on the light theme', async () => {
    ;(useDarkMode as jest.Mock).mockReturnValue(false)
    const { client } = mockSdk()
    render(<GullySignIn />)
    await waitFor(() =>
      expect(client.renderButton).toHaveBeenCalledWith(expect.any(HTMLElement), {
        passkey: false,
        theme: 'light',
        size: 's',
      }),
    )
  })
})
