const express = require('express')
const helmet  = require('helmet')
const cors    = require('cors')
const morgan  = require('morgan')
const routes = require('./routes')

const app = express()

app.set('json spaces', 2);

app.use(cors());
app.use(helmet());
app.use(morgan('tiny'));

app.use('/', routes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: true, 
    name: 'NotFoundError', 
    message: `Cannot find anything in ${req.originalUrl}`
  })
})

// error handler
app.use((err, req, res, next) => {
  const {name, message, status = 500} = err
  res.status(status).json({error: true, name, message})
})

const port = process.env.PORT || 4321
app.listen(port, () => {
  console.log(`API running on port ${port}`)
})

module.exports = app
