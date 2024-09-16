const express = require('express')
const mongoose = require('mongoose')
const bookRoutes = require('./routes/bookRoutes')
const userRoutes = require('./routes/userRoutes')
const path = require('path')

const app = express()

app.use(express.json())

mongoose
  .connect(
    'mongodb+srv://sacha:sacha0804@cluster0.fyyyp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'
  )

  .then(() => console.log('Connexion à MongoDB réussie !'))
  .catch(() => console.log('Connexion à MongoDB échouée !'))

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization'
  )
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, PATCH, OPTIONS'
  )
  next()
})

app.use('/api/books', bookRoutes)
app.use('/api/auth', userRoutes)
app.use('/images', express.static(path.join(__dirname, 'images')))

module.exports = app
