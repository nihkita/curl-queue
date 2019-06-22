const axios = require('axios')
const express = require('express')
const bodyParser = require('body-parser')
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const adapter = new FileSync('db.json')
const db = low(adapter)
db.defaults({ jobs: [] }).write()

let lastId = db.get('jobs').size().value()

const app = express()
app.use(bodyParser.json())

app.get('/api/sites/:id', (req, res) => {
  const id = parseInt(req.params.id)
  const job = db.get('jobs').find({ id: id }).value()
  res.status(200).json(job)
})

app.post('/api/sites', (req, res, next) => {
  if (!req.body.url) {
    return res.status(400).json({ message: 'url is required'})
  }
  if (!req.body.url.startsWith('http://') &&
      !req.body.url.startsWith('https://')) {
    req.body.url = `http://${req.body.url}`
  }
  const job = {
    id: ++lastId,
    url: req.body.url,
    status: 'Queued'
  }
  db.get('jobs').push(job).write()
  res.status(201).json(job)
})

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(err.status || 500)
     .json({ error: err.status ? err.message : 'Internal Server Error' })
})

const processJob = () => {
  console.log('looking for job to process...')
  const job = db.get('jobs').find({ status: 'Queued' }).value()
  if (!job) return setTimeout(processJob, 5000)
  axios.get(job.url)
    .then(res => {
      job.data = res.data
      job.status = 'Completed'
      console.log(`job[${job.id}] completed`)
    })
    .catch(e => {
      job.status = 'Failed'
      job.reason = e.message
      console.error(`job[${job.id}] failed: ${e.message}`)
    })
    .finally(() => {
      db.write()
      setTimeout(processJob, 5000)
    })
}
setTimeout(processJob, 5000)

app.listen(3000)
console.log('Server started at http://localhost:3000')
