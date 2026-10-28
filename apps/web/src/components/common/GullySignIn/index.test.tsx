import { render, screen, waitFor } from '@testing-library/react'
import GullySignIn from './index'
import { __resetGullyIdForTests } from './gullyId'

type WithGully = Window & { GullyID?: unknown }

describe('GullySignIn', () => {
  beforeEach(() => {
    __resetGullyIdForTests()
    delete (window as WithGully).GullyID
  })

  it('renders nothing when the flag is off', () => {
    const { container } = render(<GullySignIn config={null} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders the Gully ID button when the SDK is available, and removes it on unmount', async () => {
    const unmountButton = jest.fn()
    const client = {
      handleRedirect: jest.fn(() => Promise.resolve(null)),
      renderButton: jest.fn((el: HTMLElement) => {
        el.textContent = 'Sign in with Gully'
        return unmountButton
      }),
    }
    ;(window as WithGully).GullyID = { init: () => client }
    const { unmount } = render(<GullySignIn config={{ clientId: 'gully-safe', issuer: 'https://gullyid.xyz' }} />)
    await waitFor(() => expect(screen.getByTestId('gully-sign-in')).toHaveStyle({ display: 'flex' }))
    expect(screen.getByText('Sign in with Gully')).toBeInTheDocument()
    expect(client.renderButton).toHaveBeenCalledWith(expect.any(HTMLElement), { passkey: true, theme: 'dark' })
    unmount()
    expect(unmountButton).toHaveBeenCalled()
  })
})
