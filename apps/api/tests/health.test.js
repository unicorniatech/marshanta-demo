export default async function (req) {
  const res = await req.get('/healthz')
  if (res.status !== 200) throw new Error(`expected 200, got ${res.status}`)
  if (!res.body || res.body.ok !== true) throw new Error('expected ok:true')
}
