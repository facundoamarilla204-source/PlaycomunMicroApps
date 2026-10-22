import { describe, it, expect, vi, beforeEach } from 'vitest'
import { login, logout } from '../actions'

const mockSignInWithPassword = vi.fn()
const mockSignOut = vi.fn()
const mockRedirect = vi.fn()
const mockHeadersGet = vi.fn()

vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    mockRedirect(url)
    throw new Error(`NEXT_REDIRECT: ${url}`)
  },
}))

vi.mock('next/headers', () => ({
  headers: vi.fn(async () => ({
    get: mockHeadersGet,
  })),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
      signOut: mockSignOut,
    },
  })),
}))

describe('Auth Login Redirect Behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('redirects to the requested tool path when login succeeds', async () => {
    mockSignInWithPassword.mockResolvedValue({ error: null })

    const formData = new FormData()
    formData.append('email', 'test@playcomun.com')
    formData.append('password', 'password123')
    formData.append('redirectTo', '/herramientas/calculadora-costo-receta')

    await expect(login(formData)).rejects.toThrow('NEXT_REDIRECT: /herramientas/calculadora-costo-receta')
    expect(mockRedirect).toHaveBeenCalledWith('/herramientas/calculadora-costo-receta')
  })

  it('defaults to /cuenta when no redirectTo is provided', async () => {
    mockSignInWithPassword.mockResolvedValue({ error: null })

    const formData = new FormData()
    formData.append('email', 'test@playcomun.com')
    formData.append('password', 'password123')

    await expect(login(formData)).rejects.toThrow('NEXT_REDIRECT: /cuenta')
    expect(mockRedirect).toHaveBeenCalledWith('/cuenta')
  })

  it('blocks open redirect attempts to external or protocol-relative domains', async () => {
    mockSignInWithPassword.mockResolvedValue({ error: null })

    const maliciousUrls = [
      'https://malicious-site.com',
      '//evil.com/phishing',
      '/\\evil.com',
      'javascript:alert(1)',
    ]

    for (const badUrl of maliciousUrls) {
      mockRedirect.mockClear()
      const formData = new FormData()
      formData.append('email', 'test@playcomun.com')
      formData.append('password', 'password123')
      formData.append('redirectTo', badUrl)

      await expect(login(formData)).rejects.toThrow('NEXT_REDIRECT: /cuenta')
      expect(mockRedirect).toHaveBeenCalledWith('/cuenta')
    }
  })

  it('preserves the redirect param when login credentials fail', async () => {
    mockSignInWithPassword.mockResolvedValue({ error: { message: 'Invalid login credentials' } })

    const formData = new FormData()
    formData.append('email', 'test@playcomun.com')
    formData.append('password', 'wrong')
    formData.append('redirectTo', '/herramientas/calculadora-costo-receta')

    await expect(login(formData)).rejects.toThrow('NEXT_REDIRECT')
    expect(mockRedirect).toHaveBeenCalledWith(
      '/ingresar?error=Invalid+login+credentials&redirect=%2Fherramientas%2Fcalculadora-costo-receta'
    )
  })
})

describe('Auth Logout Redirect Behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('redirects to the page the user was on instead of /ingresar', async () => {
    mockSignOut.mockResolvedValue({ error: null })

    const formData = new FormData()
    formData.append('redirectTo', '/herramientas/calculadora-costo-receta')

    await expect(logout(formData)).rejects.toThrow('NEXT_REDIRECT: /herramientas/calculadora-costo-receta')
    expect(mockRedirect).toHaveBeenCalledWith('/herramientas/calculadora-costo-receta')
    expect(mockRedirect).not.toHaveBeenCalledWith('/ingresar')
  })

  it('redirects to referer header if no formData redirectTo is passed', async () => {
    mockSignOut.mockResolvedValue({ error: null })
    mockHeadersGet.mockReturnValue('http://localhost:3000/microapps/cocina-pro')

    await expect(logout()).rejects.toThrow('NEXT_REDIRECT: /microapps/cocina-pro')
    expect(mockRedirect).toHaveBeenCalledWith('/microapps/cocina-pro')
  })

  it('redirects to home / instead of /ingresar when logging out from protected /cuenta', async () => {
    mockSignOut.mockResolvedValue({ error: null })

    const formData = new FormData()
    formData.append('redirectTo', '/cuenta')

    await expect(logout(formData)).rejects.toThrow('NEXT_REDIRECT: /')
    expect(mockRedirect).toHaveBeenCalledWith('/')
    expect(mockRedirect).not.toHaveBeenCalledWith('/ingresar')
  })

  it('redirects to home / instead of /ingresar when logging out from /favoritas', async () => {
    mockSignOut.mockResolvedValue({ error: null })

    const formData = new FormData()
    formData.append('redirectTo', '/favoritas')

    await expect(logout(formData)).rejects.toThrow('NEXT_REDIRECT: /')
    expect(mockRedirect).toHaveBeenCalledWith('/')
    expect(mockRedirect).not.toHaveBeenCalledWith('/ingresar')
  })
})

