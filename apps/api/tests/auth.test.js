export default async function (req) {
  const email = `user_${Date.now()}@test.local`
  // register
  const reg = await req.post('/auth/register').send({ email, password: 'pw', role: 'client' })
  if (reg.status !== 201) throw new Error(`register ${reg.status}`)

  // login
  const login = await req.post('/auth/login').send({ email, password: 'pw' })
  if (login.status !== 200) throw new Error(`login ${login.status}`)
  const token = login.body?.token
  if (!token) throw new Error('expected token')

  // logout (noop for JWT, endpoint may exist or not; if exists expect 200/204)
  const logout = await req.post('/auth/logout').set('Authorization', `Bearer ${token}`)
  if (![200, 204, 404].includes(logout.status)) throw new Error(`logout unexpected ${logout.status}`)
}
